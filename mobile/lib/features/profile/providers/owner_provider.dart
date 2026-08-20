import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../models/equipment.dart';
import '../../../models/booking.dart';
import '../repository/owner_repository.dart';

final ownerRepositoryProvider = Provider((ref) => OwnerRepository());

class OwnerState {
  final List<Equipment> myEquipment;
  final List<Booking> bookings;
  final bool isLoading;
  final String? error;

  OwnerState({
    this.myEquipment = const [],
    this.bookings = const [],
    this.isLoading = false,
    this.error,
  });

  OwnerState copyWith({
    List<Equipment>? myEquipment,
    List<Booking>? bookings,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return OwnerState(
      myEquipment: myEquipment ?? this.myEquipment,
      bookings: bookings ?? this.bookings,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class OwnerNotifier extends StateNotifier<OwnerState> {
  final OwnerRepository _repository;

  OwnerNotifier(this._repository) : super(OwnerState()) {
    fetchDashboardData();
  }

  Future<void> fetchDashboardData() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final equipment = await _repository.fetchMyEquipment();
      final bookings = await _repository.fetchOwnerBookings();
      state = state.copyWith(myEquipment: equipment, bookings: bookings, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<bool> createEquipment(Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repository.createEquipment(data);
      await fetchDashboardData();
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> updateEquipment(String id, Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repository.updateEquipment(id, data);
      await fetchDashboardData();
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }
}

final ownerProvider = StateNotifierProvider<OwnerNotifier, OwnerState>((ref) {
  final repo = ref.watch(ownerRepositoryProvider);
  return OwnerNotifier(repo);
});
