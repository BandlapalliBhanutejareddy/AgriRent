import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/errors/api_error_handler.dart';
import '../../../core/storage/secure_storage.dart';

class Notification {
  final String id;
  final String title;
  final String message;
  final bool read;
  final String? type;
  final String? relatedId;
  final String? priority;
  final String? category;
  final DateTime? readAt;
  final DateTime? viewedAt;
  final DateTime createdAt;

  Notification({
    required this.id,
    required this.title,
    required this.message,
    required this.read,
    this.type,
    this.relatedId,
    this.priority,
    this.category,
    this.readAt,
    this.viewedAt,
    required this.createdAt,
  });

  Notification copyWith({
    String? id,
    String? title,
    String? message,
    bool? read,
    String? type,
    String? relatedId,
    String? priority,
    String? category,
    DateTime? readAt,
    DateTime? viewedAt,
    DateTime? createdAt,
  }) {
    return Notification(
      id: id ?? this.id,
      title: title ?? this.title,
      message: message ?? this.message,
      read: read ?? this.read,
      type: type ?? this.type,
      relatedId: relatedId ?? this.relatedId,
      priority: priority ?? this.priority,
      category: category ?? this.category,
      readAt: readAt ?? this.readAt,
      viewedAt: viewedAt ?? this.viewedAt,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  factory Notification.fromJson(Map<String, dynamic> json) {
    // 1. Exact Admin Title Resolution with safe precedence
    String rawTitle = '';
    if (json['title'] != null && json['title'].toString().trim().isNotEmpty) {
      rawTitle = json['title'].toString().trim();
    } else if (json['subject'] != null && json['subject'].toString().trim().isNotEmpty) {
      rawTitle = json['subject'].toString().trim();
    } else if (json['headline'] != null && json['headline'].toString().trim().isNotEmpty) {
      rawTitle = json['headline'].toString().trim();
    } else if (json['notification'] is Map && json['notification']['title'] != null) {
      rawTitle = json['notification']['title'].toString().trim();
    } else if (json['data'] is Map && json['data']['title'] != null) {
      rawTitle = json['data']['title'].toString().trim();
    }

    // 2. Exact Admin Message Resolution with safe precedence (never generic fallback)
    String rawMessage = '';
    if (json['message'] != null && json['message'].toString().trim().isNotEmpty) {
      rawMessage = json['message'].toString().trim();
    } else if (json['body'] != null && json['body'].toString().trim().isNotEmpty) {
      rawMessage = json['body'].toString().trim();
    } else if (json['description'] != null && json['description'].toString().trim().isNotEmpty) {
      rawMessage = json['description'].toString().trim();
    } else if (json['content'] != null && json['content'].toString().trim().isNotEmpty) {
      rawMessage = json['content'].toString().trim();
    } else if (json['notification'] is Map && json['notification']['body'] != null) {
      rawMessage = json['notification']['body'].toString().trim();
    } else if (json['data'] is Map && json['data']['message'] != null) {
      rawMessage = json['data']['message'].toString().trim();
    } else if (json['data'] is Map && json['data']['body'] != null) {
      rawMessage = json['data']['body'].toString().trim();
    }

    // 3. Normalized Priority
    String rawPriority = json['priority']?.toString().toUpperCase().trim() ?? 'NORMAL';
    if (!['NORMAL', 'HIGH', 'URGENT'].contains(rawPriority)) {
      rawPriority = 'NORMAL';
    }

    // 4. Human-readable Category (guard against internal IDs like bc_...)
    String? rawCategory;
    final catVal = json['category']?.toString().trim();
    if (catVal != null && catVal.isNotEmpty && !catVal.startsWith('bc_') && !catVal.startsWith('notif_')) {
      rawCategory = catVal;
    }

    return Notification(
      id: json['id']?.toString() ?? '',
      title: rawTitle,
      message: rawMessage,
      read: json['read'] == true,
      type: json['type']?.toString(),
      relatedId: json['relatedId']?.toString(),
      priority: rawPriority,
      category: rawCategory,
      readAt: json['readAt'] != null
          ? DateTime.tryParse(json['readAt'].toString())
          : null,
      viewedAt: json['viewedAt'] != null
          ? DateTime.tryParse(json['viewedAt'].toString())
          : null,
      createdAt: json['createdAt'] != null
          ? (DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now())
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'message': message,
      'read': read,
      'type': type,
      'relatedId': relatedId,
      'priority': priority,
      'category': category,
      'readAt': readAt?.toIso8601String(),
      'viewedAt': viewedAt?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

class NotificationRepository {
  final ApiClient _apiClient = ApiClient();

  /// Fetches real notifications from the backend, sorted in chronological order (newest first).
  Future<List<Notification>> fetchNotifications() async {
    try {
      final response = await _apiClient.dio.get(ApiConstants.notifications);
      final dynamic raw = response.data;
      final List<dynamic> data = raw is List
          ? raw
          : (raw is Map && raw['data'] is List
              ? raw['data']
              : (raw is Map && raw['notifications'] is List ? raw['notifications'] : []));
      
      final list = data
          .whereType<Map>()
          .map((e) => Notification.fromJson(Map<String, dynamic>.from(e)))
          .toList();

      // Ensure chronological ordering: newest first
      list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return list;
    } catch (e) {
      // Cluster fallback if primary network had an issue or awaiting deploy
      try {
        final clusterCandidates = ['http://127.0.0.1:4000/api/notifications', 'http://10.110.136.66:4000/api/notifications'];
        for (final url in clusterCandidates) {
          try {
            final token = await SecureStorage.getAccessToken();
            final res = await Dio(BaseOptions(
              connectTimeout: const Duration(seconds: 4),
              headers: token != null ? {'Authorization': 'Bearer $token'} : null,
            )).get(url);
            final dynamic raw = res.data;
            final List<dynamic> data = raw is List
                ? raw
                : (raw is Map && raw['data'] is List
                    ? raw['data']
                    : (raw is Map && raw['notifications'] is List ? raw['notifications'] : []));
            final list = data
                .whereType<Map>()
                .map((e) => Notification.fromJson(Map<String, dynamic>.from(e)))
                .toList();
            list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
            return list;
          } catch (_) {}
        }
      } catch (_) {}
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  /// Fetches unacknowledged announcements for offline users logging in.
  Future<List<Notification>> fetchPendingAnnouncements() async {
    try {
      final response = await _apiClient.dio.get('${ApiConstants.notifications}/pending-announcements');
      final dynamic raw = response.data;
      final List<dynamic> data = raw is Map && raw['announcements'] is List
          ? raw['announcements']
          : (raw is List ? raw : []);

      return data
          .whereType<Map>()
          .map((e) => Notification.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } catch (_) {
      // Fallback to filtering standard notifications
      final all = await fetchNotifications();
      return all.where((n) => !n.read && (n.type == 'ADMIN_BROADCAST' || n.type == 'ADMIN_ALERT')).toList();
    }
  }

  /// Marks a specific notification as viewed on the backend (read receipt).
  Future<void> markAsViewed(String id) async {
    try {
      await _apiClient.dio.put('${ApiConstants.notifications}/$id/viewed');
    } catch (_) {}
  }

  /// Marks a specific notification as read on the backend.
  Future<void> markAsRead(String id) async {
    try {
      await _apiClient.dio.put('${ApiConstants.notifications}/$id/read');
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  /// Marks all notifications for the authenticated user as read on the backend.
  Future<void> markAllAsRead() async {
    try {
      await _apiClient.dio.put('${ApiConstants.notifications}/read-all');
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  /// Deletes a specific notification on the backend.
  Future<void> deleteNotification(String id) async {
    try {
      await _apiClient.dio.delete('${ApiConstants.notifications}/$id');
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }
}
