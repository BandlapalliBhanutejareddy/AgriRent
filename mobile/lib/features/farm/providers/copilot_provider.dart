import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../auth/providers/auth_provider.dart';
import 'farm_provider.dart';

class CopilotFarmStatus {
  final String crop;
  final double acreage;
  final String stage;
  final String location;
  final String season;
  final String summary;

  const CopilotFarmStatus({
    this.crop = '',
    this.acreage = 0.0,
    this.stage = '',
    this.location = '',
    this.season = '',
    this.summary = '',
  });

  factory CopilotFarmStatus.fromJson(Map<String, dynamic> json) {
    return CopilotFarmStatus(
      crop: json['crop']?.toString() ?? '',
      acreage: (json['acreage'] as num?)?.toDouble() ?? 0.0,
      stage: json['stage']?.toString() ?? '',
      location: json['location']?.toString() ?? '',
      season: json['season']?.toString() ?? '',
      summary: json['summary']?.toString() ?? '',
    );
  }
}

class CopilotEquipmentRecommendation {
  final String equipmentId;
  final String equipmentName;
  final String category;
  final double pricePerDay;
  final String whyNeeded;
  final String whatItDoes;
  final String whenToUse;
  final String? imageUrl;

  const CopilotEquipmentRecommendation({
    required this.equipmentId,
    required this.equipmentName,
    required this.category,
    required this.pricePerDay,
    this.whyNeeded = '',
    this.whatItDoes = '',
    this.whenToUse = '',
    this.imageUrl,
  });

  factory CopilotEquipmentRecommendation.fromJson(Map<String, dynamic> json) {
    return CopilotEquipmentRecommendation(
      equipmentId: json['equipmentId']?.toString() ?? '',
      equipmentName: json['equipmentName']?.toString() ?? 'Equipment',
      category: json['category']?.toString() ?? 'TRACTOR',
      pricePerDay: (json['pricePerDay'] as num?)?.toDouble() ?? 0.0,
      whyNeeded: json['whyNeeded']?.toString() ?? json['whatItDoes']?.toString() ?? '',
      whatItDoes: json['whatItDoes']?.toString() ?? '',
      whenToUse: json['whenToUse']?.toString() ?? '',
      imageUrl: json['imageUrl']?.toString(),
    );
  }
}

class CopilotMessage {
  final String id;
  final String role; // 'farmer' or 'ai'
  final String text;
  final CopilotFarmStatus? farmStatus;
  final List<String> actionableSteps;
  final List<CopilotEquipmentRecommendation> recommendedEquipment;
  final List<String> warnings;
  final bool isError;
  final bool isLocalEngineUnavailable;
  final String? lastQuery;
  final DateTime timestamp;

  CopilotMessage({
    required this.id,
    required this.role,
    required this.text,
    this.farmStatus,
    this.actionableSteps = const [],
    this.recommendedEquipment = const [],
    this.warnings = const [],
    this.isError = false,
    this.isLocalEngineUnavailable = false,
    this.lastQuery,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  bool get isFarmer => role == 'farmer';
  bool get isAi => role == 'ai';
}

class CopilotState {
  final List<CopilotMessage> messages;
  final bool isLoading;
  final bool isAddingToPlan;
  final String? error;
  final String? activeFarmId;
  final String? activeCropId;
  final String? activeCropName;

  const CopilotState({
    this.messages = const [],
    this.isLoading = false,
    this.isAddingToPlan = false,
    this.error,
    this.activeFarmId,
    this.activeCropId,
    this.activeCropName,
  });

  CopilotState copyWith({
    List<CopilotMessage>? messages,
    bool? isLoading,
    bool? isAddingToPlan,
    String? error,
    bool clearError = false,
    String? activeFarmId,
    String? activeCropId,
    String? activeCropName,
  }) {
    return CopilotState(
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      isAddingToPlan: isAddingToPlan ?? this.isAddingToPlan,
      error: clearError ? null : (error ?? this.error),
      activeFarmId: activeFarmId ?? this.activeFarmId,
      activeCropId: activeCropId ?? this.activeCropId,
      activeCropName: activeCropName ?? this.activeCropName,
    );
  }
}

class CopilotNotifier extends StateNotifier<CopilotState> {
  final Ref _ref;
  final ApiClient _apiClient;
  bool _isSendingActive = false;
  CancelToken? _cancelToken;

  CopilotNotifier(this._ref, [ApiClient? apiClient])
      : _apiClient = apiClient ?? ApiClient(),
        super(const CopilotState()) {
    _setupListeners();
  }

  void _setupListeners() {
    // 1. Account Isolation: Reset messages when user switches or logs out
    _ref.listen<AuthState>(authProvider, (previous, next) {
      final prevUserId = previous?.user?.id;
      final nextUserId = next.user?.id;
      if (prevUserId != nextUserId || next.user == null) {
        reset();
      }
    });

    // 2. Selected Farm Isolation: Reset stale messages when farm changes
    _ref.listen<FarmState>(farmProvider, (previous, next) {
      final prevFarmId = previous?.selectedFarmId;
      final nextFarmId = next.selectedFarmId;
      if (prevFarmId != null && nextFarmId != null && prevFarmId != nextFarmId) {
        reset();
      }
    });
  }

  void initForFarm({
    required String farmId,
    required String cropId,
    String? cropName,
    String? userName,
  }) {
    if (state.activeFarmId == farmId && state.activeCropId == cropId && state.messages.isNotEmpty) {
      return;
    }

    final greetingUser = (userName != null && userName.isNotEmpty) ? userName : 'Farmer';
    final cropDetail = (cropName != null && cropName.isNotEmpty) ? ' for $cropName' : '';

    final welcomeMsg = CopilotMessage(
      id: 'welcome_${DateTime.now().millisecondsSinceEpoch}',
      role: 'ai',
      text: 'Hello $greetingUser! 🌾 I am your Farmer Assistant$cropDetail. Ask me anything about crop care, field operations, soil health, or seasonal farming advice.',
    );

    state = state.copyWith(
      activeFarmId: farmId,
      activeCropId: cropId,
      activeCropName: cropName,
      messages: [welcomeMsg],
      clearError: true,
    );
  }

  void cancel() {
    if (_cancelToken != null && !_cancelToken!.isCancelled) {
      _cancelToken!.cancel('Request cancelled by farmer');
    }
    _isSendingActive = false;
    state = state.copyWith(isLoading: false);
  }

  Future<bool> askQuestion({
    required String query,
    required String farmId,
    required String cropId,
    required String language,
  }) async {
    final cleanQuery = query.trim();
    if (cleanQuery.isEmpty) return false;

    // Duplicate-submission prevention mutex
    if (_isSendingActive || state.isLoading) {
      return false;
    }

    _isSendingActive = true;
    _cancelToken = CancelToken();

    final userMsg = CopilotMessage(
      id: 'user_${DateTime.now().millisecondsSinceEpoch}',
      role: 'farmer',
      text: cleanQuery,
    );

    state = state.copyWith(
      messages: [...state.messages, userMsg],
      isLoading: true,
      clearError: true,
    );

    try {
      if (farmId.isNotEmpty && cropId.isNotEmpty) {
        final res = await _apiClient.dio.post(
          'ai/farm-copilot',
          data: {
            'farmId': farmId,
            'cropId': cropId,
            'question': cleanQuery,
            'language': language,
          },
          cancelToken: _cancelToken,
        );

        final dynamic raw = res.data;
        final Map<String, dynamic> data = (raw is Map && raw['data'] is Map)
            ? Map<String, dynamic>.from(raw['data'])
            : (raw is Map ? Map<String, dynamic>.from(raw) : <String, dynamic>{});

        final explanation = (data['explanation'] ?? data['reply'] ?? data['summary'] ?? '').toString();

        CopilotFarmStatus? farmStatus;
        if (data['farmStatus'] is Map) {
          farmStatus = CopilotFarmStatus.fromJson(Map<String, dynamic>.from(data['farmStatus']));
        }

        final steps = (data['actionableSteps'] as List?)
                ?.map((s) => s.toString())
                .where((s) => s.trim().isNotEmpty)
                .toList() ??
            [];

        final warnings = (data['warnings'] as List?)
                ?.map((w) => w.toString())
                .where((w) => w.trim().isNotEmpty)
                .toList() ??
            [];

        final List<CopilotEquipmentRecommendation> equipmentList = [];
        if (data['translatedEquipment'] is List) {
          for (final item in data['translatedEquipment']) {
            if (item is Map) {
              equipmentList.add(CopilotEquipmentRecommendation.fromJson(Map<String, dynamic>.from(item)));
            }
          }
        }

        final aiMsg = CopilotMessage(
          id: 'ai_${DateTime.now().millisecondsSinceEpoch}',
          role: 'ai',
          text: explanation.isNotEmpty ? explanation : 'Here is the recommended agronomic guidance for your field.',
          farmStatus: farmStatus,
          actionableSteps: steps,
          recommendedEquipment: equipmentList,
          warnings: warnings,
        );

        state = state.copyWith(
          messages: [...state.messages, aiMsg],
          isLoading: false,
          clearError: true,
        );
        _isSendingActive = false;
        return true;
      } else {
        // Fallback to legacy advisor if farm context is unconfigured
        final res = await _apiClient.dio.post(
          'ai/advisor',
          data: {
            'question': cleanQuery,
            'prompt': cleanQuery,
            'language': language,
          },
          cancelToken: _cancelToken,
        );

        final dynamic raw = res.data;
        final Map<String, dynamic> data = (raw is Map && raw['data'] is Map)
            ? Map<String, dynamic>.from(raw['data'])
            : (raw is Map ? Map<String, dynamic>.from(raw) : <String, dynamic>{});

        final reply = (data['reply'] ?? data['explanation'] ?? 'Agronomic advice processed.').toString();

        final aiMsg = CopilotMessage(
          id: 'ai_${DateTime.now().millisecondsSinceEpoch}',
          role: 'ai',
          text: reply,
        );

        state = state.copyWith(
          messages: [...state.messages, aiMsg],
          isLoading: false,
          clearError: true,
        );
        _isSendingActive = false;
        return true;
      }
    } catch (e) {
      if (e is DioException && CancelToken.isCancel(e)) {
        state = state.copyWith(
          isLoading: false,
          clearError: true,
        );
        _isSendingActive = false;
        return false;
      }

      final errorStr = e.toString();
      final isOllamaDown = errorStr.contains('503') ||
          errorStr.contains('unavailable') ||
          errorStr.contains('Connection refused') ||
          errorStr.contains('timeout') ||
          errorStr.contains('Failed to connect') ||
          errorStr.contains('Ollama');

      final errorMsg = CopilotMessage(
        id: 'err_${DateTime.now().millisecondsSinceEpoch}',
        role: 'ai',
        text: isOllamaDown
            ? 'Farmer Assistant service is temporarily unavailable or timed out. Please verify connectivity or try again later.'
            : 'Unable to process farm advice request. Please verify your connection and try again.',
        isError: true,
        isLocalEngineUnavailable: isOllamaDown,
        lastQuery: cleanQuery,
      );

      state = state.copyWith(
        messages: [...state.messages, errorMsg],
        isLoading: false,
        error: errorStr,
      );
      _isSendingActive = false;
      return false;
    }
  }

  Future<bool> addToPlan({
    required String farmId,
    required String cropId,
    required List<String> steps,
    String? stage,
  }) async {
    if (steps.isEmpty || state.isAddingToPlan) return false;

    state = state.copyWith(isAddingToPlan: true, clearError: true);

    try {
      final res = await _apiClient.dio.post('ai/farm-copilot/add-to-plan', data: {
        'farmId': farmId,
        'cropId': cropId,
        'actionableSteps': steps,
        if (stage != null && stage.isNotEmpty) 'stage': stage,
      });

      state = state.copyWith(isAddingToPlan: false);
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (e) {
      state = state.copyWith(
        isAddingToPlan: false,
        error: e.toString(),
      );
      return false;
    }
  }

  void reset() {
    if (_cancelToken != null && !_cancelToken!.isCancelled) {
      _cancelToken!.cancel('Resetting copilot state');
    }
    _isSendingActive = false;
    state = const CopilotState();
  }
}

final copilotProvider = StateNotifierProvider<CopilotNotifier, CopilotState>((ref) {
  return CopilotNotifier(ref);
});
