import '../../../core/api/api_client.dart';
import '../models/payment_record.dart';

class PaymentRepository {
  final ApiClient _apiClient = ApiClient();

  Future<List<PaymentRecord>> fetchFarmerPaymentHistory() async {
    final response = await _apiClient.dio.get('payments/history');
    final dynamic raw = response.data;
    final List<dynamic> list = raw is List
        ? raw
        : (raw is Map && raw['data'] is List ? raw['data'] : []);

    return list.map((item) => PaymentRecord.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<List<PaymentRecord>> fetchOwnerPaymentsReceived() async {
    final response = await _apiClient.dio.get('payments/received');
    final dynamic raw = response.data;
    final List<dynamic> list = raw is List
        ? raw
        : (raw is Map && raw['data'] is List ? raw['data'] : []);

    return list.map((item) => PaymentRecord.fromJson(item as Map<String, dynamic>)).toList();
  }
}
