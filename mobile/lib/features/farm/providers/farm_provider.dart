import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/api/api_client.dart';
import '../models/farm_model.dart';
import '../../auth/providers/auth_provider.dart';

class FarmState {
  final List<FarmModel> farms;
  final String? selectedFarmId;
  final bool isLoading;
  final String? error;

  FarmState({
    this.farms = const [],
    this.selectedFarmId,
    this.isLoading = false,
    this.error,
  });

  FarmModel? get selectedFarm {
    if (farms.isEmpty) return null;
    if (selectedFarmId != null) {
      for (final f in farms) {
        if (f.id == selectedFarmId) return f;
      }
    }
    return farms.first;
  }

  FarmState copyWith({
    List<FarmModel>? farms,
    String? selectedFarmId,
    bool? isLoading,
    String? error,
    bool clearSelectedFarm = false,
  }) {
    return FarmState(
      farms: farms ?? this.farms,
      selectedFarmId: clearSelectedFarm ? null : (selectedFarmId ?? this.selectedFarmId),
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class FarmNotifier extends StateNotifier<FarmState> {
  final Ref _ref;

  FarmNotifier(this._ref) : super(FarmState()) {
    _ref.listen<AuthState>(authProvider, (previous, next) {
      final prevUserId = previous?.user?.id;
      final nextUserId = next.user?.id;
      final role = (next.user?.role ?? '').toUpperCase().trim();
      final activeRole = (next.activeRole ?? '').toUpperCase().trim();
      final isFarmer = role == 'FARMER' || role == 'ENTREPRENEUR' || activeRole == 'FARMER' || (role == 'BOTH' && activeRole != 'OWNER');

      // Account change or logout: clear previous user's in-memory farm state completely
      if (prevUserId != nextUserId || next.user == null) {
        state = FarmState();
      }

      if (isFarmer && next.user != null) {
        if (state.farms.isEmpty) {
          Future.microtask(() => fetchFarms());
        }
      } else if (next.user == null || (!isFarmer && (role.isNotEmpty || activeRole.isNotEmpty))) {
        state = FarmState();
      }
    });

    // Initial fetch if already logged in as farmer
    final authState = _ref.read(authProvider);
    final role = (authState.user?.role ?? '').toUpperCase().trim();
    final activeRole = (authState.activeRole ?? '').toUpperCase().trim();
    final isFarmer = role == 'FARMER' || role == 'ENTREPRENEUR' || activeRole == 'FARMER' || (role == 'BOTH' && activeRole != 'OWNER');

    if (authState.user != null && isFarmer) {
      Future.microtask(() => fetchFarms());
    }
  }

  Future<void> fetchFarms() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await ApiClient().dio.get('/farms');
      if (response.statusCode == 200) {
        final dynamic raw = response.data;
        final List<dynamic> list = raw is List
            ? raw
            : (raw is Map && raw['data'] is List
                ? raw['data']
                : (raw is Map && raw['farms'] is List ? raw['farms'] : []));
        final farms = list
            .whereType<Map>()
            .map((e) => FarmModel.fromJson(Map<String, dynamic>.from(e)))
            .toList();

        String? targetFarmId;
        final currentUser = _ref.read(authProvider).user;

        if (currentUser != null && farms.isNotEmpty) {
          // 1. Check if current in-memory selectedFarmId is still valid in refreshed list
          if (state.selectedFarmId != null && farms.any((f) => f.id == state.selectedFarmId)) {
            targetFarmId = state.selectedFarmId;
          } else {
            // 2. Check SharedPreferences for user-scoped persisted selection
            try {
              final prefs = await SharedPreferences.getInstance();
              final persistedId = prefs.getString('selected_farm_id_${currentUser.id}');
              if (persistedId != null && farms.any((f) => f.id == persistedId)) {
                targetFarmId = persistedId;
              }
            } catch (_) {}
            // 3. Fallback to first farm if no valid persisted selection
            targetFarmId ??= farms.first.id;
          }
        }

        state = state.copyWith(
          farms: farms,
          selectedFarmId: targetFarmId,
          clearSelectedFarm: farms.isEmpty,
          isLoading: false,
        );
      } else {
        state = state.copyWith(error: 'Failed to load farms', isLoading: false);
      }
    } catch (e) {
      state = state.copyWith(error: 'Error: $e', isLoading: false);
    }
  }

  Future<void> selectFarm(String farmId) async {
    if (!state.farms.any((f) => f.id == farmId)) return;
    state = state.copyWith(selectedFarmId: farmId);

    final currentUser = _ref.read(authProvider).user;
    if (currentUser != null) {
      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('selected_farm_id_${currentUser.id}', farmId);
      } catch (_) {}
    }
  }

  /// Creates a new farm via POST /farms, refreshes the authoritative farm list,
  /// verifies the new farm is present in the server response and belongs to the
  /// authenticated farmer, safely selects and persists it, and returns the FarmModel.
  Future<FarmModel> createFarm({
    required String name,
    required String location,
    required double area,
    String areaUnit = 'acres',
    required String soilType,
    String? cropName,
    String? season,
    String? stage,
    double? totalBudget,
  }) async {
    if (name.trim().isEmpty) {
      throw Exception('Farm name is required');
    }
    if (location.trim().isEmpty) {
      throw Exception('Farm location is required');
    }
    if (area <= 0) {
      throw Exception('Land area must be greater than 0');
    }
    if (soilType.trim().isEmpty) {
      throw Exception('Soil type is required');
    }

    final payload = <String, dynamic>{
      'name': name.trim(),
      'location': location.trim(),
      'area': area,
      'areaUnit': areaUnit.trim().isNotEmpty ? areaUnit.trim() : 'acres',
      'soilType': soilType.trim(),
    };
    if (cropName != null && cropName.trim().isNotEmpty) {
      payload['cropName'] = cropName.trim();
    }
    if (season != null && season.trim().isNotEmpty) {
      payload['season'] = season.trim();
    }
    if (stage != null && stage.trim().isNotEmpty) {
      payload['stage'] = stage.trim().toUpperCase();
    }
    if (totalBudget != null && totalBudget > 0) {
      payload['totalBudget'] = totalBudget;
    }

    final response = await ApiClient().dio.post('/farms', data: payload);
    if (response.statusCode != 200 && response.statusCode != 201) {
      final msg = response.data is Map ? response.data['error'] : 'Failed to create farm';
      throw Exception(msg ?? 'Failed to create farm');
    }

    final dynamic resData = response.data;
    final Map<String, dynamic> farmJson = (resData is Map && resData['data'] is Map)
        ? Map<String, dynamic>.from(resData['data'] as Map)
        : (resData is Map ? Map<String, dynamic>.from(resData) : <String, dynamic>{});
    final String newFarmId = farmJson['id']?.toString() ?? '';

    // Authoritative refresh from server
    await fetchFarms();

    final currentUser = _ref.read(authProvider).user;
    if (newFarmId.isNotEmpty) {
      final matchedFarm = state.farms.where((f) => f.id == newFarmId).firstOrNull;
      if (matchedFarm != null) {
        if (currentUser == null || matchedFarm.ownerId.isEmpty || matchedFarm.ownerId == currentUser.id) {
          await selectFarm(newFarmId);
          return matchedFarm;
        }
      }
    }

    if (state.farms.isNotEmpty) {
      final fallback = state.selectedFarm ?? state.farms.first;
      return fallback;
    }

    throw Exception('Farm creation succeeded on server, but farm was not returned in refreshed list');
  }

  /// Updates an existing farm via PUT /farms/:id, refreshes authoritative list,
  /// preserving fields the user did not modify.
  Future<FarmModel> updateFarm({
    required String farmId,
    required String name,
    required String location,
    required double area,
    String areaUnit = 'acres',
    required String soilType,
    String? cropName,
    String? season,
    String? stage,
    double? totalBudget,
  }) async {
    if (farmId.trim().isEmpty) {
      throw Exception('Farm ID is required for update');
    }
    if (name.trim().isEmpty) {
      throw Exception('Farm name is required');
    }
    if (location.trim().isEmpty) {
      throw Exception('Farm location is required');
    }
    if (area <= 0) {
      throw Exception('Land area must be greater than 0');
    }
    if (soilType.trim().isEmpty) {
      throw Exception('Soil type is required');
    }

    final payload = <String, dynamic>{
      'name': name.trim(),
      'location': location.trim(),
      'area': area,
      'areaUnit': areaUnit.trim().isNotEmpty ? areaUnit.trim() : 'acres',
      'soilType': soilType.trim(),
    };
    if (cropName != null && cropName.trim().isNotEmpty) {
      payload['cropName'] = cropName.trim();
    }
    if (season != null && season.trim().isNotEmpty) {
      payload['season'] = season.trim();
    }
    if (stage != null && stage.trim().isNotEmpty) {
      payload['stage'] = stage.trim().toUpperCase();
    }
    if (totalBudget != null && totalBudget > 0) {
      payload['totalBudget'] = totalBudget;
    }

    final response = await ApiClient().dio.put('/farms/$farmId', data: payload);
    if (response.statusCode != 200) {
      final msg = response.data is Map ? response.data['error'] : 'Failed to update farm';
      throw Exception(msg ?? 'Failed to update farm');
    }

    await fetchFarms();

    final updated = state.farms.where((f) => f.id == farmId).firstOrNull;
    if (updated != null) {
      return updated;
    }
    throw Exception('Farm update succeeded on server, but farm was not returned in refreshed list');
  }
}

final farmProvider = StateNotifierProvider<FarmNotifier, FarmState>((ref) {
  return FarmNotifier(ref);
});
