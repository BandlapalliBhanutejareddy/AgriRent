class ScheduleEquipmentModel {
  final String id;
  final String name;
  final String availabilityStatus;

  ScheduleEquipmentModel({
    required this.id,
    required this.name,
    required this.availabilityStatus,
  });

  factory ScheduleEquipmentModel.fromJson(Map<String, dynamic> json) {
    return ScheduleEquipmentModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      availabilityStatus: json['availabilityStatus'] ?? 'UNKNOWN',
    );
  }
}

class ScheduledOperationModel {
  final String operationId;
  final String name;
  final String stage;
  final String status;
  final String plannedStartDate;
  final String plannedEndDate;
  final String priority;
  final int durationDays;
  final String timingStatus;
  final String reason;
  final ScheduleEquipmentModel? equipment;

  ScheduledOperationModel({
    required this.operationId,
    required this.name,
    required this.stage,
    required this.status,
    required this.plannedStartDate,
    this.plannedEndDate = '',
    this.priority = 'MEDIUM',
    this.durationDays = 1,
    this.timingStatus = 'OPTIMAL',
    required this.reason,
    this.equipment,
  });

  DateTime? get parsedStartDate => DateTime.tryParse(plannedStartDate);
  DateTime? get parsedEndDate => DateTime.tryParse(plannedEndDate);

  bool get isCompleted => status.toUpperCase() == 'COMPLETED';
  bool get isInProgress => status.toUpperCase() == 'IN_PROGRESS';

  /// An operation is overdue ONLY if it is not completed and its plannedStartDate is strictly before today.
  /// Undated operations are NEVER classified as overdue.
  bool get isOverdue {
    if (isCompleted) return false;
    final dt = parsedStartDate;
    if (dt == null) return false;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    return dt.isBefore(today);
  }

  factory ScheduledOperationModel.fromJson(Map<String, dynamic> json) {
    return ScheduledOperationModel(
      operationId: json['operationId'] ?? json['id'] ?? '',
      name: json['name'] ?? json['title'] ?? '',
      stage: json['stage'] ?? '',
      status: json['status'] ?? 'PLANNED',
      plannedStartDate: json['plannedStartDate'] ?? json['dueDate'] ?? '',
      plannedEndDate: json['plannedEndDate'] ?? '',
      priority: json['priority'] ?? 'MEDIUM',
      durationDays: json['durationDays'] is int
          ? json['durationDays']
          : (int.tryParse(json['durationDays']?.toString() ?? '1') ?? 1),
      timingStatus: json['timingStatus'] ?? 'OPTIMAL',
      reason: json['reason'] ?? '',
      equipment: json['equipment'] != null
          ? ScheduleEquipmentModel.fromJson(Map<String, dynamic>.from(json['equipment']))
          : null,
    );
  }
}

class MasterScheduleModel {
  final List<ScheduledOperationModel> operations;

  MasterScheduleModel({
    required this.operations,
  });

  factory MasterScheduleModel.fromJson(dynamic rawData) {
    if (rawData is! Map<String, dynamic>) {
      return MasterScheduleModel(operations: []);
    }
    final json = (rawData['data'] is Map<String, dynamic>) ? rawData['data'] as Map<String, dynamic> : rawData;
    final dynamic opsRaw = json['operations'] ?? rawData['operations'];
    final List<dynamic> opsList = opsRaw is List ? opsRaw : [];
    final ops = opsList
        .whereType<Map>()
        .map((e) => ScheduledOperationModel.fromJson(Map<String, dynamic>.from(e)))
        .toList();
    return MasterScheduleModel(operations: ops);
  }
}
