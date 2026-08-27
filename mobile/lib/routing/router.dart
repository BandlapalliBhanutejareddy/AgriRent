import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/providers/auth_provider.dart';
import '../features/auth/ui/login_screen.dart';
import '../features/auth/ui/register_screen.dart';
import '../features/auth/ui/otp_screen.dart';
import '../features/marketplace/ui/farmer_home_screen.dart';
import '../features/profile/ui/owner_dashboard_screen.dart';

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
          state.matchedLocation == '/otp';
      final isRoot = state.matchedLocation == '/';
      
      // While initial loading (restoring session), show root
      if (authState.isLoading && authState.user == null) return null;

      if (authState.user == null) {
        return isLoggingIn ? null : '/login';
      }

      if (isLoggingIn || isRoot) {
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
        path: '/farmer',
        builder: (context, state) => const FarmerHomeScreen(),
      ),
      GoRoute(
        path: '/owner',
        builder: (context, state) => const OwnerDashboardScreen(),
      ),
    ],
  );
});
