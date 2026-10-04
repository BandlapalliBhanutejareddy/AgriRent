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

  ChatMessage({
    required this.id,
    required this.bookingId,
    required this.senderId,
    required this.text,
    required this.read,
    required this.createdAt,
    this.sender,
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
      sender: json['sender'] != null && json['sender'] is Map<String, dynamic>
          ? ChatSender.fromJson(json['sender'] as Map<String, dynamic>)
          : null,
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
    };
  }
}
