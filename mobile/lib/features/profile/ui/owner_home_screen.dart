import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../shared/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../../notifications/providers/notification_provider.dart';
import '../providers/owner_provider.dart';
import 'owner_bank_details_dialog.dart';
import '../../ai_assistant/ui/voice_interaction_modal.dart';

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
                    '${'good_morning'.tr(lang)} ${user?.name ?? ''}'.trim(),
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
        onRefresh: () async {
          await ref.read(ownerProvider.notifier).fetchDashboardData();
          await ref.read(notificationsProvider.notifier).fetchNotifications(forceRefresh: true);
        },
        color: AppTheme.primaryGreen,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome Hero Banner
              _buildHeroBanner(user?.name ?? '', unreadCount, isDark, lang, context),
              const SizedBox(height: 14),

              // Owner Voice Search Bar
              _buildVoiceSearchBar(context, ref, isDark, lang),
              const SizedBox(height: 20),

              // Loading / Error / Content
              if (ownerState.isLoading && ownerState.myEquipment.isEmpty && ownerState.bookings.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 48),
                  child: Center(
                    child: CircularProgressIndicator(color: AppTheme.primaryGreen),
                  ),
                )
              else if (ownerState.error != null && ownerState.myEquipment.isEmpty && ownerState.bookings.isEmpty)
                _buildErrorCard(ownerState.error!, ref, isDark, lang)
              else ...[
                // Section 1: Fleet & Rental Overview Metrics Grid
                _buildMetricsSection(
                  context,
                  ref,
                  ownerState,
                  isDark,
                  lang,
                ),
                const SizedBox(height: 24),

                // Section 2: Owner Quick Actions
                _buildQuickActions(context, ref, isDark, lang),
                const SizedBox(height: 24),

                // Section 3: Authoritative Financial Summary
                _buildFinancialSummary(context, ownerState, isDark, lang),
                const SizedBox(height: 24),

                // Section 4: Equipment Fleet Summary
                _buildEquipmentSummary(context, ref, ownerState, isDark, lang),
                const SizedBox(height: 24),

                // Section 5: Recent Booking & Rental Activity
                _buildBookingSummary(context, ref, ownerState, isDark, lang),
                const SizedBox(height: 24),

                // Section 6: Monthly Revenue Trends (if present in analytics)
                if (analytics != null &&
                    analytics['monthlyRevenue'] != null &&
                    (analytics['monthlyRevenue'] as List).isNotEmpty) ...[
                  _buildRevenueTrends(context, analytics['monthlyRevenue'] as List, isDark, lang),
                  const SizedBox(height: 24),
                ],

                // Section 7: Top Performing Equipment (if present in analytics)
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

  Widget _buildHeroBanner(String name, int unreadCount, bool isDark, String lang, BuildContext context) {
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
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'fleet_owner'.tr(lang).toUpperCase(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
              if (unreadCount > 0)
                InkWell(
                  onTap: () => context.push('/notifications'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE53935).withValues(alpha: 0.9),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.notifications_active_rounded, size: 12, color: Colors.white),
                        const SizedBox(width: 4),
                        Text(
                          '$unreadCount',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            name.isNotEmpty ? '${'hello_user'.tr(lang)} $name' : 'owner_dashboard'.tr(lang),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'owner_banner_subtitle'.tr(lang),
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 12.5,
              height: 1.3,
            ),
          ),
          if (unreadCount > 0) ...[
            const SizedBox(height: 12),
            InkWell(
              onTap: () => context.push('/notifications'),
              borderRadius: BorderRadius.circular(10),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.info_outline_rounded, color: Colors.white, size: 14),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        '$unreadCount ${'unread_notifications_alert'.tr(lang)}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11.5,
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white70, size: 10),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildVoiceSearchBar(BuildContext context, WidgetRef ref, bool isDark, String lang) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (ctx) => VoiceInteractionModal(
              onQuerySubmitted: (query) {
                final q = query.trim().toLowerCase();
                if (q.contains('booking') || q.contains('rent') || q.contains('request') || q.contains('order')) {
                  ref.read(ownerBookingFilterProvider.notifier).state = 'ALL';
                  onNavigateTab?.call(2);
                } else {
                  ref.read(ownerEquipmentAvailabilityFilterProvider.notifier).state = 'ALL';
                  onNavigateTab?.call(1);
                }
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Voice search: "$query"'),
                    backgroundColor: AppTheme.primaryGreen,
                    duration: const Duration(seconds: 2),
                  ),
                );
              },
            ),
          );
        },
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              const Icon(Icons.search_rounded, color: AppTheme.primaryGreen, size: 22),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'voice_search_owner_hint'.tr(lang).isEmpty || 'voice_search_owner_hint'.tr(lang) == 'voice_search_owner_hint'
                      ? 'Search fleet or bookings by voice...'
                      : 'voice_search_owner_hint'.tr(lang),
                  style: TextStyle(
                    fontSize: 13.5,
                    color: isDark ? Colors.white38 : AppTheme.textMutedGray,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.mic_rounded, color: AppTheme.primaryGreen, size: 18),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetricsSection(
    BuildContext context,
    WidgetRef ref,
    OwnerState ownerState,
    bool isDark,
    String lang,
  ) {
    final totalListings = ownerState.totalEquipmentCount;
    final activeListings = ownerState.activeListingsCount;
    final inactiveListings = ownerState.inactiveListingsCount;
    final pendingBookings = ownerState.pendingBookingsCount;
    final activeRentals = ownerState.activeRentalsCount;
    final completedBookings = ownerState.completedBookingsCount;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                'performance_summary'.tr(lang).isEmpty || 'performance_summary'.tr(lang) == 'performance_summary'
                    ? 'Performance Overview'
                    : 'performance_summary'.tr(lang),
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            InkWell(
              onTap: () => context.push('/owner-analytics'),
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'analytics_performance'.tr(lang),
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.primaryGreen,
                      ),
                    ),
                    const SizedBox(width: 2),
                    const Icon(Icons.arrow_forward_ios_rounded, size: 10, color: AppTheme.primaryGreen),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 1.18,
          children: [
            // 1. Total Listed Equipment -> Tab 1 with ALL
            _buildMetricCard(
              title: 'total_listed_equipment'.tr(lang).isEmpty || 'total_listed_equipment'.tr(lang) == 'total_listed_equipment'
                  ? 'Total Listed Equipment'
                  : 'total_listed_equipment'.tr(lang),
              value: '$totalListings',
              subtitle: 'All owned equipment',
              icon: Icons.inventory_2_rounded,
              accentColor: const Color(0xFF1976D2),
              isDark: isDark,
              onTap: () {
                ref.read(ownerEquipmentAvailabilityFilterProvider.notifier).state = 'ALL';
                onNavigateTab?.call(1);
              },
            ),
            // 2. Available Equipment -> Tab 1 with AVAILABLE
            _buildMetricCard(
              title: 'available_equipment'.tr(lang).isEmpty || 'available_equipment'.tr(lang) == 'available_equipment'
                  ? 'Available Equipment'
                  : 'available_equipment'.tr(lang),
              value: '$activeListings',
              subtitle: 'Ready for rental',
              icon: Icons.check_circle_outline_rounded,
              accentColor: const Color(0xFF2E7D32),
              isDark: isDark,
              onTap: () {
                ref.read(ownerEquipmentAvailabilityFilterProvider.notifier).state = 'AVAILABLE';
                onNavigateTab?.call(1);
              },
            ),
            // 3. Unavailable Equipment -> Tab 1 with UNAVAILABLE
            _buildMetricCard(
              title: 'unavailable_equipment'.tr(lang).isEmpty || 'unavailable_equipment'.tr(lang) == 'unavailable_equipment'
                  ? 'Unavailable Equipment'
                  : 'unavailable_equipment'.tr(lang),
              value: '$inactiveListings',
              subtitle: 'In use or paused',
              icon: Icons.pause_circle_outline_rounded,
              accentColor: const Color(0xFFC62828),
              isDark: isDark,
              onTap: () {
                ref.read(ownerEquipmentAvailabilityFilterProvider.notifier).state = 'UNAVAILABLE';
                onNavigateTab?.call(1);
              },
            ),
            // 4. Pending Booking Requests -> Tab 2 with PENDING
            _buildMetricCard(
              title: 'pending_requests'.tr(lang),
              value: '$pendingBookings',
              subtitle: 'Requires your approval',
              icon: Icons.pending_actions_rounded,
              accentColor: const Color(0xFFF57C00),
              isDark: isDark,
              onTap: () {
                ref.read(ownerBookingFilterProvider.notifier).state = 'PENDING';
                onNavigateTab?.call(2);
              },
            ),
            // 5. Active Rentals -> Tab 2 with ACTIVE
            _buildMetricCard(
              title: 'active_rentals'.tr(lang),
              value: '$activeRentals',
              subtitle: 'Currently deployed',
              icon: Icons.play_circle_outline_rounded,
              accentColor: const Color(0xFF00897B),
              isDark: isDark,
              onTap: () {
                ref.read(ownerBookingFilterProvider.notifier).state = 'ACTIVE';
                onNavigateTab?.call(2);
              },
            ),
            // 6. Completed Rentals -> Tab 2 with COMPLETED (Rental History)
            _buildMetricCard(
              title: 'completed_rentals'.tr(lang),
              value: '$completedBookings',
              subtitle: 'Finished rental records',
              icon: Icons.history_rounded,
              accentColor: const Color(0xFF7B1FA2),
              isDark: isDark,
              onTap: () {
                ref.read(ownerBookingFilterProvider.notifier).state = 'COMPLETED';
                onNavigateTab?.call(2);
              },
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    String? subtitle,
    required IconData icon,
    required Color accentColor,
    required bool isDark,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
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
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 4),
                Container(
                  padding: const EdgeInsets.all(5),
                  decoration: BoxDecoration(
                    color: accentColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: accentColor, size: 15),
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(
                      child: Text(
                        value,
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w900,
                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Icon(
                      Icons.arrow_forward_ios_rounded,
                      size: 10,
                      color: isDark ? Colors.white30 : Colors.black26,
                    ),
                  ],
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 9.5,
                      color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context, WidgetRef ref, bool isDark, String lang) {
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
                color: const Color(0xFF16A34A),
                isDark: isDark,
                onTap: () => context.push('/add-equipment'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildActionTile(
                title: 'manage_fleet'.tr(lang),
                icon: Icons.inventory_2_outlined,
                color: const Color(0xFF1976D2),
                isDark: isDark,
                onTap: () {
                  ref.read(ownerEquipmentAvailabilityFilterProvider.notifier).state = 'ALL';
                  onNavigateTab?.call(1);
                },
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildActionTile(
                title: 'rental_history'.tr(lang),
                icon: Icons.history_rounded,
                color: const Color(0xFF7B1FA2),
                isDark: isDark,
                onTap: () {
                  ref.read(ownerBookingFilterProvider.notifier).state = 'COMPLETED';
                  onNavigateTab?.call(2);
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _buildActionTile(
                title: 'bank_details'.tr(lang).isEmpty || 'bank_details'.tr(lang) == 'bank_details'
                    ? 'Bank Details'
                    : 'bank_details'.tr(lang),
                icon: Icons.account_balance_rounded,
                color: const Color(0xFF00897B),
                isDark: isDark,
                onTap: () => OwnerBankDetailsDialog.show(context),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildActionTile(
                title: 'payments_received'.tr(lang),
                icon: Icons.receipt_long_rounded,
                color: const Color(0xFFE65100),
                isDark: isDark,
                onTap: () => context.push('/payments-received'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildActionTile(
                title: 'analytics_performance'.tr(lang),
                icon: Icons.analytics_rounded,
                color: const Color(0xFF0D9488),
                isDark: isDark,
                onTap: () => context.push('/owner-analytics'),
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
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.02),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
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

  Widget _buildFinancialSummary(BuildContext context, OwnerState ownerState, bool isDark, String lang) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'owner_financial_overview'.tr(lang),
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildFinancialRow(
                label: 'total_booking_value'.tr(lang),
                value: AppFormatters.formatCurrency(ownerState.totalBookingValue),
                isDark: isDark,
              ),
              const Divider(height: 20),
              _buildFinancialRow(
                label: 'amount_actually_paid'.tr(lang),
                value: AppFormatters.formatCurrency(ownerState.totalAmountPaid),
                isDark: isDark,
                valueColor: AppTheme.primaryGreen,
              ),
              const Divider(height: 20),
              _buildFinancialRow(
                label: 'outstanding_amount'.tr(lang),
                value: AppFormatters.formatCurrency(ownerState.totalOutstandingBalance),
                isDark: isDark,
                valueColor: const Color(0xFFF57C00),
              ),
              const Divider(height: 20),
              _buildFinancialRow(
                label: 'received_rental_revenue'.tr(lang),
                value: AppFormatters.formatCurrency(ownerState.totalRevenue),
                isDark: isDark,
                valueColor: const Color(0xFF2E7D32),
                isBold: true,
              ),
              const SizedBox(height: 14),
              // Owner Expenses Transparency Advisory Notice
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withValues(alpha: 0.05) : const Color(0xFFF1F8E9),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isDark ? Colors.white12 : const Color(0xFFDCEDC8),
                  ),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.info_outline_rounded, size: 16, color: AppTheme.primaryGreen),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'owner_expenses_notice'.tr(lang),
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark ? Colors.white70 : const Color(0xFF33691E),
                          height: 1.35,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              // Integrity notice & Action Button
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      'financial_integrity_notice'.tr(lang),
                      style: TextStyle(
                        fontSize: 10,
                        color: isDark ? Colors.white38 : AppTheme.textMutedGray,
                      ),
                      maxLines: 2,
                    ),
                  ),
                  const SizedBox(width: 8),
                  TextButton.icon(
                    onPressed: () => context.push('/payments-received'),
                    icon: const Icon(Icons.receipt_outlined, size: 16),
                    label: Text(
                      'view_payment_receipts'.tr(lang),
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                    ),
                    style: TextButton.styleFrom(
                      foregroundColor: AppTheme.primaryGreen,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFinancialRow({
    required String label,
    required String value,
    required bool isDark,
    Color? valueColor,
    bool isBold = false,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
            color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isBold ? 15 : 14,
            fontWeight: isBold ? FontWeight.w900 : FontWeight.w700,
            color: valueColor ?? (isDark ? Colors.white : AppTheme.textDarkNavy),
          ),
        ),
      ],
    );
  }

  Widget _buildEquipmentSummary(BuildContext context, WidgetRef ref, OwnerState ownerState, bool isDark, String lang) {
    final equipment = ownerState.myEquipment;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'equipment_summary'.tr(lang),
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
            ),
            if (equipment.isNotEmpty)
              TextButton(
                onPressed: () {
                  ref.read(ownerEquipmentAvailabilityFilterProvider.notifier).state = 'ALL';
                  onNavigateTab?.call(1);
                },
                style: TextButton.styleFrom(
                  foregroundColor: AppTheme.primaryGreen,
                  padding: EdgeInsets.zero,
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(
                  'view_all_equipment'.tr(lang),
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                ),
              ),
          ],
        ),
        const SizedBox(height: 12),
        if (equipment.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 28),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.darkCard : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
              ),
            ),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.inventory_2_outlined,
                    size: 36,
                    color: AppTheme.primaryGreen,
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  'no_equipment_added_yet'.tr(lang),
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'add_first_equipment_prompt'.tr(lang),
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () => context.push('/add-equipment'),
                  icon: const Icon(Icons.add_rounded, size: 18),
                  label: Text('add_equipment'.tr(lang)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryGreen,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ],
            ),
          )
        else
          Column(
            children: equipment.take(3).map((item) {
              final activeBookings = ownerState.equipmentActiveBookingCount(item.id);
              final totalItemBookings = ownerState.equipmentBookingCount(item.id);
              final localizedCategory = AppLocalizations.localizedEquipmentCategory(item.category, lang);
              final rateStr = item.pricePerDay != null
                  ? '${AppFormatters.formatCurrency(item.pricePerDay)} / ${'day'.tr(lang)}'
                  : 'not_available_na'.tr(lang);

              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.darkCard : Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
                  ),
                ),
                child: Material(
                  color: Colors.transparent,
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  leading: ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      width: 52,
                      height: 52,
                      color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                      child: item.imageUrl.isNotEmpty
                          ? Image.network(
                              item.imageUrl,
                              fit: BoxFit.cover,
                              errorBuilder: (ctx, err, stack) => const Icon(
                                Icons.agriculture_rounded,
                                color: AppTheme.primaryGreen,
                              ),
                            )
                          : const Icon(
                              Icons.agriculture_rounded,
                              color: AppTheme.primaryGreen,
                            ),
                    ),
                  ),
                  title: Row(
                    children: [
                      Expanded(
                        child: Text(
                          item.title,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: isDark ? Colors.white : AppTheme.textDarkNavy,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: item.available
                              ? const Color(0xFF2E7D32).withValues(alpha: 0.12)
                              : Colors.grey.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          item.available ? 'available_status'.tr(lang) : 'unavailable_status'.tr(lang),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: item.available ? const Color(0xFF2E7D32) : Colors.grey.shade700,
                          ),
                        ),
                      ),
                    ],
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          Text(
                            localizedCategory,
                            style: TextStyle(
                              fontSize: 11.5,
                              color: isDark ? Colors.white60 : AppTheme.textMutedGray,
                            ),
                          ),
                          const Text(' • ', style: TextStyle(color: Colors.grey, fontSize: 10)),
                          Text(
                            rateStr,
                            style: const TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.primaryGreen,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '$totalItemBookings ${'bookings_count_label'.tr(lang)} ($activeBookings ${'active_bookings_count_label'.tr(lang)})',
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w500,
                          color: isDark ? Colors.white38 : AppTheme.textMutedGray,
                        ),
                      ),
                    ],
                  ),
                  trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: Colors.grey),
                  onTap: () {
                    context.push('/equipment-detail', extra: item);
                  },
                ),
              ),
            );
            }).toList(),
          ),
      ],
    );
  }

  Widget _buildBookingSummary(BuildContext context, WidgetRef ref, OwnerState ownerState, bool isDark, String lang) {
    final recentBookings = ownerState.recentBookings.take(3).toList();
    final pendingCount = ownerState.pendingBookingsCount;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'booking_activity'.tr(lang),
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
            ),
            if (recentBookings.isNotEmpty)
              TextButton(
                onPressed: () {
                  ref.read(ownerBookingFilterProvider.notifier).state = 'ALL';
                  onNavigateTab?.call(2);
                },
                style: TextButton.styleFrom(
                  foregroundColor: AppTheme.primaryGreen,
                  padding: EdgeInsets.zero,
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(
                  'view_all_bookings'.tr(lang),
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                ),
              ),
          ],
        ),
        const SizedBox(height: 12),
        // Action Required Banner if pending requests exist
        if (pendingCount > 0) ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            margin: const EdgeInsets.only(bottom: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF3E0),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFFFB74D)),
            ),
            child: Row(
              children: [
                const Icon(Icons.pending_actions_rounded, color: Color(0xFFE65100), size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'action_required_pending'.tr(lang),
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFFBF360C),
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                TextButton(
                  onPressed: () {
                    ref.read(ownerBookingFilterProvider.notifier).state = 'PENDING';
                    onNavigateTab?.call(2);
                  },
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFFE65100),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: Text(
                    'view_booking_requests'.tr(lang),
                    style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800),
                  ),
                ),
              ],
            ),
          ),
        ],
        if (recentBookings.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.darkCard : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
              ),
            ),
            child: Column(
              children: [
                Icon(
                  Icons.receipt_long_outlined,
                  size: 36,
                  color: isDark ? Colors.white38 : Colors.grey.shade400,
                ),
                const SizedBox(height: 10),
                Text(
                  'no_bookings_desc'.tr(lang),
                  style: TextStyle(
                    fontSize: 12.5,
                    color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          )
        else
          Column(
            children: recentBookings.map((b) {
              final statusLocalized = AppLocalizations.localizedBookingStatus(b.status, lang);
              final dateRangeStr = AppFormatters.formatDateRange(b.startDate, b.endDate);
              final priceStr = AppFormatters.formatCurrency(b.totalPrice);
              final customerName = b.farmer?.name ?? (b.farmer?.email ?? 'Farmer');
              final equipmentTitle = b.equipment?.title ?? 'Equipment';

              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.darkCard : Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
                  ),
                ),
                child: Material(
                  color: Colors.transparent,
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    title: Row(
                      children: [
                        Expanded(
                          child: Text(
                            equipmentTitle,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: isDark ? Colors.white : AppTheme.textDarkNavy,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        _buildStatusBadge(b.status, statusLocalized),
                      ],
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 4),
                        Text(
                          '$customerName • $dateRangeStr',
                          style: TextStyle(
                            fontSize: 11.5,
                            color: isDark ? Colors.white60 : AppTheme.textMutedGray,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          priceStr,
                          style: const TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.primaryGreen,
                          ),
                        ),
                      ],
                    ),
                    trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: Colors.grey),
                    onTap: () {
                      context.push('/booking-details', extra: b);
                    },
                  ),
                ),
              );
            }).toList(),
          ),
      ],
    );
  }

  Widget _buildStatusBadge(String rawStatus, String label) {
    Color bg;
    Color fg;

    switch (rawStatus.toUpperCase()) {
      case 'PENDING':
        bg = const Color(0xFFFFF3E0);
        fg = const Color(0xFFE65100);
        break;
      case 'ACCEPTED':
      case 'CONFIRMED':
        bg = const Color(0xFFE3F2FD);
        fg = const Color(0xFF1565C0);
        break;
      case 'ACTIVE':
      case 'DELIVERED':
        bg = const Color(0xFFE8F5E9);
        fg = const Color(0xFF2E7D32);
        break;
      case 'RETURN_PENDING':
      case 'RETURNED':
      case 'INSPECTION_PENDING':
        bg = const Color(0xFFE0F7FA);
        fg = const Color(0xFF006064);
        break;
      case 'COMPLETED':
        bg = const Color(0xFFF3E5F5);
        fg = const Color(0xFF6A1B9A);
        break;
      case 'CANCELLED':
      case 'REJECTED':
        bg = const Color(0xFFFFEBEE);
        fg = const Color(0xFFC62828);
        break;
      default:
        bg = Colors.grey.shade100;
        fg = Colors.grey.shade800;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10.5,
          fontWeight: FontWeight.w700,
          color: fg,
        ),
      ),
    );
  }

  Widget _buildRevenueTrends(BuildContext context, List monthly, bool isDark, String lang) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'revenue_trends'.tr(lang),
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
            ),
            InkWell(
              onTap: () => context.push('/owner-analytics'),
              child: Text(
                'view_all'.tr(lang),
                style: const TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.primaryGreen,
                ),
              ),
            ),
          ],
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
              final rev = m['revenue'] != null ? AppFormatters.formatCurrency(double.tryParse(m['revenue'].toString()) ?? 0) : '₹0';
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
              final rev = eq['revenue'] != null ? AppFormatters.formatCurrency(double.tryParse(eq['revenue'].toString()) ?? 0) : '₹0';

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
                            '$bookings ${'rentals_completed_count'.tr(lang)}',
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
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.red.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Column(
        children: [
          Icon(Icons.cloud_off_rounded, size: 40, color: Colors.red.shade400),
          const SizedBox(height: 12),
          Text(
            error.isNotEmpty ? error : 'unable_to_load_messages'.tr(lang),
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white : AppTheme.textDarkNavy,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 14),
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
