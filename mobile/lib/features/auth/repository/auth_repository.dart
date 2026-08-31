import 'dart:convert';
import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/errors/api_error_handler.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../models/user.dart';

class AuthRepository {
  final ApiClient _apiClient = ApiClient();

  Future<User> login(String email, String password, {String? role}) async {
    try {
      final Map<String, dynamic> reqData = {
        'email': email,
        'password': password,
      };
      if (role != null) {
        reqData['role'] = role;
      }
      final response = await _apiClient.dio.post(ApiConstants.login, data: reqData);

      if (response.data['success'] == true) {
        final token = response.data['token'];
        final refreshToken = response.data['refreshToken'];
        final userData = response.data['user'];

        await SecureStorage.saveTokens(token, refreshToken);
        await SecureStorage.saveUser(jsonEncode(userData));

        return User.fromJson(userData);
      } else {
        throw Exception(response.data['error'] ?? 'Login failed');
      }
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<User> register({
    required String name,
    required String email,
    required String password,
    required String role,
    String? phone,
  }) async {
    try {
      final response = await _apiClient.dio.post(ApiConstants.register, data: {
        'name': name,
        'email': email,
        'password': password,
        'role': role,
        'phone': ?phone,
      });

      if (response.data['success'] == true) {
        final userData = response.data['user'];
        final token = response.data['token'];
        final refreshToken = response.data['refreshToken'];

        if (token != null && refreshToken != null) {
          await SecureStorage.saveTokens(token, refreshToken);
          await SecureStorage.saveUser(jsonEncode(userData));
        }

        return User.fromJson(userData);
      } else {
        throw Exception(response.data['error'] ?? 'Registration failed');
      }
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<User> verifyOtp(String email, String otp, String purpose) async {
    try {
      final response = await _apiClient.dio.post(ApiConstants.verifyOtp, data: {
        'email': email,
        'otp': otp,
        'purpose': purpose,
      });

      if (response.data['success'] == true) {
        if (purpose == 'REGISTER' || purpose == 'LOGIN') {
          final token = response.data['token'];
          final refreshToken = response.data['refreshToken'];
          final userData = response.data['user'];

          await SecureStorage.saveTokens(token, refreshToken);
          await SecureStorage.saveUser(jsonEncode(userData));
          return User.fromJson(userData);
        } else {
          // Forgot password flow returns just success
          return User(id: '', name: '', email: email, role: 'FARMER', preferredLanguage: 'en');
        }
      } else {
        throw Exception(response.data['error'] ?? 'OTP verification failed');
      }
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<void> forgotPassword(String email) async {
    try {
      final response = await _apiClient.dio.post('/auth/forgot-password', data: {'email': email});
      if (response.data['success'] != true) {
        throw Exception(response.data['error'] ?? 'Failed to request reset');
      }
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<String> verifyForgotPasswordOtp(String email, String otp) async {
    try {
      final response = await _apiClient.dio.post(ApiConstants.verifyOtp, data: {
        'email': email,
        'otp': otp,
        'purpose': 'FORGOT_PASSWORD',
      });
      if (response.data['success'] == true) {
        return response.data['resetToken'] as String;
      }
      throw Exception(response.data['error'] ?? 'OTP verification failed');
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<void> resetPassword(String email, String resetToken, String newPassword) async {
    try {
      final response = await _apiClient.dio.post('/auth/reset-password', data: {
        'email': email,
        'resetToken': resetToken,
        'newPassword': newPassword,
      });
      if (response.data['success'] != true) {
        throw Exception(response.data['error'] ?? 'Failed to reset password');
      }
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<void> logout() async {
    try {
      final refreshToken = await SecureStorage.getRefreshToken();
      if (refreshToken != null) {
        await _apiClient.dio.post(ApiConstants.logout, data: {
          'refreshToken': refreshToken,
        });
      }
    } catch (e) {
      // Ignore errors on logout
    } finally {
      await SecureStorage.clearAll();
    }
  }

  Future<User?> restoreSession() async {
    try {
      final token = await SecureStorage.getAccessToken();
      if (token == null) return null;

      final response = await _apiClient.dio.get(ApiConstants.me);
      if (response.statusCode == 200) {
        final userData = response.data;
        await SecureStorage.saveUser(jsonEncode(userData));
        return User.fromJson(userData);
      }
      return null;
    } catch (e) {
      // If fetching /me fails (e.g. 401), token interceptor should have tried refreshing.
      // If still fails, clear session.
      await SecureStorage.clearAll();
      return null;
    }
  }
}
