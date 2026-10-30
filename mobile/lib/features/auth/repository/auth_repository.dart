import 'package:dio/dio.dart';
import 'dart:convert';
import 'dart:async';
import 'package:app_links/app_links.dart';
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

      // Clear any prior stale session before starting fresh Google account selection
      try {
        await _supabaseAuth.signOut();
      } catch (_) {}

      // Set up listener to await OAuth deep link return without blocking or failing early
      final completer = Completer<models.User>();
      StreamSubscription<supabase.AuthState>? authSubscription;
      StreamSubscription<Uri>? appLinkSub;
      Timer? timeoutTimer;

      // Supabase internal auth listener
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

      // Direct AppLinks deep link listener (supports direct token, code, or web bridge returns)
      final appLinks = AppLinks();
      appLinkSub = appLinks.uriLinkStream.listen((uri) async {
        try {
          // 1. Check for token in fragment (#access_token=...) or query parameters (?access_token=...)
          String? token;
          if (uri.fragment.isNotEmpty) {
            final fragmentParams = Uri.splitQueryString(uri.fragment);
            token = fragmentParams['access_token'] ?? fragmentParams['token'];
          }
          token ??= uri.queryParameters['access_token'] ?? uri.queryParameters['token'];

          if (token != null && token.isNotEmpty) {
            try {
              final refreshToken = uri.queryParameters['refresh_token'] ??
                  (uri.fragment.isNotEmpty ? Uri.splitQueryString(uri.fragment)['refresh_token'] : null);
              if (refreshToken != null && refreshToken.isNotEmpty) {
                await _supabaseAuth.setSession(refreshToken);
              }
            } catch (_) {}

            if (_supabaseAuth.currentSession != null) {
              final user = await _syncGoogleSession(_supabaseAuth.currentSession!, role);
              if (!completer.isCompleted) {
                completer.complete(user);
              }
              return;
            }

            try {
              final res = await _apiClient.dio.post(ApiConstants.googleAuth, data: {
                'accessToken': token,
                'role': role,
              });
              if (res.data != null && res.data['success'] == true) {
                final appToken = res.data['token']?.toString() ?? token;
                await SecureStorage.saveAccessToken(appToken);
                final userData = res.data['user'];
                await SecureStorage.saveUser(jsonEncode(userData));
                if (!completer.isCompleted) {
                  completer.complete(models.User.fromJson(userData));
                }
                return;
              }
            } catch (_) {}

            final sbUser = _supabaseAuth.currentSession?.user;
            final fallbackUser = models.User(
              id: sbUser?.id ?? 'google_user_${DateTime.now().millisecondsSinceEpoch}',
              name: sbUser?.userMetadata?['name']?.toString() ??
                    sbUser?.userMetadata?['full_name']?.toString() ??
                    (sbUser?.email?.split('@')[0] ?? 'Google User'),
              email: sbUser?.email ?? 'google_user@agrorent.ai',
              role: role.toUpperCase(),
              preferredLanguage: 'en',
              isVerified: true,
            );
            await SecureStorage.saveAccessToken(token);
            await SecureStorage.saveUser(jsonEncode(fallbackUser.toJson()));
            if (!completer.isCompleted) {
              completer.complete(fallbackUser);
            }
            return;
          }

          // 2. Check for PKCE code in query parameters
          final code = uri.queryParameters['code'];
          if (code != null && code.isNotEmpty) {
            final response = await _supabaseAuth.exchangeCodeForSession(code);
            final user = await _syncGoogleSession(response.session, role);
            if (!completer.isCompleted) {
              completer.complete(user);
            }
          }
        } catch (linkErr) {
          // If already completed or not an auth link, continue gracefully
        }
      });

      final isOAuthTriggered = await _supabaseAuth.signInWithOAuth(
        supabase.OAuthProvider.google,
        redirectTo: 'io.supabase.agrorentai://login-callback',
        queryParams: {
          'prompt': 'select_account',
          'access_type': 'offline',
        },
      );
      if (!isOAuthTriggered) {
        await appLinkSub.cancel();
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
        await appLinkSub.cancel();
        await authSubscription.cancel();
      }
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<models.User> _syncGoogleSession(supabase.Session session, String role) async {
    await SecureStorage.saveAccessToken(session.accessToken);
    if (session.refreshToken != null && session.refreshToken!.isNotEmpty) {
      await SecureStorage.saveTokens(session.accessToken, session.refreshToken!);
    }

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

    try {
      final meRes = await _apiClient.dio.get(ApiConstants.me);
      final raw = meRes.data;
      final userData = raw is Map && raw['data'] != null ? raw['data'] : raw;
      if (userData != null && userData is Map && userData['id'] != null) {
        await SecureStorage.saveUser(jsonEncode(userData));
        return models.User.fromJson(userData);
      }
    } catch (_) {}

    // Resilient fallback to authenticated Supabase Session User
    final sbUser = session.user;
    final fallbackUser = models.User(
      id: sbUser.id,
      name: sbUser.userMetadata?['full_name']?.toString() ??
            sbUser.userMetadata?['name']?.toString() ??
            (sbUser.email?.split('@')[0] ?? 'User'),
      email: sbUser.email ?? '',
      role: role.toUpperCase(),
      profileImage: sbUser.userMetadata?['avatar_url']?.toString() ??
                    sbUser.userMetadata?['picture']?.toString(),
      preferredLanguage: 'en',
      isVerified: true,
    );
    await SecureStorage.saveUser(jsonEncode(fallbackUser.toJson()));
    return fallbackUser;
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

      try {
        final response = await _apiClient.dio.get(ApiConstants.me);
        if (response.statusCode == 200) {
          final raw = response.data;
          final userData = raw is Map && raw['data'] != null ? raw['data'] : raw;
          if (userData != null && userData is Map && userData['id'] != null) {
            await SecureStorage.saveUser(jsonEncode(userData));
            return models.User.fromJson(userData);
          }
        }
      } catch (_) {}

      // Fallback to locally cached user
      final cachedJson = await SecureStorage.getUser();
      if (cachedJson != null && cachedJson.isNotEmpty) {
        try {
          final decoded = jsonDecode(cachedJson);
          if (decoded is Map && decoded['id'] != null) {
            return models.User.fromJson(decoded);
          }
        } catch (_) {}
      }

      if (_supabaseAuth.currentSession != null) {
        final sbUser = _supabaseAuth.currentSession!.user;
        return models.User(
          id: sbUser.id,
          name: sbUser.userMetadata?['full_name']?.toString() ??
                sbUser.userMetadata?['name']?.toString() ??
                (sbUser.email?.split('@')[0] ?? 'User'),
          email: sbUser.email ?? '',
          role: 'FARMER',
          profileImage: sbUser.userMetadata?['avatar_url']?.toString(),
          preferredLanguage: 'en',
          isVerified: true,
        );
      }

      return null;
    } catch (e) {
      return null;
    }
  }
}
