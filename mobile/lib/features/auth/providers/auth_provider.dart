import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../models/user.dart';
import '../repository/auth_repository.dart';

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
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repository;

  AuthNotifier(this._repository) : super(AuthState(isLoading: true)) {
    _init();
  }

  Future<void> _init() async {
    try {
      final user = await _repository.restoreSession();
      state = state.copyWith(user: user, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false);
    }
  }

  Future<void> checkAuth() async {
    await _init();
  }

  Future<bool> login(String email, String password, {String? role}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _repository.login(email, password, role: role);
      state = state.copyWith(user: user, isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
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
      state = state.copyWith(user: user, isLoading: false);
      return true; // Successfully registered and logged in
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> verifyOtp(String email, String otp, String purpose) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _repository.verifyOtp(email, otp, purpose);
      if (purpose == 'REGISTER' || purpose == 'LOGIN') {
        state = state.copyWith(user: user, isLoading: false);
      } else {
        state = state.copyWith(isLoading: false);
      }
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
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
      state = state.copyWith(isLoading: false, error: e.toString());
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
    state = AuthState(); // Reset state
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }

  void setActiveRole(String role) {
    state = state.copyWith(activeRole: role);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return AuthNotifier(repository);
});
