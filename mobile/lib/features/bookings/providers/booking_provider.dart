import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repository/booking_repository.dart';

final bookingRepositoryProvider = Provider((ref) => BookingRepository());

class BookingState {
  final bool isLoading;
  final String? error;

  BookingState({this.isLoading = false, this.error});

  BookingState copyWith({bool? isLoading, String? error, bool clearError = false}) {
    return BookingState(
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class BookingNotifier extends StateNotifier<BookingState> {
  final BookingRepository _repository;

  BookingNotifier(this._repository) : super(BookingState());

  Future<bool> createBooking({
    required String equipmentId,
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repository.createBooking(equipmentId: equipmentId, startDate: startDate, endDate: endDate);
      state = state.copyWith(isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> updateBookingStatus(String bookingId, String status) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repository.updateBookingStatus(bookingId, status);
      state = state.copyWith(isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }
}

final bookingProvider = StateNotifierProvider<BookingNotifier, BookingState>((ref) {
  final repo = ref.watch(bookingRepositoryProvider);
  return BookingNotifier(repo);
});
