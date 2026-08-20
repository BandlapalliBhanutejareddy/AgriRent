import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repository/notification_repository.dart';
import '../../../core/socket/socket_client.dart';

final notificationRepositoryProvider = Provider((ref) => NotificationRepository());

class NotificationState {
  final List<Notification> notifications;
  final bool isLoading;
  final String? error;
  
  int get unreadCount => notifications.where((n) => !n.read).length;

  NotificationState({
    this.notifications = const [],
    this.isLoading = false,
    this.error,
  });

  NotificationState copyWith({
    List<Notification>? notifications,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return NotificationState(
      notifications: notifications ?? this.notifications,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class NotificationNotifier extends StateNotifier<NotificationState> {
  final NotificationRepository _repository;
  final SocketClient _socketClient = SocketClient();

  NotificationNotifier(this._repository) : super(NotificationState()) {
    fetchNotifications();
    _initSocket();
  }

  void _initSocket() async {
    await _socketClient.connect();
    _socketClient.onNotification((data) {
      if (data != null) {
        final newNotification = Notification.fromJson(data);
        state = state.copyWith(
          notifications: [newNotification, ...state.notifications],
        );
      }
    });
  }

  Future<void> fetchNotifications() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final notifs = await _repository.fetchNotifications();
      state = state.copyWith(notifications: notifs, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      await _repository.markAsRead(id);
      final updated = state.notifications.map((n) {
        if (n.id == id) {
          return Notification(id: n.id, title: n.title, message: n.message, read: true, createdAt: n.createdAt);
        }
        return n;
      }).toList();
      state = state.copyWith(notifications: updated);
    } catch (e) {
      // Ignore error for marking read
    }
  }

  @override
  void dispose() {
    _socketClient.offNotification();
    super.dispose();
  }
}

final notificationProvider = StateNotifierProvider<NotificationNotifier, NotificationState>((ref) {
  final repo = ref.watch(notificationRepositoryProvider);
  return NotificationNotifier(repo);
});
