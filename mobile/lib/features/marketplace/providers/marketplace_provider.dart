import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../models/equipment.dart';
import '../repository/marketplace_repository.dart';

final marketplaceRepositoryProvider = Provider((ref) => MarketplaceRepository());

class MarketplaceState {
  final List<Equipment> equipment;
  final bool isLoading;
  final bool isFetchingMore;
  final String? error;
  final int currentPage;
  final bool hasMore;

  MarketplaceState({
    this.equipment = const [],
    this.isLoading = false,
    this.isFetchingMore = false,
    this.error,
    this.currentPage = 1,
    this.hasMore = true,
  });

  MarketplaceState copyWith({
    List<Equipment>? equipment,
    bool? isLoading,
    bool? isFetchingMore,
    String? error,
    int? currentPage,
    bool? hasMore,
    bool clearError = false,
  }) {
    return MarketplaceState(
      equipment: equipment ?? this.equipment,
      isLoading: isLoading ?? this.isLoading,
      isFetchingMore: isFetchingMore ?? this.isFetchingMore,
      error: clearError ? null : (error ?? this.error),
      currentPage: currentPage ?? this.currentPage,
      hasMore: hasMore ?? this.hasMore,
    );
  }
}

class MarketplaceNotifier extends StateNotifier<MarketplaceState> {
  final MarketplaceRepository _repository;
  
  // Filters
  String? category;
  String? search;
  String? sort;

  MarketplaceNotifier(this._repository) : super(MarketplaceState()) {
    fetchInitial();
  }

  void updateFilters({String? newCategory, String? newSearch, String? newSort}) {
    category = newCategory ?? category;
    search = newSearch ?? search;
    sort = newSort ?? sort;
    fetchInitial();
  }

  void clearFilters() {
    category = null;
    search = null;
    sort = null;
    fetchInitial();
  }

  Future<void> fetchInitial() async {
    state = state.copyWith(isLoading: true, clearError: true, currentPage: 1, hasMore: true);
    try {
      final result = await _repository.fetchEquipment(
        page: 1,
        category: category,
        search: search,
        sort: sort,
      );
      
      final equipment = result['equipment'] as List<Equipment>;
      final totalPages = result['pagination']['totalPages'] as int;

      state = state.copyWith(
        equipment: equipment,
        isLoading: false,
        hasMore: 1 < totalPages,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> fetchMore() async {
    if (state.isLoading || state.isFetchingMore || !state.hasMore) return;

    state = state.copyWith(isFetchingMore: true);
    final nextPage = state.currentPage + 1;

    try {
      final result = await _repository.fetchEquipment(
        page: nextPage,
        category: category,
        search: search,
        sort: sort,
      );
      
      final newEquipment = result['equipment'] as List<Equipment>;
      final totalPages = result['pagination']['totalPages'] as int;

      state = state.copyWith(
        equipment: [...state.equipment, ...newEquipment],
        isFetchingMore: false,
        currentPage: nextPage,
        hasMore: nextPage < totalPages,
      );
    } catch (e) {
      state = state.copyWith(isFetchingMore: false, error: e.toString());
    }
  }
}

final marketplaceProvider = StateNotifierProvider<MarketplaceNotifier, MarketplaceState>((ref) {
  final repo = ref.watch(marketplaceRepositoryProvider);
  return MarketplaceNotifier(repo);
});
