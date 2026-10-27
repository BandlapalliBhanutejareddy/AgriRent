import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../shared/theme/app_theme.dart';
import '../providers/marketplace_provider.dart';
import 'widgets/equipment_card.dart';

class FarmerMarketplaceScreen extends ConsumerStatefulWidget {
  final String? initialCategory;
  final String? initialEquipmentId;
  final String? initialBookId;

  const FarmerMarketplaceScreen({
    super.key,
    this.initialCategory,
    this.initialEquipmentId,
    this.initialBookId,
  });

  @override
  ConsumerState<FarmerMarketplaceScreen> createState() => _FarmerMarketplaceScreenState();
}

class _FarmerMarketplaceScreenState extends ConsumerState<FarmerMarketplaceScreen> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounceTimer;

  final List<String> _categories = [
    'ALL',
    'TRACTOR',
    'HARVESTER',
    'POWER_TILLERS',
    'SPRAYER',
    'IRRIGATION',
    'CULTIVATOR',
    'IMPLEMENTS',
  ];

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    if (widget.initialCategory != null && widget.initialCategory!.isNotEmpty) {
      final cat = widget.initialCategory == 'ALL' ? null : widget.initialCategory;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(marketplaceProvider.notifier).setCategory(cat);
      });
    }
    final targetEqId = widget.initialEquipmentId ?? widget.initialBookId;
    if (targetEqId != null && targetEqId.trim().isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          context.push('/equipment/${targetEqId.trim()}');
        }
      });
    }
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.hasClients &&
        _scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 250) {
      ref.read(marketplaceProvider.notifier).fetchMore();
    }
  }

  void _onSearch(String query) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 350), () {
      if (mounted) {
        ref.read(marketplaceProvider.notifier).updateFilters(newSearch: query.trim());
      }
    });
  }

  void _onSearchSubmitted(String query) {
    _debounceTimer?.cancel();
    ref.read(marketplaceProvider.notifier).updateFilters(newSearch: query.trim());
  }

  void _clearSearch() {
    _debounceTimer?.cancel();
    _searchController.clear();
    ref.read(marketplaceProvider.notifier).updateFilters(clearSearch: true);
  }

  void _onCategorySelected(String category) {
    ref.read(marketplaceProvider.notifier).setCategory(category == 'ALL' ? null : category);
  }

  void _showSortBottomSheet(BuildContext context, String lang) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final currentSort = ref.read(marketplaceProvider).selectedSort;

    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? AppTheme.darkBackground : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'sort_by'.tr(lang),
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _buildSortOption(ctx, 'sort_newest'.tr(lang), 'newest', currentSort),
                _buildSortOption(ctx, 'sort_price_low_high'.tr(lang), 'lowest_price', currentSort),
                _buildSortOption(ctx, 'sort_price_high_low'.tr(lang), 'highest_price', currentSort),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSortOption(BuildContext ctx, String label, String value, String? currentSort) {
    final isSelected = currentSort == value;
    return ListTile(
      title: Text(label, style: TextStyle(fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
      trailing: isSelected ? const Icon(Icons.check, color: AppTheme.primaryGreen) : null,
      onTap: () {
        ref.read(marketplaceProvider.notifier).updateFilters(newSort: value);
        Navigator.pop(ctx);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final state = ref.watch(marketplaceProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final selectedCategory = state.selectedCategory ?? 'ALL';
    final hasCategoryFilter = selectedCategory != 'ALL';

    final categoryTitle = hasCategoryFilter
        ? '${'marketplace'.tr(lang)} • ${AppLocalizations.localizedEquipmentCategory(selectedCategory, lang)}'
        : 'marketplace'.tr(lang);

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          categoryTitle,
          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
          overflow: TextOverflow.ellipsis,
        ),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        foregroundColor: isDark ? Colors.white : AppTheme.textDarkNavy,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        actions: [
          IconButton(
            icon: const Icon(Icons.favorite_rounded, color: AppTheme.primaryGreen),
            tooltip: 'saved_equipment'.tr(lang),
            onPressed: () => context.push('/saved'),
          ),
          IconButton(
            icon: const Icon(Icons.tune_rounded, color: AppTheme.primaryGreen),
            tooltip: 'sort_by'.tr(lang),
            onPressed: () => _showSortBottomSheet(context, lang),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // SEARCH BAR
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
              child: Container(
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.darkCard : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: TextField(
                  controller: _searchController,
                  onChanged: _onSearch,
                  onSubmitted: _onSearchSubmitted,
                  textInputAction: TextInputAction.search,
                  style: TextStyle(color: isDark ? Colors.white : AppTheme.textDarkNavy),
                  decoration: InputDecoration(
                    hintText: 'search_equipment'.tr(lang),
                    hintStyle: TextStyle(
                      color: isDark ? Colors.white38 : AppTheme.textMutedGray,
                      fontSize: 14,
                    ),
                    prefixIcon: const Icon(Icons.search_rounded, color: AppTheme.primaryGreen),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: _clearSearch,
                          )
                        : null,
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                ),
              ),
            ),

            // ACTIVE CATEGORY FILTER BANNER
            if (hasCategoryFilter)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.primaryGreen.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.filter_alt_rounded, size: 18, color: AppTheme.primaryGreen),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '${'category'.tr(lang)}: ${AppLocalizations.localizedEquipmentCategory(selectedCategory, lang)}',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primaryGreen,
                            fontSize: 13,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      InkWell(
                        onTap: () => ref.read(marketplaceProvider.notifier).setCategory(null),
                        borderRadius: BorderRadius.circular(8),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'clear'.tr(lang),
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.primaryGreen,
                                ),
                              ),
                              const SizedBox(width: 4),
                              const Icon(Icons.close_rounded, size: 16, color: AppTheme.primaryGreen),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // CATEGORY PILLS HORIZONTAL BAR
            SizedBox(
              height: 44,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: _categories.length,
                separatorBuilder: (context, index) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final cat = _categories[index];
                  final isSelected = selectedCategory == cat;
                  return InkWell(
                    onTap: () => _onCategorySelected(cat),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: isSelected ? AppTheme.primaryGreen : (isDark ? AppTheme.darkCard : Colors.white),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isSelected ? AppTheme.primaryGreen : (isDark ? Colors.white10 : Colors.grey.shade300),
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        cat == 'ALL' ? 'all'.tr(lang) : AppLocalizations.localizedEquipmentCategory(cat, lang),
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                          color: isSelected ? Colors.white : (isDark ? Colors.grey.shade300 : AppTheme.textDarkNavy),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 10),

            // EQUIPMENT LIST FEED
            Expanded(
              child: RefreshIndicator(
                color: AppTheme.primaryGreen,
                onRefresh: () => ref.read(marketplaceProvider.notifier).fetchInitial(),
                child: state.isLoading && state.equipment.isEmpty
                    ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
                    : state.error != null && state.equipment.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(24.0),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    'unable_to_load_equipment'.tr(lang).isNotEmpty
                                        ? 'unable_to_load_equipment'.tr(lang)
                                        : 'Failed to load equipment',
                                    style: TextStyle(color: isDark ? Colors.grey.shade400 : Colors.grey.shade700),
                                  ),
                                  const SizedBox(height: 12),
                                  ElevatedButton(
                                    onPressed: () => ref.read(marketplaceProvider.notifier).fetchInitial(),
                                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen),
                                    child: Text('retry'.tr(lang), style: const TextStyle(color: Colors.white)),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : state.equipment.isEmpty
                            ? Center(
                                child: Padding(
                                  padding: const EdgeInsets.all(24.0),
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.agriculture_outlined,
                                        size: 68,
                                        color: isDark ? Colors.grey.shade700 : Colors.grey.shade400,
                                      ),
                                      const SizedBox(height: 16),
                                      Text(
                                        (hasCategoryFilter && state.searchQuery != null && state.searchQuery!.isNotEmpty)
                                            ? 'no_equipment_search_in_category'
                                                .tr(lang)
                                                .replaceAll('{query}', state.searchQuery!)
                                                .replaceAll('{category}', AppLocalizations.localizedEquipmentCategory(selectedCategory, lang))
                                            : (state.searchQuery != null && state.searchQuery!.isNotEmpty)
                                                ? 'no_equipment_matching_query'
                                                    .tr(lang)
                                                    .replaceAll('{query}', state.searchQuery!)
                                                : hasCategoryFilter
                                                    ? '${'no_equipment_in_category'.tr(lang)}: ${AppLocalizations.localizedEquipmentCategory(selectedCategory, lang)}'
                                                    : 'no_equipment_found'.tr(lang),
                                        textAlign: TextAlign.center,
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                        ),
                                      ),
                                      const SizedBox(height: 16),
                                      if (hasCategoryFilter && state.searchQuery != null && state.searchQuery!.isNotEmpty)
                                        ElevatedButton.icon(
                                          onPressed: () {
                                            _clearSearch();
                                            ref.read(marketplaceProvider.notifier).clearFilters();
                                          },
                                          icon: const Icon(Icons.filter_alt_off_rounded, size: 18),
                                          label: Text('reset_filters'.tr(lang)),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: AppTheme.primaryGreen,
                                            foregroundColor: Colors.white,
                                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                          ),
                                        )
                                      else if (state.searchQuery != null && state.searchQuery!.isNotEmpty)
                                        ElevatedButton.icon(
                                          onPressed: _clearSearch,
                                          icon: const Icon(Icons.clear_rounded, size: 18),
                                          label: Text('clear_search'.tr(lang)),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: AppTheme.primaryGreen,
                                            foregroundColor: Colors.white,
                                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                          ),
                                        )
                                      else if (hasCategoryFilter)
                                        ElevatedButton.icon(
                                          onPressed: () => ref.read(marketplaceProvider.notifier).setCategory(null),
                                          icon: const Icon(Icons.clear_all_rounded, size: 18),
                                          label: Text('view_all_equipment'.tr(lang)),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: AppTheme.primaryGreen,
                                            foregroundColor: Colors.white,
                                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                          ),
                                        )
                                      else
                                        ElevatedButton.icon(
                                          onPressed: () => ref.read(marketplaceProvider.notifier).fetchInitial(),
                                          icon: const Icon(Icons.refresh_rounded, size: 18),
                                          label: Text('refresh'.tr(lang)),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: AppTheme.primaryGreen,
                                            foregroundColor: Colors.white,
                                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                              )
                            : ListView.separated(
                                controller: _scrollController,
                                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                                itemCount: state.equipment.length + (state.isFetchingMore ? 1 : 0),
                                separatorBuilder: (context, index) => const SizedBox(height: 14),
                                itemBuilder: (context, index) {
                                  if (index >= state.equipment.length) {
                                    return const Center(
                                      child: Padding(
                                        padding: EdgeInsets.all(16),
                                        child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primaryGreen),
                                      ),
                                    );
                                  }
                                  final item = state.equipment[index];
                                  return EquipmentCard(
                                    equipment: item,
                                  );
                                },
                              ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
