import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../models/equipment.dart';
import '../../../models/booking.dart';
import '../../auth/providers/auth_provider.dart';
import '../repository/owner_repository.dart';
import '../repository/owner_analytics_repository.dart';

final ownerRepositoryProvider = Provider((ref) => OwnerRepository());
final ownerAnalyticsRepositoryProvider = Provider((ref) => OwnerAnalyticsRepository());

class OwnerState {
  final List<Equipment> myEquipment;
  final List<Booking> bookings;
  final Map<String, dynamic>? analytics;
  final bool isLoading;
  final String? error;
  final Set<String> pendingBookingActions;
  final Set<String> pendingEquipmentActions;

  OwnerState({
    this.myEquipment = const [],
    this.bookings = const [],
    this.analytics,
    this.isLoading = false,
    this.error,
    this.pendingBookingActions = const {},
    this.pendingEquipmentActions = const {},
  });

  bool isBookingActionPending(String bookingId) => pendingBookingActions.contains(bookingId);
  bool isEquipmentActionPending(String equipmentId) => pendingEquipmentActions.contains(equipmentId);

  // Authoritative equipment metrics
  int get totalEquipmentCount => myEquipment.length;
  int get activeListingsCount => myEquipment.where((e) => e.available).length;
  int get inactiveListingsCount => myEquipment.where((e) => !e.available).length;

  // Authoritative booking lifecycle metrics
  int get pendingBookingsCount =>
      bookings.where((b) => b.status.toUpperCase() == 'PENDING').length;
  int get activeRentalsCount =>
      bookings.where((b) => b.status.toUpperCase() == 'ACTIVE' || b.status.toUpperCase() == 'ACCEPTED').length;
  int get completedBookingsCount =>
      bookings.where((b) => b.status.toUpperCase() == 'COMPLETED').length;
  int get returnPendingCount =>
      bookings.where((b) => b.status.toUpperCase() == 'RETURN_PENDING' ||
                            b.status.toUpperCase() == 'INSPECTION_PENDING' ||
                            b.status.toUpperCase() == 'RETURNED').length;

  // Financial Summary Integrity (Separating booking value, amount actually paid, outstanding amount, received rental revenue)
  double get totalBookingValue => bookings
      .where((b) => b.status.toUpperCase() != 'CANCELLED' && b.status.toUpperCase() != 'REJECTED')
      .fold<double>(0.0, (sum, b) => sum + (b.totalPrice ?? 0.0));

  double get totalAmountPaid => bookings
      .where((b) => b.status.toUpperCase() != 'CANCELLED' && b.status.toUpperCase() != 'REJECTED')
      .fold<double>(0.0, (sum, b) => sum + (b.amountPaid ?? 0.0));

  double get totalOutstandingBalance => bookings
      .where((b) => b.status.toUpperCase() != 'CANCELLED' && b.status.toUpperCase() != 'REJECTED')
      .fold<double>(0.0, (sum, b) => sum + b.outstandingBalance);

  double get totalRevenue {
    final raw = analytics?['totalRevenue'];
    if (raw != null) {
      if (raw is num) return raw.toDouble();
      final parsed = double.tryParse(raw.toString());
      if (parsed != null) return parsed;
    }
    const revStatuses = [
      'COMPLETED',
      'ACTIVE',
      'RETURN_PENDING',
      'RETURN_IN_PROGRESS',
      'RETURNED',
      'INSPECTION_PENDING',
      'ACCEPTED',
    ];
    return bookings
        .where((b) => revStatuses.contains(b.status.toUpperCase()))
        .fold<double>(0.0, (sum, b) => sum + (b.totalPrice ?? 0.0));
  }

  // Phase 17 Enhanced Metric Getters
  Map<String, dynamic>? get equipmentMetrics => analytics?['equipmentMetrics'] as Map<String, dynamic>?;
  Map<String, dynamic>? get bookingStatusBreakdown => analytics?['bookingStatusBreakdown'] as Map<String, dynamic>?;
  Map<String, dynamic>? get financialMetrics => analytics?['financialMetrics'] as Map<String, dynamic>?;
  Map<String, dynamic>? get utilizationMetrics => analytics?['utilizationMetrics'] as Map<String, dynamic>?;

  double get grossBookingValue =>
      (financialMetrics?['grossBookingValue'] as num?)?.toDouble() ?? totalBookingValue;

  double get realizedEarnings =>
      (financialMetrics?['verifiedPaymentsCollected'] as num?)?.toDouble() ??
      (financialMetrics?['realizedEarnings'] as num?)?.toDouble() ?? totalAmountPaid;

  double get verifiedPaymentsCollected => realizedEarnings;

  double get completedRevenueAmount =>
      (financialMetrics?['completedRevenue'] as num?)?.toDouble() ?? 0.0;

  double get pendingPayoutAmount =>
      (financialMetrics?['uncollectedBookingBalance'] as num?)?.toDouble() ??
      (financialMetrics?['pendingPayout'] as num?)?.toDouble() ?? totalOutstandingBalance;

  double get uncollectedBookingBalance => pendingPayoutAmount;

  double get securityDepositsHeldAmount =>
      (financialMetrics?['securityDepositsHeld'] as num?)?.toDouble() ?? 0.0;

  double get inspectionDeductionsAmount =>
      (financialMetrics?['inspectionDeductions'] as num?)?.toDouble() ?? 0.0;

  double get fleetUtilizationRate =>
      (utilizationMetrics?['fleetUtilizationRate'] as num?)?.toDouble() ??
      (analytics?['utilization'] as num?)?.toDouble() ??
      0.0;

  List<Map<String, dynamic>> get bookingTrends {
    final raw = analytics?['bookingTrends'];
    if (raw is List) {
      return raw.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    }
    return [];
  }

  List<Map<String, dynamic>> get equipmentPerformanceList {
    final raw = analytics?['equipmentPerformance'];
    if (raw is List) {
      return raw.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    }
    return [];
  }

  // Recent booking activity sorted descending
  List<Booking> get recentBookings {
    final list = List<Booking>.from(bookings);
    list.sort((a, b) => b.startDate.compareTo(a.startDate));
    return list.take(5).toList();
  }

  // Booking activity associated with specific equipment
  int equipmentBookingCount(String equipmentId) {
    if (equipmentId.isEmpty) return 0;
    return bookings.where((b) => b.equipmentId == equipmentId || b.equipment?.id == equipmentId).length;
  }

  int equipmentActiveBookingCount(String equipmentId) {
    if (equipmentId.isEmpty) return 0;
    return bookings.where((b) =>
        (b.equipmentId == equipmentId || b.equipment?.id == equipmentId) &&
        (b.status.toUpperCase() == 'ACTIVE' || b.status.toUpperCase() == 'ACCEPTED')).length;
  }

  OwnerState copyWith({
    List<Equipment>? myEquipment,
    List<Booking>? bookings,
    Map<String, dynamic>? analytics,
    bool? isLoading,
    String? error,
    bool clearError = false,
    Set<String>? pendingBookingActions,
    Set<String>? pendingEquipmentActions,
  }) {
    return OwnerState(
      myEquipment: myEquipment ?? this.myEquipment,
      bookings: bookings ?? this.bookings,
      analytics: analytics ?? this.analytics,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      pendingBookingActions: pendingBookingActions ?? this.pendingBookingActions,
      pendingEquipmentActions: pendingEquipmentActions ?? this.pendingEquipmentActions,
    );
  }
}

class OwnerNotifier extends StateNotifier<OwnerState> {
  final OwnerRepository _repository;
  final Ref _ref;
  final Set<String> _pendingBookingActions = {};
  final Set<String> _pendingEquipmentActions = {};

  OwnerNotifier(this._repository, this._ref, {bool autoFetch = true}) : super(OwnerState()) {
    _ref.listen<AuthState>(authProvider, (previous, next) {
      final prevUser = previous?.user;
      final nextUser = next.user;
      if (nextUser == null) {
        reset();
      } else if (prevUser?.id != nextUser.id) {
        reset();
        final role = nextUser.role.toUpperCase();
        if (role == 'OWNER' || role == 'BOTH' || role == 'ADMIN') {
          fetchDashboardData();
        }
      }
    });
    if (autoFetch) {
      final user = _ref.read(authProvider).user;
      if (user != null) {
        final role = user.role.toUpperCase();
        if (role == 'OWNER' || role == 'BOTH' || role == 'ADMIN') {
          Future.microtask(() => fetchDashboardData());
        }
      }
    }
  }

  bool isBookingActionPending(String bookingId) => _pendingBookingActions.contains(bookingId) || state.pendingBookingActions.contains(bookingId);
  bool isEquipmentActionPending(String equipmentId) => _pendingEquipmentActions.contains(equipmentId) || state.pendingEquipmentActions.contains(equipmentId);

  void reset() {
    _pendingBookingActions.clear();
    _pendingEquipmentActions.clear();
    state = OwnerState();
    try {
      _ref.read(ownerBookingFilterProvider.notifier).state = 'ALL';
    } catch (_) {}
  }

  static List<Equipment> _deduplicateEquipment(List<Equipment> items) {
    final seen = <String>{};
    final result = <Equipment>[];
    for (final item in items) {
      if (item.id.isNotEmpty) {
        if (seen.add(item.id)) {
          result.add(item);
        }
      } else {
        result.add(item);
      }
    }
    return result;
  }

  static List<Booking> _deduplicateBookings(List<Booking> items) {
    final seen = <String>{};
    final result = <Booking>[];
    for (final item in items) {
      if (item.id.isNotEmpty) {
        if (seen.add(item.id)) {
          result.add(item);
        }
      } else {
        result.add(item);
      }
    }
    return result;
  }

  Future<void> fetchDashboardData() async {
    final currentUser = _ref.read(authProvider).user;
    final currentUserId = currentUser?.id;
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

    if (!mounted) return;
    // Late response guard: if account changed or user logged out while request was in-flight, discard
    final activeUser = _ref.read(authProvider).user;
    if (activeUser == null) return;
    if (currentUserId != null && activeUser.id != currentUserId) return;

    final uniqueEquipment = _deduplicateEquipment(equipment ?? state.myEquipment);
    final uniqueBookings = _deduplicateBookings(bookings ?? state.bookings);

    state = state.copyWith(
      myEquipment: uniqueEquipment,
      bookings: uniqueBookings,
      analytics: analytics ?? state.analytics,
      isLoading: false,
      error: errorMsg?.replaceFirst('Exception: ', ''),
    );
  }

  Future<bool> createEquipment(Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repository.createEquipment(data);
      await fetchDashboardData();
      if (mounted) {
        state = state.copyWith(isLoading: false);
      }
      return true;
    } catch (e) {
      if (mounted) {
        state = state.copyWith(
          isLoading: false,
          error: e.toString().replaceFirst('Exception: ', ''),
        );
      }
      return false;
    }
  }

  Future<bool> updateEquipment(String id, Map<String, dynamic> data) async {
    if (id.isEmpty) return false;
    if (_pendingEquipmentActions.contains(id) || state.pendingEquipmentActions.contains(id)) {
      return false;
    }
    _pendingEquipmentActions.add(id);
    state = state.copyWith(
      isLoading: true,
      clearError: true,
      pendingEquipmentActions: {...state.pendingEquipmentActions, id},
    );
    try {
      await _repository.updateEquipment(id, data);
      await fetchDashboardData();
      _pendingEquipmentActions.remove(id);
      if (mounted) {
        state = state.copyWith(
          isLoading: false,
          pendingEquipmentActions: state.pendingEquipmentActions.where((x) => x != id).toSet(),
        );
      }
      return true;
    } catch (e) {
      _pendingEquipmentActions.remove(id);
      if (mounted) {
        state = state.copyWith(
          isLoading: false,
          error: e.toString().replaceFirst('Exception: ', ''),
          pendingEquipmentActions: state.pendingEquipmentActions.where((x) => x != id).toSet(),
        );
      }
      return false;
    }
  }

  Future<bool> updateEquipmentAvailability(String id, bool available) async {
    if (id.isEmpty) return false;
    if (_pendingEquipmentActions.contains(id) || state.pendingEquipmentActions.contains(id)) {
      return false;
    }
    _pendingEquipmentActions.add(id);
    state = state.copyWith(
      clearError: true,
      pendingEquipmentActions: {...state.pendingEquipmentActions, id},
    );
    try {
      await _repository.updateEquipment(id, {'available': available});
      await fetchDashboardData();
      _pendingEquipmentActions.remove(id);
      if (mounted) {
        state = state.copyWith(
          pendingEquipmentActions: state.pendingEquipmentActions.where((x) => x != id).toSet(),
        );
      }
      return true;
    } catch (e) {
      _pendingEquipmentActions.remove(id);
      if (mounted) {
        state = state.copyWith(
          error: e.toString().replaceFirst('Exception: ', ''),
          pendingEquipmentActions: state.pendingEquipmentActions.where((x) => x != id).toSet(),
        );
      }
      return false;
    }
  }

  Future<bool> deleteEquipment(String id) async {
    if (id.isEmpty) return false;
    if (_pendingEquipmentActions.contains(id) || state.pendingEquipmentActions.contains(id)) {
      return false;
    }
    _pendingEquipmentActions.add(id);
    state = state.copyWith(
      isLoading: true,
      clearError: true,
      pendingEquipmentActions: {...state.pendingEquipmentActions, id},
    );
    try {
      await _repository.deleteEquipment(id);
      await fetchDashboardData();
      _pendingEquipmentActions.remove(id);
      if (mounted) {
        state = state.copyWith(
          isLoading: false,
          pendingEquipmentActions: state.pendingEquipmentActions.where((x) => x != id).toSet(),
        );
      }
      return true;
    } catch (e) {
      _pendingEquipmentActions.remove(id);
      if (mounted) {
        state = state.copyWith(
          isLoading: false,
          error: e.toString().replaceFirst('Exception: ', ''),
          pendingEquipmentActions: state.pendingEquipmentActions.where((x) => x != id).toSet(),
        );
      }
      return false;
    }
  }

  Future<bool> updateBookingStatus(String bookingId, String status, {String? note}) async {
    if (bookingId.isEmpty) return false;
    if (state.pendingBookingActions.contains(bookingId) || _pendingBookingActions.contains(bookingId)) {
      return false;
    }
    final currentUserId = _ref.read(authProvider).user?.id;
    _pendingBookingActions.add(bookingId);
    state = state.copyWith(
      isLoading: true,
      clearError: true,
      pendingBookingActions: {...state.pendingBookingActions, bookingId},
    );
    try {
      await _repository.updateBookingStatus(bookingId, status, note: note);
      if (!mounted) return true;
      if (_ref.read(authProvider).user?.id != currentUserId) return false;
      await fetchDashboardData();
      _pendingBookingActions.remove(bookingId);
      if (mounted) {
        state = state.copyWith(
          isLoading: false,
          pendingBookingActions: state.pendingBookingActions.where((id) => id != bookingId).toSet(),
        );
      }
      return true;
    } catch (e) {
      _pendingBookingActions.remove(bookingId);
      if (mounted) {
        state = state.copyWith(
          isLoading: false,
          error: e.toString().replaceFirst('Exception: ', ''),
          pendingBookingActions: state.pendingBookingActions.where((id) => id != bookingId).toSet(),
        );
      }
      return false;
    }
  }

  Future<bool> completeInspection(String bookingId, Map<String, dynamic> data) async {
    if (bookingId.isEmpty) return false;
    if (state.pendingBookingActions.contains(bookingId) || _pendingBookingActions.contains(bookingId)) {
      return false;
    }
    final currentUserId = _ref.read(authProvider).user?.id;
    _pendingBookingActions.add(bookingId);
    state = state.copyWith(
      isLoading: true,
      clearError: true,
      pendingBookingActions: {...state.pendingBookingActions, bookingId},
    );
    try {
      await _repository.completeInspection(bookingId, data);
      if (!mounted) return true;
      if (_ref.read(authProvider).user?.id != currentUserId) return false;
      await fetchDashboardData();
      _pendingBookingActions.remove(bookingId);
      if (mounted) {
        state = state.copyWith(
          isLoading: false,
          pendingBookingActions: state.pendingBookingActions.where((id) => id != bookingId).toSet(),
        );
      }
      return true;
    } catch (e) {
      _pendingBookingActions.remove(bookingId);
      if (mounted) {
        state = state.copyWith(
          isLoading: false,
          error: e.toString().replaceFirst('Exception: ', ''),
          pendingBookingActions: state.pendingBookingActions.where((id) => id != bookingId).toSet(),
        );
      }
      return false;
    }
  }
}

final ownerProvider = StateNotifierProvider<OwnerNotifier, OwnerState>((ref) {
  final repo = ref.watch(ownerRepositoryProvider);
  return OwnerNotifier(repo, ref);
});

final ownerBookingFilterProvider = StateProvider<String>((ref) => 'ALL');
final ownerEquipmentAvailabilityFilterProvider = StateProvider<String>((ref) => 'ALL');
final ownerTabIndexProvider = StateProvider<int>((ref) => 0);

class OwnerAnalyticsState {
  final Map<String, dynamic>? data;
  final String selectedPeriod;
  final bool isLoading;
  final String? error;

  OwnerAnalyticsState({
    this.data,
    this.selectedPeriod = '30d',
    this.isLoading = false,
    this.error,
  });

  Map<String, dynamic>? get equipmentMetrics => data?['equipmentMetrics'] as Map<String, dynamic>?;
  Map<String, dynamic>? get bookingStatusBreakdown => data?['bookingStatusBreakdown'] as Map<String, dynamic>?;
  Map<String, dynamic>? get financialMetrics => data?['financialMetrics'] as Map<String, dynamic>?;
  Map<String, dynamic>? get utilizationMetrics => data?['utilizationMetrics'] as Map<String, dynamic>?;

  int get totalListings =>
      (equipmentMetrics?['total'] as num?)?.toInt() ??
      (data?['totalEquipment'] as num?)?.toInt() ??
      (data?['totalListings'] as num?)?.toInt() ??
      0;

  int get activeListings =>
      (equipmentMetrics?['active'] as num?)?.toInt() ??
      (data?['activeEquipment'] as num?)?.toInt() ??
      (data?['activeListings'] as num?)?.toInt() ??
      0;

  int get inactiveListings =>
      (equipmentMetrics?['inactive'] as num?)?.toInt() ??
      (data?['inactiveEquipment'] as num?)?.toInt() ??
      (data?['inactiveListings'] as num?)?.toInt() ??
      0;

  int get totalBookings =>
      (data?['totalBookings'] as num?)?.toInt() ?? 0;

  int get completedRentals =>
      (data?['completedRentals'] as num?)?.toInt() ??
      (data?['completedBookings'] as num?)?.toInt() ??
      0;

  int get pendingRequests =>
      (data?['pendingRequests'] as num?)?.toInt() ??
      (data?['pendingBookings'] as num?)?.toInt() ??
      0;

  Map<String, dynamic> get statusBreakdown {
    if (bookingStatusBreakdown != null) return bookingStatusBreakdown!;
    if (data?['statusBreakdown'] is Map) {
      return Map<String, dynamic>.from(data!['statusBreakdown'] as Map);
    }
    return const {};
  }

  double get grossBookingValue =>
      (financialMetrics?['grossBookingValue'] as num?)?.toDouble() ??
      (data?['totalRevenue'] as num?)?.toDouble() ?? 0.0;

  double get realizedEarnings =>
      (financialMetrics?['realizedEarnings'] as num?)?.toDouble() ??
      (data?['totalEarnings'] as num?)?.toDouble() ?? 0.0;

  double get completedRevenue =>
      (financialMetrics?['completedRevenue'] as num?)?.toDouble() ??
      (data?['completedRevenue'] as num?)?.toDouble() ?? 0.0;

  double get pendingPayout =>
      (financialMetrics?['pendingPayout'] as num?)?.toDouble() ??
      (data?['pendingValue'] as num?)?.toDouble() ?? 0.0;

  double get securityDepositsHeld =>
      (financialMetrics?['securityDepositsHeld'] as num?)?.toDouble() ?? 0.0;

  double get inspectionDeductions =>
      (financialMetrics?['inspectionDeductions'] as num?)?.toDouble() ?? 0.0;

  double get fleetUtilizationRate =>
      (utilizationMetrics?['fleetUtilizationRate'] as num?)?.toDouble() ??
      (data?['utilization'] as num?)?.toDouble() ?? 0.0;

  List<Map<String, dynamic>> get bookingTrends {
    final raw = data?['bookingTrends'];
    if (raw is List) {
      return raw.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    }
    return [];
  }

  List<Map<String, dynamic>> get equipmentPerformanceList {
    final raw = data?['equipmentPerformance'];
    if (raw is List) {
      return raw.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    }
    return [];
  }

  OwnerAnalyticsState copyWith({
    Map<String, dynamic>? data,
    String? selectedPeriod,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return OwnerAnalyticsState(
      data: data ?? this.data,
      selectedPeriod: selectedPeriod ?? this.selectedPeriod,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class OwnerAnalyticsNotifier extends StateNotifier<OwnerAnalyticsState> {
  final OwnerAnalyticsRepository _repository;
  final Ref _ref;

  OwnerAnalyticsNotifier(this._repository, this._ref) : super(OwnerAnalyticsState()) {
    _ref.listen<AuthState>(authProvider, (previous, next) {
      if (next.user == null || previous?.user?.id != next.user?.id) {
        state = OwnerAnalyticsState();
      }
    });
  }

  Future<void> fetchAnalytics({String? period, DateTime? startDate, DateTime? endDate}) async {
    final activePeriod = period ?? state.selectedPeriod;
    state = state.copyWith(isLoading: true, clearError: true, selectedPeriod: activePeriod);
    try {
      final res = await _repository.fetchAnalytics(period: activePeriod, startDate: startDate, endDate: endDate);
      if (mounted) {
        state = state.copyWith(data: res, isLoading: false);
      }
    } catch (e) {
      if (mounted) {
        state = state.copyWith(
          isLoading: false,
          error: e.toString().replaceFirst('Exception: ', ''),
        );
      }
    }
  }
}

final ownerAnalyticsProvider = StateNotifierProvider<OwnerAnalyticsNotifier, OwnerAnalyticsState>((ref) {
  final repo = ref.watch(ownerAnalyticsRepositoryProvider);
  return OwnerAnalyticsNotifier(repo, ref);
});

