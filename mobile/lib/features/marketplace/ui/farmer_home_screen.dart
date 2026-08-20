import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/marketplace_provider.dart';

class FarmerHomeScreen extends ConsumerStatefulWidget {
  const FarmerHomeScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<FarmerHomeScreen> createState() => _FarmerHomeScreenState();
}

class _FarmerHomeScreenState extends ConsumerState<FarmerHomeScreen> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();
  final List<String> _categories = ['ALL', 'TRACTOR', 'HARVESTER', 'IMPLEMENTS'];
  String _selectedCategory = 'ALL';

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      ref.read(marketplaceProvider.notifier).fetchMore();
    }
  }

  void _onSearch(String query) {
    ref.read(marketplaceProvider.notifier).updateFilters(newSearch: query);
  }

  void _onCategorySelected(String category) {
    setState(() {
      _selectedCategory = category;
    });
    ref.read(marketplaceProvider.notifier).updateFilters(newCategory: category == 'ALL' ? null : category);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(marketplaceProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Marketplace'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () {
              // TODO: Navigate to Profile
            },
          )
        ],
      ),
      body: Column(
        children: [
          // Search & Filters
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search equipment...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        _onSearch('');
                      },
                    ),
                  ),
                  onSubmitted: _onSearch,
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 40,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: _categories.length,
                    itemBuilder: (context, index) {
                      final cat = _categories[index];
                      final isSelected = _selectedCategory == cat;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8.0),
                        child: ChoiceChip(
                          label: Text(cat),
                          selected: isSelected,
                          onSelected: (selected) {
                            if (selected) _onCategorySelected(cat);
                          },
                          selectedColor: Theme.of(context).primaryColor,
                          labelStyle: TextStyle(color: isSelected ? Colors.white : Colors.black87),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
          
          // Equipment List
          Expanded(
            child: state.isLoading && state.equipment.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : state.error != null && state.equipment.isEmpty
                    ? Center(child: Text(state.error!, style: const TextStyle(color: Colors.red)))
                    : state.equipment.isEmpty
                        ? const Center(child: Text('No equipment found in the marketplace.'))
                        : RefreshIndicator(
                            onRefresh: () => ref.read(marketplaceProvider.notifier).fetchInitial(),
                            child: ListView.builder(
                              controller: _scrollController,
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              itemCount: state.equipment.length + (state.isFetchingMore ? 1 : 0),
                              itemBuilder: (context, index) {
                                if (index == state.equipment.length) {
                                  return const Padding(
                                    padding: EdgeInsets.all(16.0),
                                    child: Center(child: CircularProgressIndicator()),
                                  );
                                }
                                
                                final item = state.equipment[index];
                                return Card(
                                  margin: const EdgeInsets.only(bottom: 16),
                                  child: InkWell(
                                    onTap: () {
                                      // Navigate to equipment details
                                    },
                                    borderRadius: BorderRadius.circular(16),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.stretch,
                                      children: [
                                        ClipRRect(
                                          borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                                          child: item.imageUrl.isNotEmpty
                                            ? Image.network(
                                                item.imageUrl,
                                                height: 160,
                                                fit: BoxFit.cover,
                                                errorBuilder: (context, error, stack) => _buildPlaceholder(),
                                              )
                                            : _buildPlaceholder(),
                                        ),
                                        Padding(
                                          padding: const EdgeInsets.all(16.0),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                children: [
                                                  Expanded(
                                                    child: Text(
                                                      item.title,
                                                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                                      maxLines: 1,
                                                      overflow: TextOverflow.ellipsis,
                                                    ),
                                                  ),
                                                  Text(
                                                    '₹${item.pricePerDay}/day',
                                                    style: TextStyle(
                                                      fontSize: 16,
                                                      fontWeight: FontWeight.bold,
                                                      color: Theme.of(context).primaryColor,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              const SizedBox(height: 8),
                                              Row(
                                                children: [
                                                  const Icon(Icons.person, size: 16, color: Colors.grey),
                                                  const SizedBox(width: 4),
                                                  Text(item.owner?.name ?? 'Unknown Owner', style: const TextStyle(color: Colors.grey)),
                                                  const Spacer(),
                                                  if (item.location != null) ...[
                                                    const Icon(Icons.location_on, size: 16, color: Colors.grey),
                                                    const SizedBox(width: 4),
                                                    Text(item.location!, style: const TextStyle(color: Colors.grey)),
                                                  ]
                                                ],
                                              )
                                            ],
                                          ),
                                        )
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      height: 160,
      color: Colors.grey.shade200,
      child: const Icon(Icons.agriculture, size: 60, color: Colors.grey),
    );
  }
}
