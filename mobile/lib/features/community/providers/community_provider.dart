import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/community_models.dart';
import '../services/community_service.dart';

final communityServiceProvider = Provider<CommunityService>((ref) {
  return CommunityService();
});

class CommunityState {
  final List<CommunityMessage> messages;
  final CommunityInfo? info;
  final List<CommunityMember> members;
  final CropTrendsResponse? cropTrends;
  final bool isLoading;
  final bool isLoadingMembers;
  final bool isLoadingCropTrends;
  final bool isSending;
  final String? error;
  final String? sendError;
  final String? lastFailedMessage;
  final Set<String> likedMessageIds;
  final Map<String, int> extraLikes;
  final String searchQuery;
  final String selectedCategory;

  const CommunityState({
    this.messages = const [],
    this.info,
    this.members = const [],
    this.cropTrends,
    this.isLoading = true,
    this.isLoadingMembers = false,
    this.isLoadingCropTrends = false,
    this.isSending = false,
    this.error,
    this.sendError,
    this.lastFailedMessage,
    this.likedMessageIds = const {},
    this.extraLikes = const {},
    this.searchQuery = '',
    this.selectedCategory = 'All',
  });

  CommunityState copyWith({
    List<CommunityMessage>? messages,
    CommunityInfo? info,
    List<CommunityMember>? members,
    CropTrendsResponse? cropTrends,
    bool? isLoading,
    bool? isLoadingMembers,
    bool? isLoadingCropTrends,
    bool? isSending,
    String? error,
    bool clearError = false,
    String? sendError,
    bool clearSendError = false,
    String? lastFailedMessage,
    bool clearLastFailedMessage = false,
    Set<String>? likedMessageIds,
    Map<String, int>? extraLikes,
    String? searchQuery,
    String? selectedCategory,
  }) {
    return CommunityState(
      messages: messages ?? this.messages,
      info: info ?? this.info,
      members: members ?? this.members,
      cropTrends: cropTrends ?? this.cropTrends,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMembers: isLoadingMembers ?? this.isLoadingMembers,
      isLoadingCropTrends: isLoadingCropTrends ?? this.isLoadingCropTrends,
      isSending: isSending ?? this.isSending,
      error: clearError ? null : (error ?? this.error),
      sendError: clearSendError ? null : (sendError ?? this.sendError),
      lastFailedMessage: clearLastFailedMessage ? null : (lastFailedMessage ?? this.lastFailedMessage),
      likedMessageIds: likedMessageIds ?? this.likedMessageIds,
      extraLikes: extraLikes ?? this.extraLikes,
      searchQuery: searchQuery ?? this.searchQuery,
      selectedCategory: selectedCategory ?? this.selectedCategory,
    );
  }
}

class CommunityNotifier extends StateNotifier<CommunityState> {
  final CommunityService _service;
  Timer? _pollingTimer;
  String? _currentUserId;
  bool _isSendingActive = false;

  CommunityNotifier(this._service, {String? userId}) : super(const CommunityState()) {
    _currentUserId = userId;
    if (_currentUserId != null) {
      loadCommunity();
      loadMembers();
      _startPolling();
    } else {
      state = state.copyWith(isLoading: false);
    }
  }

  void resetForUser(String? newUserId) {
    _pollingTimer?.cancel();
    _pollingTimer = null;
    _currentUserId = newUserId;
    state = const CommunityState(isLoading: false);
    if (_currentUserId != null) {
      loadCommunity();
      loadMembers();
      _startPolling();
    }
  }

  void _startPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      _pollMessages();
    });
  }

  Future<void> loadCommunity() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final info = await _service.fetchCommunityInfo();
      final messages = await _service.fetchMessages();
      if (!mounted) return;
      state = state.copyWith(
        info: info,
        messages: messages,
        isLoading: false,
      );
    } catch (e) {
      if (!mounted) return;
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceAll('Exception: ', ''),
      );
    }
  }

  Future<void> loadMembers() async {
    state = state.copyWith(isLoadingMembers: true);
    try {
      final members = await _service.fetchMembers();
      if (!mounted) return;
      state = state.copyWith(
        members: members,
        isLoadingMembers: false,
      );
    } catch (e) {
      if (!mounted) return;
      state = state.copyWith(isLoadingMembers: false);
    }
  }

  Future<void> loadCropTrends() async {
    state = state.copyWith(isLoadingCropTrends: true);
    try {
      final trends = await _service.fetchCropTrends();
      if (!mounted) return;
      state = state.copyWith(
        cropTrends: trends,
        isLoadingCropTrends: false,
      );
    } catch (e) {
      if (!mounted) return;
      state = state.copyWith(isLoadingCropTrends: false);
    }
  }

  Future<bool> saveMyCrops({
    required Map<String, dynamic> currentCrop,
    Map<String, dynamic>? nextCrop,
  }) async {
    try {
      await _service.saveMyCrops(currentCrop: currentCrop, nextCrop: nextCrop);
      if (!mounted) return false;
      await loadMembers();
      if (!mounted) return false;
      await loadCropTrends();
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<void> _pollMessages() async {
    if (!mounted || _currentUserId == null) return;
    try {
      final messages = await _service.fetchMessages();
      if (!mounted) return;
      if (messages.length != state.messages.length ||
          (messages.isNotEmpty && state.messages.isNotEmpty && messages.last.id != state.messages.last.id)) {
        state = state.copyWith(messages: messages);
      }
    } catch (e) {
      final msg = e.toString();
      if (msg.contains('403') || msg.contains('Forbidden') || msg.contains('401')) {
        _pollingTimer?.cancel();
        _pollingTimer = null;
      }
    }
  }

  Future<bool> sendMessage(String text) async {
    if (_isSendingActive) return false;
    final trimmed = text.trim();
    if (trimmed.isEmpty) return false;

    _isSendingActive = true;
    state = state.copyWith(isSending: true, clearSendError: true);
    try {
      final newMessage = await _service.sendMessage(trimmed);
      if (!mounted) return true;
      final updated = List<CommunityMessage>.from(state.messages)..add(newMessage);
      state = state.copyWith(
        messages: updated,
        isSending: false,
        clearLastFailedMessage: true,
      );
      return true;
    } catch (e) {
      if (!mounted) return false;
      state = state.copyWith(
        isSending: false,
        sendError: e.toString().replaceAll('Exception: ', ''),
        lastFailedMessage: trimmed,
      );
      return false;
    } finally {
      _isSendingActive = false;
    }
  }

  void toggleLike(String messageId) {
    final updatedLiked = Set<String>.from(state.likedMessageIds);
    final updatedExtra = Map<String, int>.from(state.extraLikes);
    final isCurrentlyLiked = updatedLiked.contains(messageId);

    if (isCurrentlyLiked) {
      updatedLiked.remove(messageId);
      final currentExtra = updatedExtra[messageId] ?? 0;
      updatedExtra[messageId] = (currentExtra - 1).clamp(0, 9999);
    } else {
      updatedLiked.add(messageId);
      final currentExtra = updatedExtra[messageId] ?? 0;
      updatedExtra[messageId] = currentExtra + 1;
    }

    state = state.copyWith(
      likedMessageIds: updatedLiked,
      extraLikes: updatedExtra,
    );
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
  }

  void setSelectedCategory(String category) {
    state = state.copyWith(selectedCategory: category);
  }

  Future<bool> createPost({required String text, String category = 'Discussions'}) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return false;
    final formatted = (category != 'Discussions' && category != 'All')
        ? '[$category] $trimmed'
        : trimmed;
    return sendMessage(formatted);
  }

  Future<bool> sendReply({
    required String parentMessageId,
    required String authorName,
    required String replyText,
  }) async {
    final trimmed = replyText.trim();
    if (trimmed.isEmpty) return false;
    final formatted = '[Reply to @$authorName] $trimmed';
    return sendMessage(formatted);
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }
}

final communityProvider = StateNotifierProvider<CommunityNotifier, CommunityState>((ref) {
  final service = ref.watch(communityServiceProvider);
  final auth = ref.watch(authProvider);
  final notifier = CommunityNotifier(service, userId: auth.user?.id);

  ref.listen<AuthState>(authProvider, (prev, next) {
    if (prev?.user?.id != next.user?.id) {
      notifier.resetForUser(next.user?.id);
    }
  });

  ref.onDispose(() => notifier.dispose());
  return notifier;
});
