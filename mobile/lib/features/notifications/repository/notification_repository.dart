import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/errors/api_error_handler.dart';

class Notification {
  final String id;
  final String title;
  final String message;
  final bool read;
  final String? type;
  final String? relatedId;
  final DateTime createdAt;

  Notification({
    required this.id,
    required this.title,
    required this.message,
    required this.read,
    this.type,
    this.relatedId,
    required this.createdAt,
  });

  Notification copyWith({
    String? id,
    String? title,
    String? message,
    bool? read,
    String? type,
    String? relatedId,
    DateTime? createdAt,
  }) {
    return Notification(
      id: id ?? this.id,
      title: title ?? this.title,
      message: message ?? this.message,
      read: read ?? this.read,
      type: type ?? this.type,
      relatedId: relatedId ?? this.relatedId,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  factory Notification.fromJson(Map<String, dynamic> json) {
    return Notification(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
      read: json['read'] == true,
      type: json['type']?.toString(),
      relatedId: json['relatedId']?.toString(),
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
      throw Exception(ApiErrorHandler.getMessage(e));
    }
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
