import 'package:dio/dio.dart';

class ApiErrorHandler {
  static String getMessage(dynamic error) {
    if (error is DioException) {
      if (error.response?.data != null && error.response?.data is Map) {
        final data = error.response!.data as Map;
        if (data.containsKey('error')) {
          return data['error'].toString();
        }
        if (data.containsKey('message')) {
          return data['message'].toString();
        }
      }
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return 'Connection timed out. Please try again.';
        case DioExceptionType.connectionError:
          return 'No internet connection or server is unreachable.';
        case DioExceptionType.badResponse:
          final statusCode = error.response?.statusCode;
          if (statusCode == 401) return 'Session expired. Please log in again.';
          if (statusCode == 403) return 'You do not have permission to perform this action.';
          if (statusCode == 404) return 'Resource not found.';
          if (statusCode == 429) return 'Too many requests. Please try again later.';
          if (statusCode == 500) return 'Internal server error. Please try again later.';
          if (statusCode == 503) return 'Service temporarily unavailable.';
          return 'Received invalid response from server ($statusCode).';
        default:
          return 'An unexpected network error occurred.';
      }
    }
    return error.toString();
  }
}
