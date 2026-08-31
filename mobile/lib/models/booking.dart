import 'user.dart';
import 'equipment.dart';

class Booking {
  final String id;
  final String farmerId;
  final String equipmentId;
  final DateTime startDate;
  final DateTime endDate;
  final String status;
  final double? totalPrice;
  final String paymentStatus;
  
  final User? farmer;
  final Equipment? equipment;
  final List<dynamic>? payments;

  Booking({
    required this.id,
    required this.farmerId,
    required this.equipmentId,
    required this.startDate,
    required this.endDate,
    required this.status,
    this.totalPrice,
    required this.paymentStatus,
    this.farmer,
    this.equipment,
    this.payments,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['id'] ?? '',
      farmerId: json['farmerId'] ?? '',
      equipmentId: json['equipmentId'] ?? '',
      startDate: DateTime.parse(json['startDate']),
      endDate: DateTime.parse(json['endDate']),
      status: json['status'] ?? 'PENDING',
      totalPrice: json['totalPrice']?.toDouble(),
      paymentStatus: json['paymentStatus'] ?? 'PENDING',
      farmer: json['farmer'] != null ? User.fromJson(json['farmer']) : null,
      equipment: json['equipment'] != null ? Equipment.fromJson(json['equipment']) : null,
      payments: json['payments'] != null ? List<dynamic>.from(json['payments']) : [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'farmerId': farmerId,
      'equipmentId': equipmentId,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'status': status,
      'totalPrice': totalPrice,
      'paymentStatus': paymentStatus,
    };
  }
}
