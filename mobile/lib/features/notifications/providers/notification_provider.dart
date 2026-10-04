import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';

final unreadNotificationsCountProvider = StateNotifierProvider<UnreadCountNotifier, int>((ref) {
  return UnreadCountNotifier();
});

class UnreadCountNotifier extends StateNotifier<int> {
  UnreadCountNotifier() : super(0) {
    Future.microtask(() => refresh());
  }

  Future<void> refresh() async {
    try {
      final res = await ApiClient().dio.get('/notifications');
      final dynamic raw = res.data;
      final List<dynamic> notifications = raw is List
          ? raw
          : (raw is Map && raw['data'] is List ? raw['data'] : []);
      final unreadCount = notifications.where((n) => n is Map && n['read'] == false).length;
      state = unreadCount;
    } catch (e) {
      // Ignore network/auth errors gracefully
    }
  }

  void decrement() {
    if (state > 0) state--;
  }

  void reset() {
    state = 0;
  }
}
