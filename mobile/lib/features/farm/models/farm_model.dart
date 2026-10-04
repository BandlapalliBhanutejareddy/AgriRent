class FarmModel {
  final String id;
  final String ownerId;
  final String name;
  final String location;
  final double area;
  final String areaUnit;
  final String soilType;
  final List<FarmCropModel> crops;
  final int cropsCount;
  final int activeRisksCount;
  final int activitiesCount;

  FarmModel({
    required this.id,
    required this.ownerId,
    required this.name,
    required this.location,
    required this.area,
    required this.areaUnit,
    required this.soilType,
    this.crops = const [],
    this.cropsCount = 0,
    this.activeRisksCount = 0,
    this.activitiesCount = 0,
  });

  factory FarmModel.fromJson(Map<String, dynamic> rawJson) {
    final json = (rawJson['data'] is Map)
        ? Map<String, dynamic>.from(rawJson['data'] as Map)
        : rawJson;

    var cropsList = json['crops'] as List? ?? [];
    List<FarmCropModel> parsedCrops = cropsList
        .whereType<Map>()
        .map((i) => FarmCropModel.fromJson(Map<String, dynamic>.from(i)))
        .toList();
    
    int cropsCount = 0;
    int activeRisksCount = 0;
    int activitiesCount = 0;
    
    if (json['_count'] != null && json['_count'] is Map) {
      cropsCount = json['_count']['crops'] is num ? (json['_count']['crops'] as num).toInt() : (int.tryParse(json['_count']['crops']?.toString() ?? '') ?? 0);
      activeRisksCount = json['_count']['risks'] is num ? (json['_count']['risks'] as num).toInt() : (int.tryParse(json['_count']['risks']?.toString() ?? '') ?? 0);
      activitiesCount = json['_count']['activities'] is num ? (json['_count']['activities'] as num).toInt() : (int.tryParse(json['_count']['activities']?.toString() ?? '') ?? 0);
    } else {
      cropsCount = parsedCrops.length;
    }

    final dynamic rawArea = json['area'];
    final double parsedArea = rawArea is num
        ? rawArea.toDouble()
        : (double.tryParse(rawArea?.toString() ?? '') ?? 0.0);

    return FarmModel(
      id: json['id']?.toString() ?? '',
      ownerId: json['ownerId']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      location: json['location']?.toString() ?? '',
      area: parsedArea,
      areaUnit: json['areaUnit']?.toString() ?? 'acres',
      soilType: json['soilType']?.toString() ?? '',
      crops: parsedCrops,
      cropsCount: cropsCount,
      activeRisksCount: activeRisksCount,
      activitiesCount: activitiesCount,
    );
  }
}

class FarmCropModel {
  final String id;
  final String farmId;
  final String cropName;
  final String? variety;
  final String season;
  final String stage;
  final String status;

  FarmCropModel({
    required this.id,
    required this.farmId,
    required this.cropName,
    this.variety,
    required this.season,
    required this.stage,
    required this.status,
  });

  factory FarmCropModel.fromJson(Map<String, dynamic> json) {
    return FarmCropModel(
      id: json['id'] ?? '',
      farmId: json['farmId'] ?? '',
      cropName: json['cropName'] ?? '',
      variety: json['variety'],
      season: json['season'] ?? '',
      stage: json['stage'] ?? '',
      status: json['status'] ?? 'ACTIVE',
    );
  }
}

class FarmTaskModel {
  final String id;
  final String operationId;
  final String title;
  final String? description;
  final String status;
  final String priority;
  final DateTime? dueDate;
  final DateTime? completedAt;

  FarmTaskModel({
    required this.id,
    required this.operationId,
    required this.title,
    this.description,
    required this.status,
    required this.priority,
    this.dueDate,
    this.completedAt,
  });

  factory FarmTaskModel.fromJson(Map<String, dynamic> json) {
    return FarmTaskModel(
      id: json['id'] ?? '',
      operationId: json['operationId'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      status: json['status'] ?? 'PENDING',
      priority: json['priority'] ?? 'MEDIUM',
      dueDate: json['dueDate'] != null ? DateTime.tryParse(json['dueDate']) : null,
      completedAt: json['completedAt'] != null ? DateTime.tryParse(json['completedAt']) : null,
    );
  }
}

class FarmOperationModel {
  final String id;
  final String farmCropId;
  final String name;
  final String? description;
  final String status;
  final DateTime? plannedStartDate;
  final DateTime? plannedEndDate;
  final DateTime? completedAt;
  final List<FarmTaskModel> tasks;

  FarmOperationModel({
    required this.id,
    required this.farmCropId,
    required this.name,
    this.description,
    required this.status,
    this.plannedStartDate,
    this.plannedEndDate,
    this.completedAt,
    this.tasks = const [],
  });

  factory FarmOperationModel.fromJson(Map<String, dynamic> json) {
    var tasksList = json['tasks'] as List? ?? [];
    List<FarmTaskModel> parsedTasks = tasksList.map((i) => FarmTaskModel.fromJson(i)).toList();

    return FarmOperationModel(
      id: json['id'] ?? '',
      farmCropId: json['farmCropId'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      status: json['status'] ?? 'PLANNED',
      plannedStartDate: json['plannedStartDate'] != null ? DateTime.tryParse(json['plannedStartDate']) : null,
      plannedEndDate: json['plannedEndDate'] != null ? DateTime.tryParse(json['plannedEndDate']) : null,
      completedAt: json['completedAt'] != null ? DateTime.tryParse(json['completedAt']) : null,
      tasks: parsedTasks,
    );
  }
}
