import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/environment.dart';
import '../constants/api_constants.dart';
import '../storage/secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'network_interceptor.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  late Dio _dio;

  factory ApiClient() {
    return _instance;
  }

  ApiClient._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 60),
      receiveTimeout: const Duration(seconds: 60),
      sendTimeout: const Duration(seconds: 60),
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        var token = Supabase.instance.client.auth.currentSession?.accessToken;
        if (token == null || token.isEmpty) {
          token = await SecureStorage.getAccessToken();
        }

        if (options.path.startsWith('/api/')) {
          options.path = options.path.substring(5);
        } else if (options.path.startsWith('api/')) {
          options.path = options.path.substring(4);
        } else if (options.path.startsWith('/')) {
          options.path = options.path.substring(1);
        }

        options.baseUrl = ApiConstants.baseUrl;
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        if (kDebugMode) {
          print('REQUEST[${options.method}] => URL: ${options.baseUrl}${options.path}');
        }
        return handler.next(options);
      },
      onResponse: (response, handler) {
        if (kDebugMode) {
          print('RESPONSE[${response.statusCode}] => PATH: ${response.requestOptions.path}');
        }
        return handler.next(response);
      },
      onError: (DioException e, handler) async {
        if (kDebugMode) {
          print('ERROR[${e.response?.statusCode}] => PATH: ${e.requestOptions.path}');
          print('Message: ${e.message}');
        }

        // Automatic dev failover between candidate hosts (127.0.0.1, LAN IP 10.110.136.66, 10.0.2.2)
        final retryCount = (e.requestOptions.extra['retried_count'] as int?) ?? 0;
        final path = e.requestOptions.path;
        final isDevRoute = path.contains('admin/') || path.contains('system-health') || path.contains('notifications');

        if (retryCount < 2 && (e.response?.statusCode == 404 && isDevRoute)) {
          final candidates = ['http://127.0.0.1:4000/api/', 'http://10.110.136.66:4000/api/'];
          for (final candidate in candidates) {
            try {
              final rawDio = Dio(BaseOptions(
                connectTimeout: const Duration(seconds: 4),
                receiveTimeout: const Duration(seconds: 8),
                headers: e.requestOptions.headers,
              ));
              final ep = path.startsWith('/') ? path.substring(1) : path;
              final response = await rawDio.request(
                '$candidate$ep',
                data: e.requestOptions.data,
                queryParameters: e.requestOptions.queryParameters,
                options: Options(method: e.requestOptions.method),
              );
              if (response.statusCode == 200 || response.statusCode == 201) {
                return handler.resolve(response);
              }
            } catch (_) {}
          }
        }

        if (retryCount < 3 &&
            (e.type == DioExceptionType.connectionError ||
             e.type == DioExceptionType.connectionTimeout ||
             e.type == DioExceptionType.unknown)) {
          Environment.switchDevHost();
          if (kDebugMode) {
            print('[ApiClient] Network error encountered. Switching dev host to ${Environment.activeDevHost} and retrying (attempt ${retryCount + 1})...');
          }
          final newOptions = e.requestOptions;
          newOptions.extra['retried_count'] = retryCount + 1;
          newOptions.baseUrl = ApiConstants.baseUrl;
          try {
            final response = await _dio.fetch(newOptions);
            return handler.resolve(response);
          } catch (retryErr) {
            if (kDebugMode) {
              print('[ApiClient] Failover retry ($retryCount) failed: $retryErr');
            }
          }
        }

        if (e.response?.statusCode == 401) {
           await Supabase.instance.client.auth.signOut();
           await SecureStorage.clearAll();
        } else if (e.response?.statusCode == 403) {
           // Handle 403 Forbidden (RBAC failure)
        }

        return handler.next(e);
      },
    ));

    _initCacheInterceptor();
  }

  Future<void> _initCacheInterceptor() async {
    final prefs = await SharedPreferences.getInstance();
    _dio.interceptors.add(NetworkInterceptor(prefs));
  }

  Dio get dio => _dio;
}
