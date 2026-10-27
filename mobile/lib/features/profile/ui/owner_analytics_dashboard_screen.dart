import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/localization/app_localizations.dart';
import '../../../shared/theme/app_theme.dart';
import '../providers/owner_provider.dart';

class OwnerAnalyticsDashboardScreen extends ConsumerStatefulWidget {
  const OwnerAnalyticsDashboardScreen({super.key});

  @override
  ConsumerState<OwnerAnalyticsDashboardScreen> createState() => _OwnerAnalyticsDashboardScreenState();
}

class _OwnerAnalyticsDashboardScreenState extends ConsumerState<OwnerAnalyticsDashboardScreen> {
  String _selectedPeriod = '30d';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(ownerAnalyticsProvider.notifier).fetchAnalytics(period: _selectedPeriod);
    });
  }

  void _onPeriodChanged(String period) {
    if (_selectedPeriod == period) return;
    setState(() {
      _selectedPeriod = period;
    });
    ref.read(ownerAnalyticsProvider.notifier).fetchAnalytics(period: period);
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final analyticsState = ref.watch(ownerAnalyticsProvider);
    final ownerState = ref.watch(ownerProvider);

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text(
          'Analytics & Performance',
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 18,
          ),
        ),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        surfaceTintColor: Colors.transparent,
        foregroundColor: isDark ? Colors.white : AppTheme.textDarkNavy,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, size: 22),
            tooltip: 'refresh'.tr(lang),
            onPressed: () {
              ref.read(ownerAnalyticsProvider.notifier).fetchAnalytics(period: _selectedPeriod);
              ref.read(ownerProvider.notifier).fetchDashboardData();
            },
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(ownerAnalyticsProvider.notifier).fetchAnalytics(period: _selectedPeriod);
          await ref.read(ownerProvider.notifier).fetchDashboardData();
        },
        color: AppTheme.primaryGreen,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Period Selection Chips
              _buildPeriodSelector(isDark),
              const SizedBox(height: 20),

              // Loading State
              if (analyticsState.isLoading && analyticsState.data == null)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 64),
                  child: Center(
                    child: CircularProgressIndicator(color: AppTheme.primaryGreen),
                  ),
                )
              // Error State
              else if (analyticsState.error != null && analyticsState.data == null)
                _buildErrorCard(analyticsState.error!, isDark)
              // Empty State
              else if (analyticsState.totalListings == 0 && analyticsState.totalBookings == 0 && ownerState.myEquipment.isEmpty && ownerState.bookings.isEmpty)
                _buildEmptyState(isDark)
              // Main Analytics Sections
              else ...[
                // SECTION A: Overview
                _buildSectionAOverview(analyticsState, ownerState, isDark),
                const SizedBox(height: 28),

                // SECTION B: Earnings
                _buildSectionBEarnings(analyticsState, isDark),
                const SizedBox(height: 28),

                // SECTION C: Equipment Performance
                _buildSectionCEquipmentPerformance(analyticsState, ownerState, isDark),
                const SizedBox(height: 28),

                // SECTION D: Rental Activity
                _buildSectionDRentalActivity(analyticsState, isDark),
                const SizedBox(height: 36),
              ],
            ],
          ),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // PERIOD SELECTOR
  // ---------------------------------------------------------------------------
  Widget _buildPeriodSelector(bool isDark) {
    final periods = [
      {'key': '7d', 'label': '7 Days'},
      {'key': '30d', 'label': '30 Days'},
      {'key': '90d', 'label': '90 Days'},
      {'key': 'this_month', 'label': 'This Month'},
      {'key': 'all', 'label': 'All Time'},
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: periods.map((p) {
          final isSelected = _selectedPeriod == p['key'];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: InkWell(
              onTap: () => _onPeriodChanged(p['key']!),
              borderRadius: BorderRadius.circular(20),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppTheme.primaryGreen
                      : (isDark ? Colors.white.withValues(alpha: 0.06) : Colors.white),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isSelected
                        ? AppTheme.primaryGreen
                        : (isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.08)),
                  ),
                ),
                child: Text(
                  p['label']!,
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    color: isSelected ? Colors.white : (isDark ? Colors.white70 : AppTheme.textDarkNavy),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION A: OVERVIEW
  // ---------------------------------------------------------------------------
  Widget _buildSectionAOverview(OwnerAnalyticsState analytics, OwnerState ownerState, bool isDark) {
    // Derive numbers from real data
    final totalListed = analytics.totalListings > 0 ? analytics.totalListings : ownerState.totalEquipmentCount;
    final available = analytics.activeListings > 0 ? analytics.activeListings : ownerState.activeListingsCount;
    final unavailable = analytics.inactiveListings > 0 ? analytics.inactiveListings : ownerState.inactiveListingsCount;
    final pending = analytics.pendingRequests > 0 ? analytics.pendingRequests : ownerState.pendingBookingsCount;
    final active = (analytics.statusBreakdown['ACTIVE'] as num?)?.toInt() ?? ownerState.activeRentalsCount;
    final completed = analytics.completedRentals > 0 ? analytics.completedRentals : ownerState.completedBookingsCount;

    final grossBookingVal = analytics.grossBookingValue > 0 ? analytics.grossBookingValue : ownerState.totalRevenue;
    final realized = analytics.realizedEarnings;
    final outstanding = analytics.pendingPayout > 0 ? analytics.pendingPayout : ownerState.totalOutstandingBalance;

    final currencyFmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader(
          title: 'Section A: Overview',
          subtitle: 'Core operational, fleet, and financial metrics with one-tap filtering.',
          icon: Icons.dashboard_outlined,
          isDark: isDark,
        ),
        const SizedBox(height: 14),

        // Grid of Overview Metric Cards
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 1.15,
          children: [
            // 1. Total Listed Equipment
            _buildTappableMetricCard(
              title: 'Total Listed Equipment',
              value: '$totalListed',
              explanation: 'All owned equipment listings',
              icon: Icons.inventory_2_outlined,
              accentColor: const Color(0xFF1976D2),
              isDark: isDark,
              onTap: () {
                ref.read(ownerEquipmentAvailabilityFilterProvider.notifier).state = 'ALL';
                ref.read(ownerTabIndexProvider.notifier).state = 1;
                Navigator.pop(context);
              },
            ),

            // 2. Available Equipment
            _buildTappableMetricCard(
              title: 'Available Equipment',
              value: '$available',
              explanation: 'Available for farmer bookings',
              icon: Icons.check_circle_outline,
              accentColor: const Color(0xFF2E7D32),
              isDark: isDark,
              onTap: () {
                ref.read(ownerEquipmentAvailabilityFilterProvider.notifier).state = 'AVAILABLE';
                ref.read(ownerTabIndexProvider.notifier).state = 1;
                Navigator.pop(context);
              },
            ),

            // 3. Unavailable Equipment
            _buildTappableMetricCard(
              title: 'Unavailable Equipment',
              value: '$unavailable',
              explanation: 'Rented out or paused',
              icon: Icons.pause_circle_outline,
              accentColor: const Color(0xFFE65100),
              isDark: isDark,
              onTap: () {
                ref.read(ownerEquipmentAvailabilityFilterProvider.notifier).state = 'UNAVAILABLE';
                ref.read(ownerTabIndexProvider.notifier).state = 1;
                Navigator.pop(context);
              },
            ),

            // 4. Pending Booking Requests
            _buildTappableMetricCard(
              title: 'Pending Requests',
              value: '$pending',
              explanation: 'Awaiting your acceptance',
              icon: Icons.pending_actions_outlined,
              accentColor: const Color(0xFFD97706),
              isDark: isDark,
              onTap: () {
                ref.read(ownerBookingFilterProvider.notifier).state = 'PENDING';
                ref.read(ownerTabIndexProvider.notifier).state = 2;
                Navigator.pop(context);
              },
            ),

            // 5. Active Rentals
            _buildTappableMetricCard(
              title: 'Active Rentals',
              value: '$active',
              explanation: 'Currently active on farms',
              icon: Icons.agriculture_outlined,
              accentColor: const Color(0xFF0284C7),
              isDark: isDark,
              onTap: () {
                ref.read(ownerBookingFilterProvider.notifier).state = 'ACTIVE';
                ref.read(ownerTabIndexProvider.notifier).state = 2;
                Navigator.pop(context);
              },
            ),

            // 6. Completed Rentals
            _buildTappableMetricCard(
              title: 'Completed Rentals',
              value: '$completed',
              explanation: 'Successfully returned rentals',
              icon: Icons.task_alt_outlined,
              accentColor: const Color(0xFF059669),
              isDark: isDark,
              onTap: () {
                ref.read(ownerBookingFilterProvider.notifier).state = 'COMPLETED';
                ref.read(ownerTabIndexProvider.notifier).state = 2;
                Navigator.pop(context);
              },
            ),

            // 7. Total Booking Value
            _buildTappableMetricCard(
              title: 'Total Booking Value',
              value: currencyFmt.format(grossBookingVal),
              explanation: 'Contracted value of valid bookings',
              icon: Icons.request_quote_outlined,
              accentColor: const Color(0xFF7C3AED),
              isDark: isDark,
              onTap: null,
            ),

            // 8. Actual Payments Received
            _buildTappableMetricCard(
              title: 'Payments Received',
              value: currencyFmt.format(realized),
              explanation: 'Verified funds collected',
              icon: Icons.account_balance_wallet_outlined,
              accentColor: const Color(0xFF16A34A),
              isDark: isDark,
              onTap: () => context.push('/payments-received'),
            ),
          ],
        ),
        const SizedBox(height: 10),

        // 9. Outstanding Payments Card (Full Width)
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: outstanding > 0 ? Colors.amber.shade700.withValues(alpha: 0.4) : (isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06)),
            ),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.amber.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.hourglass_bottom_rounded, color: Colors.amber, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Outstanding Payments',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : AppTheme.textDarkNavy,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Uncollected balances awaiting farmer completion',
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? Colors.white60 : AppTheme.textMutedGray,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                currencyFmt.format(outstanding),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: Colors.amber,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION B: EARNINGS
  // ---------------------------------------------------------------------------
  Widget _buildSectionBEarnings(OwnerAnalyticsState analytics, bool isDark) {
    final currencyFmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2);

    final grossVal = analytics.grossBookingValue;
    final completedRev = analytics.completedRevenue;
    final realized = analytics.realizedEarnings;
    final outstanding = analytics.pendingPayout;
    final deposits = analytics.securityDepositsHeld;
    final deductions = analytics.inspectionDeductions;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader(
          title: 'Section B: Earnings',
          subtitle: 'Direct financial accounting from real booking and payment records.',
          icon: Icons.payments_outlined,
          isDark: isDark,
        ),
        const SizedBox(height: 14),

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
              _buildEarningsRow('Total Booking Value', currencyFmt.format(grossVal), 'Contracted total across all valid bookings', isDark),
              const Divider(height: 20),
              _buildEarningsRow('Confirmed Rental Value', currencyFmt.format(completedRev), 'Revenue from fully completed and returned rentals', isDark),
              const Divider(height: 20),
              _buildEarningsRow('Amount Paid by Farmers', currencyFmt.format(realized), 'Verified payment transactions successfully collected', isDark, isHighlight: true),
              const Divider(height: 20),
              _buildEarningsRow('Amount Received by Owner', currencyFmt.format(realized), 'Net verified rental proceeds credited to owner', isDark),
              const Divider(height: 20),
              _buildEarningsRow('Outstanding Amount', currencyFmt.format(outstanding), 'Remaining contract balance due from active rentals', isDark, isWarning: outstanding > 0),
              if (deposits > 0) ...[
                const Divider(height: 20),
                _buildEarningsRow('Security Deposits in Escrow', currencyFmt.format(deposits), 'Held in escrow during rental; refunded on return inspection', isDark),
              ],
              if (deductions > 0) ...[
                const Divider(height: 20),
                _buildEarningsRow('Inspection Deductions Retained', currencyFmt.format(deductions), 'Retained by owner for damage or maintenance repairs', isDark),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildEarningsRow(String label, String value, String note, bool isDark, {bool isHighlight = false, bool isWarning = false}) {
    Color valueColor;
    if (isHighlight) {
      valueColor = const Color(0xFF16A34A);
    } else if (isWarning) {
      valueColor = const Color(0xFFD97706);
    } else {
      valueColor = isDark ? Colors.white : AppTheme.textDarkNavy;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
              ),
            ),
            Text(
              value,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w900,
                color: valueColor,
              ),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Text(
          note,
          style: TextStyle(
            fontSize: 11,
            color: isDark ? Colors.white60 : AppTheme.textMutedGray,
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION C: EQUIPMENT PERFORMANCE
  // ---------------------------------------------------------------------------
  Widget _buildSectionCEquipmentPerformance(OwnerAnalyticsState analytics, OwnerState ownerState, bool isDark) {
    final performanceList = analytics.equipmentPerformanceList;
    final currencyFmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader(
          title: 'Section C: Equipment Performance',
          subtitle: 'Individual machine utilization, rentals count, and revenue generated.',
          icon: Icons.precision_manufacturing_outlined,
          isDark: isDark,
        ),
        const SizedBox(height: 14),

        if (performanceList.isEmpty && ownerState.myEquipment.isEmpty)
          _buildNoDataCard('No equipment performance records available for this period.', isDark)
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: performanceList.isNotEmpty ? performanceList.length : ownerState.myEquipment.length,
            separatorBuilder: (ctx, i) => const SizedBox(height: 10),
            itemBuilder: (ctx, i) {
              if (performanceList.isNotEmpty) {
                final item = performanceList[i];
                final title = item['title']?.toString() ?? 'Equipment';
                final isAvailable = item['isAvailable'] == true;
                final totalRentals = (item['rentalsCount'] as num?)?.toInt() ?? 0;
                final activeRentals = (item['activeRentals'] as num?)?.toInt() ?? 0;
                final completedRentals = (item['completedRentals'] as num?)?.toInt() ?? 0;
                final grossRevenue = (item['grossRevenue'] as num?)?.toDouble() ?? 0.0;
                final status = item['status']?.toString() ?? (isAvailable ? 'AVAILABLE' : 'RENTED');

                return _buildEquipmentPerformanceCard(
                  title: title,
                  isAvailable: isAvailable,
                  totalRentals: totalRentals,
                  activeRentals: activeRentals,
                  completedRentals: completedRentals,
                  grossRevenue: currencyFmt.format(grossRevenue),
                  status: status,
                  isDark: isDark,
                  onTap: () {
                    final eqMatch = ownerState.myEquipment.where((e) => e.title == title).firstOrNull;
                    if (eqMatch != null) {
                      context.push('/equipment-detail', extra: {'equipment': eqMatch});
                    }
                  },
                );
              } else {
                final eq = ownerState.myEquipment[i];
                return _buildEquipmentPerformanceCard(
                  title: eq.title,
                  isAvailable: eq.available,
                  totalRentals: 0,
                  activeRentals: 0,
                  completedRentals: 0,
                  grossRevenue: '₹0',
                  status: eq.available ? 'AVAILABLE' : 'UNAVAILABLE',
                  isDark: isDark,
                  onTap: () => context.push('/equipment-detail', extra: {'equipment': eq}),
                );
              }
            },
          ),
      ],
    );
  }

  Widget _buildEquipmentPerformanceCard({
    required String title,
    required bool isAvailable,
    required int totalRentals,
    required int activeRentals,
    required int completedRentals,
    required String grossRevenue,
    required String status,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: TextStyle(
                      fontSize: 14.5,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: isAvailable ? Colors.green.withValues(alpha: 0.12) : Colors.orange.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    isAvailable ? 'AVAILABLE' : 'UNAVAILABLE',
                    style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w800,
                      color: isAvailable ? const Color(0xFF16A34A) : const Color(0xFFD97706),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Rentals Completed / Active',
                        style: TextStyle(fontSize: 11, color: isDark ? Colors.white60 : AppTheme.textMutedGray),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '$totalRentals total ($completedRentals completed, $activeRentals active)',
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
                        ),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      'Recorded Revenue',
                      style: TextStyle(fontSize: 11, color: isDark ? Colors.white60 : AppTheme.textMutedGray),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      grossRevenue,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.primaryGreen,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION D: RENTAL ACTIVITY
  // ---------------------------------------------------------------------------
  Widget _buildSectionDRentalActivity(OwnerAnalyticsState analytics, bool isDark) {
    final trends = analytics.bookingTrends;
    final currencyFmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader(
          title: 'Section D: Rental Activity',
          subtitle: 'Booking volume and periodic rental trend from actual database records.',
          icon: Icons.trending_up_rounded,
          isDark: isDark,
        ),
        const SizedBox(height: 14),

        if (trends.isEmpty)
          _buildNoDataCard('No rental activity recorded in this period.', isDark)
        else
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.darkCard : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06)),
            ),
            child: Column(
              children: trends.map((t) {
                final dateLabel = t['date']?.toString() ?? 'Date';
                final count = (t['bookingsCount'] as num?)?.toInt() ?? (t['count'] as num?)?.toInt() ?? 0;
                final rev = (t['revenue'] as num?)?.toDouble() ?? 0.0;

                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8.0),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          dateLabel,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : AppTheme.textDarkNavy,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '$count ${count == 1 ? 'Booking' : 'Bookings'}',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: isDark ? Colors.white : AppTheme.textDarkNavy,
                              ),
                            ),
                            const SizedBox(height: 2),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: count > 0 ? (count / 10).clamp(0.1, 1.0) : 0.05,
                                minHeight: 6,
                                backgroundColor: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
                                valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryGreen),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        currencyFmt.format(rev),
                        style: TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
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

  // ---------------------------------------------------------------------------
  // HELPERS & COMMON COMPONENTS
  // ---------------------------------------------------------------------------
  Widget _buildSectionHeader({
    required String title,
    required String subtitle,
    required IconData icon,
    required bool isDark,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 18, color: AppTheme.primaryGreen),
            const SizedBox(width: 8),
            Text(
              title,
              style: TextStyle(
                fontSize: 15.5,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
            ),
          ],
        ),
        const SizedBox(height: 3),
        Text(
          subtitle,
          style: TextStyle(
            fontSize: 11.5,
            color: isDark ? Colors.white60 : AppTheme.textMutedGray,
          ),
        ),
      ],
    );
  }

  Widget _buildTappableMetricCard({
    required String title,
    required String value,
    required String explanation,
    required IconData icon,
    required Color accentColor,
    required bool isDark,
    required VoidCallback? onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: accentColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(icon, color: accentColor, size: 18),
                  ),
                  if (onTap != null)
                    const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: Colors.grey),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    value,
                    style: TextStyle(
                      fontSize: 19,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 1),
                  Text(
                    explanation,
                    style: TextStyle(
                      fontSize: 9.5,
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
    );
  }

  Widget _buildNoDataCard(String message, bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06)),
      ),
      child: Center(
        child: Text(
          message,
          style: TextStyle(
            fontSize: 12.5,
            color: isDark ? Colors.white60 : AppTheme.textMutedGray,
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.analytics_outlined, size: 56, color: isDark ? Colors.white24 : Colors.grey.shade300),
          const SizedBox(height: 16),
          Text(
            'No Analytics Data Available',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: isDark ? Colors.white : AppTheme.textDarkNavy,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Start by adding equipment to your fleet or check all time data.',
            style: TextStyle(fontSize: 12.5, color: isDark ? Colors.white60 : AppTheme.textMutedGray),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => _onPeriodChanged('all'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryGreen,
              foregroundColor: Colors.white,
            ),
            child: const Text('View All Time Analytics'),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorCard(String error, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.red.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.error_outline, color: Colors.red),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  error,
                  style: const TextStyle(color: Colors.red, fontSize: 13),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: () {
              ref.read(ownerAnalyticsProvider.notifier).fetchAnalytics(period: _selectedPeriod);
              ref.read(ownerProvider.notifier).fetchDashboardData();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryGreen,
              foregroundColor: Colors.white,
            ),
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}
