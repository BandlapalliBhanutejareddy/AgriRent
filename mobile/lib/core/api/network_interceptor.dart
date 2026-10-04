import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide Headers;

class NetworkInterceptor extends Interceptor {
  final SharedPreferences prefs;

  NetworkInterceptor(this.prefs);

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) async {
    if (response.requestOptions.method == 'GET' && response.statusCode == 200) {
      final userId = Supabase.instance.client.auth.currentUser?.id ?? 'anon';
      final key = 'cache_${userId}_${response.requestOptions.uri.toString()}';
      final cacheData = {
        'timestamp': DateTime.now().toIso8601String(),
        'data': response.data,
        'headers': response.headers.map,
      };
      await prefs.setString(key, json.encode(cacheData));
    }
    return handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (_isNetworkError(err) && err.requestOptions.method == 'GET') {
      final userId = Supabase.instance.client.auth.currentUser?.id ?? 'anon';
      final key = 'cache_${userId}_${err.requestOptions.uri.toString()}';
      final cachedString = prefs.getString(key);

      if (cachedString != null) {
        try {
          final cacheData = json.decode(cachedString);
          final timestamp = cacheData['timestamp'];
          final data = cacheData['data'];
          
          final response = Response(
            requestOptions: err.requestOptions,
            data: data,
            statusCode: 200,
            statusMessage: 'OK (Cached)',
            headers: Headers.fromMap({
              'X-Cached-At': [timestamp]
            }),
          );
          
          return handler.resolve(response);
        } catch (e) {
          // Cache parsing failed, fallback to error
        }
      }
    }
    
    // For non-GET or no cache, just return the error (blocked)
    return handler.next(err);
  }

  bool _isNetworkError(DioException err) {
    return err.type == DioExceptionType.connectionTimeout ||
           err.type == DioExceptionType.sendTimeout ||
           err.type == DioExceptionType.receiveTimeout ||
           err.type == DioExceptionType.connectionError ||
           err.type == DioExceptionType.unknown; // unknown usually means SocketException
  }
}
