class User {
  final String id;
  final String name;
  final String email;
  final String role; // FARMER, OWNER, ADMIN
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

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'FARMER',
      phone: json['phone'],
      profileImage: json['profileImage'],
      preferredLanguage: json['preferredLanguage'] ?? 'en',
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
