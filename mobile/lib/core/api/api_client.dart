import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';
import '../storage/secure_storage.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  late Dio _dio;

  factory ApiClient() {
    return _instance;
  }

  ApiClient._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await SecureStorage.getAccessToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        if (kDebugMode) {
          print('REQUEST[${options.method}] => PATH: ${options.path}');
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

        if (e.response?.statusCode == 401 && e.requestOptions.path != ApiConstants.refresh && e.requestOptions.path != ApiConstants.login) {
          final isRefreshed = await _refreshToken();
          if (isRefreshed) {
            final token = await SecureStorage.getAccessToken();
            final opts = e.requestOptions;
            opts.headers['Authorization'] = 'Bearer $token';
            
            try {
              // Retry the request
              final response = await _dio.fetch(opts);
              return handler.resolve(response);
            } on DioException catch (retryError) {
              return handler.next(retryError);
            }
          } else {
            // Refresh failed, clear tokens
            await SecureStorage.clearAll();
            // We should ideally use a global navigator key or Riverpod to redirect to login
            // For now, we just pass the error down. UI will handle 401 by redirecting.
          }
        }

        return handler.next(e);
      },
    ));
  }

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await SecureStorage.getRefreshToken();
      if (refreshToken == null) return false;

      final dioRefresh = Dio(BaseOptions(baseUrl: ApiConstants.baseUrl));
      final response = await dioRefresh.post(ApiConstants.refresh, data: {
        'refreshToken': refreshToken,
      });

      if (response.statusCode == 200 && response.data['success'] == true) {
        final newAccessToken = response.data['token'];
        final newRefreshToken = response.data['refreshToken'];
        await SecureStorage.saveTokens(newAccessToken, newRefreshToken);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Dio get dio => _dio;
}
