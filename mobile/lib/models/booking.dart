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
  final double? amountPaid;
  final double? securityDeposit;

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
    this.amountPaid,
    this.securityDeposit,
    this.farmer,
    this.equipment,
    this.payments,
  });

  factory Booking.fromJson(dynamic raw) {
    if (raw is! Map) {
      return Booking(
        id: '',
        farmerId: '',
        equipmentId: '',
        startDate: DateTime.now(),
        endDate: DateTime.now(),
        status: 'PENDING',
        paymentStatus: 'PENDING',
      );
    }
    final json = Map<String, dynamic>.from(raw);
    DateTime start;
    try {
      start = json['startDate'] != null
          ? (DateTime.tryParse(json['startDate'].toString()) ?? DateTime.now())
          : DateTime.now();
    } catch (_) {
      start = DateTime.now();
    }
    DateTime end;
    try {
      end = json['endDate'] != null
          ? (DateTime.tryParse(json['endDate'].toString()) ?? DateTime.now())
          : DateTime.now();
    } catch (_) {
      end = DateTime.now();
    }

    return Booking(
      id: json['id']?.toString() ?? '',
      farmerId: json['farmerId']?.toString() ?? '',
      equipmentId: json['equipmentId']?.toString() ?? '',
      startDate: start,
      endDate: end,
      status: json['status']?.toString() ?? 'PENDING',
      totalPrice: json['totalPrice'] != null
          ? double.tryParse(json['totalPrice'].toString())
          : null,
      paymentStatus: json['paymentStatus']?.toString() ?? 'PENDING',
      amountPaid: json['amountPaid'] != null
          ? double.tryParse(json['amountPaid'].toString()) ?? 0.0
          : 0.0,
      securityDeposit: json['securityDeposit'] != null
          ? double.tryParse(json['securityDeposit'].toString())
          : null,
      farmer: json['farmer'] is Map ? User.fromJson(json['farmer']) : null,
      equipment: json['equipment'] is Map ? Equipment.fromJson(Map<String, dynamic>.from(json['equipment'])) : null,
      payments: json['payments'] is List ? List<dynamic>.from(json['payments']) : [],
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
      'amountPaid': amountPaid,
      'securityDeposit': securityDeposit,
    };
  }
}
