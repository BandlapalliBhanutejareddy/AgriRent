import '../../../core/errors/api_error_handler.dart';

class PaymentRepository {

  // Internal booking handles atomic payment creation
  Future<bool> confirmDirectPayment(String bookingId) async {
    try {
      // Simulate success for direct internal flow,
      // API call to /bookings already handles the atomic payment.
      return true;
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }
}
