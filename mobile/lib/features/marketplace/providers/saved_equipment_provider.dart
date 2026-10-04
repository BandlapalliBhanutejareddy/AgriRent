import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../models/equipment.dart';

class SavedEquipmentState {
  final List<Equipment> items;
  final Set<String> savedIds;
  final bool isLoading;
  final String? error;

  SavedEquipmentState({
    this.items = const [],
    this.savedIds = const {},
    this.isLoading = false,
    this.error,
  });

  SavedEquipmentState copyWith({
    List<Equipment>? items,
    Set<String>? savedIds,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return SavedEquipmentState(
      items: items ?? this.items,
      savedIds: savedIds ?? this.savedIds,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class SavedEquipmentNotifier extends StateNotifier<SavedEquipmentState> {
  final ApiClient _apiClient = ApiClient();

  SavedEquipmentNotifier() : super(SavedEquipmentState()) {
    Future.microtask(() => loadSavedEquipment());
  }

  Future<void> loadSavedEquipment() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _apiClient.dio.get('saved');
      dynamic data = response.data;
      if (data is String) {
        try {
          data = json.decode(data);
        } catch (_) {}
      }
      final List<dynamic> rawList = data is List
          ? data
          : (data is Map && data['data'] is List
              ? data['data']
              : []);

      final List<Equipment> equipmentList = [];
      final Set<String> ids = {};

      for (final item in rawList) {
        if (item is Map && item['equipment'] != null) {
          final eq = Equipment.fromJson(Map<String, dynamic>.from(item['equipment'] as Map));
          if (eq.id.isNotEmpty) {
            equipmentList.add(eq);
            ids.add(eq.id);
          }
        }
      }

      state = state.copyWith(
        items: equipmentList,
        savedIds: ids,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  bool isSaved(String equipmentId) {
    return state.savedIds.contains(equipmentId);
  }

  Future<bool> toggleSave(Equipment equipment) async {
    final equipmentId = equipment.id;
    final currentlySaved = state.savedIds.contains(equipmentId);

    // Optimistic UI update
    final newIds = Set<String>.from(state.savedIds);
    List<Equipment> newItems = List<Equipment>.from(state.items);

    if (currentlySaved) {
      newIds.remove(equipmentId);
      newItems.removeWhere((e) => e.id == equipmentId);
    } else {
      newIds.add(equipmentId);
      if (!newItems.any((e) => e.id == equipmentId)) {
        newItems.insert(0, equipment);
      }
    }

    state = state.copyWith(savedIds: newIds, items: newItems);

    try {
      final response = await _apiClient.dio.post('saved/$equipmentId');
      final isSavedNow = response.data?['saved'] == true;
      
      // Sync if server differs
      if (isSavedNow != !currentlySaved) {
        if (isSavedNow) {
          newIds.add(equipmentId);
        } else {
          newIds.remove(equipmentId);
          newItems.removeWhere((e) => e.id == equipmentId);
        }
        state = state.copyWith(savedIds: newIds, items: newItems);
      }
      return isSavedNow;
    } catch (e) {
      // Revert on error
      loadSavedEquipment();
      rethrow;
    }
  }
}

final savedEquipmentProvider = StateNotifierProvider<SavedEquipmentNotifier, SavedEquipmentState>((ref) {
  return SavedEquipmentNotifier();
});
