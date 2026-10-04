import 'user.dart';

class Equipment {
  final String id;
  final String category;
  final String description;
  final double? pricePerDay;
  final String imageUrl;
  final String ownerId;
  final bool available;
  final String title;
  final String? location;
  final double? latitude;
  final double? longitude;
  final User? owner;
  final double? rating;
  final int? reviewCount;
  final double? securityDeposit;

  Equipment({
    required this.id,
    required this.category,
    required this.description,
    this.pricePerDay,
    required this.imageUrl,
    required this.ownerId,
    required this.available,
    required this.title,
    this.location,
    this.latitude,
    this.longitude,
    this.owner,
    this.rating,
    this.reviewCount,
    this.securityDeposit,
  });

  factory Equipment.fromJson(dynamic raw) {
    if (raw is! Map) {
      return Equipment(
        id: '',
        category: '',
        description: '',
        imageUrl: '',
        ownerId: '',
        available: true,
        title: '',
      );
    }
    final json = Map<String, dynamic>.from(raw);
    return Equipment(
      id: json['id']?.toString() ?? '',
      category: json['category']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      pricePerDay: json['pricePerDay'] != null ? double.tryParse(json['pricePerDay'].toString()) : null,
      imageUrl: json['imageUrl']?.toString() ?? '',
      ownerId: json['ownerId']?.toString() ?? '',
      available: json['available'] == true || json['available'] == 'true' || json['available'] == 1,
      title: json['title']?.toString() ?? '',
      location: json['location']?.toString(),
      latitude: json['latitude'] != null ? double.tryParse(json['latitude'].toString()) : null,
      longitude: json['longitude'] != null ? double.tryParse(json['longitude'].toString()) : null,
      owner: json['owner'] is Map ? User.fromJson(json['owner']) : null,
      rating: json['rating'] != null ? double.tryParse(json['rating'].toString()) : null,
      reviewCount: json['reviewCount'] != null ? int.tryParse(json['reviewCount'].toString()) : null,
      securityDeposit: json['securityDeposit'] != null ? double.tryParse(json['securityDeposit'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'category': category,
      'description': description,
      if (pricePerDay != null) 'pricePerDay': pricePerDay,
      'imageUrl': imageUrl,
      'ownerId': ownerId,
      'available': available,
      'title': title,
      'location': location,
      'latitude': latitude,
      'longitude': longitude,
      'owner': owner?.toJson(),
      'rating': rating,
      'reviewCount': reviewCount,
      'securityDeposit': securityDeposit,
    };
  }
}
