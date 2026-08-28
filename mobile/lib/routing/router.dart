import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/providers/auth_provider.dart';
import '../features/auth/ui/login_screen.dart';
import '../features/auth/ui/register_screen.dart';
import '../features/auth/ui/otp_screen.dart';
import '../features/auth/ui/role_select_screen.dart';
import '../features/auth/ui/forgot_password_screen.dart';
import '../features/auth/ui/reset_password_screen.dart';
import '../features/marketplace/ui/farmer_home_screen.dart';
import '../features/profile/ui/owner_dashboard_screen.dart';
import '../features/feedback/ui/feedback_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = ValueNotifier<AuthState>(ref.read(authProvider));
  
  ref.listen<AuthState>(authProvider, (_, next) {
    notifier.value = next;
  });

  return GoRouter(
    initialLocation: '/',
    refreshListenable: notifier,
    redirect: (context, state) {
      final authState = notifier.value;
      final isLoggingIn = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation == '/otp' ||
          state.matchedLocation == '/forgot-password' ||
          state.matchedLocation == '/reset-password';
      final isRoot = state.matchedLocation == '/';
      
      // While initial loading (restoring session), show root
      if (authState.isLoading && authState.user == null) return null;

      if (authState.user == null) {
        return isLoggingIn ? null : '/login';
      }

      if (isLoggingIn || isRoot || state.matchedLocation == '/role-select') {
        if (authState.user!.role == 'BOTH') {
          if (authState.activeRole == null) {
            return '/role-select';
          } else {
            return authState.activeRole == 'OWNER' ? '/owner' : '/farmer';
          }
        }
        
        if (authState.user!.role == 'FARMER') {
          return '/farmer';
        } else if (authState.user!.role == 'OWNER') {
          return '/owner';
        } else {
          return '/farmer'; // Fallback
        }
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const Scaffold(
          body: Center(child: CircularProgressIndicator()),
        ),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/role-select',
        builder: (context, state) => const RoleSelectScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/otp',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          final email = extra['email'] ?? '';
          final purpose = extra['purpose'] ?? 'REGISTER';
          return OtpScreen(email: email, purpose: purpose);
        },
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/reset-password',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          final email = extra['email'] ?? '';
          final token = extra['token'] ?? '';
          return ResetPasswordScreen(email: email, resetToken: token);
        },
      ),
      GoRoute(
        path: '/farmer',
        builder: (context, state) => const FarmerHomeScreen(),
      ),
      GoRoute(
        path: '/owner',
        builder: (context, state) => const OwnerDashboardScreen(),
      ),
      GoRoute(
        path: '/feedback',
        builder: (context, state) => const FeedbackScreen(),
      ),
    ],
  );
});
