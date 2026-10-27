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
          if (statusCode == 401) return 'Invalid credentials or session expired. Please log in again.';
          if (statusCode == 403) return 'You do not have permission to perform this action.';
          if (statusCode == 404) return 'Resource not found.';
          if (statusCode == 409) return 'These dates are already booked. Please choose different dates.';
          if (statusCode == 429) return 'Too many requests. Please try again later.';
          if (statusCode == 500) return 'Internal server error. Please try again later.';
          if (statusCode == 503) return 'Database or service is temporarily unavailable.';
          return 'Received invalid response from server ($statusCode).';
        default:
          return 'An unexpected network error occurred.';
      }
    }
    String msg = error.toString();
    if (msg.startsWith('Exception: ')) {
      msg = msg.substring(11);
    }
    final lower = msg.toLowerCase();
    if (lower.contains('over_email_send_rate_limit') || lower.contains('rate limit') || lower.contains('429')) {
      return 'Email request rate limit reached. Please wait a few minutes before trying again.';
    }
    if (lower.contains('invalid login credentials') || lower.contains('invalid_credentials')) {
      return 'Invalid email or password credentials.';
    }
    if (lower.contains('email not confirmed')) {
      return 'Please verify your email address before logging in.';
    }
    if (lower.contains('user already registered') || lower.contains('already registered')) {
      return 'An account with this email address already exists.';
    }
    // Clean AuthApiException(message: ..., statusCode: ...)
    final authApiMatch = RegExp(r'AuthApiException\(message:\s*([^,]+)').firstMatch(msg);
    if (authApiMatch != null && authApiMatch.group(1) != null) {
      return authApiMatch.group(1)!.trim();
    }
    return msg;
  }
}
