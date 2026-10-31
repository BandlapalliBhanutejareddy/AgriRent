import 'package:flutter/material.dart' hide Notification;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../shared/theme/app_theme.dart';
import '../providers/notification_provider.dart';
import '../repository/notification_repository.dart';

class NotificationScreen extends ConsumerStatefulWidget {
  const NotificationScreen({super.key});

  @override
  ConsumerState<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends ConsumerState<NotificationScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(notificationsProvider.notifier).fetchNotifications(forceRefresh: true);
    });
  }

  void _handleNotificationTap(Notification n, String lang) {
    if (!n.read) {
      ref.read(notificationsProvider.notifier).markAsRead(n.id);
    }

    final type = (n.type ?? '').toUpperCase();

    if (type.contains('BROADCAST') || type.contains('ADMIN')) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(
            children: [
              const Icon(Icons.campaign_rounded, color: Color(0xFF2563EB)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  n.title,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                n.message,
                style: const TextStyle(fontSize: 14, height: 1.4),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 4,
                children: [
                  if (n.category != null && n.category!.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF2563EB).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'Category: ${n.category}',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF2563EB)),
                      ),
                    ),
                  if (n.priority != null && n.priority != 'NORMAL')
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.red.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'Priority: ${n.priority}',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFFD32F2F)),
                      ),
                    ),
                ],
              ),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx),
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF2563EB), foregroundColor: Colors.white),
              child: const Text('Acknowledge'),
            ),
          ],
        ),
      );
      return;
    }

    final relId = n.relatedId?.trim();
    if (relId == null || relId.isEmpty) return;

    if (type == 'CHAT_MESSAGE') {
      context.push('/chat?bookingId=$relId');
    } else if (type.contains('BOOKING')) {
      // Booking related: navigate to chat or booking details
      context.push('/chat?bookingId=$relId');
    } else if (type.contains('WEATHER') || type.contains('AGRONOMIC') || type.contains('ALERT')) {
      context.push('/crop-advisor');
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final notifState = ref.watch(notificationsProvider);
    final notifications = notifState.notifications;
    final hasUnread = notifications.any((n) => !n.read);

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
      appBar: AppBar(
        title: Text(
          'notifications'.tr(lang),
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 18,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
        ),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_ios_new_rounded,
            size: 20,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (hasUnread)
            IconButton(
              icon: const Icon(Icons.done_all_rounded, color: AppTheme.primaryGreen),
              onPressed: notifState.isActionLoading
                  ? null
                  : () async {
                      await ref.read(notificationsProvider.notifier).markAllAsRead();
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('all_notifications_read'.tr(lang)),
                            duration: const Duration(seconds: 2),
                          ),
                        );
                      }
                    },
              tooltip: 'mark_all_read'.tr(lang),
            ),
          const SizedBox(width: 4),
        ],
      ),
      body: notifState.isLoading && notifications.isEmpty
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primaryGreen),
            )
          : notifState.error != null && notifications.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.cloud_off_rounded, size: 48, color: Colors.red.shade400),
                        const SizedBox(height: 12),
                        Text(
                          'failed_to_load'.tr(lang),
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () {
                            ref.read(notificationsProvider.notifier).fetchNotifications(forceRefresh: true);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryGreen,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: Text('retry'.tr(lang)),
                        ),
                      ],
                    ),
                  ),
                )
              : notifications.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                color: isDark
                                    ? AppTheme.darkCard
                                    : AppTheme.primaryGreen.withValues(alpha: 0.08),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.notifications_none_rounded,
                                size: 48,
                                color: AppTheme.primaryGreen,
                              ),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'no_notifications'.tr(lang),
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: isDark ? Colors.white : AppTheme.textDarkNavy,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  : RefreshIndicator(
                      color: AppTheme.primaryGreen,
                      onRefresh: () async {
                        await ref
                            .read(notificationsProvider.notifier)
                            .fetchNotifications(forceRefresh: true);
                      },
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        itemCount: notifications.length,
                        itemBuilder: (context, index) {
                          final n = notifications[index];
                          final isRead = n.read;
                          final id = n.id;
                          final timeFormatted =
                              DateFormat('MMM d, h:mm a').format(n.createdAt.toLocal());

                          return Dismissible(
                            key: Key(id),
                            direction: DismissDirection.endToStart,
                            background: Container(
                              alignment: Alignment.centerRight,
                              padding: const EdgeInsets.only(right: 20),
                              margin: const EdgeInsets.only(bottom: 12),
                              decoration: BoxDecoration(
                                color: const Color(0xFFD32F2F),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Icon(Icons.delete_outline_rounded,
                                  color: Colors.white, size: 24),
                            ),
                            onDismissed: (_) {
                              ref.read(notificationsProvider.notifier).deleteNotification(id);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('notification_deleted'.tr(lang)),
                                    duration: const Duration(seconds: 2),
                                  ),
                                );
                              }
                            },
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              decoration: BoxDecoration(
                                color: isDark
                                    ? (isRead
                                        ? AppTheme.darkCard
                                        : AppTheme.primaryGreen.withValues(alpha: 0.12))
                                    : (isRead ? Colors.white : const Color(0xFFE8F5E9)),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: isDark
                                      ? (isRead
                                          ? Colors.white10
                                          : AppTheme.primaryGreen.withValues(alpha: 0.3))
                                      : (isRead
                                          ? Colors.black.withValues(alpha: 0.06)
                                          : AppTheme.primaryGreen.withValues(alpha: 0.3)),
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.02),
                                    blurRadius: 4,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: ListTile(
                                contentPadding:
                                    const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                leading: CircleAvatar(
                                  radius: 20,
                                  backgroundColor: _getIconColor(n.type).withValues(alpha: 0.14),
                                  child: Icon(
                                    _getIconForType(n.type),
                                    color: _getIconColor(n.type),
                                    size: 20,
                                  ),
                                ),
                                title: Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        n.title,
                                        style: TextStyle(
                                          fontWeight: isRead ? FontWeight.w600 : FontWeight.w800,
                                          fontSize: 14,
                                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                        ),
                                      ),
                                    ),
                                    if (!isRead)
                                      Container(
                                        width: 8,
                                        height: 8,
                                        decoration: const BoxDecoration(
                                          color: AppTheme.primaryGreen,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                  ],
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const SizedBox(height: 4),
                                    Text(
                                      n.message,
                                      style: TextStyle(
                                        fontSize: 12.5,
                                        color: isDark ? Colors.white70 : AppTheme.textMutedGray,
                                      ),
                                    ),
                                    if (timeFormatted.isNotEmpty) ...[
                                      const SizedBox(height: 6),
                                      Text(
                                        timeFormatted,
                                        style: TextStyle(
                                          fontSize: 10.5,
                                          color: isDark ? Colors.white38 : Colors.grey.shade500,
                                        ),
                                      ),
                                    ],
                                    if (n.relatedId != null && n.relatedId!.isNotEmpty) ...[
                                      const SizedBox(height: 10),
                                      Row(
                                        children: [
                                          ElevatedButton.icon(
                                            onPressed: () => _handleNotificationTap(n, lang),
                                            icon: const Icon(Icons.arrow_forward_rounded, size: 16),
                                            label: Text(
                                              (n.type ?? '').toUpperCase().contains('BROADCAST') || (n.type ?? '').toUpperCase().contains('ADMIN')
                                                  ? 'View Announcement'
                                                  : ((n.type ?? '').toUpperCase() == 'CHAT_MESSAGE'
                                                      ? 'reply'.tr(lang)
                                                      : 'open_chat'.tr(lang)),
                                              style: const TextStyle(
                                                  fontWeight: FontWeight.bold, fontSize: 12),
                                            ),
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: AppTheme.primaryGreen,
                                              foregroundColor: Colors.white,
                                              padding: const EdgeInsets.symmetric(
                                                  horizontal: 12, vertical: 6),
                                              minimumSize: const Size(0, 32),
                                              shape: RoundedRectangleBorder(
                                                  borderRadius: BorderRadius.circular(8)),
                                              elevation: 0,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ],
                                ),
                                onTap: () => _handleNotificationTap(n, lang),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
    );
  }

  IconData _getIconForType(String? type) {
    final t = (type ?? '').toUpperCase();
    if (t.contains('BROADCAST')) return Icons.campaign_rounded;
    if (t.contains('ADMIN')) return Icons.admin_panel_settings_rounded;
    switch (type) {
      case 'SUCCESS':
        return Icons.check_circle_rounded;
      case 'WARNING':
        return Icons.warning_amber_rounded;
      case 'BOOKING_REQUEST':
      case 'BOOKING_UPDATE':
      case 'BOOKING':
        return Icons.receipt_long_rounded;
      case 'CHAT_MESSAGE':
        return Icons.chat_rounded;
      case 'AI':
        return Icons.smart_toy_rounded;
      case 'WEATHER_ALERT':
        return Icons.cloud_outlined;
      case 'AGRONOMIC_ALERT':
        return Icons.eco_rounded;
      default:
        return Icons.notifications_rounded;
    }
  }

  Color _getIconColor(String? type) {
    final t = (type ?? '').toUpperCase();
    if (t.contains('BROADCAST')) return const Color(0xFF2563EB);
    if (t.contains('ADMIN')) return const Color(0xFF7C3AED);
    switch (type) {
      case 'SUCCESS':
        return const Color(0xFF2E7D32);
      case 'WARNING':
        return const Color(0xFFF57C00);
      case 'BOOKING_REQUEST':
      case 'BOOKING_UPDATE':
      case 'BOOKING':
        return const Color(0xFF1976D2);
      case 'CHAT_MESSAGE':
        return AppTheme.primaryGreen;
      case 'AI':
        return const Color(0xFF7B1FA2);
      case 'WEATHER_ALERT':
        return Colors.blue;
      case 'AGRONOMIC_ALERT':
        return Colors.green;
      default:
        return AppTheme.primaryGreen;
    }
  }
}
