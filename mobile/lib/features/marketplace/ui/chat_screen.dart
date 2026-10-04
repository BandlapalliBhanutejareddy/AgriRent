import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../models/booking.dart';
import '../../../shared/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../../chat/models/chat_message.dart';
import '../../chat/providers/chat_provider.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final Booking? booking;

  const ChatScreen({super.key, required this.booking});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _hasText = false;

  @override
  void initState() {
    super.initState();
    _textController.addListener(_onTextChanged);
    if (widget.booking != null && widget.booking!.id.isNotEmpty) {
      // Trigger read status
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(chatProvider(widget.booking!.id).notifier).markAsRead();
      });
    }
  }

  void _onTextChanged() {
    final has = _textController.text.trim().isNotEmpty;
    if (has != _hasText) {
      setState(() => _hasText = has);
    }
  }

  @override
  void dispose() {
    _textController.removeListener(_onTextChanged);
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom({bool animated = true}) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        if (animated) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOutCubic,
          );
        } else {
          _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
        }
      }
    });
  }

  Future<void> _handleSendMessage() async {
    final text = _textController.text.trim();
    if (text.isEmpty || widget.booking == null) return;

    final bookingId = widget.booking!.id;
    final lang = ref.read(languageProvider);
    final notifier = ref.read(chatProvider(bookingId).notifier);

    _textController.clear();
    final success = await notifier.sendMessage(text);
    if (success) {
      _scrollToBottom(animated: true);
    } else {
      if (mounted) {
        final sendError = ref.read(chatProvider(bookingId)).sendError;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              sendError ?? 'message_could_not_be_sent'.tr(lang),
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            backgroundColor: const Color(0xFFC62828),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            action: SnackBarAction(
              label: 'retry'.tr(lang),
              textColor: Colors.white,
              onPressed: () {
                _textController.text = text;
                _handleSendMessage();
              },
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (widget.booking == null || widget.booking!.id.isEmpty) {
      return Scaffold(
        backgroundColor: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
        appBar: AppBar(
          title: Text('chat'.tr(lang)),
          backgroundColor: Colors.transparent,
          elevation: 0,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline_rounded,
                size: 56,
                color: Colors.red.shade400,
              ),
              const SizedBox(height: 16),
              Text(
                'invalid_booking_context'.tr(lang),
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryGreen,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Back'),
              ),
            ],
          ),
        ),
      );
    }

    final booking = widget.booking!;
    final chatState = ref.watch(chatProvider(booking.id));
    final currentUser = ref.watch(authProvider).user;

    // Listen for incoming messages to scroll and mark as read
    ref.listen<ChatState>(chatProvider(booking.id), (previous, next) {
      if (previous != null && next.messages.length > previous.messages.length) {
        _scrollToBottom(animated: true);
        ref.read(chatProvider(booking.id).notifier).markAsRead();
      }
    });

    final equipmentTitle = booking.equipment?.title ?? 'Equipment Rental';
    final ownerName = booking.equipment?.owner?.name;
    final farmerName = booking.farmer?.name;
    final otherParticipantName = currentUser?.id == booking.farmerId
        ? (ownerName ?? 'Owner')
        : (farmerName ?? 'Farmer');

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
      appBar: AppBar(
        elevation: 0,
        scrolledUnderElevation: 1,
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_ios_new_rounded,
            size: 20,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        titleSpacing: 0,
        title: Row(
          children: [
            CircleAvatar(
              radius: 19,
              backgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.12),
              child: const Icon(
                Icons.agriculture_rounded,
                size: 20,
                color: AppTheme.primaryGreen,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    otherParticipantName,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 1),
                  Text(
                    equipmentTitle,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: isDark ? Colors.white60 : AppTheme.textMutedGray,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(
              Icons.refresh_rounded,
              color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
            ),
            tooltip: 'refresh',
            onPressed: () {
              ref.read(chatProvider(booking.id).notifier).loadMessages();
            },
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Status bar banner showing booking context
            _buildBookingContextBanner(booking, isDark, lang),

            // Message Area
            Expanded(
              child: _buildMessageArea(chatState, currentUser?.id, isDark, lang, booking.id),
            ),

            // Bottom Message Composer
            _buildComposer(chatState, isDark, lang),
          ],
        ),
      ),
    );
  }

  Widget _buildBookingContextBanner(Booking booking, bool isDark, String lang) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard.withValues(alpha: 0.6) : const Color(0xFFE8F5E9),
        border: Border(
          bottom: BorderSide(
            color: isDark ? Colors.white10 : const Color(0xFFC8E6C9),
            width: 0.8,
          ),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
            decoration: BoxDecoration(
              color: AppTheme.primaryGreen.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              '#${booking.id.length > 8 ? booking.id.substring(0, 8) : booking.id}',
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: AppTheme.primaryGreen,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              '${booking.status} • ${DateFormat('dd MMM').format(booking.startDate)} - ${DateFormat('dd MMM').format(booking.endDate)}',
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
                color: isDark ? Colors.white70 : const Color(0xFF2E7D32),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageArea(
    ChatState state,
    String? currentUserId,
    bool isDark,
    String lang,
    String bookingId,
  ) {
    if (state.isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(
              color: AppTheme.primaryGreen,
              strokeWidth: 3,
            ),
            SizedBox(height: 12),
            Text(
              'Loading conversation...',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: AppTheme.textMutedGray,
              ),
            ),
          ],
        ),
      );
    }

    if (state.error != null && state.messages.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.darkCard : Colors.red.shade50,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.cloud_off_rounded,
                  size: 40,
                  color: Colors.red.shade400,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'unable_to_load_messages'.tr(lang),
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                state.error!,
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? Colors.white60 : AppTheme.textMutedGray,
                ),
                textAlign: TextAlign.center,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: () {
                  ref.read(chatProvider(bookingId).notifier).loadMessages();
                },
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: Text('retry'.tr(lang)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryGreen,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (state.messages.isEmpty) {
      return RefreshIndicator(
        color: AppTheme.primaryGreen,
        onRefresh: () => ref.read(chatProvider(bookingId).notifier).loadMessages(),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            SizedBox(
              height: MediaQuery.of(context).size.height * 0.45,
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(22),
                        decoration: BoxDecoration(
                          color: isDark
                              ? AppTheme.darkCard
                              : AppTheme.primaryGreen.withValues(alpha: 0.08),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.chat_bubble_outline_rounded,
                          size: 48,
                          color: AppTheme.primaryGreen,
                        ),
                      ),
                      const SizedBox(height: 18),
                      Text(
                        'no_messages_yet'.tr(lang),
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'start_conversation_prompt'.tr(lang),
                        style: TextStyle(
                          fontSize: 13,
                          height: 1.4,
                          color: isDark ? Colors.white60 : AppTheme.textMutedGray,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      color: AppTheme.primaryGreen,
      onRefresh: () => ref.read(chatProvider(bookingId).notifier).loadMessages(),
      child: ListView.builder(
        controller: _scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        itemCount: state.messages.length,
        itemBuilder: (context, index) {
          final msg = state.messages[index];
          final isMe = msg.senderId == currentUserId;
          return _buildMessageBubble(msg, isMe, isDark);
        },
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage msg, bool isMe, bool isDark) {
    final timeFormatted = DateFormat('h:mm a').format(msg.createdAt);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Align(
        alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.78,
          ),
          child: Column(
            crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
            children: [
              if (!isMe && msg.sender?.name != null && msg.sender!.name.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(left: 6, bottom: 4),
                  child: Text(
                    msg.sender!.name,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white60 : AppTheme.textMutedGray,
                    ),
                  ),
                ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: isMe
                      ? AppTheme.primaryGreen
                      : (isDark ? AppTheme.darkCard : Colors.white),
                  borderRadius: BorderRadius.circular(18).copyWith(
                    bottomRight: isMe ? const Radius.circular(2) : const Radius.circular(18),
                    bottomLeft: !isMe ? const Radius.circular(2) : const Radius.circular(18),
                  ),
                  border: isMe
                      ? null
                      : Border.all(
                          color: isDark
                              ? Colors.white10
                              : Colors.black.withValues(alpha: 0.08),
                          width: 1,
                        ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.04),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                  children: [
                    Text(
                      msg.text,
                      style: TextStyle(
                        fontSize: 14.5,
                        height: 1.35,
                        color: isMe
                            ? Colors.white
                            : (isDark ? Colors.white : AppTheme.textDarkNavy),
                      ),
                    ),
                    const SizedBox(height: 5),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          timeFormatted,
                          style: TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w500,
                            color: isMe
                                ? Colors.white.withValues(alpha: 0.8)
                                : (isDark ? Colors.white54 : AppTheme.textMutedGray),
                          ),
                        ),
                        if (isMe) ...[
                          const SizedBox(width: 4),
                          Icon(
                            msg.read ? Icons.done_all_rounded : Icons.done_rounded,
                            size: 13,
                            color: Colors.white.withValues(alpha: 0.85),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildComposer(ChatState state, bool isDark, String lang) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        border: Border(
          top: BorderSide(
            color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
            width: 1,
          ),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Container(
              constraints: const BoxConstraints(maxHeight: 120),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkBackground : const Color(0xFFF4F6F5),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: isDark ? Colors.white12 : const Color(0xFFE0E0E0),
                  width: 1,
                ),
              ),
              child: TextField(
                controller: _textController,
                enabled: !state.isSending,
                minLines: 1,
                maxLines: 4,
                textCapitalization: TextCapitalization.sentences,
                style: TextStyle(
                  fontSize: 14.5,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
                decoration: InputDecoration(
                  hintText: 'type_message'.tr(lang),
                  hintStyle: TextStyle(
                    color: isDark ? Colors.white38 : AppTheme.textMutedGray,
                    fontSize: 14,
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
                  border: InputBorder.none,
                  isDense: true,
                ),
                onSubmitted: (_) => _handleSendMessage(),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: (_hasText && !state.isSending) ? _handleSendMessage : null,
              borderRadius: BorderRadius.circular(24),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: _hasText && !state.isSending
                      ? AppTheme.primaryGreen
                      : (isDark ? Colors.white10 : Colors.grey.shade300),
                  shape: BoxShape.circle,
                ),
                child: state.isSending
                    ? const Center(
                        child: SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.2,
                            color: Colors.white,
                          ),
                        ),
                      )
                    : Icon(
                        Icons.send_rounded,
                        color: _hasText ? Colors.white : Colors.grey.shade500,
                        size: 20,
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
