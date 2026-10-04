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
  final String reason;
  final ScheduleEquipmentModel? equipment;

  ScheduledOperationModel({
    required this.operationId,
    required this.name,
    required this.stage,
    required this.status,
    required this.plannedStartDate,
    required this.reason,
    this.equipment,
  });

  factory ScheduledOperationModel.fromJson(Map<String, dynamic> json) {
    return ScheduledOperationModel(
      operationId: json['operationId'] ?? '',
      name: json['name'] ?? '',
      stage: json['stage'] ?? '',
      status: json['status'] ?? 'PLANNED',
      plannedStartDate: json['plannedStartDate'] ?? '',
      reason: json['reason'] ?? '',
      equipment: json['equipment'] != null
          ? ScheduleEquipmentModel.fromJson(json['equipment'])
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
