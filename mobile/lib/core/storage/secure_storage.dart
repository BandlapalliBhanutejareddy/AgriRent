import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  static const _storage = FlutterSecureStorage();
  
  static const _keyAccessToken = 'access_token';
  static const _keyRefreshToken = 'refresh_token';
  static const _keyUser = 'user_data';

  static Future<void> saveTokens(String accessToken, String refreshToken) async {
    await _storage.write(key: _keyAccessToken, value: accessToken);
    await _storage.write(key: _keyRefreshToken, value: refreshToken);
  }

  static Future<void> saveAccessToken(String accessToken) async {
    await _storage.write(key: _keyAccessToken, value: accessToken);
  }

  static Future<String?> getAccessToken() async {
    return await _storage.read(key: _keyAccessToken);
  }

  static Future<String?> getRefreshToken() async {
    return await _storage.read(key: _keyRefreshToken);
  }

  static Future<void> saveUser(String userJson) async {
    await _storage.write(key: _keyUser, value: userJson);
  }

  static Future<String?> getUser() async {
    return await _storage.read(key: _keyUser);
  }

  static Future<String?> getUserId() async {
    final userJson = await getUser();
    if (userJson == null) return null;
    try {
      final map = jsonDecode(userJson);
      return map['id']?.toString();
    } catch (_) {
      return null;
    }
  }

  static Future<void> clearAuthTokens() async {
    await _storage.delete(key: _keyAccessToken);
    await _storage.delete(key: _keyRefreshToken);
    await _storage.delete(key: _keyUser);
  }

  static Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
