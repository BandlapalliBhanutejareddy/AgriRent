import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../models/booking.dart';
import '../../../models/equipment.dart';
import '../../auth/providers/auth_provider.dart';
import '../../notifications/providers/notification_provider.dart';
import '../providers/owner_provider.dart';
import 'analytics_report_screen.dart';

class OwnerHomeScreen extends ConsumerWidget {
  final Function(int)? onNavigateTab;

  const OwnerHomeScreen({super.key, this.onNavigateTab});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageProvider);
    final user = ref.watch(authProvider).user;
    final ownerState = ref.watch(ownerProvider);
    final analytics = ownerState.analytics;
    final unreadCount = ref.watch(unreadNotificationsCountProvider);
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
            CircleAvatar(
              radius: 18,
              backgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.12),
              child: const Icon(
                Icons.person_rounded,
                color: AppTheme.primaryGreen,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '${'good_morning'.tr(lang)} ${user?.name ?? ''}',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    'owner_dashboard'.tr(lang),
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: isDark ? Colors.white60 : AppTheme.textMutedGray,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(
                  Icons.notifications_outlined,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  size: 24,
                ),
                if (unreadCount > 0)
                  Positioned(
                    right: -2,
                    top: -2,
                    child: Container(
                      padding: const EdgeInsets.all(3),
                      decoration: const BoxDecoration(
                        color: Color(0xFFE53935),
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(minWidth: 14, minHeight: 14),
                      child: Text(
                        '$unreadCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            ),
            onPressed: () => context.push('/notifications'),
          ),
          IconButton(
            icon: Icon(
              Icons.refresh_rounded,
              color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
            ),
            onPressed: () => ref.read(ownerProvider.notifier).fetchDashboardData(),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(ownerProvider.notifier).fetchDashboardData(),
        color: AppTheme.primaryGreen,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome Hero Banner
              _buildHeroBanner(user?.name ?? '', isDark, lang),
              const SizedBox(height: 20),

              // Authoritative Metrics Grid
              if (ownerState.isLoading && analytics == null)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: Center(
                    child: CircularProgressIndicator(color: AppTheme.primaryGreen),
                  ),
                )
              else if (ownerState.error != null && analytics == null)
                _buildErrorCard(ownerState.error!, ref, isDark, lang)
              else ...[
                _buildMetricsSection(
                  context,
                  ref,
                  analytics,
                  ownerState.bookings,
                  ownerState.myEquipment,
                  isDark,
                  lang,
                ),
                const SizedBox(height: 24),

                // Quick Action Buttons
                _buildQuickActions(context, isDark, lang),
                const SizedBox(height: 24),

                // Monthly Revenue Trends
                if (analytics != null &&
                    analytics['monthlyRevenue'] != null &&
                    (analytics['monthlyRevenue'] as List).isNotEmpty) ...[
                  _buildRevenueTrends(analytics['monthlyRevenue'] as List, isDark, lang),
                  const SizedBox(height: 24),
                ],

                // Top Performing Equipment
                if (analytics != null &&
                    analytics['topEquipment'] != null &&
                    (analytics['topEquipment'] as List).isNotEmpty) ...[
                  _buildTopEquipment(analytics['topEquipment'] as List, isDark, lang),
                  const SizedBox(height: 24),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeroBanner(String name, bool isDark, String lang) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFF1B5E20),
            Color(0xFF2E7D32),
          ],
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
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'FLEET OWNER',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            name.isNotEmpty ? 'Welcome, $name' : 'Owner Dashboard',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Monitor fleet rental yield, pending bookings & machine status.',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 12.5,
              height: 1.3,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricsSection(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic>? analytics,
    List<Booking> bookings,
    List<Equipment> equipment,
    bool isDark,
    String lang,
  ) {
    final totalRevenue = analytics?['totalRevenue'];
    final activeRentals = analytics?['activeRentals'];
    final pendingBookings = analytics?['pendingBookings'];
    final completedBookings = analytics?['completedBookings'];

    final revenueStr = totalRevenue != null ? '₹$totalRevenue' : 'not_available'.tr(lang);
    final activeStr = activeRentals != null ? '$activeRentals' : 'not_available'.tr(lang);
    final pendingStr = pendingBookings != null ? '$pendingBookings' : 'not_available'.tr(lang);
    final completedStr = completedBookings != null ? '$completedBookings' : 'not_available'.tr(lang);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'revenue_generated'.tr(lang),
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
            ),
            Text(
              'tap_to_view_reports'.tr(lang),
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppTheme.primaryGreen,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.25,
          children: [
            _buildMetricCard(
              title: 'revenue'.tr(lang),
              value: revenueStr,
              icon: Icons.currency_rupee_rounded,
              accentColor: const Color(0xFF2E7D32),
              isDark: isDark,
              onTap: () => _openRevenueReport(context, ref, bookings, totalRevenue),
            ),
            _buildMetricCard(
              title: 'active_rentals'.tr(lang),
              value: activeStr,
              icon: Icons.agriculture_rounded,
              accentColor: const Color(0xFF1976D2),
              isDark: isDark,
              onTap: () => _openActiveRentalsReport(context, ref, bookings, activeRentals),
            ),
            _buildMetricCard(
              title: 'pending_requests'.tr(lang),
              value: pendingStr,
              icon: Icons.pending_actions_rounded,
              accentColor: const Color(0xFFF57C00),
              isDark: isDark,
              onTap: () => _openPendingRequestsReport(context, ref, bookings, pendingBookings),
            ),
            _buildMetricCard(
              title: 'completed_rentals'.tr(lang),
              value: completedStr,
              icon: Icons.check_circle_outline_rounded,
              accentColor: const Color(0xFF00897B),
              isDark: isDark,
              onTap: () => _openCompletedRentalsReport(context, ref, bookings, completedBookings),
            ),
          ],
        ),
      ],
    );
  }

  void _openRevenueReport(BuildContext context, WidgetRef ref, List<Booking> bookings, dynamic totalRevenue) {
    const revenueStatuses = ['COMPLETED', 'ACTIVE', 'RETURN_PENDING', 'RETURN_IN_PROGRESS', 'RETURNED', 'INSPECTION_PENDING', 'ACCEPTED'];
    final revBookings = bookings.where((b) => revenueStatuses.contains(b.status.toUpperCase())).toList();
    final totalSum = revBookings.fold<double>(0.0, (sum, b) => sum + (b.totalPrice ?? 0.0));

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (ctx) => AnalyticsReportScreen(
          title: 'Revenue Report',
          subtitle: 'Qualifying rental contracts generating platform revenue',
          metricValue: '₹${totalRevenue ?? totalSum.toStringAsFixed(0)}',
          metricLabel: 'Total Platform Revenue',
          columns: const ['Booking ID', 'Equipment', 'Customer', 'Dates', 'Status', 'Amount'],
          totalSum: totalSum,
          onRefresh: () => ref.read(ownerProvider.notifier).fetchDashboardData(),
          rows: revBookings.map((b) {
            final start = DateFormat('dd MMM').format(b.startDate);
            final end = DateFormat('dd MMM yy').format(b.endDate);
            return ReportRowData(
              values: {
                'Booking ID': b.id.length > 8 ? b.id.substring(b.id.length - 8) : b.id,
                'Equipment': b.equipment?.title ?? 'Equipment',
                'Customer': b.farmer?.name ?? (b.farmer?.email ?? 'Farmer'),
                'Dates': '$start - $end',
                'Status': b.status,
                'Amount': '₹${b.totalPrice?.toStringAsFixed(0) ?? '0'}',
              },
              status: b.status,
              amount: b.totalPrice,
            );
          }).toList(),
        ),
      ),
    );
  }

  void _openActiveRentalsReport(BuildContext context, WidgetRef ref, List<Booking> bookings, dynamic activeCount) {
    final activeBookings = bookings.where((b) => b.status.toUpperCase() == 'ACTIVE' || b.status.toUpperCase() == 'ACCEPTED').toList();
    final totalSum = activeBookings.fold<double>(0.0, (sum, b) => sum + (b.totalPrice ?? 0.0));

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (ctx) => AnalyticsReportScreen(
          title: 'Active Rentals Report',
          subtitle: 'Machinery currently deployed and in active farm operation',
          metricValue: '${activeCount ?? activeBookings.length} Active',
          metricLabel: 'Active Deployments',
          columns: const ['Booking ID', 'Equipment', 'Customer', 'Start Date', 'End Date', 'Status', 'Daily Rate'],
          totalSum: totalSum,
          onRefresh: () => ref.read(ownerProvider.notifier).fetchDashboardData(),
          rows: activeBookings.map((b) {
            return ReportRowData(
              values: {
                'Booking ID': b.id.length > 8 ? b.id.substring(b.id.length - 8) : b.id,
                'Equipment': b.equipment?.title ?? 'Equipment',
                'Customer': b.farmer?.name ?? 'Farmer',
                'Start Date': DateFormat('dd MMM yyyy').format(b.startDate),
                'End Date': DateFormat('dd MMM yyyy').format(b.endDate),
                'Status': b.status,
                'Daily Rate': '₹${b.equipment?.pricePerDay?.toStringAsFixed(0) ?? '0'}',
              },
              status: b.status,
            );
          }).toList(),
        ),
      ),
    );
  }

  void _openPendingRequestsReport(BuildContext context, WidgetRef ref, List<Booking> bookings, dynamic pendingCount) {
    final pendingList = bookings.where((b) => b.status.toUpperCase() == 'PENDING').toList();
    final totalSum = pendingList.fold<double>(0.0, (sum, b) => sum + (b.totalPrice ?? 0.0));

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (ctx) => AnalyticsReportScreen(
          title: 'Pending Requests Report',
          subtitle: 'Incoming rental bookings awaiting owner confirmation',
          metricValue: '${pendingCount ?? pendingList.length} Pending',
          metricLabel: 'Awaiting Acceptance',
          columns: const ['Booking ID', 'Equipment', 'Customer', 'Start Date', 'End Date', 'Status', 'Estimated Total'],
          totalSum: totalSum,
          onRefresh: () => ref.read(ownerProvider.notifier).fetchDashboardData(),
          rows: pendingList.map((b) {
            return ReportRowData(
              values: {
                'Booking ID': b.id.length > 8 ? b.id.substring(b.id.length - 8) : b.id,
                'Equipment': b.equipment?.title ?? 'Equipment',
                'Customer': b.farmer?.name ?? 'Farmer',
                'Start Date': DateFormat('dd MMM yyyy').format(b.startDate),
                'End Date': DateFormat('dd MMM yyyy').format(b.endDate),
                'Status': b.status,
                'Estimated Total': '₹${b.totalPrice?.toStringAsFixed(0) ?? '0'}',
              },
              status: b.status,
              amount: b.totalPrice,
            );
          }).toList(),
        ),
      ),
    );
  }

  void _openCompletedRentalsReport(BuildContext context, WidgetRef ref, List<Booking> bookings, dynamic completedCount) {
    final completedList = bookings.where((b) => b.status.toUpperCase() == 'COMPLETED').toList();
    final totalSum = completedList.fold<double>(0.0, (sum, b) => sum + (b.totalPrice ?? 0.0));

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (ctx) => AnalyticsReportScreen(
          title: 'Completed Rentals Report',
          subtitle: 'Fulfilled machinery rental contracts and inspection history',
          metricValue: '${completedCount ?? completedList.length} Completed',
          metricLabel: 'Completed Rentals',
          columns: const ['Booking ID', 'Equipment', 'Customer', 'Return Date', 'Status', 'Total Paid'],
          totalSum: totalSum,
          onRefresh: () => ref.read(ownerProvider.notifier).fetchDashboardData(),
          rows: completedList.map((b) {
            return ReportRowData(
              values: {
                'Booking ID': b.id.length > 8 ? b.id.substring(b.id.length - 8) : b.id,
                'Equipment': b.equipment?.title ?? 'Equipment',
                'Customer': b.farmer?.name ?? 'Farmer',
                'Return Date': DateFormat('dd MMM yyyy').format(b.endDate),
                'Status': b.status,
                'Total Paid': '₹${b.totalPrice?.toStringAsFixed(0) ?? '0'}',
              },
              status: b.status,
              amount: b.totalPrice,
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required IconData icon,
    required Color accentColor,
    required bool isDark,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
            width: 1,
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
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.white60 : AppTheme.textMutedGray,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: accentColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: accentColor, size: 16),
                ),
              ],
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 11,
                  color: isDark ? Colors.white30 : Colors.black26,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context, bool isDark, String lang) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
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
              child: _buildActionTile(
                title: 'add_equipment'.tr(lang),
                icon: Icons.add_circle_outline_rounded,
                color: AppTheme.primaryGreen,
                isDark: isDark,
                onTap: () => context.push('/add-equipment'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildActionTile(
                title: 'manage_equipment'.tr(lang),
                icon: Icons.inventory_2_outlined,
                color: const Color(0xFF1976D2),
                isDark: isDark,
                onTap: () => onNavigateTab?.call(1),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildActionTile(
                title: 'bookings'.tr(lang),
                icon: Icons.receipt_long_outlined,
                color: const Color(0xFFF57C00),
                isDark: isDark,
                onTap: () => onNavigateTab?.call(2),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionTile({
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
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRevenueTrends(List monthly, bool isDark, String lang) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'revenue_trends'.tr(lang),
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
            ),
          ),
          child: Column(
            children: monthly.map((m) {
              final month = m['month']?.toString() ?? '';
              final rev = m['revenue'] != null ? '₹${m['revenue']}' : '₹0';
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 7),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: const Color(0xFF2E7D32).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Icon(
                            Icons.trending_up_rounded,
                            size: 14,
                            color: Color(0xFF2E7D32),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          month,
                          style: TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w600,
                            color: isDark ? Colors.white : AppTheme.textDarkNavy,
                          ),
                        ),
                      ],
                    ),
                    Text(
                      rev,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.primaryGreen,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildTopEquipment(List equipment, bool isDark, String lang) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'top_equipment'.tr(lang),
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
            ),
          ),
          child: Column(
            children: equipment.map((eq) {
              final title = eq['title']?.toString() ?? 'Equipment';
              final bookings = eq['bookings'] ?? 0;
              final rev = eq['revenue'] != null ? '₹${eq['revenue']}' : '₹0';

              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1976D2).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.agriculture_rounded,
                        color: Color(0xFF1976D2),
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            style: TextStyle(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w700,
                              color: isDark ? Colors.white : AppTheme.textDarkNavy,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            '$bookings rentals completed',
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      rev,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.primaryGreen,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildErrorCard(String error, WidgetRef ref, bool isDark, String lang) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.red.shade50,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(Icons.cloud_off_rounded, size: 36, color: Colors.red.shade400),
          const SizedBox(height: 10),
          Text(
            'unable_to_load_messages'.tr(lang),
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white : AppTheme.textDarkNavy,
            ),
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: () => ref.read(ownerProvider.notifier).fetchDashboardData(),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryGreen,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text('retry'.tr(lang)),
          ),
        ],
      ),
    );
  }
}
