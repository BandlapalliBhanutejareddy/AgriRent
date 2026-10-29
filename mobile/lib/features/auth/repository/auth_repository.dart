import 'package:dio/dio.dart';
import 'dart:convert';
import 'dart:async';
import 'package:supabase_flutter/supabase_flutter.dart' as supabase;
import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/errors/api_error_handler.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../models/user.dart' as models;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthRepository {
  final ApiClient _apiClient = ApiClient();
  supabase.GoTrueClient get _supabaseAuth => supabase.Supabase.instance.client.auth;

  Future<models.User> login(String email, String password, {String? role}) async {
    final dataMap = <String, dynamic>{
      'email': email.trim().toLowerCase(),
      'password': password,
    };
    if (role != null) {
      dataMap['role'] = role;
    }

    // 1. Primary: Authenticate via AgroRent Backend
    try {
      final backendRes = await _apiClient.dio.post(ApiConstants.login, data: dataMap);
      if (backendRes.data != null && backendRes.data['success'] == true) {
        final token = backendRes.data['token']?.toString() ?? backendRes.data['session']?['access_token']?.toString();
        if (token != null && token.isNotEmpty) {
          await SecureStorage.saveAccessToken(token);
          final refreshToken = backendRes.data['refreshToken']?.toString() ?? backendRes.data['session']?['refresh_token']?.toString();
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
    } on DioException catch (dioErr) {
      // If the backend returned an actual HTTP response (e.g. 400, 401, 403, 500, 503), surface its error message!
      if (dioErr.response != null) {
        if (dioErr.response?.data is Map) {
          final errData = dioErr.response!.data as Map;
          final msg = errData['error'] ?? errData['message'];
          if (msg != null && msg.toString().isNotEmpty) {
            throw Exception(msg.toString());
          }
        }
        throw Exception(ApiErrorHandler.getMessage(dioErr));
      }
      // If backend was completely unreachable (connection error/timeout), fall through to direct Supabase
    }

    // 2. Direct Supabase authentication fallback (only if backend was completely unreachable)
    try {
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

  Future<models.User> continueWithGoogle({
    String? idToken,
    required String role,
  }) async {
    try {
      if (idToken != null && idToken.isNotEmpty) {
        final res = await _apiClient.dio.post(ApiConstants.googleAuth, data: {
          'idToken': idToken,
          'role': role,
        });
        if (res.data != null && res.data['success'] == true) {
          final token = res.data['token']?.toString();
          if (token != null && token.isNotEmpty) {
            await SecureStorage.saveAccessToken(token);
          }
          final userData = res.data['user'];
          await SecureStorage.saveUser(jsonEncode(userData));
          return models.User.fromJson(userData);
        }
        throw Exception(res.data?['error'] ?? 'Google authentication failed');
      }

      // 1. If an existing authenticated session is already valid, sync directly
      final existingSession = _supabaseAuth.currentSession;
      if (existingSession != null && !existingSession.isExpired) {
        return await _syncGoogleSession(existingSession, role);
      }

      // 2. Set up listener to await OAuth deep link return without blocking or failing early
      final completer = Completer<models.User>();
      StreamSubscription<supabase.AuthState>? authSubscription;
      Timer? timeoutTimer;

      authSubscription = _supabaseAuth.onAuthStateChange.listen((data) async {
        final session = data.session;
        if (data.event == supabase.AuthChangeEvent.signedIn && session != null) {
          try {
            final user = await _syncGoogleSession(session, role);
            if (!completer.isCompleted) {
              completer.complete(user);
            }
          } catch (e) {
            if (!completer.isCompleted) {
              completer.completeError(e);
            }
          }
        }
      });

      final isOAuthTriggered = await _supabaseAuth.signInWithOAuth(
        supabase.OAuthProvider.google,
        redirectTo: 'io.supabase.agrorentai://login-callback',
      );
      if (!isOAuthTriggered) {
        await authSubscription.cancel();
        throw Exception('Could not launch Google authentication window.');
      }

      timeoutTimer = Timer(const Duration(seconds: 90), () {
        if (!completer.isCompleted) {
          completer.completeError(Exception('Google sign-in timed out. Please try again.'));
        }
      });

      try {
        return await completer.future;
      } finally {
        timeoutTimer.cancel();
        await authSubscription.cancel();
      }
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<models.User> _syncGoogleSession(supabase.Session session, String role) async {
    await SecureStorage.saveAccessToken(session.accessToken);
    try {
      final syncRes = await _apiClient.dio.post(ApiConstants.googleAuth, data: {
        'accessToken': session.accessToken,
        'role': role,
      });
      if (syncRes.data != null && syncRes.data['success'] == true) {
        final appToken = syncRes.data['token']?.toString();
        if (appToken != null && appToken.isNotEmpty) {
          await SecureStorage.saveAccessToken(appToken);
        }
        final userData = syncRes.data['user'];
        await SecureStorage.saveUser(jsonEncode(userData));
        return models.User.fromJson(userData);
      }
    } catch (_) {}

    final meRes = await _apiClient.dio.get(ApiConstants.me);
    final raw = meRes.data;
    final userData = raw is Map && raw['data'] != null ? raw['data'] : raw;
    await SecureStorage.saveUser(jsonEncode(userData));
    return models.User.fromJson(userData);
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
      // Preserve device-level preferences: app_language and user_theme_mode
      const storage = FlutterSecureStorage();
      final savedLang = await storage.read(key: 'app_language');

      final prefs = await SharedPreferences.getInstance();
      final savedTheme = prefs.getString('user_theme_mode');

      // Clear all secure storage credentials and cached tokens
      await SecureStorage.clearAuthTokens();
      await storage.deleteAll();

      // Clear user-specific shared preferences cache
      await prefs.clear();

      // Restore device-level preferences
      if (savedLang != null && savedLang.isNotEmpty) {
        await storage.write(key: 'app_language', value: savedLang);
      }
      if (savedTheme != null && savedTheme.isNotEmpty) {
        await prefs.setString('user_theme_mode', savedTheme);
      }
    }
  }

  Future<models.User?> restoreSession() async {
    try {
      final session = _supabaseAuth.currentSession;
      var savedToken = await SecureStorage.getAccessToken();
      final refreshToken = await SecureStorage.getRefreshToken();
      if (session == null && (savedToken == null || savedToken.isEmpty)) return null;

      if (_supabaseAuth.currentSession == null && refreshToken != null && refreshToken.isNotEmpty) {
        try {
          final res = await _supabaseAuth.setSession(refreshToken);
          if (res.session != null) {
            savedToken = res.session!.accessToken;
            await SecureStorage.saveTokens(savedToken, res.session!.refreshToken ?? refreshToken);
          }
        } catch (_) {}
      }

      final response = await _apiClient.dio.get(ApiConstants.me);
      if (response.statusCode == 200) {
        final raw = response.data;
        final userData = raw is Map && raw['data'] != null ? raw['data'] : raw;
        await SecureStorage.saveUser(jsonEncode(userData));
        return models.User.fromJson(userData);
      }
      return null;
    } catch (e) {
      await SecureStorage.clearAll();
      return null;
    }
  }
}
