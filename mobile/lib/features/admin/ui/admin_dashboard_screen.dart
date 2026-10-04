import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../core/localization/app_localizations.dart';

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

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final user = ref.watch(authProvider).user;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
      appBar: AppBar(
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
                color: const Color(0xFFD32F2F).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.admin_panel_settings_rounded,
                color: Color(0xFFD32F2F),
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
            icon: const Icon(Icons.logout_rounded, color: Color(0xFFD32F2F), size: 22),
            tooltip: 'Log Out',
            onPressed: () => ref.read(authProvider.notifier).logout(),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: _buildTabBody(isDark, lang),
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
          indicatorColor: AppTheme.primaryGreen.withValues(alpha: 0.15),
          elevation: 0,
          onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
          destinations: [
            NavigationDestination(
              icon: const Icon(Icons.dashboard_outlined),
              selectedIcon: const Icon(Icons.dashboard_rounded, color: AppTheme.primaryGreen),
              label: 'home'.tr(lang),
            ),
            NavigationDestination(
              icon: const Icon(Icons.monitor_heart_outlined),
              selectedIcon: const Icon(Icons.monitor_heart_rounded, color: AppTheme.primaryGreen),
              label: 'operations'.tr(lang),
            ),
            NavigationDestination(
              icon: const Icon(Icons.notification_important_outlined),
              selectedIcon: const Icon(Icons.notification_important_rounded, color: AppTheme.primaryGreen),
              label: 'alerts_complaints'.tr(lang),
            ),
            NavigationDestination(
              icon: const Icon(Icons.health_and_safety_outlined),
              selectedIcon: const Icon(Icons.health_and_safety_rounded, color: AppTheme.primaryGreen),
              label: 'system_health'.tr(lang),
            ),
            NavigationDestination(
              icon: const Icon(Icons.people_outline_rounded),
              selectedIcon: const Icon(Icons.people_rounded, color: AppTheme.primaryGreen),
              label: 'user_management'.tr(lang),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTabBody(bool isDark, String lang) {
    switch (_currentIndex) {
      case 0:
        return _buildStatsTab(isDark, lang);
      case 1:
        return _buildOperationsTab(isDark, lang);
      case 2:
        return _buildAlertsTab(isDark, lang);
      case 3:
        return _buildSystemHealthTab(isDark, lang);
      case 4:
        return _buildUsersTab(isDark, lang);
      default:
        return const SizedBox();
    }
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
                      subtitle: '${users['farmers'] ?? 0} farmers Ã¢â‚¬Â¢ ${users['owners'] ?? 0} owners',
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
    final gmv = fin['gmv'] != null ? 'Ã¢â€šÂ¹${fin['gmv']}' : 'not_available'.tr(lang);
    final commission = fin['platformRevenue'] != null ? 'Ã¢â€šÂ¹${fin['platformRevenue']}' : 'not_available'.tr(lang);
    final payouts = fin['ownerRevenue'] != null ? 'Ã¢â€šÂ¹${fin['ownerRevenue']}' : 'not_available'.tr(lang);

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
                                'Rating: ${f['rating'] ?? 5}/5 Ã¢â‚¬Â¢ by ${f['user']?['name'] ?? 'User'}',
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
                            '${u['email'] ?? ''} Ã¢â‚¬Â¢ $role',
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
}
