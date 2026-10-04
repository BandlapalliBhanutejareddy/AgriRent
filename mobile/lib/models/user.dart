class User {
  final String id;
  final String name;
  final String email;
  final String role; // FARMER, OWNER, ADMIN, ENTREPRENEUR
  final String? phone;
  final String? profileImage;
  final String preferredLanguage;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.phone,
    this.profileImage,
    required this.preferredLanguage,
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
    };
  }
}
