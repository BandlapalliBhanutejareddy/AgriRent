import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../api/api_client.dart';

class CallRelayService {
  static Future<void> initiatePrivateCall({
    String? equipmentId,
    String? bookingId,
    String? recipientName,
    required BuildContext context,
    required String lang,
    required bool isDark,
  }) async {
    try {
      final Map<String, dynamic> body = {};
      if (equipmentId != null) body['equipmentId'] = equipmentId;
      if (bookingId != null) body['bookingId'] = bookingId;

      final response = await ApiClient().dio.post('calls/initiate', data: body);
      final data = response.data['data'] ?? response.data;
      final phone = (data['targetPhone'] ?? data['relayNumber'])?.toString().trim();

      if (phone != null && phone.isNotEmpty) {
        final dialUri = Uri.parse('tel:$phone');
        final launched = await launchUrl(dialUri, mode: LaunchMode.externalApplication);
        if (!launched && context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not open phone dialer.')),
          );
        }
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Phone number is not available for this contact.')),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Contact does not have a registered phone number.')),
        );
      }
    }
  }
}
