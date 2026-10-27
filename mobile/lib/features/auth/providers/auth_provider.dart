import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../models/user.dart';
import '../repository/auth_repository.dart';
import '../../../core/localization/app_localizations.dart';
import '../../profile/providers/owner_provider.dart';
import '../../marketplace/providers/saved_equipment_provider.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;
  final String? activeRole;

  AuthState({this.user, this.isLoading = false, this.error, this.activeRole});

  AuthState copyWith({
    User? user,
    bool? isLoading,
    String? error,
    bool clearError = false,
    String? activeRole,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      activeRole: activeRole ?? this.activeRole,
    );
  }
  bool get isAuthenticated => user != null;
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repository;
  final Ref _ref;

  AuthNotifier(this._repository, this._ref) : super(AuthState(isLoading: true)) {
    _init();
  }

  void _syncLanguage(User? user) {
    if (user != null && user.preferredLanguage.isNotEmpty) {
      _ref.read(languageProvider.notifier).setLanguage(user.preferredLanguage, syncBackend: false);
    }
  }

  Future<void> _init() async {
    try {
      final user = await _repository.restoreSession();
      if (!mounted) return;
      _syncLanguage(user);
      state = state.copyWith(user: user, isLoading: false);
      if (user != null) {
        _ref.read(savedEquipmentProvider.notifier).loadSavedEquipment();
      }
      final normRole = user?.role.toUpperCase() ?? '';
      if (user != null && (normRole == 'OWNER' || normRole == 'EQUIPMENT_OWNER' || normRole == 'BOTH' || normRole == 'ADMIN')) {
        _ref.read(ownerProvider.notifier).fetchDashboardData();
      }
    } catch (e) {
      if (mounted) {
        state = state.copyWith(isLoading: false);
      }
    }
  }

  Future<void> checkAuth() async {
    await _init();
  }

  String _cleanErrorMessage(dynamic e) {
    String msg = e.toString();
    if (msg.startsWith('Exception: ')) {
      msg = msg.substring(11);
    }
    return msg;
  }

  Future<bool> login(String email, String password, {String? role}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _repository.login(email, password, role: role);
      _syncLanguage(user);
      _ref.read(savedEquipmentProvider.notifier).clear();
      _ref.read(savedEquipmentProvider.notifier).loadSavedEquipment();
      state = state.copyWith(user: user, isLoading: false);
      final loginRole = user.role.toUpperCase();
      if (loginRole == 'OWNER' || loginRole == 'EQUIPMENT_OWNER' || loginRole == 'BOTH' || loginRole == 'ADMIN') {
        _ref.read(ownerProvider.notifier).fetchDashboardData();
      }
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _cleanErrorMessage(e));
      return false;
    }
  }

  Future<bool> register({
    required String name,
    required String email,
    required String password,
    required String role,
    String? phone,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _repository.register(name: name, email: email, password: password, role: role, phone: phone);
      _syncLanguage(user);
      state = state.copyWith(user: user, isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _cleanErrorMessage(e));
      return false;
    }
  }

  Future<bool> continueWithGoogle({String? idToken, required String role}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _repository.continueWithGoogle(idToken: idToken, role: role);
      _syncLanguage(user);
      _ref.read(savedEquipmentProvider.notifier).clear();
      _ref.read(savedEquipmentProvider.notifier).loadSavedEquipment();
      state = state.copyWith(user: user, isLoading: false);
      final normRole = user.role.toUpperCase();
      if (normRole == 'OWNER' || normRole == 'EQUIPMENT_OWNER' || normRole == 'BOTH' || normRole == 'ADMIN') {
        _ref.read(ownerProvider.notifier).fetchDashboardData();
      }
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _cleanErrorMessage(e));
      return false;
    }
  }

  Future<bool> verifyOtp(String email, String otp, String purpose) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _repository.verifyOtp(email, otp, purpose);
      if (purpose == 'REGISTER' || purpose == 'LOGIN') {
        _syncLanguage(user);
        state = state.copyWith(user: user, isLoading: false);
      } else {
        state = state.copyWith(isLoading: false);
      }
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _cleanErrorMessage(e));
      return false;
    }
  }

  Future<bool> forgotPassword(String email) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repository.forgotPassword(email);
      state = state.copyWith(isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _cleanErrorMessage(e));
      return false;
    }
  }

  Future<String?> verifyForgotPasswordOtp(String email, String otp) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final token = await _repository.verifyForgotPasswordOtp(email, otp);
      state = state.copyWith(isLoading: false);
      return token;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return null;
    }
  }

  Future<bool> resetPassword(String email, String resetToken, String newPassword) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repository.resetPassword(email, resetToken, newPassword);
      state = state.copyWith(isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    await _repository.logout();
    _ref.read(savedEquipmentProvider.notifier).clear();
    state = AuthState(); // Reset state
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }

  void setActiveRole(String role) {
    state = state.copyWith(activeRole: role);
  }

  void setUser(User? user) {
    if (user == null || (state.user != null && state.user!.id != user.id)) {
      _ref.read(savedEquipmentProvider.notifier).clear();
      if (user != null) {
        _ref.read(savedEquipmentProvider.notifier).loadSavedEquipment();
      }
    }
    state = state.copyWith(user: user);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return AuthNotifier(repository, ref);
});
