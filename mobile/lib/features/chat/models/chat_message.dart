class ChatSender {
  final String id;
  final String name;
  final String? role;
  final String? profileImage;

  ChatSender({
    required this.id,
    required this.name,
    this.role,
    this.profileImage,
  });

  factory ChatSender.fromJson(Map<String, dynamic> json) {
    return ChatSender(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      role: json['role']?.toString(),
      profileImage: json['profileImage']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'role': role,
      'profileImage': profileImage,
    };
  }
}

class ChatMessage {
  final String id;
  final String bookingId;
  final String senderId;
  final String text;
  final bool read;
  final DateTime createdAt;
  final ChatSender? sender;
  final bool isSending;

  ChatMessage({
    required this.id,
    required this.bookingId,
    required this.senderId,
    required this.text,
    required this.read,
    required this.createdAt,
    this.sender,
    this.isSending = false,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id']?.toString() ?? '',
      bookingId: json['bookingId']?.toString() ?? '',
      senderId: json['senderId']?.toString() ?? '',
      text: json['text']?.toString() ?? '',
      read: json['read'] == true,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      sender: json['sender'] is Map
          ? ChatSender.fromJson(Map<String, dynamic>.from(json['sender'] as Map))
          : null,
      isSending: json['isSending'] == true,
    );
  }

  ChatMessage copyWith({
    String? id,
    String? bookingId,
    String? senderId,
    String? text,
    bool? read,
    DateTime? createdAt,
    ChatSender? sender,
    bool? isSending,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      bookingId: bookingId ?? this.bookingId,
      senderId: senderId ?? this.senderId,
      text: text ?? this.text,
      read: read ?? this.read,
      createdAt: createdAt ?? this.createdAt,
      sender: sender ?? this.sender,
      isSending: isSending ?? this.isSending,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'bookingId': bookingId,
      'senderId': senderId,
      'text': text,
      'read': read,
      'createdAt': createdAt.toIso8601String(),
      'sender': sender?.toJson(),
      'isSending': isSending,
    };
  }
}
