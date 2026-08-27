import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../models/equipment.dart';
import '../../bookings/repository/booking_repository.dart';
import '../../payments/ui/payment_screen.dart';
import 'equipment_map_screen.dart';

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
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select dates')));
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

      if (mounted) {
        Navigator.push(context, MaterialPageRoute(builder: (_) => PaymentScreen(booking: booking)));
      }
    } catch (e) {
      setState(() { _isLoading = false; });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
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
      appBar: AppBar(title: Text(eq.title)),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (eq.imageUrl.isNotEmpty)
              Image.network(eq.imageUrl, height: 250, fit: BoxFit.cover, errorBuilder: (context, error, stack) => _placeholder())
            else
              _placeholder(),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(child: Text(eq.title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold))),
                      Text('₹${eq.pricePerDay}/day', style: TextStyle(fontSize: 20, color: Theme.of(context).primaryColor, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('Category: ${eq.category}', style: const TextStyle(color: Colors.grey)),
                  const SizedBox(height: 16),
                  const Text('Description', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text(eq.description, style: const TextStyle(fontSize: 16)),
                  const SizedBox(height: 16),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.location_on),
                    title: Text(eq.location ?? 'Unknown location'),
                    trailing: ElevatedButton(
                      onPressed: () {
                        Navigator.push(context, MaterialPageRoute(builder: (_) => EquipmentMapScreen(equipment: eq)));
                      },
                      child: const Text('View Map'),
                    ),
                  ),
                  const Divider(),
                  const Text('Booking Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.calendar_today),
                    title: Text(_startDate != null && _endDate != null
                        ? '${DateFormat('MMM d').format(_startDate!)} - ${DateFormat('MMM d').format(_endDate!)} ($days days)'
                        : 'Select Dates'),
                    trailing: TextButton(onPressed: _selectDateRange, child: const Text('Change')),
                  ),
                  if (_startDate != null && _endDate != null)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Total Estimate:', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                          Text('₹$total', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Theme.of(context).primaryColor)),
                        ],
                      ),
                    ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _createBooking,
                      child: _isLoading ? const CircularProgressIndicator(color: Colors.white) : const Text('Confirm Booking & Pay', style: TextStyle(fontSize: 18)),
                    ),
                  )
                ],
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _placeholder() => Container(height: 250, color: Colors.grey[200], child: const Icon(Icons.agriculture, size: 80, color: Colors.grey));
}
