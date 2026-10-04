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

        // Automatic dev failover between 127.0.0.1 (reverse) and LAN IP (10.73.129.66)
        if (e.requestOptions.extra['retried_fallback'] != true &&
            (e.type == DioExceptionType.connectionError ||
             e.type == DioExceptionType.connectionTimeout ||
             e.type == DioExceptionType.unknown)) {
          Environment.switchDevHost();
          if (kDebugMode) {
            print('Ã°Å¸â€â€ž [ApiClient] Network error encountered. Switching dev host to ${Environment.activeDevHost} and retrying...');
          }
          final newOptions = e.requestOptions;
          newOptions.extra['retried_fallback'] = true;
          newOptions.baseUrl = ApiConstants.baseUrl;
          try {
            final response = await _dio.fetch(newOptions);
            return handler.resolve(response);
          } catch (retryErr) {
            if (kDebugMode) {
              print('Ã¢ÂÅ’ [ApiClient] Failover retry also failed: $retryErr');
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
