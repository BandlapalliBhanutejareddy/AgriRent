import 'user.dart';
import 'equipment.dart';

class BookingStatusHistory {
  final String id;
  final String bookingId;
  final String status;
  final String title;
  final String? note;
  final DateTime createdAt;

  BookingStatusHistory({
    required this.id,
    required this.bookingId,
    required this.status,
    required this.title,
    this.note,
    required this.createdAt,
  });

  factory BookingStatusHistory.fromJson(dynamic raw) {
    if (raw is! Map) {
      return BookingStatusHistory(
        id: '',
        bookingId: '',
        status: '',
        title: '',
        createdAt: DateTime.now(),
      );
    }
    final json = Map<String, dynamic>.from(raw);
    DateTime created;
    try {
      created = json['createdAt'] != null
          ? (DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now())
          : DateTime.now();
    } catch (_) {
      created = DateTime.now();
    }
    return BookingStatusHistory(
      id: json['id']?.toString() ?? '',
      bookingId: json['bookingId']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      note: json['note']?.toString(),
      createdAt: created,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'bookingId': bookingId,
      'status': status,
      'title': title,
      'note': note,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

class ReturnInspection {
  final String id;
  final String bookingId;
  final String condition;
  final double deductionAmount;
  final String? notes;
  final DateTime createdAt;

  ReturnInspection({
    required this.id,
    required this.bookingId,
    required this.condition,
    required this.deductionAmount,
    this.notes,
    required this.createdAt,
  });

  factory ReturnInspection.fromJson(dynamic raw) {
    if (raw is! Map) {
      return ReturnInspection(
        id: '',
        bookingId: '',
        condition: 'GOOD',
        deductionAmount: 0.0,
        notes: null,
        createdAt: DateTime.now(),
      );
    }
    final json = Map<String, dynamic>.from(raw);
    DateTime created;
    try {
      created = json['createdAt'] != null
          ? (DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now())
          : DateTime.now();
    } catch (_) {
      created = DateTime.now();
    }
    return ReturnInspection(
      id: json['id']?.toString() ?? '',
      bookingId: json['bookingId']?.toString() ?? '',
      condition: json['condition']?.toString() ?? 'GOOD',
      deductionAmount: json['deductionAmount'] != null
          ? double.tryParse(json['deductionAmount'].toString()) ?? 0.0
          : 0.0,
      notes: json['notes']?.toString(),
      createdAt: created,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'bookingId': bookingId,
      'condition': condition,
      'deductionAmount': deductionAmount,
      'notes': notes,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

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
  final List<BookingStatusHistory> statusHistory;
  final ReturnInspection? returnInspection;

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
    this.statusHistory = const [],
    this.returnInspection,
  });

  // Financial Invariants & Calculations
  double get outstandingBalance {
    if (status == 'CANCELLED' || status == 'REJECTED' || paymentStatus == 'PAID' || paymentStatus == 'CANCELLED') {
      return 0.0;
    }
    final total = totalPrice ?? 0.0;
    final paid = amountPaid ?? 0.0;
    return (total - paid).clamp(0.0, double.infinity);
  }

  bool get isPaid => paymentStatus == 'PAID' || paymentStatus == 'SUCCESS' || paymentStatus == 'COMPLETED';

  // Authoritative Lifecycle Eligibility Rules
  bool get isFarmerCancellable => status == 'PENDING' || status == 'ACCEPTED';
  bool get isFarmerReturnable => status == 'ACTIVE' || status == 'DELIVERED';

  bool get isOwnerAcceptable => status == 'PENDING';
  bool get isOwnerRejectable => status == 'PENDING';
  bool get isOwnerDispatchable => status == 'ACCEPTED' || status == 'CONFIRMED';
  bool get isOwnerActivable =>
      status == 'ACCEPTED' || status == 'CONFIRMED' || status == 'DISPATCHED' || status == 'OUT_FOR_DELIVERY' || status == 'IN_TRANSIT';
  bool get isOwnerReturnInspectable =>
      status == 'RETURN_PENDING' || status == 'RETURN_IN_PROGRESS' || status == 'RETURNED' || status == 'INSPECTION_PENDING';
  bool get isOwnerCompletable =>
      status == 'RETURN_PENDING' || status == 'RETURNED' || status == 'INSPECTION_PENDING' || status == 'ACTIVE';

  bool get isTerminal => status == 'COMPLETED' || status == 'CANCELLED' || status == 'REJECTED';

  Booking copyWith({
    String? id,
    String? farmerId,
    String? equipmentId,
    DateTime? startDate,
    DateTime? endDate,
    String? status,
    double? totalPrice,
    String? paymentStatus,
    double? amountPaid,
    double? securityDeposit,
    User? farmer,
    Equipment? equipment,
    List<dynamic>? payments,
    List<BookingStatusHistory>? statusHistory,
    ReturnInspection? returnInspection,
  }) {
    return Booking(
      id: id ?? this.id,
      farmerId: farmerId ?? this.farmerId,
      equipmentId: equipmentId ?? this.equipmentId,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      status: status ?? this.status,
      totalPrice: totalPrice ?? this.totalPrice,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      amountPaid: amountPaid ?? this.amountPaid,
      securityDeposit: securityDeposit ?? this.securityDeposit,
      farmer: farmer ?? this.farmer,
      equipment: equipment ?? this.equipment,
      payments: payments ?? this.payments,
      statusHistory: statusHistory ?? this.statusHistory,
      returnInspection: returnInspection ?? this.returnInspection,
    );
  }

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

    List<BookingStatusHistory> historyList = [];
    final rawHistory = json['bookingStatusHistory'] ?? json['statusHistory'] ?? json['history'];
    if (rawHistory is List) {
      historyList = rawHistory
          .whereType<Map>()
          .map((item) => BookingStatusHistory.fromJson(item))
          .toList();
    }

    ReturnInspection? inspection;
    final rawInspection = json['returnInspection'] ?? json['inspection'];
    if (rawInspection is Map) {
      inspection = ReturnInspection.fromJson(rawInspection);
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
      statusHistory: historyList,
      returnInspection: inspection,
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
      'statusHistory': statusHistory.map((h) => h.toJson()).toList(),
      if (returnInspection != null) 'returnInspection': returnInspection!.toJson(),
    };
  }
}
