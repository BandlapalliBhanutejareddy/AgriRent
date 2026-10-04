import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../shared/theme/app_theme.dart';
import '../providers/marketplace_provider.dart';
import 'widgets/equipment_card.dart';

class FarmerMarketplaceScreen extends ConsumerStatefulWidget {
  const FarmerMarketplaceScreen({super.key});

  @override
  ConsumerState<FarmerMarketplaceScreen> createState() => _FarmerMarketplaceScreenState();
}

class _FarmerMarketplaceScreenState extends ConsumerState<FarmerMarketplaceScreen> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();

  final List<String> _categories = [
    'ALL',
    'TRACTOR',
    'HARVESTER',
    'TILLER',
    'SPRAYER',
    'IMPLEMENTS',
    'ROTAVATOR',
    'THRESHER',
  ];

  String _selectedCategory = 'ALL';
  String? _selectedSort;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
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
    ref.read(marketplaceProvider.notifier).updateFilters(newSearch: query.trim());
  }

  void _onCategorySelected(String category) {
    setState(() {
      _selectedCategory = category;
    });
    ref.read(marketplaceProvider.notifier).updateFilters(
      newCategory: category == 'ALL' ? null : category,
    );
  }

  void _showSortBottomSheet(BuildContext context, String lang) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

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
                _buildSortOption(ctx, 'sort_newest'.tr(lang), 'createdAt:desc'),
                _buildSortOption(ctx, 'sort_price_low_high'.tr(lang), 'price:asc'),
                _buildSortOption(ctx, 'sort_price_high_low'.tr(lang), 'price:desc'),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSortOption(BuildContext ctx, String label, String value) {
    final isSelected = _selectedSort == value;
    return ListTile(
      title: Text(label, style: TextStyle(fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
      trailing: isSelected ? const Icon(Icons.check, color: AppTheme.primaryGreen) : null,
      onTap: () {
        setState(() => _selectedSort = value);
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

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Marketplace', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20)),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        foregroundColor: isDark ? Colors.white : AppTheme.textDarkNavy,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        actions: [
          IconButton(
            icon: const Icon(Icons.tune_rounded, color: AppTheme.primaryGreen),
            onPressed: () => _showSortBottomSheet(context, lang),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppTheme.primaryGreen,
        onRefresh: () async {
          ref.read(marketplaceProvider.notifier).fetchInitial();
        },
        child: Column(
          children: [
            // SEARCH BAR
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
              child: Container(
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.darkCard : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: TextField(
                  controller: _searchController,
                  onChanged: _onSearch,
                  decoration: InputDecoration(
                    hintText: 'Search equipment...',
                    hintStyle: TextStyle(fontSize: 14, color: isDark ? Colors.grey.shade500 : Colors.grey.shade400),
                    prefixIcon: Icon(Icons.search, color: isDark ? Colors.grey.shade400 : Colors.grey.shade500, size: 22),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              _onSearch('');
                            },
                          )
                        : null,
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
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
                  final isSelected = _selectedCategory == cat;
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
                        cat[0] + cat.substring(1).toLowerCase(),
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
            const SizedBox(height: 12),

            // EQUIPMENT LIST FEED
            Expanded(
              child: state.isLoading && state.equipment.isEmpty
                  ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
                  : state.error != null && state.equipment.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text('Unable to load equipment', style: TextStyle(color: isDark ? Colors.grey.shade400 : Colors.grey.shade700)),
                              const SizedBox(height: 12),
                              ElevatedButton(
                                onPressed: () => ref.read(marketplaceProvider.notifier).fetchInitial(),
                                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen),
                                child: const Text('Retry', style: TextStyle(color: Colors.white)),
                              ),
                            ],
                          ),
                        )
                      : state.equipment.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.agriculture_outlined, size: 64, color: isDark ? Colors.grey.shade700 : Colors.grey.shade300),
                                  const SizedBox(height: 16),
                                  Text('No equipment found', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: isDark ? Colors.white : AppTheme.textDarkNavy)),
                                ],
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
          ],
        ),
      ),
    );
  }
}
