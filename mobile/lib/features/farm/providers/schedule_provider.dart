import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../models/schedule_model.dart';

class ScheduleState {
  final MasterScheduleModel? schedule;
  final bool isLoading;
  final String? error;

  ScheduleState({
    this.schedule,
    this.isLoading = false,
    this.error,
  });

  ScheduleState copyWith({
    MasterScheduleModel? schedule,
    bool? isLoading,
    String? error,
  }) {
    return ScheduleState(
      schedule: schedule ?? this.schedule,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class ScheduleNotifier extends StateNotifier<ScheduleState> {
  final String farmId;
  final String lang;

  ScheduleNotifier(this.farmId, this.lang) : super(ScheduleState()) {
    fetchSchedule();
  }

  Future<void> fetchSchedule() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await ApiClient().dio.get('/farms/$farmId/schedule?lang=$lang');
      if (response.statusCode == 200) {
        final schedule = MasterScheduleModel.fromJson(response.data);
        state = state.copyWith(schedule: schedule, isLoading: false);
      } else {
        state = state.copyWith(error: 'Failed to load schedule', isLoading: false);
      }
    } catch (e) {
      state = state.copyWith(error: 'Error: $e', isLoading: false);
    }
  }
}

final scheduleProvider = StateNotifierProvider.family<ScheduleNotifier, ScheduleState, Map<String, String>>((ref, params) {
  final farmId = params['farmId']!;
  final lang = params['lang']!;
  return ScheduleNotifier(farmId, lang);
});
