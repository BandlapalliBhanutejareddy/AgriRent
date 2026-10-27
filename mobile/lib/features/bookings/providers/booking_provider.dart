import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repository/booking_repository.dart';

final bookingRepositoryProvider = Provider((ref) => BookingRepository());

class BookingState {
  final bool isLoading;
  final String? error;
  final Set<String> pendingBookingIds;

  BookingState({
    this.isLoading = false,
    this.error,
    this.pendingBookingIds = const {},
  });

  BookingState copyWith({
    bool? isLoading,
    String? error,
    bool clearError = false,
    Set<String>? pendingBookingIds,
  }) {
    return BookingState(
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      pendingBookingIds: pendingBookingIds ?? this.pendingBookingIds,
    );
  }
}

class BookingNotifier extends StateNotifier<BookingState> {
  final BookingRepository _repository;
  final Set<String> _pendingActions = {};

  BookingNotifier(this._repository) : super(BookingState());

  bool isActionPending(String bookingId) => _pendingActions.contains(bookingId);

  void setPendingForTesting(String bookingId, bool isPending) {
    if (isPending) {
      _pendingActions.add(bookingId);
    } else {
      _pendingActions.remove(bookingId);
    }
    state = state.copyWith(pendingBookingIds: Set<String>.from(_pendingActions));
  }

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

  Future<bool> updateBookingStatus(String bookingId, String status, {String? note}) async {
    if (bookingId.isEmpty) return false;

    // Prevent duplicate submits on same booking while in-flight
    if (_pendingActions.contains(bookingId)) {
      return false;
    }
    _pendingActions.add(bookingId);

    state = state.copyWith(
      isLoading: true,
      clearError: true,
      pendingBookingIds: Set<String>.from(_pendingActions),
    );

    try {
      await _repository.updateBookingStatus(bookingId, status, note: note);
      _pendingActions.remove(bookingId);
      state = state.copyWith(
        isLoading: false,
        pendingBookingIds: Set<String>.from(_pendingActions),
      );
      return true;
    } catch (e) {
      _pendingActions.remove(bookingId);
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
        pendingBookingIds: Set<String>.from(_pendingActions),
      );
      return false;
    }
  }

  void clearPending() {
    _pendingActions.clear();
    state = state.copyWith(pendingBookingIds: const {});
  }
}

final bookingProvider = StateNotifierProvider<BookingNotifier, BookingState>((ref) {
  final repo = ref.watch(bookingRepositoryProvider);
  return BookingNotifier(repo);
});
