import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../models/booking.dart';
import '../providers/payment_provider.dart';

class PaymentScreen extends ConsumerStatefulWidget {
  final Booking booking;

  const PaymentScreen({super.key, required this.booking});

  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen> {
  @override
  void initState() {
    super.initState();
    // Delay initiation to allow UI to build
    Future.microtask(() {
      ref.read(paymentProvider.notifier).initiatePayment(widget.booking);
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(paymentProvider);

    ref.listen<PaymentState>(paymentProvider, (previous, next) {
      if (next.isSuccess) {
        _showSuccessAndNavigate();
      } else if (next.error != null) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(next.error!)));
      }
    });

    return Scaffold(
      appBar: AppBar(title: const Text('Payment')),
      body: Center(
        child: state.isLoading 
          ? const Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 16),
                Text('Processing Payment...', style: TextStyle(fontSize: 18)),
                SizedBox(height: 8),
                Text('Please do not close this screen', style: TextStyle(color: Colors.grey)),
              ],
            )
          : state.isSuccess
              ? const Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.check_circle, color: Colors.green, size: 80),
                    SizedBox(height: 16),
                    Text('Payment Successful!', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                  ],
                )
              : state.error != null
                  ? Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error, color: Colors.red, size: 80),
                        const SizedBox(height: 16),
                        Text('Payment Failed', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 32.0),
                          child: Text(state.error!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey)),
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: () {
                            ref.read(paymentProvider.notifier).initiatePayment(widget.booking);
                          },
                          child: const Text('Retry Payment'),
                        ),
                      ],
                    )
                  : const SizedBox.shrink(),
      ),
    );
  }

  void _showSuccessAndNavigate() {
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    });
  }
}
