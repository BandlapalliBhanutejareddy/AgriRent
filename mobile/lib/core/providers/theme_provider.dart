import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final themeModeProvider = StateNotifierProvider<ThemeNotifier, ThemeMode>((ref) {
  return ThemeNotifier();
});

class ThemeNotifier extends StateNotifier<ThemeMode> {
  static const _themePrefKey = 'user_theme_mode';

  ThemeNotifier() : super(ThemeMode.system) {
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedMode = prefs.getString(_themePrefKey);
      if (savedMode != null) {
        switch (savedMode) {
          case 'light':
            state = ThemeMode.light;
            break;
          case 'dark':
            state = ThemeMode.dark;
            break;
          default:
            state = ThemeMode.system;
            break;
        }
      }
    } catch (_) {
      // Fallback to system if error occurs
      state = ThemeMode.system;
    }
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    state = mode;
    try {
      final prefs = await SharedPreferences.getInstance();
      String modeStr;
      switch (mode) {
        case ThemeMode.light:
          modeStr = 'light';
          break;
        case ThemeMode.dark:
          modeStr = 'dark';
          break;
        default:
          modeStr = 'system';
          break;
      }
      await prefs.setString(_themePrefKey, modeStr);
    } catch (_) {
      // Ignore write errors
    }
  }
}
