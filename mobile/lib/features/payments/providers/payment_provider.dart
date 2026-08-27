import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../repository/payment_repository.dart';
import '../../../models/booking.dart';
import '../../auth/providers/auth_provider.dart';

final paymentProvider = StateNotifierProvider<PaymentNotifier, PaymentState>((ref) {
  return PaymentNotifier(PaymentRepository(), ref);
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
  final PaymentRepository _repository;
  final Ref _ref;
  Razorpay? _razorpay;
  String? _currentBookingId;

  PaymentNotifier(this._repository, this._ref) : super(PaymentState()) {
    _razorpay = Razorpay();
    _razorpay!.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay!.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay!.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }

  @override
  void dispose() {
    _razorpay?.clear();
    super.dispose();
  }

  Future<void> initiatePayment(Booking booking) async {
    state = state.copyWith(isLoading: true, error: null, isSuccess: false);
    _currentBookingId = booking.id;

    try {
      final keyId = await _repository.getKeyId();
      final orderData = await _repository.createOrder(booking.id);

      final user = _ref.read(authProvider).user;
      final contact = user?.phone ?? '0000000000';
      final email = user?.email ?? 'test@example.com';

      var options = {
        'key': keyId,
        'amount': orderData['amount'],
        'currency': orderData['currency'],
        'name': 'AgroRent AI',
        'description': 'Booking ${booking.id}',
        'order_id': orderData['orderId'],
        'prefill': {
          'contact': contact,
          'email': email
        }
      };

      _razorpay!.open(options);
      // We do not stop loading here. The loading state continues until Razorpay overlay completes.
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    if (_currentBookingId == null) {
      state = state.copyWith(isLoading: false, error: 'Booking ID lost during payment');
      return;
    }

    try {
      final verifyData = {
        'razorpay_order_id': response.orderId,
        'razorpay_payment_id': response.paymentId,
        'razorpay_signature': response.signature,
        'bookingId': _currentBookingId
      };

      final isVerified = await _repository.verifyPayment(verifyData);
      
      if (isVerified) {
        state = state.copyWith(isLoading: false, isSuccess: true);
      } else {
        state = state.copyWith(isLoading: false, error: 'Backend validation failed for payment');
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    state = state.copyWith(isLoading: false, error: response.message ?? 'Payment failed or cancelled.');
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    state = state.copyWith(isLoading: false, error: 'External wallets are currently not supported.');
  }
}
