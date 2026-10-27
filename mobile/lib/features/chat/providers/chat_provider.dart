import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/chat_message.dart';
import '../repository/chat_repository.dart';

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  return ChatRepository();
});

class ChatState {
  final List<ChatMessage> messages;
  final bool isLoading;
  final bool isSending;
  final String? error;
  final String? sendError;

  const ChatState({
    this.messages = const [],
    this.isLoading = true,
    this.isSending = false,
    this.error,
    this.sendError,
  });

  ChatState copyWith({
    List<ChatMessage>? messages,
    bool? isLoading,
    bool? isSending,
    String? error,
    bool clearError = false,
    String? sendError,
    bool clearSendError = false,
  }) {
    return ChatState(
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      isSending: isSending ?? this.isSending,
      error: clearError ? null : (error ?? this.error),
      sendError: clearSendError ? null : (sendError ?? this.sendError),
    );
  }
}

class ChatNotifier extends StateNotifier<ChatState> {
  final ChatRepository _repository;
  final String bookingId;
  Timer? _pollingTimer;

  ChatNotifier(this._repository, this.bookingId) : super(const ChatState()) {
    loadMessages();
    _startPolling();
  }

  bool _isPolling = false;

  void _startPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      _pollMessages();
    });
  }

  Future<void> loadMessages() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final messages = await _repository.fetchMessages(bookingId);
      if (mounted) {
        state = state.copyWith(
          messages: messages,
          isLoading: false,
          clearError: true,
        );
      }
    } catch (e) {
      if (mounted) {
        final errStr = e.toString().replaceAll('Exception: ', '').trim();
        state = state.copyWith(
          isLoading: false,
          error: errStr.isNotEmpty ? errStr : 'Unable to load messages.',
        );
      }
    }
  }

  Future<void> _pollMessages() async {
    if (!mounted || state.isLoading || _isPolling) return;
    _isPolling = true;
    try {
      final messages = await _repository.fetchMessages(bookingId);
      if (mounted) {
        // Keep any active in-flight sending message at bottom
        final inFlight = state.messages.where((m) => m.isSending).toList();
        if (messages.length != (state.messages.length - inFlight.length) ||
            (messages.isNotEmpty && state.messages.isNotEmpty && messages.last.id != state.messages.last.id)) {
          state = state.copyWith(
            messages: [...messages, ...inFlight],
            clearError: true,
          );
        }
      }
    } catch (_) {
      // Polling errors fail silently without destroying visible UI
    } finally {
      _isPolling = false;
    }
  }

  /// Sends a message associated with this booking.
  /// Displays an immediate sending state and enforces a mutex on concurrent sends.
  Future<bool> sendMessage(String text, {String? senderId, String? senderName}) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty || state.isSending) return false;

    final tempId = 'temp_${DateTime.now().millisecondsSinceEpoch}';
    final pendingMsg = ChatMessage(
      id: tempId,
      bookingId: bookingId,
      senderId: senderId ?? '',
      text: trimmed,
      read: false,
      createdAt: DateTime.now(),
      sender: ChatSender(id: senderId ?? '', name: senderName ?? 'You'),
      isSending: true,
    );

    // Display immediate sending/loading state in the chat timeline
    final optimisticList = List<ChatMessage>.from(state.messages)..add(pendingMsg);
    state = state.copyWith(
      messages: optimisticList,
      isSending: true,
      clearSendError: true,
    );

    try {
      final newMsg = await _repository.sendMessage(bookingId, trimmed);
      if (mounted) {
        // Replace pending placeholder with confirmed server message
        final confirmedList = state.messages.map((m) => m.id == tempId ? newMsg : m).toList();
        state = state.copyWith(
          messages: confirmedList,
          isSending: false,
          clearSendError: true,
        );
        return true;
      }
      return false;
    } catch (e) {
      if (mounted) {
        // Remove uncommitted temporary message on failure so state matches test constraints
        final filteredList = state.messages.where((m) => m.id != tempId).toList();
        final errStr = e.toString().replaceAll('Exception: ', '').trim();
        state = state.copyWith(
          messages: filteredList,
          isSending: false,
          sendError: errStr.isNotEmpty ? errStr : 'Message could not be sent.',
        );
      }
      return false;
    }
  }

  Future<void> markAsRead() async {
    try {
      await _repository.markAsRead(bookingId);
    } catch (_) {}
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }
}

final chatProvider = StateNotifierProvider.autoDispose.family<ChatNotifier, ChatState, String>(
  (ref, bookingId) {
    final repo = ref.watch(chatRepositoryProvider);
    return ChatNotifier(repo, bookingId);
  },
);

// -----------------------------------------------------------------------------
// Unread Chat Counter Provider
// -----------------------------------------------------------------------------
final unreadChatCountProvider =
    StateNotifierProvider<UnreadChatCountNotifier, int>((ref) {
  final repo = ref.watch(chatRepositoryProvider);
  return UnreadChatCountNotifier(ref, repo);
});

class UnreadChatCountNotifier extends StateNotifier<int> {
  final Ref _ref;
  final ChatRepository _repository;

  UnreadChatCountNotifier(this._ref, this._repository) : super(0) {
    _ref.listen<AuthState>(authProvider, (previous, next) {
      if (next.user == null) {
        state = 0;
      }
    });
    Future.microtask(() => refresh());
  }

  Future<void> refresh() async {
    try {
      final count = await _repository.getUnreadCount();
      state = count;
    } catch (_) {}
  }

  void decrement() {
    if (state > 0) state--;
  }

  void reset() {
    state = 0;
  }
}
