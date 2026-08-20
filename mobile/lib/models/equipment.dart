import 'user.dart';

class Equipment {
  final String id;
  final String category;
  final String description;
  final double pricePerDay;
  final String imageUrl;
  final String ownerId;
  final bool available;
  final String title;
  final String? location;
  final double? latitude;
  final double? longitude;
  final User? owner;

  Equipment({
    required this.id,
    required this.category,
    required this.description,
    required this.pricePerDay,
    required this.imageUrl,
    required this.ownerId,
    required this.available,
    required this.title,
    this.location,
    this.latitude,
    this.longitude,
    this.owner,
  });

  factory Equipment.fromJson(Map<String, dynamic> json) {
    return Equipment(
      id: json['id'] ?? '',
      category: json['category'] ?? '',
      description: json['description'] ?? '',
      pricePerDay: (json['pricePerDay'] ?? 0).toDouble(),
      imageUrl: json['imageUrl'] ?? '',
      ownerId: json['ownerId'] ?? '',
      available: json['available'] ?? true,
      title: json['title'] ?? '',
      location: json['location'],
      latitude: json['latitude'] != null ? (json['latitude']).toDouble() : null,
      longitude: json['longitude'] != null ? (json['longitude']).toDouble() : null,
      owner: json['owner'] != null ? User.fromJson(json['owner']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'category': category,
      'description': description,
      'pricePerDay': pricePerDay,
      'imageUrl': imageUrl,
      'ownerId': ownerId,
      'available': available,
      'title': title,
      'location': location,
      'latitude': latitude,
      'longitude': longitude,
      'owner': owner?.toJson(),
    };
  }
}
