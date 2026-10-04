import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/providers/auth_provider.dart';
import '../features/auth/ui/splash_screen.dart';
import '../features/auth/ui/login_screen.dart';
import '../features/auth/ui/register_screen.dart';
import '../features/auth/ui/otp_screen.dart';
import '../features/auth/ui/role_select_screen.dart';
import '../features/auth/ui/forgot_password_screen.dart';
import '../features/auth/ui/reset_password_screen.dart';
import '../features/marketplace/ui/farmer_main_screen.dart';
import '../features/marketplace/ui/crop_advisor_screen.dart';
import '../features/marketplace/ui/knowledge_base_screen.dart';
import '../features/profile/ui/owner_main_screen.dart';
import '../features/profile/ui/add_equipment_screen.dart';
import '../features/feedback/ui/feedback_screen.dart';
import '../features/admin/ui/admin_dashboard_screen.dart';
import '../features/profile/ui/edit_profile_screen.dart';
import '../features/profile/ui/change_password_screen.dart';
import '../features/farm/ui/farm_setup_screen.dart';
import '../features/farm/ui/farmer_farm_screen.dart';
import '../features/farm/ui/my_farm_screen.dart';
import '../features/farm/ui/crop_lifecycle_screen.dart';
import '../features/farm/ui/stage_operations_screen.dart';
import '../features/farm/ui/operation_detail_screen.dart';
import '../features/farm/ui/farm_copilot_screen.dart';
import '../features/notifications/ui/notification_screen.dart';
import '../features/marketplace/ui/saved_equipment_screen.dart';
import '../features/marketplace/ui/chat_screen.dart';
import '../features/marketplace/ui/receipt_screen.dart';
import '../features/marketplace/ui/my_rentals_screen.dart';
import '../features/marketplace/ui/equipment_details_screen.dart';
import '../features/marketplace/ui/equipment_loader_screen.dart';
import '../features/farm/ui/all_expenses_screen.dart';
import '../features/farm/ui/completed_tasks_screen.dart';
import '../models/booking.dart';
import '../models/equipment.dart';

final rootNavigatorKey = GlobalKey<NavigatorState>();

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = ValueNotifier<AuthState>(ref.read(authProvider));

  ref.listen<AuthState>(authProvider, (_, next) {
    notifier.value = next;
  });

  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/',
    refreshListenable: notifier,
    redirect: (context, state) {
      final authState = notifier.value;
      final isLoggingIn = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation == '/otp' ||
          state.matchedLocation == '/splash' ||
          state.matchedLocation == '/forgot-password' ||
          state.matchedLocation == '/reset-password';
      final isRoot = state.matchedLocation == '/';

      // While initial loading (restoring session), show root
      if (authState.isLoading && authState.user == null) return null;

      if (authState.user == null) {
        return isLoggingIn ? null : '/login';
      }

      final userRole = (authState.user?.role ?? '').toUpperCase().trim();

      if (isLoggingIn || isRoot || state.matchedLocation == '/role-select') {
        if (userRole == 'BOTH') {
          final activeRole = (authState.activeRole ?? '').toUpperCase().trim();
          if (activeRole.isEmpty) {
            return '/role-select';
          } else {
            return activeRole == 'OWNER' ? '/owner' : '/farmer';
          }
        }

        if (userRole == 'FARMER' || userRole == 'ENTREPRENEUR') {
          return '/farmer';
        } else if (userRole == 'OWNER') {
          return '/owner';
        } else if (userRole == 'ADMIN') {
          return '/admin';
        } else if (userRole == 'ADVISOR') {
          return '/farmer';
        } else {
          return '/login';
        }
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
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
        builder: (context, state) => const FarmerMainScreen(),
      ),
      GoRoute(
        path: '/farm',
        builder: (context, state) => const MyFarmScreen(),
      ),
      GoRoute(
        path: '/farm-plan',
        builder: (context, state) => const FarmerFarmScreen(),
      ),
      GoRoute(
        path: '/crop-lifecycle',
        builder: (context, state) => const CropLifecycleScreen(),
      ),
      GoRoute(
        path: '/operations',
        builder: (context, state) => const StageOperationsScreen(),
      ),
      GoRoute(
        path: '/operation-detail',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          final op = extra['operation'] as Map<String, dynamic>? ?? {};
          final farmId = extra['farmId'] as String? ?? '';
          final cropId = extra['cropId'] as String? ?? '';
          return OperationDetailScreen(operation: op, farmId: farmId, cropId: cropId);
        },
      ),
      GoRoute(
        path: '/crop-advisor',
        builder: (context, state) => const CropAdvisorScreen(),
      ),
      GoRoute(
        path: '/knowledge',
        builder: (context, state) => const KnowledgeBaseScreen(),
      ),
      GoRoute(
        path: '/owner',
        builder: (context, state) => const OwnerMainScreen(),
      ),
      GoRoute(
        path: '/feedback',
        builder: (context, state) => const FeedbackScreen(),
      ),
      GoRoute(
        path: '/admin',
        builder: (context, state) => const AdminDashboardScreen(),
      ),
      GoRoute(
        path: '/add-equipment',
        builder: (context, state) => const AddEquipmentScreen(),
      ),
      GoRoute(
        path: '/edit-profile',
        builder: (context, state) => const EditProfileScreen(),
      ),
      GoRoute(
        path: '/change-password',
        builder: (context, state) => const ChangePasswordScreen(),
      ),
      GoRoute(
        path: '/farm-setup',
        builder: (context, state) => const FarmSetupScreen(),
      ),
      GoRoute(
        path: '/farm-copilot',
        builder: (context, state) {
          final farmId = state.uri.queryParameters['farmId'] ?? '';
          final cropId = state.uri.queryParameters['cropId'] ?? '';
          return FarmCopilotScreen(farmId: farmId, cropId: cropId);
        },
      ),
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotificationScreen(),
      ),
      GoRoute(
        path: '/saved',
        builder: (context, state) => const SavedEquipmentScreen(),
      ),
      GoRoute(
        path: '/chat',
        builder: (context, state) {
          final booking = state.extra as Booking?;
          return ChatScreen(booking: booking);
        },
      ),
      GoRoute(
        path: '/guides',
        builder: (context, state) => const KnowledgeBaseScreen(),
      ),
      GoRoute(
        path: '/my-rentals',
        builder: (context, state) => const MyRentalsScreen(),
      ),
      GoRoute(
        path: '/booking-details',
        builder: (context, state) {
          final booking = state.extra as Booking;
          return ReceiptScreen(booking: booking);
        },
      ),
      GoRoute(
        path: '/equipment-detail',
        builder: (context, state) {
          final eq = state.extra as Equipment;
          return EquipmentDetailsScreen(equipment: eq);
        },
      ),
      GoRoute(
        path: '/equipment/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          final extra = state.extra;
          if (extra is Equipment) {
            return EquipmentDetailsScreen(equipment: extra);
          }
          return EquipmentLoaderScreen(equipmentId: id);
        },
      ),
      GoRoute(
        path: '/all-expenses',
        builder: (context, state) {
          final farmId = state.uri.queryParameters['farmId'];
          return AllExpensesScreen(farmId: farmId);
        },
      ),
      GoRoute(
        path: '/completed-tasks',
        builder: (context, state) {
          final farmId = state.uri.queryParameters['farmId'];
          final cropId = state.uri.queryParameters['cropId'];
          return CompletedTasksScreen(farmId: farmId, cropId: cropId);
        },
      ),
    ],
  );
});
