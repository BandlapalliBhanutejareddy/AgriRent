import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/api/api_client.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../shared/theme/app_theme.dart';
import '../providers/notification_provider.dart';

class NotificationScreen extends ConsumerStatefulWidget {
  const NotificationScreen({super.key});

  @override
  ConsumerState<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends ConsumerState<NotificationScreen> {
  List<dynamic> _notifications = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
  }

  Future<void> _fetchNotifications() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final res = await ApiClient().dio.get('/notifications');
      final dynamic raw = res.data;
      final List<dynamic> list = raw is List
          ? raw
          : (raw is Map && raw['data'] is List
              ? raw['data']
              : (raw is Map && raw['notifications'] is List
                  ? raw['notifications']
                  : []));

      if (mounted) {
        setState(() {
          _notifications = list;
          _isLoading = false;
        });
        ref.read(unreadNotificationsCountProvider.notifier).refresh();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _markAsRead(String id) async {
    try {
      await ApiClient().dio.put('/notifications/$id/read');
      if (mounted) {
        setState(() {
          final idx = _notifications.indexWhere((n) => n['id'] == id);
          if (idx != -1 && _notifications[idx] is Map) {
            _notifications[idx]['read'] = true;
          }
        });
        ref.read(unreadNotificationsCountProvider.notifier).decrement();
      }
    } catch (_) {}
  }

  Future<void> _markAllAsRead() async {
    try {
      await ApiClient().dio.put('/notifications/read-all');
      if (mounted) {
        setState(() {
          for (var n in _notifications) {
            if (n is Map) {
              n['read'] = true;
            }
          }
        });
        ref.read(unreadNotificationsCountProvider.notifier).reset();
      }
    } catch (_) {}
  }

  Future<void> _deleteNotification(String id) async {
    try {
      await ApiClient().dio.delete('/notifications/$id');
      if (mounted) {
        setState(() {
          _notifications.removeWhere((n) => n['id'] == id);
        });
        ref.read(unreadNotificationsCountProvider.notifier).refresh();
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

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
          if (_notifications.any((n) => n is Map && n['read'] == false))
            IconButton(
              icon: const Icon(Icons.done_all_rounded, color: AppTheme.primaryGreen),
              onPressed: _markAllAsRead,
              tooltip: 'mark_all_read'.tr(lang),
            ),
          const SizedBox(width: 4),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primaryGreen),
            )
          : _error != null && _notifications.isEmpty
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
                          onPressed: _fetchNotifications,
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
              : _notifications.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                color: isDark ? AppTheme.darkCard : AppTheme.primaryGreen.withValues(alpha: 0.08),
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
                      onRefresh: _fetchNotifications,
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        itemCount: _notifications.length,
                        itemBuilder: (context, index) {
                          final n = _notifications[index];
                          if (n is! Map) return const SizedBox.shrink();
                          final isRead = n['read'] == true;
                          final id = n['id']?.toString() ?? '$index';
                          final title = n['title']?.toString() ?? '';
                          final message = n['message']?.toString() ?? '';
                          final type = n['type']?.toString();
                          final createdAtStr = n['createdAt']?.toString();
                          String timeFormatted = '';
                          if (createdAtStr != null) {
                            try {
                              final dt = DateTime.parse(createdAtStr);
                              timeFormatted = DateFormat('MMM d, h:mm a').format(dt.toLocal());
                            } catch (_) {}
                          }

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
                              child: const Icon(Icons.delete_outline_rounded, color: Colors.white, size: 24),
                            ),
                            onDismissed: (_) => _deleteNotification(id),
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              decoration: BoxDecoration(
                                color: isDark
                                    ? (isRead ? AppTheme.darkCard : AppTheme.primaryGreen.withValues(alpha: 0.12))
                                    : (isRead ? Colors.white : const Color(0xFFE8F5E9)),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: isDark
                                      ? (isRead ? Colors.white10 : AppTheme.primaryGreen.withValues(alpha: 0.3))
                                      : (isRead ? Colors.black.withValues(alpha: 0.06) : AppTheme.primaryGreen.withValues(alpha: 0.3)),
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
                                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                leading: CircleAvatar(
                                  radius: 20,
                                  backgroundColor: _getIconColor(type).withValues(alpha: 0.14),
                                  child: Icon(
                                    _getIconForType(type),
                                    color: _getIconColor(type),
                                    size: 20,
                                  ),
                                ),
                                title: Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        title,
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
                                      message,
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
                                  ],
                                ),
                                onTap: () {
                                  if (!isRead) _markAsRead(id);
                                },
                              ),
                            ),
                          );
                        },
                      ),
                    ),
    );
  }

  IconData _getIconForType(String? type) {
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
      default:
        return Icons.notifications_rounded;
    }
  }

  Color _getIconColor(String? type) {
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
      default:
        return AppTheme.primaryGreen;
    }
  }
}
