import '../../../core/api/api_client.dart';
import '../../../core/errors/api_error_handler.dart';

class PaymentRepository {
  final ApiClient _apiClient = ApiClient();

  Future<String> getKeyId() async {
    try {
      final response = await _apiClient.dio.get('/payments/key');
      final responseData = response.data['data'] ?? response.data;
      return responseData['keyId'];
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<Map<String, dynamic>> createOrder(String bookingId) async {
    try {
      final response = await _apiClient.dio.post('/payments/create-order', data: {
        'bookingId': bookingId,
      });
      final responseData = response.data['data'] ?? response.data;
      return responseData;
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<bool> verifyPayment(Map<String, dynamic> paymentData) async {
    try {
      final response = await _apiClient.dio.post('/payments/verify', data: paymentData);
      return response.data['success'] == true;
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }
}
