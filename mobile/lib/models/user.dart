class User {
  final String id;
  final String name;
  final String email;
  final String role; // FARMER, OWNER, ADMIN, ENTREPRENEUR
  final String? phone;
  final String? profileImage;
  final String preferredLanguage;
  final bool isSuspended;
  final bool isVerified;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.phone,
    this.profileImage,
    required this.preferredLanguage,
    this.isSuspended = false,
    this.isVerified = false,
  });

  factory User.fromJson(dynamic raw) {
    if (raw is! Map) {
      return User(
        id: '',
        name: '',
        email: '',
        role: '',
        preferredLanguage: 'en',
      );
    }
    final rawMap = Map<String, dynamic>.from(raw);
    final json = (rawMap['data'] is Map)
        ? Map<String, dynamic>.from(rawMap['data'] as Map)
        : ((rawMap['user'] is Map)
            ? Map<String, dynamic>.from(rawMap['user'] as Map)
            : rawMap);

    final rawRole = json['role']?.toString().trim().toUpperCase() ?? '';

    return User(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      role: rawRole,
      phone: json['phone']?.toString(),
      profileImage: json['profileImage']?.toString(),
      preferredLanguage: json['preferredLanguage']?.toString() ?? 'en',
      isSuspended: json['isSuspended'] == true,
      isVerified: json['isVerified'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'phone': phone,
      'profileImage': profileImage,
      'preferredLanguage': preferredLanguage,
      'isSuspended': isSuspended,
      'isVerified': isVerified,
    };
  }

  User copyWith({
    String? id,
    String? name,
    String? email,
    String? role,
    String? phone,
    String? profileImage,
    String? preferredLanguage,
    bool? isSuspended,
    bool? isVerified,
  }) {
    return User(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      role: role ?? this.role,
      phone: phone ?? this.phone,
      profileImage: profileImage ?? this.profileImage,
      preferredLanguage: preferredLanguage ?? this.preferredLanguage,
      isSuspended: isSuspended ?? this.isSuspended,
      isVerified: isVerified ?? this.isVerified,
    );
  }
}
