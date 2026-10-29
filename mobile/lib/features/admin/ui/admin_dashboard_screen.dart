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
// ADMIN DATA HELPERS & PROVIDERS
// -----------------------------------------------------------------------------
List<dynamic> extractListFromResponse(dynamic d) {
  if (d == null) return [];
  if (d is List) return d;
  if (d is Map) {
    if (d['data'] is List) return d['data'] as List<dynamic>;
    if (d['data'] is Map && d['data']['data'] is List) return d['data']['data'] as List<dynamic>;
    if (d['users'] is List) return d['users'] as List<dynamic>;
    if (d['equipment'] is List) return d['equipment'] as List<dynamic>;
    if (d['bookings'] is List) return d['bookings'] as List<dynamic>;
    if (d['results'] is List) return d['results'] as List<dynamic>;
    if (d['items'] is List) return d['items'] as List<dynamic>;
    if (d['logs'] is List) return d['logs'] as List<dynamic>;
  }
  return [];
}

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
  return extractListFromResponse(response.data);
});

final adminEquipmentProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final response = await ApiClient().dio.get('/admin/equipment');
  return extractListFromResponse(response.data);
});

final adminBookingsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final response = await ApiClient().dio.get('/admin/bookings');
  return extractListFromResponse(response.data);
});

final adminAuditLogsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final response = await ApiClient().dio.get('/admin/audit-logs');
  return extractListFromResponse(response.data);
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
  return extractListFromResponse(response.data);
});

final adminDataQualityProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final response = await ApiClient().dio.get('/admin/data-quality');
  return extractListFromResponse(response.data);
});

final adminEquipmentAnalyticsProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, period) async {
  try {
    final response = await ApiClient().dio.get('/admin/equipment-analytics', queryParameters: {'period': period});
    final dynamic d = response.data;
    if (d is Map<String, dynamic>) {
      return d['data'] is Map<String, dynamic> ? d['data'] as Map<String, dynamic> : d;
    }
  } catch (_) {}
  return {};
});

final adminOwnerEarningsProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, period) async {
  try {
    final response = await ApiClient().dio.get('/admin/owner-earnings', queryParameters: {'period': period});
    final dynamic d = response.data;
    if (d is Map<String, dynamic>) {
      return d['data'] is Map<String, dynamic> ? d['data'] as Map<String, dynamic> : d;
    }
  } catch (_) {}
  return {};
});

final adminCropAnalyticsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  try {
    final response = await ApiClient().dio.get('/admin/crop-analytics');
    final dynamic d = response.data;
    if (d is Map<String, dynamic>) {
      return d['data'] is Map<String, dynamic> ? d['data'] as Map<String, dynamic> : d;
    }
  } catch (_) {}
  return {};
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

  // Users Management State
  String _userSearch = '';
  String _userRole = 'All';
  String _userStatus = 'All';
  int _userPage = 1;
  final int _userLimit = 15;
  int _userTotal = 0;
  bool _isUsersLoading = false;
  String? _usersError;
  List<dynamic> _usersList = [];
  final TextEditingController _userSearchCtrl = TextEditingController();

  // Analytics Period State (7d, 30d, 90d, all)
  String _analyticsPeriod = '30d';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _fetchUsers();
      }
    });
  }

  @override
  void dispose() {
    _userSearchCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchUsers() async {
    if (!mounted) return;
    setState(() {
      _isUsersLoading = true;
      _usersError = null;
    });
    try {
      List<dynamic> list = [];
      int total = 0;

      if (_userSearch.trim().isEmpty && _userRole == 'All' && _userStatus == 'All' && _userPage == 1) {
        list = await ref.read(adminUsersProvider.future);
        total = list.length;
      } else {
        final queryParams = <String, dynamic>{
          'page': _userPage,
          'limit': _userLimit,
        };
        if (_userSearch.trim().isNotEmpty) {
          queryParams['search'] = _userSearch.trim();
        }
        if (_userRole != 'All') {
          queryParams['role'] = _userRole;
        }
        if (_userStatus != 'All') {
          queryParams['status'] = _userStatus;
        }

        final res = await ApiClient().dio.get('/admin/users', queryParameters: queryParams);
        final dynamic d = res.data;

        if (d is Map) {
          if (d['data'] is List) {
            list = d['data'] as List<dynamic>;
            total = (d['total'] as num?)?.toInt() ?? list.length;
          } else if (d['users'] is List) {
            list = d['users'] as List<dynamic>;
            total = (d['total'] as num?)?.toInt() ?? list.length;
          } else if (d['data'] is Map) {
            final inner = d['data'] as Map;
            if (inner['data'] is List) {
              list = inner['data'] as List<dynamic>;
            } else if (inner['users'] is List) {
              list = inner['users'] as List<dynamic>;
            }
            total = (inner['total'] as num?)?.toInt() ?? list.length;
          }
        } else if (d is List) {
          list = d;
          total = list.length;
        }
      }

      if (!mounted) return;
      setState(() {
        _usersList = list;
        _userTotal = total;
        _isUsersLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _usersError = e.toString().replaceFirst('Exception: ', '');
        _isUsersLoading = false;
      });
    }
  }

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
                      onTap: () => setState(() => _currentIndex = 1),
                    ),
                    _buildStatCard(
                      title: 'All Equipment',
                      value: '${equipment['total'] ?? 'Not Available'}',
                      subtitle: '${equipment['available'] ?? 0} active in fleet',
                      icon: Icons.agriculture_rounded,
                      color: const Color(0xFF2E7D32),
                      isDark: isDark,
                      onTap: () => _showEquipmentManagementModal(isDark, lang),
                    ),
                    _buildStatCard(
                      title: 'Active Rentals',
                      value: '${bookings['active'] ?? 'Not Available'}',
                      subtitle: '${bookings['completed'] ?? 0} completed rentals',
                      icon: Icons.receipt_long_rounded,
                      color: const Color(0xFFF57C00),
                      isDark: isDark,
                      onTap: () => _showBookingsManagementModal(isDark, lang),
                    ),
                    _buildStatCard(
                      title: 'open_complaints'.tr(lang),
                      value: '${moderation['openComplaints'] ?? '0'}',
                      subtitle: '${moderation['totalFeedback'] ?? 0} feedbacks received',
                      icon: Icons.warning_amber_rounded,
                      color: const Color(0xFFD32F2F),
                      isDark: isDark,
                      onTap: () => setState(() => _currentIndex = 2),
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
                        title: 'Fleet Moderation',
                        icon: Icons.agriculture_rounded,
                        color: const Color(0xFF16A34A),
                        isDark: isDark,
                        onTap: () => _showEquipmentManagementModal(isDark, lang),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildJumpButton(
                        title: 'All Bookings',
                        icon: Icons.receipt_long_rounded,
                        color: const Color(0xFF2563EB),
                        isDark: isDark,
                        onTap: () => _showBookingsManagementModal(isDark, lang),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildJumpButton(
                        title: 'Audit Logs',
                        icon: Icons.history_rounded,
                        color: const Color(0xFF7C3AED),
                        isDark: isDark,
                        onTap: () => _showAuditLogsModal(isDark, lang),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Platform Analytics & Trends (Parity with Web Admin)
                _buildAnalyticsSection(isDark, lang),
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
    VoidCallback? onTap,
  }) {
    return Container(
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
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(14),
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
          ),
        ),
      ),
    );
  }

  Widget _buildAnalyticsSection(bool isDark, String lang) {
    final eqAnalytics = ref.watch(adminEquipmentAnalyticsProvider(_analyticsPeriod));
    final ownerEarnings = ref.watch(adminOwnerEarningsProvider(_analyticsPeriod));
    final cropAnalytics = ref.watch(adminCropAnalyticsProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Analytics & Trends',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
            ),
            // Period selector
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  ...['7d', '30d', '90d', 'all'].map((p) {
                    final isSel = _analyticsPeriod == p;
                    return GestureDetector(
                      onTap: () => setState(() => _analyticsPeriod = p),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: isSel ? const Color(0xFF2563EB) : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          p.toUpperCase(),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: isSel ? Colors.white : (isDark ? Colors.white60 : Colors.grey.shade600),
                          ),
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // 1. Equipment Trends Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.bar_chart_rounded, color: Color(0xFF2563EB), size: 20),
                  const SizedBox(width: 8),
                  Text(
                    'Equipment Utilization & Categories',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              eqAnalytics.when(
                loading: () => const Center(
                  child: Padding(
                    padding: EdgeInsets.all(12.0),
                    child: CircularProgressIndicator(color: Color(0xFF2563EB)),
                  ),
                ),
                error: (e, _) => Text('Analytics offline: $e', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                data: (data) {
                  final categories = (data['categories'] as List<dynamic>?) ??
                      (data['popularCategories'] as List<dynamic>?) ??
                      [];
                  if (categories.isEmpty) {
                    return const Text('No category utilization recorded for this period.', style: TextStyle(fontSize: 12, color: Colors.grey));
                  }
                  return Column(
                    children: categories.take(4).map((c) {
                      final name = c['category']?.toString() ?? c['name']?.toString() ?? 'Category';
                      final count = c['count'] ?? c['bookingCount'] ?? 1;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8.0),
                        child: Row(
                          children: [
                            Expanded(
                              flex: 2,
                              child: Text(
                                name,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: isDark ? Colors.white70 : const Color(0xFF334155),
                                ),
                              ),
                            ),
                            Expanded(
                              flex: 3,
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: LinearProgressIndicator(
                                  value: (count is num ? count.toDouble() : 1.0) / 10.0,
                                  minHeight: 6,
                                  backgroundColor: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
                                  valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF2563EB)),
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Text(
                              '$count rentals',
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF2563EB)),
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
        const SizedBox(height: 12),

        // 2. Owner Performance & Agricultural Demands
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Owner Earnings preview
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.darkCard : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.monetization_on_rounded, size: 16, color: Color(0xFF16A34A)),
                        SizedBox(width: 6),
                        Text('Owner Payouts', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ownerEarnings.when(
                      loading: () => const Text('Loading...', style: TextStyle(fontSize: 11, color: Colors.grey)),
                      error: (e, _) => const Text('--', style: TextStyle(fontSize: 11, color: Colors.grey)),
                      data: (data) {
                        final total = data['totalEarnings'] ?? data['totalPayout'] ?? '₹0';
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '$total',
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF16A34A)),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${data['activeOwners'] ?? 0} active earners',
                              style: TextStyle(fontSize: 10.5, color: isDark ? Colors.white54 : Colors.grey.shade600),
                            ),
                          ],
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 10),

            // Crop Demand preview
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.darkCard : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.eco_rounded, size: 16, color: Color(0xFFEAB308)),
                        SizedBox(width: 6),
                        Text('Crop Demands', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    cropAnalytics.when(
                      loading: () => const Text('Loading...', style: TextStyle(fontSize: 11, color: Colors.grey)),
                      error: (e, _) => const Text('--', style: TextStyle(fontSize: 11, color: Colors.grey)),
                      data: (data) {
                        final topCrops = (data['topCrops'] as List<dynamic>?) ?? ['Paddy', 'Tomato'];
                        final cropNames = topCrops.take(2).map((c) => c is Map ? c['name'] ?? '' : c.toString()).where((s) => s.isNotEmpty).join(', ');
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              cropNames.isNotEmpty ? cropNames : 'Paddy, Tomato',
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFFEAB308)),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'High regional rental need',
                              style: TextStyle(fontSize: 10.5, color: isDark ? Colors.white54 : Colors.grey.shade600),
                            ),
                          ],
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  void _showEquipmentManagementModal(bool isDark, String lang) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Consumer(
        builder: (context, ref, _) {
          final eqState = ref.watch(adminEquipmentProvider);

          return Container(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.85,
            ),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.darkCard : Colors.white,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: SafeArea(
              child: Column(
                children: [
                  const SizedBox(height: 12),
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(color: Colors.grey.shade400, borderRadius: BorderRadius.circular(2)),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: const [
                            Icon(Icons.agriculture_rounded, color: Color(0xFF16A34A), size: 24),
                            SizedBox(width: 8),
                            Text('Equipment Fleet Moderation', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.refresh_rounded),
                          onPressed: () => ref.invalidate(adminEquipmentProvider),
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1),
                  Expanded(
                    child: eqState.when(
                      loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF16A34A))),
                      error: (e, _) => Center(child: Text('Error loading equipment: $e')),
                      data: (equipmentList) {
                        if (equipmentList.isEmpty) {
                          return const Center(child: Text('No machinery registered in fleet.'));
                        }
                        return ListView.builder(
                          padding: const EdgeInsets.all(14),
                          itemCount: equipmentList.length,
                          itemBuilder: (context, idx) {
                            final eq = equipmentList[idx] as Map<String, dynamic>;
                            final id = eq['id']?.toString() ?? '';
                            final title = eq['title']?.toString() ?? 'Equipment';
                            final cat = eq['category']?.toString() ?? 'Machinery';
                            final rate = eq['pricePerDay'] ?? 0;
                            final ownerName = eq['owner']?['name']?.toString() ?? 'Fleet Owner';
                            final isAvail = eq['available'] == true;

                            return Container(
                              margin: const EdgeInsets.only(bottom: 10),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
                              ),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    backgroundColor: const Color(0xFF16A34A).withValues(alpha: 0.15),
                                    child: const Icon(Icons.agriculture_rounded, color: Color(0xFF16A34A)),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                                        Text('$cat • ₹$rate/day • By $ownerName', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                      ],
                                    ),
                                  ),
                                  TextButton(
                                    onPressed: () async {
                                      final action = isAvail ? 'PAUSE' : 'APPROVE';
                                      try {
                                        await ApiClient().dio.put('/admin/equipment/$id/moderation', data: {'action': action});
                                        ref.invalidate(adminEquipmentProvider);
                                        ref.invalidate(adminStatsProvider);
                                      } catch (_) {}
                                    },
                                    child: Text(
                                      isAvail ? 'PAUSE' : 'ACTIVATE',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w800,
                                        color: isAvail ? const Color(0xFFDC2626) : const Color(0xFF16A34A),
                                      ),
                                    ),
                                  ),
                                ],
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
        },
      ),
    );
  }

  void _showBookingsManagementModal(bool isDark, String lang) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Consumer(
        builder: (context, ref, _) {
          final bookingsState = ref.watch(adminBookingsProvider);

          return Container(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.85,
            ),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.darkCard : Colors.white,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: SafeArea(
              child: Column(
                children: [
                  const SizedBox(height: 12),
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(color: Colors.grey.shade400, borderRadius: BorderRadius.circular(2)),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: const [
                            Icon(Icons.receipt_long_rounded, color: Color(0xFF2563EB), size: 24),
                            SizedBox(width: 8),
                            Text('Platform Rental Bookings', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.refresh_rounded),
                          onPressed: () => ref.invalidate(adminBookingsProvider),
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1),
                  Expanded(
                    child: bookingsState.when(
                      loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF2563EB))),
                      error: (e, _) => Center(child: Text('Error loading bookings: $e')),
                      data: (bookingsList) {
                        if (bookingsList.isEmpty) {
                          return const Center(child: Text('No rental bookings recorded yet.'));
                        }
                        return ListView.builder(
                          padding: const EdgeInsets.all(14),
                          itemCount: bookingsList.length,
                          itemBuilder: (context, idx) {
                            final b = bookingsList[idx] as Map<String, dynamic>;
                            final id = b['id']?.toString().substring(0, 8) ?? '';
                            final eqTitle = b['equipment']?['title']?.toString() ?? 'Equipment';
                            final farmerName = b['farmer']?['name']?.toString() ?? 'Farmer';
                            final amount = b['totalAmount'] ?? 0;
                            final status = b['status']?.toString() ?? 'CONFIRMED';

                            Color statusColor = const Color(0xFF2563EB);
                            if (status == 'COMPLETED') statusColor = const Color(0xFF16A34A);
                            if (status == 'PENDING') statusColor = const Color(0xFFEAB308);
                            if (status == 'CANCELLED') statusColor = const Color(0xFFDC2626);

                            return Container(
                              margin: const EdgeInsets.only(bottom: 10),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
                              ),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    backgroundColor: statusColor.withValues(alpha: 0.15),
                                    child: Icon(Icons.receipt_rounded, color: statusColor),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('Booking #$id • $eqTitle', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5)),
                                        Text('Rented by $farmerName • Total: ₹$amount', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: statusColor.withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      status,
                                      style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800, color: statusColor),
                                    ),
                                  ),
                                ],
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
        },
      ),
    );
  }

  void _showAuditLogsModal(bool isDark, String lang) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Consumer(
        builder: (context, ref, _) {
          final logsState = ref.watch(adminAuditLogsProvider);

          return Container(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.85,
            ),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.darkCard : Colors.white,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: SafeArea(
              child: Column(
                children: [
                  const SizedBox(height: 12),
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(color: Colors.grey.shade400, borderRadius: BorderRadius.circular(2)),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: const [
                            Icon(Icons.history_rounded, color: Color(0xFF7C3AED), size: 24),
                            SizedBox(width: 8),
                            Text('Platform Audit Trail', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.refresh_rounded),
                          onPressed: () => ref.invalidate(adminAuditLogsProvider),
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1),
                  Expanded(
                    child: logsState.when(
                      loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF7C3AED))),
                      error: (e, _) => Center(child: Text('Error loading audit logs: $e')),
                      data: (logs) {
                        if (logs.isEmpty) {
                          return const Center(child: Text('No system audit logs found.'));
                        }
                        return ListView.builder(
                          padding: const EdgeInsets.all(14),
                          itemCount: logs.length,
                          itemBuilder: (context, idx) {
                            final log = logs[idx] as Map<String, dynamic>;
                            final action = log['action']?.toString() ?? 'SYSTEM_EVENT';
                            final resource = log['resource']?.toString() ?? '';
                            final time = log['createdAt'] != null
                                ? DateFormat('dd MMM, h:mm a').format(DateTime.parse(log['createdAt']))
                                : '';

                            return Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.security_rounded, size: 18, color: Color(0xFF7C3AED)),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(action.replaceAll('_', ' '), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                                        if (resource.isNotEmpty)
                                          Text('Resource: $resource', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                      ],
                                    ),
                                  ),
                                  Text(time, style: const TextStyle(fontSize: 10, color: Colors.grey)),
                                ],
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
        },
      ),
    );
  }

  void _showBroadcastAlertDialog(bool isDark) {
    final titleCtrl = TextEditingController();
    final msgCtrl = TextEditingController();
    String target = 'ALL';
    bool isSending = false;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDlgState) => AlertDialog(
          backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF2563EB).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.campaign_rounded, color: Color(0xFF2563EB), size: 22),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'Send Broadcast Alert',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Target Audience:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
              const SizedBox(height: 6),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    ChoiceChip(
                      label: const Text('All Users', style: TextStyle(fontSize: 11)),
                      selected: target == 'ALL',
                      onSelected: isSending ? null : (_) => setDlgState(() => target = 'ALL'),
                    ),
                    const SizedBox(width: 6),
                    ChoiceChip(
                      label: const Text('Farmers', style: TextStyle(fontSize: 11)),
                      selected: target == 'FARMER',
                      onSelected: isSending ? null : (_) => setDlgState(() => target = 'FARMER'),
                    ),
                    const SizedBox(width: 6),
                    ChoiceChip(
                      label: const Text('Owners', style: TextStyle(fontSize: 11)),
                      selected: target == 'OWNER',
                      onSelected: isSending ? null : (_) => setDlgState(() => target = 'OWNER'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: titleCtrl,
                enabled: !isSending,
                decoration: const InputDecoration(
                  labelText: 'Alert Headline',
                  hintText: 'e.g. Critical Weather Advisory or Subsidy Update',
                  border: OutlineInputBorder(),
                  contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: msgCtrl,
                enabled: !isSending,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Message Body',
                  hintText: 'Details for intended farmers / owners...',
                  border: OutlineInputBorder(),
                  contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: isSending ? null : () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: isSending
                  ? null
                  : () async {
                      final title = titleCtrl.text.trim();
                      final message = msgCtrl.text.trim();
                      if (title.isEmpty || message.isEmpty) return;

                      setDlgState(() => isSending = true);
                      final messenger = ScaffoldMessenger.of(context);

                      try {
                        final res = await ApiClient().dio.post('/admin/alerts/broadcast', data: {
                          'title': title,
                          'message': message,
                          'targetRole': target,
                          'type': 'ADMIN_BROADCAST',
                        });

                        final successMsg = res.data?['message']?.toString() ?? 'Broadcast alert dispatched successfully.';

                        if (ctx.mounted) {
                          Navigator.pop(ctx);
                        }

                        messenger.showSnackBar(
                          SnackBar(
                            content: Text(successMsg),
                            backgroundColor: const Color(0xFF16A34A),
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                        ref.invalidate(adminAlertsProvider);
                      } catch (e) {
                        setDlgState(() => isSending = false);
                        messenger.showSnackBar(
                          SnackBar(
                            content: Text('Failed to dispatch alert: $e'),
                            backgroundColor: Colors.red,
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: isSending
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Text('Dispatch Alert', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ],
        ),
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'open_complaints'.tr(lang),
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : AppTheme.textDarkNavy,
                      ),
                    ),
                    ElevatedButton.icon(
                      onPressed: () => _showBroadcastAlertDialog(isDark),
                      icon: const Icon(Icons.campaign_rounded, size: 16),
                      label: const Text('Broadcast Alert', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2563EB),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ],
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
      await ApiClient().dio.put('/admin/complaints/$id/status', data: {
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
  // TAB 1: USERS DIRECTORY & ACCOUNT MANAGEMENT
  // ---------------------------------------------------------------------------
  Widget _buildUsersTab(bool isDark, String lang) {
    final totalPages = _userTotal > 0 ? (_userTotal / _userLimit).ceil() : 1;

    return Column(
      children: [
        // 1. Search Bar & Filter Header
        Container(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          color: isDark ? AppTheme.darkCard : Colors.white,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(
                controller: _userSearchCtrl,
                style: TextStyle(
                  fontSize: 14,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
                decoration: InputDecoration(
                  hintText: 'Search by name, email, or phone...',
                  hintStyle: TextStyle(
                    fontSize: 13,
                    color: isDark ? Colors.white38 : Colors.grey.shade500,
                  ),
                  prefixIcon: const Icon(Icons.search_rounded, size: 20, color: Color(0xFF2563EB)),
                  suffixIcon: _userSearch.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear_rounded, size: 18),
                          onPressed: () {
                            _userSearchCtrl.clear();
                            setState(() {
                              _userSearch = '';
                              _userPage = 1;
                            });
                            _fetchUsers();
                          },
                        )
                      : null,
                  filled: true,
                  fillColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide.none,
                  ),
                ),
                onSubmitted: (val) {
                  setState(() {
                    _userSearch = val.trim();
                    _userPage = 1;
                  });
                  _fetchUsers();
                },
              ),
              const SizedBox(height: 10),

              // Role Filter Chips
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    const Text(
                      'Role: ',
                      style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: Colors.grey),
                    ),
                    ...['All', 'FARMER', 'OWNER', 'ADMIN'].map((role) {
                      final isSel = _userRole == role;
                      return Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: ChoiceChip(
                          label: Text(
                            role == 'All' ? 'All Roles' : (role == 'FARMER' ? 'Farmers' : (role == 'OWNER' ? 'Owners' : 'Admins')),
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                              color: isSel ? Colors.white : (isDark ? Colors.white70 : const Color(0xFF334155)),
                            ),
                          ),
                          selected: isSel,
                          selectedColor: const Color(0xFF2563EB),
                          backgroundColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          side: BorderSide.none,
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
                          onSelected: (_) {
                            setState(() {
                              _userRole = role;
                              _userPage = 1;
                            });
                            _fetchUsers();
                          },
                        ),
                      );
                    }),
                    const SizedBox(width: 8),
                    const Text(
                      'Status: ',
                      style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: Colors.grey),
                    ),
                    ...['All', 'Active', 'Suspended'].map((status) {
                      final isSel = _userStatus == status;
                      return Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: ChoiceChip(
                          label: Text(
                            status == 'All' ? 'All Status' : status,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                              color: isSel ? Colors.white : (isDark ? Colors.white70 : const Color(0xFF334155)),
                            ),
                          ),
                          selected: isSel,
                          selectedColor: status == 'Suspended' ? const Color(0xFFDC2626) : const Color(0xFF16A34A),
                          backgroundColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          side: BorderSide.none,
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
                          onSelected: (_) {
                            setState(() {
                              _userStatus = status;
                              _userPage = 1;
                            });
                            _fetchUsers();
                          },
                        ),
                      );
                    }),
                  ],
                ),
              ),
              const SizedBox(height: 6),

              // Record Counter
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Showing ${_usersList.length} accounts${_userTotal > 0 ? ' of $_userTotal total' : ''}',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.white54 : Colors.grey.shade600,
                    ),
                  ),
                  if (_isUsersLoading)
                    const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF2563EB)),
                    ),
                ],
              ),
            ],
          ),
        ),
        const Divider(height: 1),

        // 2. Main List View or States with Safe RefreshIndicator
        Expanded(
          child: RefreshIndicator(
            color: const Color(0xFF2563EB),
            onRefresh: () async => _fetchUsers(),
            child: _isUsersLoading && _usersList.isEmpty
                ? const Center(
                    child: CircularProgressIndicator(color: Color(0xFF2563EB)),
                  )
                : _usersError != null
                    ? SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        child: Container(
                          alignment: Alignment.center,
                          padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 20),
                          child: _buildErrorState(_usersError!, isDark, lang, () => _fetchUsers()),
                        ),
                      )
                    : _usersList.isEmpty
                        ? SingleChildScrollView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            child: Container(
                              alignment: Alignment.center,
                              padding: const EdgeInsets.symmetric(vertical: 40),
                              child: _buildUsersEmptyState(isDark, lang),
                            ),
                          )
                        : ListView.builder(
                            physics: const AlwaysScrollableScrollPhysics(),
                            padding: const EdgeInsets.all(14),
                            itemCount: _usersList.length,
                            itemBuilder: (context, index) {
                              return _buildUserCard(_usersList[index], isDark, lang);
                            },
                          ),
          ),
        ),

        // 3. Pagination Controls
        if (totalPages > 1)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.darkCard : Colors.white,
              border: Border(
                top: BorderSide(
                  color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
                ),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                OutlinedButton.icon(
                  onPressed: _userPage > 1
                      ? () {
                          setState(() => _userPage--);
                          _fetchUsers();
                        }
                      : null,
                  icon: const Icon(Icons.chevron_left_rounded, size: 18),
                  label: const Text('Previous', style: TextStyle(fontSize: 12)),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
                Text(
                  'Page $_userPage of $totalPages',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.white70 : const Color(0xFF334155),
                  ),
                ),
                OutlinedButton.icon(
                  onPressed: _userPage < totalPages
                      ? () {
                          setState(() => _userPage++);
                          _fetchUsers();
                        }
                      : null,
                  icon: const Icon(Icons.chevron_right_rounded, size: 18),
                  label: const Text('Next', style: TextStyle(fontSize: 12)),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildUsersEmptyState(bool isDark, String lang) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF2563EB).withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.person_search_rounded,
                size: 48,
                color: Color(0xFF2563EB),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'No matching users found',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              _userSearch.isNotEmpty
                  ? 'No users matched search "$_userSearch" with the selected role and status filters.'
                  : 'There are no user accounts in the system matching the active filters.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12.5,
                color: isDark ? Colors.white60 : AppTheme.textMutedGray,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 18),
            ElevatedButton.icon(
              onPressed: () {
                _userSearchCtrl.clear();
                setState(() {
                  _userSearch = '';
                  _userRole = 'All';
                  _userStatus = 'All';
                  _userPage = 1;
                });
                _fetchUsers();
              },
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('Reset All Filters', style: TextStyle(fontWeight: FontWeight.w700)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUserCard(dynamic rawU, bool isDark, String lang) {
    final u = (rawU is Map) ? rawU : const <String, dynamic>{};
    final id = u['id']?.toString() ?? '';
    final name = u['name']?.toString() ?? 'User';
    final email = u['email']?.toString() ?? '';
    final phone = u['phone']?.toString() ?? '';
    final role = u['role']?.toString() ?? 'USER';
    final isSuspended = u['isSuspended'] == true;
    final isVerified = u['isVerified'] == true;
    final counts = (u['_count'] is Map) ? (u['_count'] as Map) : const {};
    final bookingsCount = counts['bookings'] ?? 0;
    final equipmentsCount = counts['equipments'] ?? 0;

    Color roleColor = const Color(0xFF16A34A);
    if (role == 'OWNER' || role == 'EQUIPMENT_OWNER') roleColor = const Color(0xFF2563EB);
    if (role == 'ADMIN') roleColor = const Color(0xFF7C3AED);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isSuspended
              ? const Color(0xFFDC2626).withValues(alpha: 0.4)
              : (isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06)),
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
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Avatar
              Stack(
                children: [
                  CircleAvatar(
                    radius: 22,
                    backgroundColor: roleColor.withValues(alpha: 0.15),
                    child: Text(
                      name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'U',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: roleColor,
                      ),
                    ),
                  ),
                  if (isVerified)
                    const Positioned(
                      bottom: -2,
                      right: -2,
                      child: Icon(Icons.verified_rounded, size: 16, color: Color(0xFF2563EB)),
                    ),
                ],
              ),
              const SizedBox(width: 12),

              // Name and Credentials
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            name,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.white : AppTheme.textDarkNavy,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 6),
                        // Role Pill
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: roleColor.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            role,
                            style: TextStyle(
                              fontSize: 9.5,
                              fontWeight: FontWeight.w800,
                              color: roleColor,
                            ),
                          ),
                        ),
                        if (isSuspended) ...[
                          const SizedBox(width: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFDC2626).withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'SUSPENDED',
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFFDC2626),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      email,
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? Colors.white60 : const Color(0xFF64748B),
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (phone.isNotEmpty)
                      Text(
                        phone,
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark ? Colors.white38 : Colors.grey.shade500,
                        ),
                      ),
                  ],
                ),
              ),

              // Action Buttons
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // View Deep Profile Details Modal
                  IconButton(
                    icon: const Icon(Icons.visibility_outlined, size: 20, color: Color(0xFF2563EB)),
                    tooltip: 'View Profile Details',
                    onPressed: () => _showUserDetailModal(id, isDark, lang),
                  ),

                  // Verify Owner (if owner)
                  if (role == 'OWNER' || role == 'EQUIPMENT_OWNER')
                    IconButton(
                      icon: Icon(
                        isVerified ? Icons.verified_rounded : Icons.verified_outlined,
                        size: 20,
                        color: isVerified ? const Color(0xFF16A34A) : Colors.grey,
                      ),
                      tooltip: isVerified ? 'Verified Owner' : 'Verify Owner',
                      onPressed: () => _confirmVerifyOwner(id, name, !isVerified),
                    ),

                  // Suspend / Reactivate
                  if (role != 'ADMIN')
                    IconButton(
                      icon: Icon(
                        isSuspended ? Icons.lock_open_rounded : Icons.block_rounded,
                        size: 20,
                        color: isSuspended ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                      ),
                      tooltip: isSuspended ? 'Reactivate Account' : 'Suspend Account',
                      onPressed: () => _confirmToggleSuspend(id, name, !isSuspended),
                    ),
                ],
              ),
            ],
          ),

          // Counts row
          const SizedBox(height: 10),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Bookings: $bookingsCount',
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.white70 : const Color(0xFF475569),
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Equipments: $equipmentsCount',
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.white70 : const Color(0xFF475569),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showUserDetailModal(String userId, bool isDark, String lang) async {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => FutureBuilder<Response>(
        future: ApiClient().dio.get('/admin/users/$userId'),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Container(
              height: 300,
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkCard : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: const Center(child: CircularProgressIndicator(color: Color(0xFF2563EB))),
            );
          }
          if (snapshot.hasError || !snapshot.hasData) {
            return Container(
              height: 250,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkCard : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Center(
                child: Text('Failed to load user profile: ${snapshot.error}'),
              ),
            );
          }

          final dynamic raw = snapshot.data?.data;
          final Map<String, dynamic> u = (raw is Map && raw['data'] is Map)
              ? raw['data'] as Map<String, dynamic>
              : (raw is Map ? raw as Map<String, dynamic> : {});

          final name = u['name']?.toString() ?? 'User Profile';
          final email = u['email']?.toString() ?? '';
          final phone = u['phone']?.toString() ?? 'No phone provided';
          final role = u['role']?.toString() ?? 'USER';
          final isVerified = u['isVerified'] == true;
          final isSuspended = u['isSuspended'] == true;
          final equipments = (u['equipments'] as List<dynamic>?) ?? [];
          final bookings = (u['bookings'] as List<dynamic>?) ?? [];

          return Container(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.82,
            ),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.darkCard : Colors.white,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade400,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 26,
                          backgroundColor: const Color(0xFF2563EB).withValues(alpha: 0.15),
                          child: Text(
                            name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'U',
                            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF2563EB)),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                name,
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                ),
                              ),
                              Text(
                                '$email • $phone',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? Colors.white60 : const Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 8,
                      children: [
                        Chip(
                          label: Text(role, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 11)),
                          backgroundColor: const Color(0xFF2563EB).withValues(alpha: 0.12),
                          side: BorderSide.none,
                        ),
                        Chip(
                          label: Text(isVerified ? 'Verified Account' : 'Unverified',
                              style: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 11,
                                  color: isVerified ? const Color(0xFF16A34A) : Colors.grey)),
                          backgroundColor: (isVerified ? Colors.green : Colors.grey).withValues(alpha: 0.12),
                          side: BorderSide.none,
                        ),
                        if (isSuspended)
                          const Chip(
                            label: Text('Suspended', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11, color: Colors.red)),
                            backgroundColor: Color(0x22DC2626),
                            side: BorderSide.none,
                          ),
                      ],
                    ),
                    const Divider(height: 28),

                    // Equipment section
                    if (equipments.isNotEmpty) ...[
                      Text(
                        'Fleet Machinery (${equipments.length})',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
                        ),
                      ),
                      const SizedBox(height: 10),
                      ...equipments.map((eq) {
                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.agriculture_rounded, color: Color(0xFF16A34A), size: 24),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      eq['title']?.toString() ?? 'Equipment',
                                      style: TextStyle(
                                        fontSize: 13.5,
                                        fontWeight: FontWeight.w700,
                                        color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                      ),
                                    ),
                                    Text(
                                      '${eq['category']} • ₹${eq['pricePerDay']}/day',
                                      style: TextStyle(
                                        fontSize: 11.5,
                                        color: isDark ? Colors.white60 : const Color(0xFF64748B),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                decoration: BoxDecoration(
                                  color: (eq['available'] == true ? Colors.green : Colors.orange).withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  eq['available'] == true ? 'AVAILABLE' : 'RENTED',
                                  style: TextStyle(
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.w800,
                                    color: eq['available'] == true ? Colors.green : Colors.orange,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                      const SizedBox(height: 16),
                    ],

                    // Bookings section
                    if (bookings.isNotEmpty) ...[
                      Text(
                        'Recent Bookings (${bookings.length})',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
                        ),
                      ),
                      const SizedBox(height: 10),
                      ...bookings.take(5).map((b) {
                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Booking #${b['id']?.toString().substring(0, 8) ?? ''}',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                    ),
                                  ),
                                  Text(
                                    'Total: ₹${b['totalAmount'] ?? 0}',
                                    style: const TextStyle(
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF16A34A),
                                    ),
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF2563EB).withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  b['status']?.toString() ?? 'STATUS',
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF2563EB),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                    ],
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  void _confirmVerifyOwner(String id, String name, bool verify) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(verify ? 'Verify Equipment Owner' : 'Revoke Verification'),
        content: Text(
          verify
              ? 'Are you sure you want to verify "$name" as an approved fleet operator on AgroRent?'
              : 'Are you sure you want to revoke verified status for "$name"?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await ApiClient().dio.put('/admin/users/$id/verify', data: {'isVerified': verify});
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Owner verification updated for $name')),
                  );
                }
                _fetchUsers();
                ref.invalidate(adminStatsProvider);
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Failed: ${e.toString()}')),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: verify ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
              foregroundColor: Colors.white,
            ),
            child: Text(verify ? 'Verify' : 'Revoke'),
          ),
        ],
      ),
    );
  }

  void _confirmToggleSuspend(String id, String name, bool suspend) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(suspend ? 'Suspend User Account' : 'Reactivate User Account'),
        content: Text(
          suspend
              ? 'Are you sure you want to suspend "$name"? They will immediately lose access to book machinery or manage listings.'
              : 'Are you sure you want to reinstate and reactivate "$name"?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await ApiClient().dio.put('/admin/users/$id/suspend', data: {
                  'isSuspended': suspend,
                  'reason': suspend ? 'Suspended by admin' : 'Reinstated by admin',
                });
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(suspend ? 'User $name has been suspended' : 'User $name reactivated')),
                  );
                }
                _fetchUsers();
                ref.invalidate(adminStatsProvider);
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Failed: ${e.toString()}')),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: suspend ? const Color(0xFFDC2626) : const Color(0xFF16A34A),
              foregroundColor: Colors.white,
            ),
            child: Text(suspend ? 'Suspend' : 'Reactivate'),
          ),
        ],
      ),
    );
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

