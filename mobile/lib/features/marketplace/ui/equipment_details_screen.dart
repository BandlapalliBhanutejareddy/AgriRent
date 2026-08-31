import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../models/equipment.dart';
import '../../bookings/repository/booking_repository.dart';
import '../../payments/ui/payment_screen.dart';
import 'equipment_map_screen.dart';
import '../../../core/theme/app_theme.dart';

class EquipmentDetailsScreen extends ConsumerStatefulWidget {
  final Equipment equipment;
  const EquipmentDetailsScreen({super.key, required this.equipment});

  @override
  ConsumerState<EquipmentDetailsScreen> createState() => _EquipmentDetailsScreenState();
}

class _EquipmentDetailsScreenState extends ConsumerState<EquipmentDetailsScreen> {
  DateTime? _startDate;
  DateTime? _endDate;
  bool _isLoading = false;

  Future<void> _selectDateRange() async {
    final DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppTheme.primaryGreen,
              onPrimary: Colors.white,
              onSurface: AppTheme.textDark,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _startDate = picked.start;
        _endDate = picked.end;
      });
    }
  }

  void _createBooking() async {
    if (_startDate == null || _endDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select dates to book', style: TextStyle(color: Colors.white)), backgroundColor: Colors.red));
      return;
    }

    setState(() { _isLoading = true; });

    try {
      final booking = await BookingRepository().createBooking(
        equipmentId: widget.equipment.id,
        startDate: _startDate!,
        endDate: _endDate!
      );

      setState(() { _isLoading = false; });

      if (!mounted) return;
      Navigator.push(context, MaterialPageRoute(builder: (_) => PaymentScreen(booking: booking)));
    } catch (e) {
      setState(() { _isLoading = false; });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
    }
  }

  @override
  Widget build(BuildContext context) {
    final eq = widget.equipment;
    int days = 0;
    double total = 0;

    if (_startDate != null && _endDate != null) {
      days = _endDate!.difference(_startDate!).inDays + 1;
      total = days * eq.pricePerDay;
    }

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 320.0,
            pinned: true,
            backgroundColor: AppTheme.primaryGreen,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  eq.imageUrl.isNotEmpty
                      ? Image.network(eq.imageUrl, fit: BoxFit.cover, errorBuilder: (c, e, s) => _placeholder())
                      : _placeholder(),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Colors.black.withValues(alpha: 0.7)],
                      ),
                    ),
                  ),
                  if (eq.available)
                    Positioned(
                      top: 100,
                      right: 16,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppTheme.accentGreen,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text('AVAILABLE', style: TextStyle(color: AppTheme.primaryGreen, fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1)),
                      ),
                    ),
                ],
              ),
            ),
            leading: IconButton(
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.3), shape: BoxShape.circle),
                child: const Icon(Icons.arrow_back, color: Colors.white, size: 20),
              ),
              onPressed: () => Navigator.pop(context),
            ),
            actions: [
              IconButton(
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.3), shape: BoxShape.circle),
                  child: const Icon(Icons.favorite_border, color: Colors.white, size: 20),
                ),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Added to favorites!')));
                },
              ),
              const SizedBox(width: 8),
            ],
          ),
          SliverToBoxAdapter(
            child: Container(
              decoration: const BoxDecoration(
                color: AppTheme.background,
                borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
              ),
              transform: Matrix4.translationValues(0, -32, 0),
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(color: AppTheme.primaryGreen.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                                child: Text(eq.category.toUpperCase(), style: const TextStyle(color: AppTheme.primaryGreen, fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1)),
                              ),
                              const SizedBox(height: 12),
                              Text(eq.title, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: AppTheme.textDark, height: 1.2)),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text('₹${eq.pricePerDay}', style: const TextStyle(fontSize: 28, color: AppTheme.primaryGreen, fontWeight: FontWeight.w900)),
                            const Text('per day', style: TextStyle(color: AppTheme.textLight, fontSize: 12, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        const Icon(Icons.star, color: Colors.amber, size: 18),
                        const SizedBox(width: 4),
                        const Text('4.8', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        const SizedBox(width: 4),
                        Text('(24 reviews)', style: TextStyle(color: Colors.grey.shade500, fontSize: 14)),
                        const Spacer(),
                        InkWell(
                          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => EquipmentMapScreen(equipment: eq))),
                          child: Row(
                            children: [
                              const Icon(Icons.location_on, color: AppTheme.primaryGreen, size: 18),
                              const SizedBox(width: 4),
                              Text(eq.location ?? 'Unknown location', style: const TextStyle(color: AppTheme.primaryGreen, fontWeight: FontWeight.w600, fontSize: 14)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Divider(height: 1, color: Colors.black12),
                    ),
                    
                    // Owner Info
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 24,
                          backgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.1),
                          child: Text(eq.owner?.name.substring(0, 1).toUpperCase() ?? 'O', style: const TextStyle(color: AppTheme.primaryGreen, fontWeight: FontWeight.bold, fontSize: 20)),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Equipment Owner', style: TextStyle(color: AppTheme.textLight, fontSize: 12, fontWeight: FontWeight.w500)),
                              Text(eq.owner?.name ?? 'Agro Partner', style: const TextStyle(color: AppTheme.textDark, fontSize: 16, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(color: AppTheme.primaryGreen.withValues(alpha: 0.1), shape: BoxShape.circle),
                            child: const Icon(Icons.chat_bubble_outline, color: AppTheme.primaryGreen, size: 20),
                          ),
                          onPressed: () {
                            showDialog(
                              context: context,
                              builder: (context) => AlertDialog(
                                title: const Text('Contact Owner'),
                                content: Text(eq.owner?.phone != null && eq.owner!.phone!.isNotEmpty
                                    ? 'Call ${eq.owner!.name} at: ${eq.owner!.phone}'
                                    : '${eq.owner?.name ?? 'The owner'} has not provided a contact number. Please book the equipment to chat.'),
                                actions: [
                                  TextButton(
                                    onPressed: () => Navigator.pop(context),
                                    child: const Text('OK', style: TextStyle(color: AppTheme.primaryGreen)),
                                  )
                                ],
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Divider(height: 1, color: Colors.black12),
                    ),

                    // Description
                    const Text('Description', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textDark)),
                    const SizedBox(height: 12),
                    Text(eq.description, style: const TextStyle(fontSize: 15, color: AppTheme.textLight, height: 1.5)),
                    
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Divider(height: 1, color: Colors.black12),
                    ),

                    // Booking Section
                    const Text('Select Dates', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textDark)),
                    const SizedBox(height: 16),
                    InkWell(
                      onTap: _selectDateRange,
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          border: Border.all(color: Colors.grey.shade200),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(color: AppTheme.primaryGreen.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                              child: const Icon(Icons.calendar_month, color: AppTheme.primaryGreen),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _startDate != null && _endDate != null
                                        ? '${DateFormat('MMM d, y').format(_startDate!)} - ${DateFormat('MMM d, y').format(_endDate!)}'
                                        : 'Choose rental period',
                                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                                  ),
                                  if (_startDate != null && _endDate != null)
                                    Text('$days days total', style: const TextStyle(color: AppTheme.textLight, fontSize: 13, fontWeight: FontWeight.w500)),
                                ],
                              ),
                            ),
                            const Icon(Icons.chevron_right, color: Colors.grey),
                          ],
                        ),
                      ),
                    ),
                    
                    if (_startDate != null && _endDate != null) ...[
                      const SizedBox(height: 24),
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryGreen.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.primaryGreen.withValues(alpha: 0.2)),
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('₹${eq.pricePerDay} x $days days', style: const TextStyle(color: AppTheme.textLight, fontSize: 15)),
                                Text('₹$total', style: const TextStyle(color: AppTheme.textDark, fontWeight: FontWeight.bold, fontSize: 15)),
                              ],
                            ),
                            const Padding(
                              padding: EdgeInsets.symmetric(vertical: 12),
                              child: Divider(color: Colors.black12, height: 1),
                            ),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Total Estimate', style: TextStyle(color: AppTheme.textDark, fontWeight: FontWeight.w900, fontSize: 18)),
                                Text('₹$total', style: const TextStyle(color: AppTheme.primaryGreen, fontWeight: FontWeight.w900, fontSize: 24)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                    
                    const SizedBox(height: 40),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _createBooking,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 20),
                          backgroundColor: AppTheme.primaryGreen,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: _isLoading 
                          ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3)) 
                          : const Text('Confirm Booking & Pay', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                      ),
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _placeholder() => Container(color: Colors.grey[200], child: const Center(child: Icon(Icons.agriculture, size: 80, color: Colors.grey)));
}
