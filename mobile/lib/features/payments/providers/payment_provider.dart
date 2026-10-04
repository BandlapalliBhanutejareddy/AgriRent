import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../models/booking.dart';

final paymentProvider = StateNotifierProvider<PaymentNotifier, PaymentState>((ref) {
  return PaymentNotifier();
});

class PaymentState {
  final bool isLoading;
  final String? error;
  final bool isSuccess;

  PaymentState({this.isLoading = false, this.error, this.isSuccess = false});

  PaymentState copyWith({bool? isLoading, String? error, bool? isSuccess}) {
    return PaymentState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isSuccess: isSuccess ?? this.isSuccess,
    );
  }
}

class PaymentNotifier extends StateNotifier<PaymentState> {
  PaymentNotifier() : super(PaymentState());

  Future<void> initiatePayment(Booking booking) async {
    state = state.copyWith(isLoading: true, error: null, isSuccess: false);

    try {
      // Simulate AgroRent Direct payment verification
      await Future.delayed(const Duration(seconds: 2));

      // Since booking creation now handles payment atomically,
      // we just simulate success here if needed, or this method can be bypassed entirely
      // depending on the mobile UI implementation.
      state = state.copyWith(isLoading: false, isSuccess: true);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}
