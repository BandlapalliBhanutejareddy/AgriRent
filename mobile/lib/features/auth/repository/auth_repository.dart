import 'dart:convert';
import 'package:supabase_flutter/supabase_flutter.dart' as supabase;
import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/errors/api_error_handler.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../models/user.dart' as models;
import 'package:shared_preferences/shared_preferences.dart';

class AuthRepository {
  final ApiClient _apiClient = ApiClient();
  final _supabaseAuth = supabase.Supabase.instance.client.auth;

  Future<models.User> login(String email, String password, {String? role}) async {
    try {
      try {
        final dataMap = <String, dynamic>{
          'email': email.trim().toLowerCase(),
          'password': password,
        };
        if (role != null) {
          dataMap['role'] = role;
        }
        final backendRes = await _apiClient.dio.post(ApiConstants.login, data: dataMap);
        if (backendRes.data != null && backendRes.data['success'] == true) {
          final token = backendRes.data['token']?.toString() ?? backendRes.data['session']?['access_token']?.toString();
          if (token != null && token.isNotEmpty) {
            await SecureStorage.saveAccessToken(token);
            final refreshToken = backendRes.data['session']?['refresh_token']?.toString();
            if (refreshToken != null) {
              await SecureStorage.saveTokens(token, refreshToken);
              try {
                await _supabaseAuth.setSession(refreshToken);
              } catch (_) {}
            }
          }
          if (backendRes.data['user'] != null) {
            final user = models.User.fromJson(backendRes.data['user']);
            await SecureStorage.saveUser(jsonEncode(backendRes.data['user']));
            return user;
          }
        }
      } catch (_) {}

      // 2. Direct Supabase authentication fallback
      final response = await _supabaseAuth.signInWithPassword(
        email: email.trim().toLowerCase(),
        password: password,
      );

      if (response.session != null) {
        final token = response.session!.accessToken;
        await SecureStorage.saveAccessToken(token);
        if (response.session!.refreshToken != null) {
          await SecureStorage.saveTokens(token, response.session!.refreshToken!);
        }

        final meResponse = await _apiClient.dio.get(ApiConstants.me);
        if (meResponse.statusCode == 200) {
          final raw = meResponse.data;
          final userData = raw is Map && raw['data'] != null ? raw['data'] : raw;
          await SecureStorage.saveUser(jsonEncode(userData));
          return models.User.fromJson(userData);
        } else {
          throw Exception('Failed to fetch user profile');
        }
      } else {
        throw Exception('Login failed: No session obtained');
      }
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<models.User> register({
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
        'phone': phone ?? '',
      });

      if (response.data['success'] == true) {
        final userData = response.data['user'];
        // After backend registration, the user must log in.
        return models.User.fromJson(userData);
      } else {
        throw Exception(response.data['error'] ?? 'Registration failed');
      }
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<models.User> verifyOtp(String email, String otp, String purpose) async {
    try {
      final response = await _apiClient.dio.post(ApiConstants.verifyOtp, data: {
        'email': email,
        'otp': otp,
        'purpose': purpose,
      });

      if (response.data['success'] == true) {
        if (purpose == 'REGISTER' || purpose == 'LOGIN') {
          // If OTP login is used, we'd need Supabase signInWithOtp.
          // For now, return standard user if successful.
          final userData = response.data['user'];
          await SecureStorage.saveUser(jsonEncode(userData));
          return models.User.fromJson(userData);
        } else {
          return models.User(id: '', name: '', email: email, role: 'FARMER', preferredLanguage: 'en');
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
      await _supabaseAuth.resetPasswordForEmail(email);
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<String> verifyForgotPasswordOtp(String email, String otp) async {
    try {
      final response = await _supabaseAuth.verifyOTP(
        email: email,
        token: otp,
        type: supabase.OtpType.recovery,
      );
      if (response.session != null) {
         return response.session!.accessToken;
      }
      throw Exception('OTP verification failed');
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<void> resetPassword(String email, String resetToken, String newPassword) async {
    try {
      // In Supabase, if the user is already signed in (which they are after OTP recovery),
      // we can update their password.
      await _supabaseAuth.updateUser(
        supabase.UserAttributes(password: newPassword),
      );
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<void> logout() async {
    try {
      await _supabaseAuth.signOut();
    } catch (e) {
      // Ignore errors on logout
    } finally {
      await SecureStorage.clearAll();
      final prefs = await SharedPreferences.getInstance();
      await prefs.clear();
    }
  }

  Future<models.User?> restoreSession() async {
    try {
      final session = _supabaseAuth.currentSession;
      final savedToken = await SecureStorage.getAccessToken();
      if (session == null && (savedToken == null || savedToken.isEmpty)) return null;

      final response = await _apiClient.dio.get(ApiConstants.me);
      if (response.statusCode == 200) {
        final raw = response.data;
        final userData = raw is Map && raw['data'] != null ? raw['data'] : raw;
        await SecureStorage.saveUser(jsonEncode(userData));
        return models.User.fromJson(userData);
      }
      return null;
    } catch (e) {
      final cachedUserStr = await SecureStorage.getUser();
      if (cachedUserStr != null) {
        try {
          return models.User.fromJson(jsonDecode(cachedUserStr));
        } catch (_) {}
      }
      return null;
    }
  }
}
