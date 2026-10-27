import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/socket/socket_client.dart';
import '../../auth/providers/auth_provider.dart';
import '../repository/notification_repository.dart';

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  return NotificationRepository();
});

class NotificationsState {
  final List<Notification> notifications;
  final bool isLoading;
  final bool isActionLoading;
  final String? error;

  const NotificationsState({
    this.notifications = const [],
    this.isLoading = false,
    this.isActionLoading = false,
    this.error,
  });

  int get unreadCount => notifications.where((n) => !n.read).length;

  NotificationsState copyWith({
    List<Notification>? notifications,
    bool? isLoading,
    bool? isActionLoading,
    String? error,
    bool clearError = false,
  }) {
    return NotificationsState(
      notifications: notifications ?? this.notifications,
      isLoading: isLoading ?? this.isLoading,
      isActionLoading: isActionLoading ?? this.isActionLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class NotificationsNotifier extends StateNotifier<NotificationsState> {
  final Ref _ref;
  final NotificationRepository _repository;
  String? _currentUserId;

  NotificationsNotifier(this._ref, this._repository)
      : super(const NotificationsState()) {
    // Security and account isolation: Reset notifications when user logs out or switches
    _ref.listen<AuthState>(authProvider, (previous, next) {
      final nextId = next.user?.id;
      if (next.user == null || (previous?.user != null && _currentUserId != nextId)) {
        reset();
        _currentUserId = nextId;
      } else if (next.user != null) {
        _currentUserId = nextId;
        if (nextId != null) {
          SocketClient().registerUser(nextId);
        }
      }
    });

    // Real-time socket notification listener
    try {
      SocketClient().onNotification((data) {
        if (data is Map && mounted) {
          try {
            final notif = Notification.fromJson(Map<String, dynamic>.from(data));
            if (!state.notifications.any((n) => n.id == notif.id)) {
              final updated = [notif, ...state.notifications];
              state = state.copyWith(notifications: updated);
              _ref.read(unreadNotificationsCountProvider.notifier).setCount(state.unreadCount);
            }
          } catch (_) {}
        }
      });
    } catch (_) {}
  }

  /// Fetches authoritative notifications for current user.
  /// Deduplicates items by unique ID to prevent duplicate entries on repeated fetches.
  Future<void> fetchNotifications({bool forceRefresh = false}) async {
    if (state.notifications.isEmpty || forceRefresh) {
      state = state.copyWith(isLoading: true, clearError: true);
    }

    try {
      final rawList = await _repository.fetchNotifications();
      final seenIds = <String>{};
      final distinctList = <Notification>[];

      for (final n in rawList) {
        if (n.id.isNotEmpty) {
          if (seenIds.add(n.id)) {
            distinctList.add(n);
          }
        } else {
          distinctList.add(n);
        }
      }

      state = state.copyWith(
        notifications: distinctList,
        isLoading: false,
        clearError: true,
      );

      // Keep unread count provider synchronized
      _ref.read(unreadNotificationsCountProvider.notifier).setCount(state.unreadCount);
    } catch (e) {
      final errStr = e.toString().replaceAll('Exception: ', '').trim();
      state = state.copyWith(
        isLoading: false,
        error: errStr.isNotEmpty ? errStr : 'Failed to load notifications',
      );
    }
  }

  /// Marks a single notification as read on backend and updates local state.
  Future<bool> markAsRead(String id) async {
    try {
      await _repository.markAsRead(id);
      final updated = state.notifications.map((n) {
        return n.id == id ? n.copyWith(read: true) : n;
      }).toList();

      state = state.copyWith(notifications: updated);
      _ref.read(unreadNotificationsCountProvider.notifier).decrement();
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Marks all notifications for user as read.
  Future<bool> markAllAsRead() async {
    state = state.copyWith(isActionLoading: true);
    try {
      await _repository.markAllAsRead();
      final updated = state.notifications.map((n) => n.copyWith(read: true)).toList();
      state = state.copyWith(notifications: updated, isActionLoading: false);
      _ref.read(unreadNotificationsCountProvider.notifier).reset();
      return true;
    } catch (_) {
      state = state.copyWith(isActionLoading: false);
      return false;
    }
  }

  /// Deletes a notification from backend and removes from local state.
  Future<bool> deleteNotification(String id) async {
    try {
      final wasUnread = state.notifications.any((n) => n.id == id && !n.read);
      await _repository.deleteNotification(id);
      final updated = state.notifications.where((n) => n.id != id).toList();
      state = state.copyWith(notifications: updated);
      if (wasUnread) {
        _ref.read(unreadNotificationsCountProvider.notifier).decrement();
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Clears in-memory notifications cache on logout
  void reset() {
    state = const NotificationsState();
    _ref.read(unreadNotificationsCountProvider.notifier).reset();
  }
}

final notificationsProvider =
    StateNotifierProvider<NotificationsNotifier, NotificationsState>((ref) {
  final repo = ref.watch(notificationRepositoryProvider);
  return NotificationsNotifier(ref, repo);
});

// -----------------------------------------------------------------------------
// Unread Badge Counter Provider
// -----------------------------------------------------------------------------
final unreadNotificationsCountProvider =
    StateNotifierProvider<UnreadCountNotifier, int>((ref) {
  return UnreadCountNotifier(ref);
});

class UnreadCountNotifier extends StateNotifier<int> {
  final Ref _ref;

  UnreadCountNotifier(this._ref) : super(0) {
    _ref.listen<AuthState>(authProvider, (previous, next) {
      if (next.user == null) {
        state = 0;
      }
    });
  }

  Future<void> refresh() async {
    try {
      final repo = _ref.read(notificationRepositoryProvider);
      final list = await repo.fetchNotifications();
      state = list.where((n) => !n.read).length;
    } catch (_) {
      // Graceful failure
    }
  }

  void setCount(int count) {
    state = count >= 0 ? count : 0;
  }

  void decrement() {
    if (state > 0) state--;
  }

  void reset() {
    state = 0;
  }
}
