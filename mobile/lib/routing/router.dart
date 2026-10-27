import '../features/profile/ui/owner_booking_detail_screen.dart';
import '../features/profile/ui/owner_analytics_dashboard_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/providers/auth_provider.dart';
import '../features/auth/ui/splash_screen.dart';
import '../features/auth/ui/login_screen.dart';
import '../features/auth/ui/welcome_screen.dart';
import '../features/auth/ui/register_screen.dart';
import '../features/auth/ui/otp_screen.dart';
import '../features/auth/ui/role_select_screen.dart';
import '../features/auth/ui/forgot_password_screen.dart';
import '../features/auth/ui/reset_password_screen.dart';
import '../features/marketplace/ui/farmer_main_screen.dart';
import '../features/marketplace/ui/farmer_marketplace_screen.dart';
import '../features/marketplace/ui/crop_advisor_screen.dart';
import '../features/marketplace/ui/knowledge_base_screen.dart';
import '../features/profile/ui/owner_main_screen.dart';
import '../features/profile/ui/add_equipment_screen.dart';
import '../features/profile/ui/edit_equipment_screen.dart';
import '../features/feedback/ui/feedback_screen.dart';
import '../features/admin/ui/admin_dashboard_screen.dart';
import '../features/profile/ui/about_profile_screen.dart';
import '../features/profile/ui/edit_profile_screen.dart';
import '../features/profile/ui/change_password_screen.dart';
import '../features/farm/ui/farm_setup_screen.dart';
import '../features/farm/ui/farmer_farm_screen.dart';
import '../features/farm/ui/my_farm_screen.dart';
import '../features/farm/ui/crop_lifecycle_screen.dart';
import '../features/farm/ui/stage_operations_screen.dart';
import '../features/farm/ui/operation_detail_screen.dart';
import '../features/farm/ui/farm_copilot_screen.dart';
import '../features/farm/ui/stage_details_screen.dart';
import '../features/notifications/ui/notification_screen.dart';
import '../features/marketplace/ui/saved_equipment_screen.dart';
import '../features/marketplace/ui/chat_screen.dart';
import '../features/community/ui/community_screen.dart';
import '../features/community/ui/crop_trends_screen.dart';
import '../features/community/ui/farmer_public_profile_screen.dart';
import '../features/marketplace/ui/receipt_screen.dart';
import '../features/marketplace/ui/my_rentals_screen.dart';
import '../features/marketplace/ui/equipment_details_screen.dart';
import '../features/marketplace/ui/equipment_loader_screen.dart';
import '../features/farm/ui/all_expenses_screen.dart';
import '../features/farm/ui/completed_tasks_screen.dart';
import '../features/payments/models/payment_record.dart';
import '../features/payments/ui/farmer_payment_history_screen.dart';
import '../features/payments/ui/owner_payments_received_screen.dart';
import '../features/payments/ui/payment_detail_screen.dart';
import '../features/ai_assistant/ui/ai_assistant_screen.dart';
import '../features/ai_assistant/services/ai_assistant_service.dart';
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
      final isLoggingIn = state.matchedLocation == '/welcome' ||
          state.matchedLocation == '/login' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation == '/otp' ||
          state.matchedLocation == '/splash' ||
          state.matchedLocation == '/forgot-password' ||
          state.matchedLocation == '/reset-password';
      final isRoot = state.matchedLocation == '/';

      // While initial loading (restoring session), show root
      if (authState.isLoading && authState.user == null) return null;

      if (authState.user == null) {
        return isLoggingIn ? null : '/welcome';
      }

      final userRole = (authState.user?.role ?? '').toUpperCase().trim();

      final roleRedirect = AppRouter.testRoleRedirect(userRole: userRole, targetPath: state.matchedLocation);
      if (roleRedirect != null) {
        return roleRedirect;
      }

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
    routes: AppRouter.routes,
  );
});

class AppRouter {
  static String? testRoleRedirect({required String userRole, required String targetPath}) {
    final role = userRole.toUpperCase().trim();
    if (targetPath.startsWith('/admin') && role != 'ADMIN') {
      return (role == 'OWNER') ? '/owner' : '/farmer';
    }
    if (role == 'OWNER') {
      final farmerOnlyPaths = [
        '/farmer',
        '/farm',
        '/farm-plan',
        '/farm-setup',
        '/crop-lifecycle',
        '/stage-details',
        '/operations',
        '/operation-detail',
        '/crop-advisor',
        '/advisor',
        '/farm-copilot',
        '/ai-assistant',
      ];
      if (farmerOnlyPaths.any((p) => targetPath == p || targetPath.startsWith('$p/') || targetPath.startsWith('$p?'))) {
        return '/owner';
      }
    }
    if (role == 'FARMER' || role == 'ENTREPRENEUR') {
      final ownerOnlyPaths = [
        '/owner',
        '/add-equipment',
        '/edit-equipment',
        '/payments-received',
        '/owner-booking-detail',
        '/owner-analytics',
      ];
      if (ownerOnlyPaths.any((p) => targetPath == p || targetPath.startsWith('$p/') || targetPath.startsWith('$p?'))) {
        return '/farmer';
      }
    }
    if (targetPath.startsWith('/owner') && role != 'OWNER' && role != 'BOTH' && role != 'ADMIN') {
      return '/farmer';
    }
    return null;
  }

  static Map<String, String?> parseMarketplaceParams(Uri uri) {
    final cat = uri.queryParameters['category'];
    final id = uri.queryParameters['id'] ?? uri.queryParameters['equipmentId'];
    final bookId = uri.queryParameters['bookId'];
    final search = uri.queryParameters['search'];
    final sort = uri.queryParameters['sort'];
    return {
      'category': cat,
      'targetEquipmentId': id,
      'bookId': bookId,
      'search': search,
      'sort': sort,
    };
  }

  static GoRouter get router => GoRouter(
    initialLocation: '/',
    routes: routes,
  );

  static final List<RouteBase> routes = [
    GoRoute(
      path: '/',
      builder: (context, state) => const SplashScreen(),
    ),
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/welcome',
        builder: (context, state) => const WelcomeScreen(),
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
        path: '/marketplace',
        builder: (context, state) {
          final params = AppRouter.parseMarketplaceParams(state.uri);
          return FarmerMarketplaceScreen(
            initialCategory: params['category'],
            initialEquipmentId: params['targetEquipmentId'],
            initialBookId: params['bookId'],
          );
        },
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
        path: '/stage-details',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          final cropName = extra['cropName']?.toString() ?? state.uri.queryParameters['cropName'] ?? 'Rice';
          final stage = extra['stage']?.toString() ?? state.uri.queryParameters['stage'] ?? 'VEGETATIVE';
          final farmId = extra['farmId']?.toString() ?? state.uri.queryParameters['farmId'];
          final cropId = extra['cropId']?.toString() ?? state.uri.queryParameters['cropId'];
          return StageDetailsScreen(
            cropName: cropName,
            stage: stage,
            farmId: farmId,
            cropId: cropId,
          );
        },
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
        path: '/advisor',
        builder: (context, state) => const CropAdvisorScreen(),
      ),
      GoRoute(
        path: '/ai-assistant',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          final query = extra['query'] as String? ?? state.uri.queryParameters['query'] ?? 'Farming Guidance';
          final result = extra['result'] as AiAssistantResponse?;
          return AiAssistantScreen(query: query, initialResult: result);
        },
      ),
      GoRoute(
        path: '/knowledge',
        builder: (context, state) {
          final crop = state.uri.queryParameters['crop'];
          return KnowledgeBaseScreen(initialCrop: crop);
        },
      ),
      GoRoute(
        path: '/knowledge-base',
        builder: (context, state) {
          final crop = state.uri.queryParameters['crop'];
          return KnowledgeBaseScreen(initialCrop: crop);
        },
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
        path: '/edit-equipment',
        builder: (context, state) {
          final extra = state.extra;
          if (extra is Equipment) {
            return EditEquipmentScreen(equipment: extra);
          }
          final id = state.uri.queryParameters['id'] ?? (extra is Map ? extra['id']?.toString() : null);
          return EditEquipmentScreen(equipmentId: id);
        },
      ),
      GoRoute(
        path: '/owner-booking-detail',
        builder: (context, state) {
          final extra = state.extra;
          if (extra is Booking) {
            return OwnerBookingDetailScreen(booking: extra);
          }
          final id = state.uri.queryParameters['id'] ?? (extra is Map ? extra['id']?.toString() : null);
          return OwnerBookingDetailScreen(bookingId: id);
        },
      ),
      GoRoute(
        path: '/owner-analytics',
        builder: (context, state) => const OwnerAnalyticsDashboardScreen(),
      ),
      GoRoute(
        path: '/about-profile',
        builder: (context, state) => const AboutProfileScreen(),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const AboutProfileScreen(),
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
        builder: (context, state) {
          final mode = state.uri.queryParameters['mode'];
          final farmId = state.uri.queryParameters['farmId'] ?? (state.extra as Map<String, dynamic>?)?['farmId']?.toString();
          final isCreate = mode == 'create' || (state.extra as Map<String, dynamic>?)?['isCreate'] == true;
          return FarmSetupScreen(
            farmId: farmId,
            isCreate: isCreate,
          );
        },
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
        path: '/saved-equipment',
        builder: (context, state) => const SavedEquipmentScreen(),
      ),
      GoRoute(
        path: '/payment-history',
        builder: (context, state) => const FarmerPaymentHistoryScreen(),
      ),
      GoRoute(
        path: '/payments-received',
        builder: (context, state) => const OwnerPaymentsReceivedScreen(),
      ),
      GoRoute(
        path: '/payment-detail',
        builder: (context, state) {
          final payment = state.extra as PaymentRecord;
          final isOwner = state.uri.queryParameters['isOwner'] == 'true';
          return PaymentDetailScreen(payment: payment, isOwnerView: isOwner);
        },
      ),
      GoRoute(
        path: '/community',
        builder: (context, state) => const CommunityScreen(),
      ),
      GoRoute(
        path: '/crop-trends',
        builder: (context, state) => const CropTrendsScreen(),
      ),
      GoRoute(
        path: '/farmer-profile/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return FarmerPublicProfileScreen(memberId: id);
        },
      ),
      GoRoute(
        path: '/chat',
        builder: (context, state) {
          final booking = state.extra as Booking?;
          final bookingId = state.uri.queryParameters['bookingId'];
          return ChatScreen(booking: booking, bookingId: bookingId);
        },
      ),
      GoRoute(
        path: '/guides',
        builder: (context, state) {
          final crop = state.uri.queryParameters['crop'];
          return KnowledgeBaseScreen(initialCrop: crop);
        },
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
          final extra = state.extra;
          if (extra is Equipment) {
            return EquipmentDetailsScreen(equipment: extra);
          }
          final id = state.uri.queryParameters['id'] ?? '';
          if (id.isNotEmpty) {
            return EquipmentLoaderScreen(equipmentId: id);
          }
          return const FarmerMarketplaceScreen();
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
    ];
}
