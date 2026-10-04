import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../models/equipment.dart';
import '../../../models/booking.dart';
import '../../bookings/repository/booking_repository.dart';
import '../repository/owner_repository.dart';

final ownerRepositoryProvider = Provider((ref) => OwnerRepository());

class OwnerState {
  final List<Equipment> myEquipment;
  final List<Booking> bookings;
  final Map<String, dynamic>? analytics;
  final bool isLoading;
  final String? error;

  OwnerState({
    this.myEquipment = const [],
    this.bookings = const [],
    this.analytics,
    this.isLoading = false,
    this.error,
  });

  OwnerState copyWith({
    List<Equipment>? myEquipment,
    List<Booking>? bookings,
    Map<String, dynamic>? analytics,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return OwnerState(
      myEquipment: myEquipment ?? this.myEquipment,
      bookings: bookings ?? this.bookings,
      analytics: analytics ?? this.analytics,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class OwnerNotifier extends StateNotifier<OwnerState> {
  final OwnerRepository _repository;

  OwnerNotifier(this._repository) : super(OwnerState()) {
    Future.microtask(() => fetchDashboardData());
  }

  Future<void> fetchDashboardData() async {
    state = state.copyWith(isLoading: true, clearError: true);
    List<Equipment>? equipment;
    List<Booking>? bookings;
    Map<String, dynamic>? analytics;
    String? errorMsg;

    try {
      equipment = await _repository.fetchMyEquipment();
    } catch (e) {
      errorMsg = e.toString();
    }

    try {
      bookings = await _repository.fetchOwnerBookings();
    } catch (e) {
      errorMsg ??= e.toString();
    }

    try {
      analytics = await _repository.fetchAnalytics();
    } catch (e) {
      errorMsg ??= e.toString();
    }

    state = state.copyWith(
      myEquipment: equipment ?? state.myEquipment,
      bookings: bookings ?? state.bookings,
      analytics: analytics ?? state.analytics,
      isLoading: false,
      error: errorMsg,
    );
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

  Future<bool> updateEquipmentAvailability(String id, bool available) async {
    try {
      await _repository.updateEquipment(id, {'available': available});
      await fetchDashboardData();
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  Future<bool> deleteEquipment(String id) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repository.deleteEquipment(id);
      await fetchDashboardData();
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> updateBookingStatus(String bookingId, String status) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final repo = BookingRepository();
      await repo.updateBookingStatus(bookingId, status);
      await fetchDashboardData();
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> completeInspection(String bookingId, Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repository.completeInspection(bookingId, data);
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
