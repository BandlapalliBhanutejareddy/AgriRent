import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'receipt_screen.dart';
import '../../bookings/repository/booking_repository.dart';
import '../../../models/booking.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';

final myRentalsProvider = FutureProvider.autoDispose<List<Booking>>((ref) async {
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
  Future<void> _cancelBooking(String id) async {
    try {
      await ApiClient().dio.put('${ApiConstants.baseUrl}/bookings/$id/status', data: {'status': 'CANCELLED'});
      ref.invalidate(myRentalsProvider);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Booking cancelled successfully')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to cancel booking')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final rentalsAsync = ref.watch(myRentalsProvider);

    return DefaultTabController(
      length: 5,
      child: Scaffold(
        backgroundColor: AppTheme.background,
        appBar: AppBar(
          title: const Text('My Rentals', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 22, color: AppTheme.textDark)),
          centerTitle: false,
          backgroundColor: Colors.white,
          elevation: 0,
          surfaceTintColor: Colors.transparent,
          bottom: const TabBar(
            isScrollable: true,
            labelColor: AppTheme.primaryGreen,
            unselectedLabelColor: Colors.grey,
            indicatorColor: AppTheme.primaryGreen,
            indicatorWeight: 3,
            labelStyle: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            tabs: [
              Tab(text: 'Pending'),
              Tab(text: 'Upcoming'),
              Tab(text: 'Active'),
              Tab(text: 'Completed'),
              Tab(text: 'Cancelled'),
            ],
          ),
        ),
        body: rentalsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen)),
          error: (err, stack) => Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, color: Colors.red, size: 48),
                const SizedBox(height: 16),
                Text('Error: $err', textAlign: TextAlign.center, style: const TextStyle(color: AppTheme.textDark)),
                TextButton(onPressed: () => ref.refresh(myRentalsProvider), child: const Text('Retry', style: TextStyle(color: AppTheme.primaryGreen)))
              ],
            ),
          ),
          data: (rentals) {
            final now = DateTime.now();
            final pending = rentals.where((r) => r.status == 'PENDING').toList();
            final upcoming = rentals.where((r) => r.status == 'ACCEPTED' && r.startDate.isAfter(now)).toList();
            final active = rentals.where((r) => r.status == 'ACTIVE' || (r.status == 'ACCEPTED' && r.startDate.isBefore(now) && r.endDate.isAfter(now))).toList();
            final completed = rentals.where((r) => r.status == 'COMPLETED' || (r.status == 'ACCEPTED' && r.endDate.isBefore(now))).toList();
            final cancelled = rentals.where((r) => r.status == 'CANCELLED' || r.status == 'REJECTED').toList();

            return TabBarView(
              children: [
                _buildList(context, pending, 'No pending requests.', false, showCancel: true),
                _buildList(context, upcoming, 'No upcoming rentals.', false, showCancel: true),
                _buildList(context, active, 'No active rentals.', true),
                _buildList(context, completed, 'No completed rentals.', false, showRate: true),
                _buildList(context, cancelled, 'No cancelled rentals.', false),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildList(BuildContext context, List<Booking> list, String emptyMessage, bool isActive, {bool showCancel = false, bool showRate = false}) {
    if (list.isEmpty) return _buildEmptyState(emptyMessage);
    
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final booking = list[index];
        final eq = booking.equipment;
        final start = DateFormat('MMM d, yyyy').format(booking.startDate);
        final end = DateFormat('MMM d, yyyy').format(booking.endDate);
        final color = _getStatusColor(booking.status);
        
        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          elevation: 0,
          color: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: BorderSide(color: Colors.grey.shade100),
          ),
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        eq?.title ?? 'Equipment', 
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.textDark),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        booking.status, 
                        style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1),
                      ),
                    )
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: AppTheme.primaryGreen.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(8)),
                      child: const Icon(Icons.calendar_month, size: 16, color: AppTheme.primaryGreen),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Rental Period', style: TextStyle(color: AppTheme.textLight, fontSize: 10, fontWeight: FontWeight.bold, textBaseline: TextBaseline.alphabetic)),
                        Text('$start - $end', style: const TextStyle(color: AppTheme.textDark, fontSize: 13, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Total Amount:', style: TextStyle(color: AppTheme.textLight, fontSize: 13, fontWeight: FontWeight.w600)),
                      Text('₹${booking.totalPrice}', style: const TextStyle(color: AppTheme.primaryGreen, fontWeight: FontWeight.w900, fontSize: 16)),
                    ],
                  ),
                ),
                if (showCancel || showRate || isActive) ...[
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            Navigator.push(context, MaterialPageRoute(builder: (context) => ReceiptScreen(booking: booking)));
                          },
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppTheme.textDark,
                            side: BorderSide(color: Colors.grey.shade200),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          child: const Text('View Details', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                        ),
                      ),
                      if (showCancel) ...[
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () => _cancelBooking(booking.id),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.red.shade50,
                              foregroundColor: Colors.red.shade700,
                              elevation: 0,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                            child: const Text('Cancel', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                          ),
                        ),
                      ],
                      if (showRate) ...[
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Feedback form opened')));
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primaryGreen,
                              foregroundColor: Colors.white,
                              elevation: 0,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                            child: const Text('Rate Rental', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                          ),
                        ),
                      ],
                    ],
                  )
                ]
              ],
            ),
          ),
        );
      },
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'PENDING': return Colors.amber.shade700;
      case 'ACCEPTED': return Colors.blue.shade600;
      case 'ACTIVE': return Colors.green;
      case 'CANCELLED':
      case 'REJECTED': return Colors.red.shade600;
      case 'COMPLETED': return Colors.purple.shade600;
      default: return Colors.grey.shade600;
    }
  }

  Widget _buildEmptyState(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10)]),
            child: const Icon(Icons.receipt_long, size: 48, color: Colors.grey),
          ),
          const SizedBox(height: 24),
          Text(message, style: const TextStyle(fontSize: 16, color: AppTheme.textLight, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
