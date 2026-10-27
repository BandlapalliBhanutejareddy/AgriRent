import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../core/providers/theme_provider.dart';
import '../../../shared/widgets/profile_header_painters.dart';

// -----------------------------------------------------------------------------
// ADMIN DATA PROVIDERS
// -----------------------------------------------------------------------------
final adminStatsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final response = await ApiClient().dio.get('/admin/stats');
  final dynamic d = response.data;
  if (d is Map<String, dynamic>) {
    return d['data'] is Map<String, dynamic> ? d['data'] as Map<String, dynamic> : d;
  }
  return {};
});

final adminUsersProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final response = await ApiClient().dio.get('/admin/users');
  final dynamic d = response.data;
  if (d is List) return d;
  if (d is Map && d['data'] is List) return d['data'];
  return [];
});

final adminEquipmentProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final response = await ApiClient().dio.get('/admin/equipment');
  final dynamic d = response.data;
  if (d is List) return d;
  if (d is Map && d['data'] is List) return d['data'];
  return [];
});

final adminBookingsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final response = await ApiClient().dio.get('/admin/bookings');
  final dynamic d = response.data;
  if (d is List) return d;
  if (d is Map && d['data'] is List) return d['data'];
  return [];
});

final adminAuditLogsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final response = await ApiClient().dio.get('/admin/audit-logs');
  final dynamic d = response.data;
  if (d is List) return d;
  if (d is Map && d['data'] is List) return d['data'];
  return [];
});

final adminAlertsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final response = await ApiClient().dio.get('/admin/feedback-complaints');
  final dynamic d = response.data;
  if (d is Map<String, dynamic>) {
    return d['data'] is Map<String, dynamic> ? d['data'] as Map<String, dynamic> : d;
  }
  return {};
});

final adminHealthProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final response = await ApiClient().dio.get('/admin/system-health');
  final dynamic d = response.data;
  if (d is List) return d;
  if (d is Map && d['data'] is List) return d['data'];
  return [];
});

final adminDataQualityProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final response = await ApiClient().dio.get('/admin/data-quality');
  final dynamic d = response.data;
  if (d is List) return d;
  if (d is Map && d['data'] is List) return d['data'];
  return [];
});

// -----------------------------------------------------------------------------
// ADMIN DASHBOARD SCREEN
// -----------------------------------------------------------------------------
class AdminDashboardScreen extends ConsumerStatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  ConsumerState<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends ConsumerState<AdminDashboardScreen> {
  int _currentIndex = 0;
  bool _isUploadingPhoto = false;

  String _getLanguageName(String? code) {
    switch ((code ?? 'en').toLowerCase()) {
      case 'te': return 'Telugu';
      case 'hi': return 'Hindi';
      case 'ta': return 'Tamil';
      case 'kn': return 'Kannada';
      case 'en':
      default: return 'English';
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final user = ref.watch(authProvider).user;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return PopScope(
      canPop: _currentIndex == 0,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) {
          setState(() {
            _currentIndex = 0;
          });
        }
      },
      child: Scaffold(
        backgroundColor: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
        appBar: _currentIndex == 4
            ? null
            : AppBar(
                backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
                elevation: 0,
                scrolledUnderElevation: 1,
                surfaceTintColor: Colors.transparent,
                titleSpacing: 16,
                title: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF2563EB).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.admin_panel_settings_rounded,
                        color: Color(0xFF2563EB),
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'admin_dashboard'.tr(lang),
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 16,
                              color: isDark ? Colors.white : AppTheme.textDarkNavy,
                            ),
                          ),
                          Text(
                            user?.name ?? 'Admin Portal',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                actions: [
                  IconButton(
                    icon: Icon(
                      Icons.refresh_rounded,
                      color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                    ),
                    tooltip: 'Refresh',
                    onPressed: () {
                      ref.invalidate(adminStatsProvider);
                      ref.invalidate(adminUsersProvider);
                      ref.invalidate(adminEquipmentProvider);
                      ref.invalidate(adminBookingsProvider);
                      ref.invalidate(adminAuditLogsProvider);
                      ref.invalidate(adminAlertsProvider);
                      ref.invalidate(adminHealthProvider);
                      ref.invalidate(adminDataQualityProvider);
                    },
                  ),
                  IconButton(
                    icon: const Icon(Icons.logout_rounded, color: Color(0xFFDC2626), size: 22),
                    tooltip: 'Log Out',
                    onPressed: () => _showLogoutDialog(context, lang, isDark),
                  ),
                  const SizedBox(width: 4),
                ],
              ),
        body: IndexedStack(
          index: _currentIndex,
          children: [
            _buildStatsTab(isDark, lang),
            _buildUsersTab(isDark, lang),
            _buildAlertsTab(isDark, lang),
            _buildSystemHealthTab(isDark, lang),
            _buildAdminProfileTab(isDark, lang),
          ],
        ),
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkCard : Colors.white,
            border: Border(
              top: BorderSide(
                color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
                width: 1,
              ),
            ),
          ),
          child: NavigationBar(
            selectedIndex: _currentIndex,
            backgroundColor: Colors.transparent,
            indicatorColor: const Color(0xFF2563EB).withValues(alpha: 0.15),
            elevation: 0,
            onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
            destinations: [
              NavigationDestination(
                icon: const Icon(Icons.dashboard_outlined),
                selectedIcon: const Icon(Icons.dashboard_rounded, color: Color(0xFF2563EB)),
                label: 'dashboard'.tr(lang),
              ),
              NavigationDestination(
                icon: const Icon(Icons.people_outline_rounded),
                selectedIcon: const Icon(Icons.people_rounded, color: Color(0xFF2563EB)),
                label: 'users'.tr(lang),
              ),
              NavigationDestination(
                icon: const Icon(Icons.warning_amber_rounded),
                selectedIcon: const Icon(Icons.warning_rounded, color: Color(0xFF2563EB)),
                label: 'alerts'.tr(lang),
              ),
              NavigationDestination(
                icon: const Icon(Icons.health_and_safety_outlined),
                selectedIcon: const Icon(Icons.health_and_safety_rounded, color: Color(0xFF2563EB)),
                label: 'system_health'.tr(lang),
              ),
              NavigationDestination(
                icon: const Icon(Icons.person_outline_rounded),
                selectedIcon: const Icon(Icons.person_rounded, color: Color(0xFF2563EB)),
                label: 'profile'.tr(lang),
              ),
            ],
          ),
        ),
      ),
    );
  }


  // ---------------------------------------------------------------------------
  // TAB 0: OVERVIEW & PLATFORM STATS
  // ---------------------------------------------------------------------------
  Widget _buildStatsTab(bool isDark, String lang) {
    return ref.watch(adminStatsProvider).when(
      loading: () => const Center(
        child: CircularProgressIndicator(color: AppTheme.primaryGreen),
      ),
      error: (err, _) => _buildErrorState('unable_to_load_messages'.tr(lang), isDark, lang, () {
        ref.invalidate(adminStatsProvider);
      }),
      data: (data) {
        final users = data['users'] as Map<String, dynamic>? ?? {};
        final equipment = data['equipment'] as Map<String, dynamic>? ?? {};
        final bookings = data['bookings'] as Map<String, dynamic>? ?? {};
        final financial = data['financial'] as Map<String, dynamic>? ?? {};
        final moderation = data['moderation'] as Map<String, dynamic>? ?? {};

        return RefreshIndicator(
          color: AppTheme.primaryGreen,
          onRefresh: () async => ref.invalidate(adminStatsProvider),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Financial Banner
                _buildFinancialBanner(financial, isDark, lang),
                const SizedBox(height: 20),

                // Core Metrics Grid
                Text(
                  'financial_summary'.tr(lang),
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  ),
                ),
                const SizedBox(height: 12),
                GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.35,
                  children: [
                    _buildStatCard(
                      title: 'Total Users',
                      value: '${users['total'] ?? 'Not Available'}',
                      subtitle: '${users['farmers'] ?? 0} farmers • ${users['owners'] ?? 0} owners',
                      icon: Icons.people_alt_rounded,
                      color: const Color(0xFF1976D2),
                      isDark: isDark,
                    ),
                    _buildStatCard(
                      title: 'All Equipment',
                      value: '${equipment['total'] ?? 'Not Available'}',
                      subtitle: '${equipment['available'] ?? 0} active in fleet',
                      icon: Icons.agriculture_rounded,
                      color: const Color(0xFF2E7D32),
                      isDark: isDark,
                    ),
                    _buildStatCard(
                      title: 'Active Rentals',
                      value: '${bookings['active'] ?? 'Not Available'}',
                      subtitle: '${bookings['completed'] ?? 0} completed rentals',
                      icon: Icons.receipt_long_rounded,
                      color: const Color(0xFFF57C00),
                      isDark: isDark,
                    ),
                    _buildStatCard(
                      title: 'open_complaints'.tr(lang),
                      value: '${moderation['openComplaints'] ?? '0'}',
                      subtitle: '${moderation['totalFeedback'] ?? 0} feedbacks received',
                      icon: Icons.warning_amber_rounded,
                      color: const Color(0xFFD32F2F),
                      isDark: isDark,
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Quick Jump Navigation Cards
                Text(
                  'quick_actions'.tr(lang),
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildJumpButton(
                        title: 'Operations',
                        icon: Icons.monitor_heart_rounded,
                        color: const Color(0xFF1976D2),
                        isDark: isDark,
                        onTap: () => setState(() => _currentIndex = 1),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _buildJumpButton(
                        title: 'Alerts',
                        icon: Icons.notification_important_rounded,
                        color: const Color(0xFFD32F2F),
                        isDark: isDark,
                        onTap: () => setState(() => _currentIndex = 2),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _buildJumpButton(
                        title: 'Health',
                        icon: Icons.health_and_safety_rounded,
                        color: const Color(0xFF2E7D32),
                        isDark: isDark,
                        onTap: () => setState(() => _currentIndex = 3),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildFinancialBanner(Map<String, dynamic> fin, bool isDark, String lang) {
    final gmv = fin['gmv'] != null ? '₹${fin['gmv']}' : 'not_available'.tr(lang);
    final commission = fin['platformRevenue'] != null ? '₹${fin['platformRevenue']}' : 'not_available'.tr(lang);
    final payouts = fin['ownerRevenue'] != null ? '₹${fin['ownerRevenue']}' : 'not_available'.tr(lang);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1B5E20), Color(0xFF2E7D32)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1B5E20).withValues(alpha: 0.25),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'PLATFORM GMV & VOLUME',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.8,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  'LIVE LEDGER',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            gmv,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 26,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'platform_revenue'.tr(lang),
                      style: const TextStyle(color: Colors.white70, fontSize: 11),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      commission,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
              Container(width: 1, height: 28, color: Colors.white24),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Owner Net Payouts',
                      style: TextStyle(color: Colors.white70, fontSize: 11),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      payouts,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
    required Color color,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.white60 : AppTheme.textMutedGray,
                ),
              ),
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 16),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: TextStyle(
                  fontSize: 19,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
              ),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 10.5,
                  color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildJumpButton({
    required String title,
    required IconData icon,
    required Color color,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
          ),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // TAB 1: OPERATIONS MONITORING & AUDIT LOGS
  // ---------------------------------------------------------------------------
  Widget _buildOperationsTab(bool isDark, String lang) {
    return ref.watch(adminAuditLogsProvider).when(
      loading: () => const Center(
        child: CircularProgressIndicator(color: AppTheme.primaryGreen),
      ),
      error: (err, _) => _buildErrorState('unable_to_load_messages'.tr(lang), isDark, lang, () {
        ref.invalidate(adminAuditLogsProvider);
      }),
      data: (logs) {
        if (logs.isEmpty) {
          return Center(
            child: Text(
              'No operations logged yet.',
              style: TextStyle(color: isDark ? Colors.white60 : AppTheme.textMutedGray),
            ),
          );
        }

        return RefreshIndicator(
          color: AppTheme.primaryGreen,
          onRefresh: () async => ref.invalidate(adminAuditLogsProvider),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: logs.length,
            itemBuilder: (context, index) {
              final log = logs[index];
              final action = log['action']?.toString() ?? 'SYSTEM_EVENT';
              final resource = log['resource']?.toString() ?? '';
              final time = log['createdAt'] != null
                  ? DateFormat('dd MMM, h:mm a').format(DateTime.parse(log['createdAt']))
                  : '';

              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.darkCard : Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1976D2).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.history_rounded, color: Color(0xFF1976D2), size: 18),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            action.replaceAll('_', ' '),
                            style: TextStyle(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w700,
                              color: isDark ? Colors.white : AppTheme.textDarkNavy,
                            ),
                          ),
                          if (resource.isNotEmpty)
                            Text(
                              'Resource: $resource #${log['resourceId'] ?? ''}',
                              style: TextStyle(
                                fontSize: 11,
                                color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                              ),
                            ),
                        ],
                      ),
                    ),
                    Text(
                      time,
                      style: TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w500,
                        color: isDark ? Colors.white38 : Colors.grey.shade500,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }

  // ---------------------------------------------------------------------------
  // TAB 2: ALERTS & MODERATION
  // ---------------------------------------------------------------------------
  Widget _buildAlertsTab(bool isDark, String lang) {
    return ref.watch(adminAlertsProvider).when(
      loading: () => const Center(
        child: CircularProgressIndicator(color: AppTheme.primaryGreen),
      ),
      error: (err, _) => _buildErrorState('unable_to_load_messages'.tr(lang), isDark, lang, () {
        ref.invalidate(adminAlertsProvider);
      }),
      data: (alertsData) {
        final complaints = alertsData['complaints'] as List<dynamic>? ?? [];
        final feedbacks = alertsData['feedbacks'] as List<dynamic>? ?? [];

        return RefreshIndicator(
          color: AppTheme.primaryGreen,
          onRefresh: () async => ref.invalidate(adminAlertsProvider),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'open_complaints'.tr(lang),
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  ),
                ),
                const SizedBox(height: 10),
                if (complaints.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(20),
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: isDark ? AppTheme.darkCard : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Center(
                      child: Text(
                        'No open complaints registered.',
                        style: TextStyle(color: isDark ? Colors.white60 : AppTheme.textMutedGray),
                      ),
                    ),
                  )
                else
                  ...complaints.map((c) {
                    final status = c['status']?.toString() ?? 'NEW';
                    final isResolved = status == 'RESOLVED';
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isDark ? AppTheme.darkCard : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isResolved
                              ? (isDark ? Colors.white10 : Colors.grey.shade200)
                              : const Color(0xFFD32F2F).withValues(alpha: 0.3),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: (isResolved ? Colors.green : Colors.red).withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  status,
                                  style: TextStyle(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w800,
                                    color: isResolved ? Colors.green : Colors.red,
                                  ),
                                ),
                              ),
                              if (!isResolved)
                                TextButton(
                                  onPressed: () => _resolveComplaint(c['id'].toString()),
                                  child: const Text('Mark Resolved', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            c['subject']?.toString() ?? 'Complaint Report',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: isDark ? Colors.white : AppTheme.textDarkNavy,
                            ),
                          ),
                          if (c['description'] != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              c['description'].toString(),
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark ? Colors.white60 : AppTheme.textMutedGray,
                              ),
                            ),
                          ],
                        ],
                      ),
                    );
                  }),

                const SizedBox(height: 24),

                Text(
                  'total_feedback'.tr(lang),
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  ),
                ),
                const SizedBox(height: 10),
                ...feedbacks.take(5).map((f) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isDark ? AppTheme.darkCard : Colors.white,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.star_rounded, color: Colors.amber, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                f['message']?.toString() ?? 'Feedback',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                ),
                              ),
                              Text(
                                'Rating: ${f['rating'] ?? 5}/5 • by ${f['user']?['name'] ?? 'User'}',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
        );
      },
    );
  }

  void _resolveComplaint(String id) async {
    try {
      await ApiClient().dio.put('${ApiConstants.baseUrl}/admin/complaints/$id/status', data: {
        'status': 'RESOLVED',
        'adminNotes': 'Resolved via Admin Mobile Console'
      });
      ref.invalidate(adminAlertsProvider);
    } catch (_) {}
  }

  // ---------------------------------------------------------------------------
  // TAB 3: SYSTEM HEALTH & DATA QUALITY
  // ---------------------------------------------------------------------------
  Widget _buildSystemHealthTab(bool isDark, String lang) {
    return RefreshIndicator(
      color: AppTheme.primaryGreen,
      onRefresh: () async {
        ref.invalidate(adminHealthProvider);
        ref.invalidate(adminDataQualityProvider);
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'system_health'.tr(lang),
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
            ),
            const SizedBox(height: 12),
            ref.watch(adminHealthProvider).when(
              loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen)),
              error: (err, _) => Text('Error: $err'),
              data: (healthServices) {
                return Column(
                  children: healthServices.map((svc) {
                    final serviceName = svc['service']?.toString() ?? 'Service';
                    final status = svc['status']?.toString() ?? 'ONLINE';
                    final latency = svc['responseTime'] != null ? '${svc['responseTime']}ms' : 'Active';
                    final isOnline = status == 'ONLINE';

                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isDark ? AppTheme.darkCard : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: (isOnline ? Colors.green : Colors.red).withValues(alpha: 0.12),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              isOnline ? Icons.check_circle_rounded : Icons.cancel_rounded,
                              color: isOnline ? Colors.green : Colors.red,
                              size: 18,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  serviceName,
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                  ),
                                ),
                                Text(
                                  'Latency / Status: $latency',
                                  style: TextStyle(
                                    fontSize: 11.5,
                                    color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                            decoration: BoxDecoration(
                              color: (isOnline ? Colors.green : Colors.red).withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              status,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: isOnline ? Colors.green : Colors.red,
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                );
              },
            ),

            const SizedBox(height: 24),

            Text(
              'data_quality'.tr(lang),
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
            ),
            const SizedBox(height: 12),
            ref.watch(adminDataQualityProvider).when(
              loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen)),
              error: (err, _) => Text('Error: $err'),
              data: (issues) {
                if (issues.isEmpty) {
                  return Container(
                    padding: const EdgeInsets.all(20),
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: isDark ? AppTheme.darkCard : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Center(
                      child: Text('100% Database Integrity. No orphaned references found.'),
                    ),
                  );
                }

                return Column(
                  children: issues.map((iss) {
                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isDark ? AppTheme.darkCard : Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.info_outline_rounded, color: Colors.orange, size: 20),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${iss['entity']}: ${iss['problem']}',
                                  style: TextStyle(
                                    fontSize: 13.5,
                                    fontWeight: FontWeight.w700,
                                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                  ),
                                ),
                                Text(
                                  'Action: ${iss['action']}',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // TAB 4: USERS MANAGEMENT
  // ---------------------------------------------------------------------------
  Widget _buildUsersTab(bool isDark, String lang) {
    return ref.watch(adminUsersProvider).when(
      loading: () => const Center(
        child: CircularProgressIndicator(color: AppTheme.primaryGreen),
      ),
      error: (err, _) => _buildErrorState('unable_to_load_messages'.tr(lang), isDark, lang, () {
        ref.invalidate(adminUsersProvider);
      }),
      data: (users) {
        return RefreshIndicator(
          color: AppTheme.primaryGreen,
          onRefresh: () async => ref.invalidate(adminUsersProvider),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: users.length,
            itemBuilder: (context, index) {
              final u = users[index];
              final isSuspended = u['isSuspended'] == true;
              final isVerified = u['isVerified'] == true;
              final role = u['role']?.toString() ?? 'USER';

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.darkCard : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isSuspended
                        ? Colors.red.withValues(alpha: 0.3)
                        : (isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06)),
                  ),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.12),
                      child: Text(
                        (u['name']?.toString() ?? 'U').substring(0, 1).toUpperCase(),
                        style: const TextStyle(fontWeight: FontWeight.w800, color: AppTheme.primaryGreen),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            u['name']?.toString() ?? 'User',
                            style: TextStyle(
                              fontSize: 14.5,
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.white : AppTheme.textDarkNavy,
                            ),
                          ),
                          Text(
                            '${u['email'] ?? ''} • $role',
                            style: TextStyle(
                              fontSize: 11.5,
                              color: isDark ? Colors.white60 : AppTheme.textMutedGray,
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Action Buttons
                    Row(
                      children: [
                        if (role == 'OWNER' && !isVerified)
                          IconButton(
                            icon: const Icon(Icons.verified_outlined, color: Colors.blue, size: 20),
                            tooltip: 'Verify Owner',
                            onPressed: () => _verifyOwner(u['id'].toString(), true),
                          ),
                        IconButton(
                          icon: Icon(
                            isSuspended ? Icons.lock_open_rounded : Icons.block_rounded,
                            color: isSuspended ? Colors.green : Colors.red,
                            size: 20,
                          ),
                          tooltip: isSuspended ? 'Reactivate' : 'Suspend',
                          onPressed: () => _toggleSuspend(u['id'].toString(), !isSuspended),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }

  void _verifyOwner(String id, bool verify) async {
    try {
      await ApiClient().dio.put('${ApiConstants.baseUrl}/admin/users/$id/verify', data: {'isVerified': verify});
      ref.invalidate(adminUsersProvider);
      ref.invalidate(adminStatsProvider);
    } catch (_) {}
  }

  void _toggleSuspend(String id, bool suspend) async {
    try {
      await ApiClient().dio.put('${ApiConstants.baseUrl}/admin/users/$id/suspend', data: {
        'isSuspended': suspend,
        'reason': suspend ? 'Admin action' : 'Reinstated'
      });
      ref.invalidate(adminUsersProvider);
      ref.invalidate(adminStatsProvider);
    } catch (_) {}
  }

  Widget _buildErrorState(String msg, bool isDark, String lang, VoidCallback onRetry) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.cloud_off_rounded, size: 48, color: Colors.red.shade400),
          const SizedBox(height: 14),
          Text(
            msg,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: isDark ? Colors.white : AppTheme.textDarkNavy,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: onRetry,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryGreen,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text('retry'.tr(lang)),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // TAB 4: ADMIN PROFILE PORTAL (Royal Blue Theme Matching Reference Image)
  // ---------------------------------------------------------------------------
  Widget _buildAdminProfileTab(bool isDark, String lang) {
    final user = ref.watch(authProvider).user;
    final stats = ref.watch(adminStatsProvider).asData?.value ?? {};
    final usersData = stats['users'] as Map<String, dynamic>? ?? {};
    final equipData = stats['equipment'] as Map<String, dynamic>? ?? {};
    final bookData = stats['bookings'] as Map<String, dynamic>? ?? {};

    final int totalUsers = usersData['total'] ?? stats['totalUsers'] ?? 0;
    final int totalEquipment = equipData['total'] ?? stats['totalEquipment'] ?? 0;
    final int totalCropGroups = stats['cropGroups']?['total'] ?? stats['totalCropGroups'] ?? 0;
    final int totalBookings = bookData['total'] ?? stats['totalBookings'] ?? 0;

    final userName = user?.name.isNotEmpty == true ? user!.name : 'Admin';
    final userInitial = userName.substring(0, 1).toUpperCase();
    final profileImage = user?.profileImage;
    final userPhone = user?.phone?.isNotEmpty == true ? user!.phone! : '+91 98765 43210';
    const userLocation = 'AgroRent AI HQ, Chennai';
    final userLang = _getLanguageName(user?.preferredLanguage ?? lang);

    return SafeArea(
      top: false,
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. SCENIC ROYAL BLUE WAVES HEADER
            Stack(
              children: [
                CustomPaint(
                  size: const Size(double.infinity, 250),
                  painter: AdminWavesPainter(isDark: isDark),
                ),

                // Top App Bar Controls
                SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            if (Navigator.of(context).canPop())
                              IconButton(
                                icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
                                color: Colors.white,
                                onPressed: () => Navigator.of(context).pop(),
                              ),
                            Text(
                              'profile'.tr(lang),
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                        IconButton(
                          icon: Container(
                            padding: const EdgeInsets.all(7),
                            decoration: const BoxDecoration(
                              color: Colors.white24,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.edit_outlined,
                              size: 18,
                              color: Colors.white,
                            ),
                          ),
                          tooltip: 'edit_profile'.tr(lang),
                          onPressed: () => context.push('/edit-profile'),
                        ),
                      ],
                    ),
                  ),
                ),

                // Avatar & Admin Details Overlay
                Positioned(
                  left: 20,
                  right: 20,
                  bottom: 16,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Circular Avatar with Camera Badge
                      GestureDetector(
                        onTap: _isUploadingPhoto ? null : () => _handlePhotoAction(context, lang, isDark),
                        child: Stack(
                          clipBehavior: Clip.none,
                          children: [
                            Container(
                              width: 84,
                              height: 84,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 3.5),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.2),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: ClipOval(
                                child: (profileImage != null && profileImage.isNotEmpty)
                                    ? Image.network(
                                        profileImage,
                                        fit: BoxFit.cover,
                                        errorBuilder: (context, error, stackTrace) => _buildAvatarFallback(userInitial),
                                      )
                                    : _buildAvatarFallback(userInitial),
                              ),
                            ),

                            if (_isUploadingPhoto)
                              const Positioned.fill(
                                child: Center(
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
                                ),
                              )
                            else
                              Positioned(
                                bottom: 0,
                                right: 0,
                                child: Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF1E40AF),
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.white, width: 2),
                                  ),
                                  child: const Icon(
                                    Icons.camera_alt_rounded,
                                    color: Colors.white,
                                    size: 14,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),

                      // Name, Role Badge, Phone, Location, Language
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    userName,
                                    style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.w900,
                                      color: Colors.white,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                const Icon(
                                  Icons.verified_rounded,
                                  color: Color(0xFF60A5FA),
                                  size: 18,
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),

                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.25),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                'administrator'.tr(lang),
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                            const SizedBox(height: 6),

                            Row(
                              children: [
                                const Icon(Icons.phone_outlined, size: 13, color: Colors.white70),
                                const SizedBox(width: 5),
                                Text(
                                  userPhone,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),

                            Padding(
                              padding: const EdgeInsets.only(top: 2, bottom: 2),
                              child: Row(
                                children: [
                                  const Icon(Icons.location_on_outlined, size: 13, color: Colors.white70),
                                  const SizedBox(width: 5),
                                  Expanded(
                                    child: Text(
                                      userLocation,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500,
                                        color: Colors.white,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            Row(
                              children: [
                                const Icon(Icons.language_rounded, size: 13, color: Colors.white70),
                                const SizedBox(width: 5),
                                Text(
                                  userLang,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            // 2. 4-COLUMN SUMMARY METRICS CARD
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.darkCard : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF2563EB).withValues(alpha: isDark ? 0.08 : 0.05),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    _buildMetricColumn(
                      context: context,
                      icon: Icons.groups_rounded,
                      iconColor: const Color(0xFF2563EB),
                      value: AppFormatters.formatNumber(totalUsers),
                      label: 'total_users'.tr(lang),
                      isDark: isDark,
                      onTap: () => setState(() => _currentIndex = 1),
                    ),
                    _buildMetricDivider(isDark),
                    _buildMetricColumn(
                      context: context,
                      icon: Icons.agriculture_rounded,
                      iconColor: const Color(0xFF2563EB),
                      value: AppFormatters.formatNumber(totalEquipment),
                      label: 'equipments'.tr(lang),
                      isDark: isDark,
                      onTap: () => _showEquipmentManagementSheet(context, lang, isDark),
                    ),
                    _buildMetricDivider(isDark),
                    _buildMetricColumn(
                      context: context,
                      icon: Icons.eco_rounded,
                      iconColor: const Color(0xFF16A34A),
                      value: AppFormatters.formatNumber(totalCropGroups),
                      label: 'crop_groups'.tr(lang),
                      isDark: isDark,
                      onTap: () => _showCropGroupsSheet(context, lang, isDark),
                    ),
                    _buildMetricDivider(isDark),
                    _buildMetricColumn(
                      context: context,
                      icon: Icons.bar_chart_rounded,
                      iconColor: const Color(0xFF9333EA),
                      value: AppFormatters.formatNumber(totalBookings),
                      label: 'total_bookings'.tr(lang),
                      isDark: isDark,
                      onTap: () => setState(() => _currentIndex = 3),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 12),

            // 3. GROUPED PROFILE MENU SECTIONS
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: [
                  // SECTION 1: PERSONAL INFORMATION
                  _buildMenuGroup(
                    isDark: isDark,
                    items: [
                      _buildMenuTile(
                        icon: Icons.person_rounded,
                        iconColor: const Color(0xFF2563EB),
                        iconBg: const Color(0xFFEFF6FF),
                        title: 'personal_information'.tr(lang),
                        subtitle: 'name_contact_profile_picture'.tr(lang),
                        isDark: isDark,
                        onTap: () => context.push('/edit-profile'),
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // SECTION 2: ADMINISTRATION
                  _buildMenuGroup(
                    isDark: isDark,
                    items: [
                      _buildMenuTile(
                        icon: Icons.manage_accounts_rounded,
                        iconColor: const Color(0xFF2563EB),
                        iconBg: const Color(0xFFEFF6FF),
                        title: 'user_management'.tr(lang),
                        subtitle: 'user_management_subtitle'.tr(lang),
                        isDark: isDark,
                        onTap: () => setState(() => _currentIndex = 1),
                      ),
                      _buildMenuDivider(isDark),
                      _buildMenuTile(
                        icon: Icons.agriculture_rounded,
                        iconColor: const Color(0xFF0284C7),
                        iconBg: const Color(0xFFF0F9FF),
                        title: 'equipment_management'.tr(lang),
                        subtitle: 'equipment_management_subtitle'.tr(lang),
                        isDark: isDark,
                        onTap: () => _showEquipmentManagementSheet(context, lang, isDark),
                      ),
                      _buildMenuDivider(isDark),
                      _buildMenuTile(
                        icon: Icons.grass_rounded,
                        iconColor: const Color(0xFF16A34A),
                        iconBg: const Color(0xFFF0FDF4),
                        title: 'crop_groups_monitoring'.tr(lang),
                        subtitle: 'crop_groups_monitoring_subtitle'.tr(lang),
                        isDark: isDark,
                        onTap: () => _showCropGroupsSheet(context, lang, isDark),
                      ),
                      _buildMenuDivider(isDark),
                      _buildMenuTile(
                        icon: Icons.insights_rounded,
                        iconColor: const Color(0xFF4F46E5),
                        iconBg: const Color(0xFFEEF2FF),
                        title: 'reports_and_analytics'.tr(lang),
                        subtitle: 'reports_analytics_subtitle'.tr(lang),
                        isDark: isDark,
                        onTap: () => setState(() => _currentIndex = 3),
                      ),
                      _buildMenuDivider(isDark),
                      _buildMenuTile(
                        icon: Icons.menu_book_rounded,
                        iconColor: const Color(0xFF059669),
                        iconBg: const Color(0xFFECFDF5),
                        title: 'content_management'.tr(lang),
                        subtitle: 'content_management_subtitle'.tr(lang),
                        isDark: isDark,
                        onTap: () => context.push('/knowledge'),
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // SECTION 3: SYSTEM & SECURITY
                  _buildMenuGroup(
                    isDark: isDark,
                    items: [
                      _buildMenuTile(
                        icon: Icons.settings_suggest_rounded,
                        iconColor: const Color(0xFF475569),
                        iconBg: const Color(0xFFF1F5F9),
                        title: 'system_settings'.tr(lang),
                        subtitle: 'system_settings_subtitle'.tr(lang),
                        isDark: isDark,
                        onTap: () => _showPreferencesSheet(context, lang, isDark),
                      ),
                      _buildMenuDivider(isDark),
                      _buildMenuTile(
                        icon: Icons.security_rounded,
                        iconColor: const Color(0xFF1D4ED8),
                        iconBg: const Color(0xFFEFF6FF),
                        title: 'security_access'.tr(lang),
                        subtitle: 'security_access_subtitle'.tr(lang),
                        isDark: isDark,
                        onTap: () => _showSecurityAccessDialog(context, lang, isDark),
                      ),
                      _buildMenuDivider(isDark),
                      _buildMenuTile(
                        icon: Icons.lock_reset_rounded,
                        iconColor: const Color(0xFF2563EB),
                        iconBg: const Color(0xFFEFF6FF),
                        title: 'Change Password',
                        subtitle: 'Update your administrator password',
                        isDark: isDark,
                        onTap: () => context.push('/change-password'),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // LOGOUT BUTTON
                  InkWell(
                    onTap: () => _showLogoutDialog(context, lang, isDark),
                    borderRadius: BorderRadius.circular(18),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF2F2),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFFFCA5A5)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.logout_rounded, color: Color(0xFFDC2626), size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'logout'.tr(lang),
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFFDC2626),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 32),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAvatarFallback(String initial) {
    return Container(
      color: const Color(0xFFDBEAFE),
      child: Center(
        child: Text(
          initial,
          style: const TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.w900,
            color: Color(0xFF2563EB),
          ),
        ),
      ),
    );
  }

  Widget _buildMetricColumn({
    required BuildContext context,
    required IconData icon,
    required Color iconColor,
    required String value,
    required String label,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: iconColor, size: 22),
              const SizedBox(height: 6),
              Text(
                value,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.white60 : const Color(0xFF64748B),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetricDivider(bool isDark) {
    return Container(
      width: 1,
      height: 38,
      color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
    );
  }

  Widget _buildMenuGroup({
    required bool isDark,
    required List<Widget> items,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.15 : 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: items,
      ),
    );
  }

  Widget _buildMenuDivider(bool isDark) {
    return Divider(
      height: 1,
      thickness: 1,
      color: isDark ? Colors.white.withValues(alpha: 0.06) : const Color(0xFFF1F5F9),
      indent: 68,
    );
  }

  Widget _buildMenuTile({
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String title,
    required String subtitle,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: iconColor, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: isDark ? Colors.white60 : const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right_rounded,
              color: isDark ? Colors.white30 : Colors.grey.shade400,
              size: 22,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handlePhotoAction(BuildContext context, String lang, bool isDark) async {
    final user = ref.read(authProvider).user;
    final hasPhoto = user?.profileImage != null && user!.profileImage!.isNotEmpty;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 36,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Text(
                'profile_photo'.tr(lang),
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2563EB).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.camera_alt_rounded, color: Color(0xFF2563EB)),
                ),
                title: Text('take_photo'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w700)),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickAndUploadImage(ImageSource.camera);
                },
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2563EB).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.photo_library_rounded, color: Color(0xFF2563EB)),
                ),
                title: Text('choose_from_gallery'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w700)),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickAndUploadImage(ImageSource.gallery);
                },
              ),
              if (hasPhoto)
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.red.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.delete_outline_rounded, color: Colors.red),
                  ),
                  title: Text('remove_photo'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.red)),
                  onTap: () {
                    Navigator.pop(ctx);
                    _removeProfilePhoto();
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickAndUploadImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(source: source, maxWidth: 1024, maxHeight: 1024, imageQuality: 85);
      if (picked == null) return;

      setState(() => _isUploadingPhoto = true);
      final fileName = 'profile_${DateTime.now().millisecondsSinceEpoch}.jpg';
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(picked.path, filename: fileName),
      });

      final uploadRes = await ApiClient().dio.post(
        'upload/profile-image',
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );

      final publicUrl = uploadRes.data['url'] ?? uploadRes.data['data']?['url'];
      if (publicUrl != null && publicUrl.toString().isNotEmpty) {
        await ApiClient().dio.put(ApiConstants.me, data: {'profileImage': publicUrl.toString()});
        if (mounted) {
          final currentUser = ref.read(authProvider).user;
          if (currentUser != null) {
            final updatedUser = currentUser.copyWith(profileImage: publicUrl.toString());
            ref.read(authProvider.notifier).setUser(updatedUser);
          }
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('profile_photo_updated'.tr(ref.read(languageProvider))),
              backgroundColor: const Color(0xFF2563EB),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to upload photo: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploadingPhoto = false);
    }
  }

  Future<void> _removeProfilePhoto() async {
    try {
      setState(() => _isUploadingPhoto = true);
      await ApiClient().dio.put(ApiConstants.me, data: {'profileImage': null});
      if (mounted) {
        final currentUser = ref.read(authProvider).user;
        if (currentUser != null) {
          final updatedUser = currentUser.copyWith(profileImage: '');
          ref.read(authProvider.notifier).setUser(updatedUser);
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('profile_photo_removed'.tr(ref.read(languageProvider))),
            backgroundColor: const Color(0xFF2563EB),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to remove photo: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploadingPhoto = false);
    }
  }

  void _showPreferencesSheet(BuildContext context, String lang, bool isDark) {
    final currentTheme = ref.read(themeModeProvider);
    final currentLang = ref.read(languageProvider);

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white24 : Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Text(
                'system_settings'.tr(lang),
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
              ),
              const SizedBox(height: 16),
              Text('theme'.tr(lang), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Row(
                children: [
                  _buildThemeOption(ctx, ThemeMode.light, Icons.wb_sunny_rounded, 'Light', currentTheme == ThemeMode.light, isDark),
                  const SizedBox(width: 8),
                  _buildThemeOption(ctx, ThemeMode.dark, Icons.nightlight_round, 'Dark', currentTheme == ThemeMode.dark, isDark),
                  const SizedBox(width: 8),
                  _buildThemeOption(ctx, ThemeMode.system, Icons.brightness_auto_rounded, 'System', currentTheme == ThemeMode.system, isDark),
                ],
              ),
              const SizedBox(height: 16),
              Text('language'.tr(lang), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _buildLangChip(ctx, 'en', 'English', currentLang == 'en', isDark),
                  _buildLangChip(ctx, 'te', 'తెలుగు (Telugu)', currentLang == 'te', isDark),
                  _buildLangChip(ctx, 'hi', 'हिन्दी (Hindi)', currentLang == 'hi', isDark),
                  _buildLangChip(ctx, 'ta', 'தமிழ் (Tamil)', currentLang == 'ta', isDark),
                  _buildLangChip(ctx, 'kn', 'ಕನ್ನಡ (Kannada)', currentLang == 'kn', isDark),
                ],
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildThemeOption(BuildContext ctx, ThemeMode mode, IconData icon, String label, bool isSelected, bool isDark) {
    return Expanded(
      child: InkWell(
        onTap: () {
          ref.read(themeModeProvider.notifier).setThemeMode(mode);
          Navigator.pop(ctx);
        },
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected
                ? const Color(0xFF2563EB).withValues(alpha: 0.15)
                : (isDark ? Colors.white.withValues(alpha: 0.04) : Colors.grey.shade50),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? const Color(0xFF2563EB) : (isDark ? Colors.white10 : Colors.grey.shade200),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 20, color: isSelected ? const Color(0xFF2563EB) : (isDark ? Colors.white70 : Colors.grey.shade700)),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isSelected ? const Color(0xFF2563EB) : (isDark ? Colors.white70 : AppTheme.textDarkNavy),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLangChip(BuildContext ctx, String code, String label, bool isSelected, bool isDark) {
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) {
        ref.read(languageProvider.notifier).setLanguage(code);
        Navigator.pop(ctx);
      },
      selectedColor: const Color(0xFF2563EB).withValues(alpha: 0.2),
      backgroundColor: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.grey.shade100,
      labelStyle: TextStyle(
        fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
        fontSize: 13,
        color: isSelected ? const Color(0xFF2563EB) : (isDark ? Colors.white70 : AppTheme.textDarkNavy),
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isSelected ? const Color(0xFF2563EB) : Colors.transparent,
        ),
      ),
    );
  }

  void _showEquipmentManagementSheet(BuildContext context, String lang, bool isDark) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.75),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Row(
              children: [
                const Icon(Icons.agriculture_rounded, color: Color(0xFF0284C7), size: 24),
                const SizedBox(width: 10),
                Text(
                  'equipment_management'.tr(lang),
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              'Approve equipment listings, inspect telemetry status, verify safety standards, and moderate machinery pricing.',
              style: TextStyle(fontSize: 13, color: isDark ? Colors.white70 : const Color(0xFF64748B), height: 1.4),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ref.watch(adminEquipmentProvider).when(
                loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF2563EB))),
                error: (e, _) => Center(child: Text('Failed to load equipment: $e')),
                data: (equipmentList) {
                  if (equipmentList.isEmpty) {
                    return const Center(child: Text('No equipment to display'));
                  }
                  return ListView.builder(
                    itemCount: equipmentList.length,
                    itemBuilder: (c, i) {
                      final eq = equipmentList[i] as Map<String, dynamic>;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          title: Text(eq['title']?.toString() ?? 'Equipment', style: const TextStyle(fontWeight: FontWeight.bold)),
                          subtitle: Text('Category: ${eq['category']} • Rate: ₹${eq['dailyRate']}/day'),
                          trailing: Icon(eq['isApproved'] == true ? Icons.check_circle : Icons.pending,
                              color: eq['isApproved'] == true ? Colors.green : Colors.orange),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCropGroupsSheet(BuildContext context, String lang, bool isDark) {
    final stats = ref.read(adminStatsProvider).asData?.value ?? {};
    final cropData = stats['cropGroups'] as Map<String, dynamic>? ?? {};
    final cropList = (cropData['items'] as List<dynamic>?)?.map((e) => e.toString()).toList() ??
        ['Rice', 'Sugarcane', 'Cotton', 'WHEAT', 'Tomato', 'Maize', 'Chilli', 'Turmeric'];
    final int cropCount = cropData['total'] ?? stats['totalCropGroups'] ?? cropList.length;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Row(
              children: [
                const Icon(Icons.grass_rounded, color: Color(0xFF16A34A), size: 24),
                const SizedBox(width: 10),
                Text(
                  'crop_groups_monitoring'.tr(lang),
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              '$cropCount distinct active crop varieties currently registered across farm digital twins.',
              style: TextStyle(fontSize: 13, color: isDark ? Colors.white70 : const Color(0xFF64748B), height: 1.4),
            ),
            const SizedBox(height: 14),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: cropList.map((crop) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFF16A34A).withValues(alpha: isDark ? 0.2 : 0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFF16A34A).withValues(alpha: 0.3)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.eco_rounded, size: 14, color: Color(0xFF16A34A)),
                    const SizedBox(width: 6),
                    Text(
                      crop,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: isDark ? Colors.white : const Color(0xFF15803D),
                      ),
                    ),
                  ],
                ),
              )).toList(),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('OK', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showSecurityAccessDialog(BuildContext context, String lang, bool isDark) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.8),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Row(
              children: [
                const Icon(Icons.security_rounded, color: Color(0xFF1D4ED8), size: 24),
                const SizedBox(width: 10),
                Text(
                  'security_access'.tr(lang),
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Expanded(child: _buildOperationsTab(isDark, lang)),
          ],
        ),
      ),
    );
  }

  void _showLogoutDialog(BuildContext context, String lang, bool isDark) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text(
          'logout'.tr(lang),
          style: TextStyle(
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
        ),
        content: Text(
          'logout_confirm'.tr(lang),
          style: TextStyle(
            fontSize: 14,
            color: isDark ? Colors.white70 : const Color(0xFF475569),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              'cancel'.tr(lang),
              style: TextStyle(
                color: isDark ? Colors.white60 : Colors.grey.shade600,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(authProvider.notifier).logout();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text('logout'.tr(lang), style: const TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}

