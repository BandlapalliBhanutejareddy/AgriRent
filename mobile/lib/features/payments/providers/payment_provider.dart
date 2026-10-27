import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/payment_record.dart';
import '../repositories/payment_repository.dart';

final paymentRepositoryProvider = Provider((ref) => PaymentRepository());

final farmerPaymentHistoryProvider = FutureProvider.autoDispose<List<PaymentRecord>>((ref) async {
  final repo = ref.watch(paymentRepositoryProvider);
  return repo.fetchFarmerPaymentHistory();
});

final ownerPaymentsReceivedProvider = FutureProvider.autoDispose<List<PaymentRecord>>((ref) async {
  final repo = ref.watch(paymentRepositoryProvider);
  return repo.fetchOwnerPaymentsReceived();
});

class PaymentState {
  final bool isLoading;
  final bool isSuccess;
  final String? error;
  final String? transactionId;

  PaymentState({
    this.isLoading = false,
    this.isSuccess = false,
    this.error,
    this.transactionId,
  });
}

class PaymentNotifier extends StateNotifier<PaymentState> {
  PaymentNotifier() : super(PaymentState());

  Future<void> initiatePayment(dynamic booking) async {
    state = PaymentState(isLoading: true);
    await Future.delayed(const Duration(seconds: 1));
    state = PaymentState(isSuccess: true, transactionId: 'TXN-${DateTime.now().millisecondsSinceEpoch}');
  }
}

final paymentProvider = StateNotifierProvider<PaymentNotifier, PaymentState>((ref) {
  return PaymentNotifier();
});
