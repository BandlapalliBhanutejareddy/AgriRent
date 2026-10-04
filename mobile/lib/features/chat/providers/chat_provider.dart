import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
    if (!mounted || state.isLoading) return;
    try {
      final messages = await _repository.fetchMessages(bookingId);
      if (mounted) {
        // If message list length or last message ID changed, update state
        if (messages.length != state.messages.length ||
            (messages.isNotEmpty && state.messages.isNotEmpty && messages.last.id != state.messages.last.id)) {
          state = state.copyWith(
            messages: messages,
            clearError: true,
          );
        }
      }
    } catch (_) {
      // Polling errors fail silently without destroying visible UI
    }
  }

  Future<bool> sendMessage(String text) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty || state.isSending) return false;

    state = state.copyWith(isSending: true, clearSendError: true);
    try {
      final newMsg = await _repository.sendMessage(bookingId, trimmed);
      if (mounted) {
        final updatedList = List<ChatMessage>.from(state.messages)..add(newMsg);
        state = state.copyWith(
          messages: updatedList,
          isSending: false,
          clearSendError: true,
        );
        return true;
      }
      return false;
    } catch (e) {
      if (mounted) {
        final errStr = e.toString().replaceAll('Exception: ', '').trim();
        state = state.copyWith(
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
