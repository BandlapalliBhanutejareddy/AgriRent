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
  final String? selectedCategory;
  final String? searchQuery;
  final String? selectedSort;

  MarketplaceState({
    this.equipment = const [],
    this.isLoading = false,
    this.isFetchingMore = false,
    this.error,
    this.currentPage = 1,
    this.hasMore = true,
    this.selectedCategory,
    this.searchQuery,
    this.selectedSort,
  });

  MarketplaceState copyWith({
    List<Equipment>? equipment,
    bool? isLoading,
    bool? isFetchingMore,
    String? error,
    int? currentPage,
    bool? hasMore,
    bool clearError = false,
    String? selectedCategory,
    bool clearCategory = false,
    String? searchQuery,
    bool clearSearch = false,
    String? selectedSort,
    bool clearSort = false,
  }) {
    return MarketplaceState(
      equipment: equipment ?? this.equipment,
      isLoading: isLoading ?? this.isLoading,
      isFetchingMore: isFetchingMore ?? this.isFetchingMore,
      error: clearError ? null : (error ?? this.error),
      currentPage: currentPage ?? this.currentPage,
      hasMore: hasMore ?? this.hasMore,
      selectedCategory: clearCategory ? null : (selectedCategory ?? this.selectedCategory),
      searchQuery: clearSearch ? null : (searchQuery ?? this.searchQuery),
      selectedSort: clearSort ? null : (selectedSort ?? this.selectedSort),
    );
  }
}

class MarketplaceNotifier extends StateNotifier<MarketplaceState> {
  final MarketplaceRepository _repository;

  // Request counter to protect against stale asynchronous responses
  int _currentRequestId = 0;

  // Filters
  String? category;
  String? search;
  String? sort;

  MarketplaceNotifier(this._repository, {bool autoFetch = true})
      : super(MarketplaceState(isLoading: autoFetch)) {
    if (autoFetch) {
      Future.microtask(() => fetchInitial());
    }
  }

  Future<void> setCategory(String? newCategory) {
    if (newCategory == null || newCategory == 'ALL' || newCategory == 'All Categories' || newCategory.trim().isEmpty) {
      category = null;
      state = state.copyWith(clearCategory: true);
    } else {
      category = newCategory.trim();
      state = state.copyWith(selectedCategory: category);
    }
    return fetchInitial();
  }

  Future<void> updateFilters({
    String? newCategory,
    bool clearCategory = false,
    String? newSearch,
    bool clearSearch = false,
    String? newSort,
    bool clearSort = false,
  }) {
    if (clearCategory || newCategory == 'ALL' || newCategory == 'All Categories') {
      category = null;
    } else if (newCategory != null) {
      category = newCategory.trim().isEmpty ? null : newCategory.trim();
    }

    if (clearSearch) {
      search = null;
    } else if (newSearch != null) {
      search = newSearch.trim().isEmpty ? null : newSearch.trim();
    }

    if (clearSort) {
      sort = null;
    } else if (newSort != null) {
      sort = newSort.trim().isEmpty ? null : newSort.trim();
    }

    state = state.copyWith(
      selectedCategory: category,
      clearCategory: category == null,
      searchQuery: search,
      clearSearch: search == null,
      selectedSort: sort,
      clearSort: sort == null,
    );

    return fetchInitial();
  }

  Future<void> clearFilters() {
    category = null;
    search = null;
    sort = null;
    state = state.copyWith(
      clearCategory: true,
      clearSearch: true,
      clearSort: true,
    );
    return fetchInitial();
  }

  Future<void> refresh() => fetchInitial();

  Future<void> fetchInitial() async {
    final requestId = ++_currentRequestId;

    state = state.copyWith(
      equipment: [],
      isLoading: true,
      clearError: true,
      currentPage: 1,
      hasMore: true,
      selectedCategory: category,
      searchQuery: search,
      selectedSort: sort,
    );
    try {
      final result = await _repository.fetchEquipment(
        page: 1,
        category: category,
        search: search,
        sort: sort,
      );

      // Discard stale response if a newer search or filter was initiated
      if (requestId != _currentRequestId) {
        return;
      }

      final equipment = result['equipment'] as List<Equipment>;
      final totalPages = result['pagination']['totalPages'] as int;

      state = state.copyWith(
        equipment: equipment,
        isLoading: false,
        hasMore: 1 < totalPages,
        selectedCategory: category,
        searchQuery: search,
        selectedSort: sort,
      );
    } catch (e) {
      if (requestId != _currentRequestId) {
        return;
      }
      state = state.copyWith(equipment: [], isLoading: false, error: e.toString());
    }
  }

  Future<void> fetchMore() async {
    if (state.isLoading || state.isFetchingMore || !state.hasMore) return;

    final requestId = _currentRequestId;
    state = state.copyWith(isFetchingMore: true);
    final nextPage = state.currentPage + 1;

    try {
      final result = await _repository.fetchEquipment(
        page: nextPage,
        category: category,
        search: search,
        sort: sort,
      );

      // Discard if a new query generation has taken place
      if (requestId != _currentRequestId) {
        return;
      }

      final newEquipment = result['equipment'] as List<Equipment>;
      final totalPages = result['pagination']['totalPages'] as int;

      state = state.copyWith(
        equipment: [...state.equipment, ...newEquipment],
        isFetchingMore: false,
        currentPage: nextPage,
        hasMore: nextPage < totalPages,
      );
    } catch (e) {
      if (requestId != _currentRequestId) {
        return;
      }
      state = state.copyWith(isFetchingMore: false, error: e.toString());
    }
  }
}

final marketplaceProvider = StateNotifierProvider<MarketplaceNotifier, MarketplaceState>((ref) {
  final repo = ref.watch(marketplaceRepositoryProvider);
  return MarketplaceNotifier(repo);
});
