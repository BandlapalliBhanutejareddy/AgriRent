import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../models/booking.dart';
import '../../../shared/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../../bookings/repository/booking_repository.dart';
import 'chat_screen.dart';
import 'receipt_screen.dart';

final myRentalsProvider = FutureProvider<List<Booking>>((ref) async {
  final authState = ref.watch(authProvider);
  final role = authState.activeRole ?? 'FARMER';
  return BookingRepository().fetchMyRentals(role);
});

class MyRentalsScreen extends ConsumerStatefulWidget {
  const MyRentalsScreen({super.key});

  @override
  ConsumerState<MyRentalsScreen> createState() => _MyRentalsScreenState();
}

class _MyRentalsScreenState extends ConsumerState<MyRentalsScreen> {
  Future<void> _cancelBooking(String id, String lang) async {
    try {
      await BookingRepository().updateBookingStatus(id, 'CANCELLED');
      ref.invalidate(myRentalsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Booking cancelled successfully'),
            backgroundColor: AppTheme.primaryGreen,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: const Color(0xFFC62828),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  void _confirmCancel(String id, String lang, bool isDark) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTheme.cardRadius)),
        title: Text(
          'cancel_booking'.tr(lang),
          style: TextStyle(
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
        ),
        content: Text(
          'Are you sure you want to cancel this booking request?',
          style: TextStyle(color: isDark ? Colors.white70 : AppTheme.textDarkNavy),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              'cancel'.tr(lang),
              style: TextStyle(color: isDark ? Colors.white54 : AppTheme.textMutedGray),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _cancelBooking(id, lang);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFC62828),
              foregroundColor: Colors.white,
            ),
            child: Text('cancel_booking'.tr(lang)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final rentalsAsync = ref.watch(myRentalsProvider);
    final lang = ref.watch(languageProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return DefaultTabController(
      length: 6,
      child: Scaffold(
        backgroundColor: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
        appBar: AppBar(
          title: Text(
            'bookings'.tr(lang),
            style: TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 22,
              letterSpacing: -0.5,
              color: isDark ? Colors.white : AppTheme.textDarkNavy,
            ),
          ),
          centerTitle: false,
          backgroundColor: Colors.transparent,
          surfaceTintColor: Colors.transparent,
          elevation: 0,
          bottom: TabBar(
            isScrollable: true,
            labelColor: AppTheme.primaryGreen,
            unselectedLabelColor: isDark ? Colors.white54 : AppTheme.textMutedGray,
            indicatorColor: AppTheme.primaryGreen,
            indicatorWeight: 3,
            tabAlignment: TabAlignment.start,
            labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
            unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
            tabs: [
              Tab(text: 'all'.tr(lang)),
              Tab(text: 'pending'.tr(lang)),
              Tab(text: 'upcoming'.tr(lang)),
              Tab(text: 'active'.tr(lang)),
              Tab(text: 'completed'.tr(lang)),
              Tab(text: 'cancelled'.tr(lang)),
            ],
          ),
        ),
        body: rentalsAsync.when(
          loading: () => const Center(
            child: CircularProgressIndicator(color: AppTheme.primaryGreen),
          ),
          error: (err, stack) => Center(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, color: Colors.red.shade400, size: 48),
                  const SizedBox(height: 12),
                  Text(
                    err.toString().replaceFirst('Exception: ', ''),
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: () => ref.refresh(myRentalsProvider),
                    icon: const Icon(Icons.refresh, size: 18),
                    label: Text('try_again'.tr(lang)),
                  ),
                ],
              ),
            ),
          ),
          data: (rentals) {
            final pending = rentals.where((r) => r.status == 'PENDING').toList();
            final upcoming = rentals
                .where((r) => r.status == 'ACCEPTED' || r.status == 'CONFIRMED')
                .toList();
            final active = rentals
                .where((r) =>
                    r.status == 'ACTIVE' ||
                    r.status == 'DELIVERED' ||
                    r.status == 'RETURN_PENDING')
                .toList();
            final completed = rentals
                .where((r) => r.status == 'COMPLETED' || r.status == 'RETURNED')
                .toList();
            final cancelled =
                rentals.where((r) => r.status == 'CANCELLED' || r.status == 'REJECTED').toList();

            return TabBarView(
              children: [
                _buildList(context, rentals, 'no_bookings_found'.tr(lang), lang, isDark),
                _buildList(context, pending, 'no_pending_requests'.tr(lang), lang, isDark, showCancel: true),
                _buildList(context, upcoming, 'no_upcoming_rentals'.tr(lang), lang, isDark, showCancel: true),
                _buildList(context, active, 'no_active_rentals'.tr(lang), lang, isDark),
                _buildList(context, completed, 'no_completed_rentals'.tr(lang), lang, isDark),
                _buildList(context, cancelled, 'no_cancelled_rentals'.tr(lang), lang, isDark),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildList(
    BuildContext context,
    List<Booking> list,
    String emptyMessage,
    String lang,
    bool isDark, {
    bool showCancel = false,
  }) {
    if (list.isEmpty) return _buildEmptyState(emptyMessage, lang, isDark);

    return RefreshIndicator(
      color: AppTheme.primaryGreen,
      onRefresh: () async => ref.refresh(myRentalsProvider),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        itemCount: list.length,
        itemBuilder: (context, index) {
          final booking = list[index];
          final eq = booking.equipment;
          final start = DateFormat('MMM d, yyyy').format(booking.startDate);
          final end = DateFormat('MMM d, yyyy').format(booking.endDate);
          final durationDays = booking.endDate.difference(booking.startDate).inDays + 1;
          final isPending = booking.status == 'PENDING';

          return Container(
            margin: const EdgeInsets.only(bottom: 14),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.darkCard : Colors.white,
              borderRadius: BorderRadius.circular(AppTheme.cardRadius),
              border: Border.all(
                color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.03),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Material(
              color: Colors.transparent,
              borderRadius: BorderRadius.circular(AppTheme.cardRadius),
              child: InkWell(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ReceiptScreen(booking: booking),
                    ),
                  ).then((_) => ref.invalidate(myRentalsProvider));
                },
                borderRadius: BorderRadius.circular(AppTheme.cardRadius),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header: Title & Status Chip
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (eq?.category != null && eq!.category.isNotEmpty)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    margin: const EdgeInsets.only(bottom: 4),
                                    decoration: BoxDecoration(
                                      color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      eq.category.toUpperCase(),
                                      style: const TextStyle(
                                        fontSize: 9,
                                        fontWeight: FontWeight.w800,
                                        color: AppTheme.primaryGreen,
                                      ),
                                    ),
                                  ),
                                Text(
                                  eq?.title ?? 'Equipment Booking',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                    height: 1.2,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          _buildStatusChip(booking.status),
                        ],
                      ),

                      const SizedBox(height: 12),

                      // Dates & Duration Row
                      Row(
                        children: [
                          Icon(
                            Icons.calendar_month_outlined,
                            size: 16,
                            color: isDark ? Colors.white60 : AppTheme.textMutedGray,
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              '$start - $end ($durationDays ${'days'.tr(lang)})',
                              style: TextStyle(
                                fontSize: 13,
                                color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                                fontWeight: FontWeight.w500,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 12),
                      Divider(
                        height: 1,
                        color: isDark ? Colors.white12 : Colors.black.withValues(alpha: 0.06),
                      ),
                      const SizedBox(height: 12),

                      // Price & Action Buttons Row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'total_estimate'.tr(lang),
                                style: TextStyle(
                                  fontSize: 10,
                                  color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              Text(
                                booking.totalPrice != null
                                    ? 'Ã¢â€šÂ¹${booking.totalPrice!.toStringAsFixed(booking.totalPrice! % 1 == 0 ? 0 : 2)}'
                                    : 'not_available'.tr(lang),
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w900,
                                  color: AppTheme.primaryGreen,
                                ),
                              ),
                            ],
                          ),
                          Row(
                            children: [
                              // Chat shortcut button
                              IconButton(
                                icon: Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? Colors.white.withValues(alpha: 0.08)
                                        : AppTheme.primaryGreen.withValues(alpha: 0.08),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.chat_bubble_outline,
                                    size: 16,
                                    color: AppTheme.primaryGreen,
                                  ),
                                ),
                                tooltip: 'chat_with_owner'.tr(lang),
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => ChatScreen(booking: booking),
                                    ),
                                  );
                                },
                              ),

                              if (showCancel && isPending) ...[
                                const SizedBox(width: 6),
                                OutlinedButton(
                                  onPressed: () => _confirmCancel(booking.id, lang, isDark),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: const Color(0xFFC62828),
                                    side: const BorderSide(color: Color(0xFFC62828)),
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                    minimumSize: Size.zero,
                                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                  ),
                                  child: Text(
                                    'cancel'.tr(lang),
                                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
                                  ),
                                ),
                              ],

                              const SizedBox(width: 6),
                              OutlinedButton(
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => ReceiptScreen(booking: booking),
                                    ),
                                  ).then((_) => ref.invalidate(myRentalsProvider));
                                },
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: isDark ? Colors.white : AppTheme.textDarkNavy,
                                  side: BorderSide(
                                    color: isDark ? Colors.white24 : Colors.black.withValues(alpha: 0.15),
                                  ),
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                  minimumSize: Size.zero,
                                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                ),
                                child: Text(
                                  'view_details'.tr(lang),
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color bg;
    Color fg;

    switch (status.toUpperCase()) {
      case 'PENDING':
        bg = const Color(0xFFFFF8E1);
        fg = const Color(0xFFF57F17);
        break;
      case 'ACCEPTED':
      case 'CONFIRMED':
        bg = const Color(0xFFE3F2FD);
        fg = const Color(0xFF1976D2);
        break;
      case 'ACTIVE':
      case 'DELIVERED':
        bg = const Color(0xFFE8F5E9);
        fg = const Color(0xFF2E7D32);
        break;
      case 'COMPLETED':
      case 'RETURNED':
        bg = const Color(0xFFEDE7F6);
        fg = const Color(0xFF512DA8);
        break;
      case 'CANCELLED':
      case 'REJECTED':
        bg = const Color(0xFFFFEBEE);
        fg = const Color(0xFFC62828);
        break;
      case 'RETURN_PENDING':
        bg = const Color(0xFFE0F7FA);
        fg = const Color(0xFF00838F);
        break;
      default:
        bg = Colors.grey.shade100;
        fg = Colors.grey.shade800;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          color: fg,
          fontSize: 9,
          fontWeight: FontWeight.w900,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildEmptyState(String message, String lang, bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkCard : const Color(0xFFF1F5F2),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.receipt_long_outlined,
                size: 48,
                color: isDark ? Colors.white38 : Colors.grey.shade400,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              message,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
