class PaymentRecord {
  final String id;
  final String transactionRef;
  final String bookingId;
  final String equipmentId;
  final String equipmentTitle;
  final String equipmentCategory;
  final String? equipmentImageUrl;
  final String ownerName;
  final String farmerName;
  final DateTime paymentDate;
  final DateTime startDate;
  final DateTime endDate;
  final double amount;
  final double totalPrice;
  final String currency;
  final String paymentStatus;
  final String paymentMethod;
  final String status;
  final bool hasReceipt;

  PaymentRecord({
    required this.id,
    required this.transactionRef,
    required this.bookingId,
    required this.equipmentId,
    required this.equipmentTitle,
    required this.equipmentCategory,
    this.equipmentImageUrl,
    required this.ownerName,
    required this.farmerName,
    required this.paymentDate,
    required this.startDate,
    required this.endDate,
    required this.amount,
    required this.totalPrice,
    required this.currency,
    required this.paymentStatus,
    required this.paymentMethod,
    required this.status,
    required this.hasReceipt,
  });

  factory PaymentRecord.fromJson(Map<String, dynamic> json) {
    return PaymentRecord(
      id: json['id']?.toString() ?? '',
      transactionRef: json['transactionRef']?.toString() ?? (json['id']?.toString() ?? ''),
      bookingId: json['bookingId']?.toString() ?? '',
      equipmentId: json['equipmentId']?.toString() ?? '',
      equipmentTitle: json['equipmentTitle']?.toString() ?? 'Equipment',
      equipmentCategory: json['equipmentCategory']?.toString() ?? 'TRACTOR',
      equipmentImageUrl: json['equipmentImageUrl']?.toString(),
      ownerName: json['ownerName']?.toString() ?? 'Equipment Owner',
      farmerName: json['farmerName']?.toString() ?? 'Farmer',
      paymentDate: json['paymentDate'] != null ? DateTime.parse(json['paymentDate']) : DateTime.now(),
      startDate: json['startDate'] != null ? DateTime.parse(json['startDate']) : DateTime.now(),
      endDate: json['endDate'] != null ? DateTime.parse(json['endDate']) : DateTime.now(),
      amount: (json['amount'] is num) ? (json['amount'] as num).toDouble() : 0.0,
      totalPrice: (json['totalPrice'] is num) ? (json['totalPrice'] as num).toDouble() : 0.0,
      currency: json['currency']?.toString() ?? 'INR',
      paymentStatus: (json['paymentStatus']?.toString() ?? 'PENDING').toUpperCase(),
      paymentMethod: json['paymentMethod']?.toString() ?? 'AGRORENT_DIRECT',
      status: (json['status']?.toString() ?? 'PENDING').toUpperCase(),
      hasReceipt: json['hasReceipt'] == true,
    );
  }
}
