import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../models/farm_model.dart';
import '../../auth/providers/auth_provider.dart';

class FarmState {
  final List<FarmModel> farms;
  final bool isLoading;
  final String? error;

  FarmState({
    this.farms = const [],
    this.isLoading = false,
    this.error,
  });

  FarmState copyWith({
    List<FarmModel>? farms,
    bool? isLoading,
    String? error,
  }) {
    return FarmState(
      farms: farms ?? this.farms,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class FarmNotifier extends StateNotifier<FarmState> {
  final Ref _ref;

  FarmNotifier(this._ref) : super(FarmState()) {
    _ref.listen<AuthState>(authProvider, (previous, next) {
      final role = (next.user?.role ?? '').toUpperCase().trim();
      final activeRole = (next.activeRole ?? '').toUpperCase().trim();
      final isFarmer = role == 'FARMER' || role == 'ENTREPRENEUR' || activeRole == 'FARMER' || (role == 'BOTH' && activeRole != 'OWNER');

      if (isFarmer) {
        if (state.farms.isEmpty) {
          Future.microtask(() => fetchFarms());
        }
      } else if (next.user == null || (!isFarmer && (role.isNotEmpty || activeRole.isNotEmpty))) {
        // Clear data when user logs out or switches role
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
        state = state.copyWith(farms: farms, isLoading: false);
      } else {
        state = state.copyWith(error: 'Failed to load farms', isLoading: false);
      }
    } catch (e) {
      state = state.copyWith(error: 'Error: $e', isLoading: false);
    }
  }
}

final farmProvider = StateNotifierProvider<FarmNotifier, FarmState>((ref) {
  return FarmNotifier(ref);
});
