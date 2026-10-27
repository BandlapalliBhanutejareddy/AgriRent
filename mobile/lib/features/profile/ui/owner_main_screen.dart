import 'owner_booking_detail_screen.dart';
import '../../../core/services/call_relay_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import '../providers/owner_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/localization/app_localizations.dart';
import '../../ai_assistant/ui/voice_interaction_modal.dart';
import 'owner_home_screen.dart';
import '../../notifications/providers/notification_provider.dart';
import '../../marketplace/ui/chat_screen.dart';
import '../../../models/equipment.dart';
import '../../../models/booking.dart';

import 'owner_more_screen.dart';
import '../../auth/providers/auth_provider.dart';

class OwnerMainScreen extends ConsumerStatefulWidget {
  const OwnerMainScreen({super.key});

  @override
  ConsumerState<OwnerMainScreen> createState() => _OwnerMainScreenState();
}

class _OwnerMainScreenState extends ConsumerState<OwnerMainScreen> {
  List<Widget> _buildScreens() {
    return [
      OwnerHomeScreen(
        key: const ValueKey('owner_home_tab'),
        onNavigateTab: (index) {
          if (mounted) {
            ref.read(ownerTabIndexProvider.notifier).state = index;
            if (index == 1 || index == 2) {
              ref.read(ownerProvider.notifier).fetchDashboardData();
            }
          }
        },
      ),
      const _OwnerEquipmentTab(key: ValueKey('owner_equipment_tab')),
      const _OwnerBookingsTab(key: ValueKey('owner_bookings_tab')),
      OwnerMoreScreen(
        key: const ValueKey('owner_more_tab'),
        onNavigateTab: (index) {
          if (mounted) {
            ref.read(ownerTabIndexProvider.notifier).state = index;
            if (index == 1 || index == 2) {
              ref.read(ownerProvider.notifier).fetchDashboardData();
            }
          }
        },
      ),
    ];
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(ownerProvider.notifier).fetchDashboardData();
    });
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final authUser = ref.watch(authProvider).user;

    if (authUser != null && authUser.isSuspended) {
      return Scaffold(
        backgroundColor: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
        appBar: AppBar(
          title: Text('account_restricted'.tr(lang)),
          backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
          automaticallyImplyLeading: false,
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(28.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.red.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.gavel_rounded, size: 56, color: Color(0xFFD32F2F)),
                ),
                const SizedBox(height: 20),
                Text(
                  'account_restricted'.tr(lang),
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'account_restricted_explanation'.tr(lang),
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: isDark ? Colors.white70 : AppTheme.textMutedGray,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 28),
                ElevatedButton.icon(
                  onPressed: () => context.push('/feedback'),
                  icon: const Icon(Icons.support_agent_rounded),
                  label: Text('submit_resolution_request'.tr(lang)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryGreen,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () => ref.read(authProvider.notifier).logout(),
                  child: Text('logout'.tr(lang), style: const TextStyle(color: Color(0xFFD32F2F), fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final activeIndex = ref.watch(ownerTabIndexProvider);

    return PopScope(
      canPop: activeIndex == 0,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) {
          ref.read(ownerTabIndexProvider.notifier).state = 0;
        }
      },
      child: Scaffold(
        backgroundColor: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
        body: IndexedStack(
          sizing: StackFit.expand,
          index: activeIndex,
          children: _buildScreens(),
        ),
        floatingActionButton: activeIndex == 1
            ? FloatingActionButton.extended(
                onPressed: () => context.push('/add-equipment'),
                backgroundColor: AppTheme.primaryGreen,
                icon: const Icon(Icons.add_rounded, color: Colors.white),
                label: Text(
                  'add_equipment'.tr(lang),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              )
            : null,
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkCard : Colors.white,
            border: Border(
              top: BorderSide(
                color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
                width: 1,
              ),
            ),
          ),
          child: NavigationBar(
            selectedIndex: activeIndex,
            backgroundColor: Colors.transparent,
            indicatorColor: const Color(0xFFD97706).withValues(alpha: 0.15),
            elevation: 0,
            onDestinationSelected: (index) {
              ref.read(ownerTabIndexProvider.notifier).state = index;
              if (index == 1 || index == 2) {
                ref.read(ownerProvider.notifier).fetchDashboardData();
              }
            },
            destinations: [
              NavigationDestination(
                icon: const Icon(Icons.dashboard_outlined),
                selectedIcon: const Icon(Icons.dashboard_rounded, color: Color(0xFFD97706)),
                label: 'home'.tr(lang),
              ),
              NavigationDestination(
                icon: const Icon(Icons.agriculture_outlined),
                selectedIcon: const Icon(Icons.agriculture_rounded, color: Color(0xFFD97706)),
                label: 'equipment'.tr(lang),
              ),
              NavigationDestination(
                icon: const Icon(Icons.receipt_long_outlined),
                selectedIcon: const Icon(Icons.receipt_long_rounded, color: Color(0xFFD97706)),
                label: 'bookings'.tr(lang),
              ),
              NavigationDestination(
                icon: const Icon(Icons.person_outline_rounded),
                selectedIcon: const Icon(Icons.person_rounded, color: Color(0xFFD97706)),
                label: 'profile'.tr(lang),
              ),
            ],
          ),
        ),
      ),
    );
  }
}




// -----------------------------------------------------------------------------
// OWNER FLEET / EQUIPMENT TAB
// -----------------------------------------------------------------------------
class _OwnerEquipmentTab extends ConsumerStatefulWidget {
  const _OwnerEquipmentTab({super.key});

  @override
  ConsumerState<_OwnerEquipmentTab> createState() => _OwnerEquipmentTabState();
}

class _OwnerEquipmentTabState extends ConsumerState<_OwnerEquipmentTab> {
  String _selectedCategory = 'ALL';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  final List<String> _categories = [
    'ALL',
    'TRACTORS_AND_POWER_UNITS',
    'LAND_PREPARATION',
    'SEEDING_AND_PLANTING',
    'CROP_CARE_AND_INTERCULTURE',
    'IRRIGATION_EQUIPMENT',
    'HARVESTING_EQUIPMENT',
    'THRESHING_AND_POST_HARVEST',
    'MATERIAL_HANDLING_AND_TRANSPORT',
    'SOIL_TESTING_AND_TOOLS',
    'CROP_PROCESSING',
    'STORAGE_EQUIPMENT',
    'HAND_TOOLS',
    'SPECIALIZED_CROP_EQUIPMENT',
    'SAFETY_AND_ACCESSORIES',
    'TRACTOR',
    'HARVESTER',
    'SEEDER',
    'PLOUGH',
    'CULTIVATOR',
    'SPRAYER',
    'OTHER',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (ref.read(ownerProvider).myEquipment.isEmpty) {
        ref.read(ownerProvider.notifier).fetchDashboardData();
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ownerState = ref.watch(ownerProvider);
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final unread = ref.watch(unreadNotificationsCountProvider);

    final availabilityFilter = ref.watch(ownerEquipmentAvailabilityFilterProvider);

    final filteredList = ownerState.myEquipment.where((item) {
      if (availabilityFilter == 'AVAILABLE' && !item.available) return false;
      if (availabilityFilter == 'UNAVAILABLE' && item.available) return false;

      final itemCat = item.category.trim().toUpperCase().replaceAll('_', '');
      final selCat = _selectedCategory.trim().toUpperCase().replaceAll('_', '');
      final matchesCat = _selectedCategory == 'ALL' ||
          itemCat == selCat ||
          itemCat == '${selCat}S' ||
          '${itemCat}S' == selCat ||
          (selCat.contains('TRACTOR') && itemCat.contains('TRACTOR')) ||
          (selCat.contains('HARVEST') && itemCat.contains('HARVEST')) ||
          (selCat.contains('SEED') && itemCat.contains('SEED')) ||
          (selCat.contains('SPRAY') && itemCat.contains('SPRAY')) ||
          (selCat.contains('PLOUGH') && itemCat.contains('PLOUGH')) ||
          (selCat.contains('CULTIVAT') && itemCat.contains('CULTIVAT')) ||
          (selCat.contains('IRRIGAT') && itemCat.contains('IRRIGAT'));
      final matchesSearch = _searchQuery.isEmpty ||
          item.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          item.category.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          (item.location != null && item.location!.toLowerCase().contains(_searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    }).toList();

    debugPrint('[EQUIP_TAB] myEquipment=${ownerState.myEquipment.length}, filtered=${filteredList.length}, availabilityFilter=$availabilityFilter');

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
      appBar: _buildAppBar(isDark, lang, unread),
      body: RefreshIndicator(
        color: AppTheme.primaryGreen,
        onRefresh: () => ref.read(ownerProvider.notifier).fetchDashboardData(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Search & Category Filter Bar
              _buildFilterBar(isDark, lang, availabilityFilter),
              const SizedBox(height: 10),

              // Active Availability Filter Indicator with Clear action
              if (availabilityFilter != 'ALL')
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: availabilityFilter == 'AVAILABLE'
                        ? const Color(0xFFE8F5E9)
                        : const Color(0xFFFFEBEE),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: availabilityFilter == 'AVAILABLE'
                          ? const Color(0xFFA5D6A7)
                          : const Color(0xFFFFCDD2),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        availabilityFilter == 'AVAILABLE'
                            ? Icons.check_circle_outline_rounded
                            : Icons.highlight_off_rounded,
                        size: 18,
                        color: availabilityFilter == 'AVAILABLE'
                            ? const Color(0xFF2E7D32)
                            : const Color(0xFFC62828),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          availabilityFilter == 'AVAILABLE'
                              ? 'Showing Available Equipment Only (${filteredList.length})'
                              : 'Showing Unavailable Equipment Only (${filteredList.length})',
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w700,
                            color: availabilityFilter == 'AVAILABLE'
                                ? const Color(0xFF1B5E20)
                                : const Color(0xFFB71C1C),
                          ),
                        ),
                      ),
                      InkWell(
                        onTap: () {
                          ref.read(ownerEquipmentAvailabilityFilterProvider.notifier).state = 'ALL';
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(8),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4),
                            ],
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.close_rounded, size: 14, color: Colors.grey),
                              SizedBox(width: 4),
                              Text(
                                'Clear',
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black87),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

              // Equipment List Body
              if (ownerState.isLoading && ownerState.myEquipment.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 80),
                  child: Center(
                    child: CircularProgressIndicator(color: AppTheme.primaryGreen),
                  ),
                )
              else if (ownerState.error != null && ownerState.myEquipment.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 60),
                  child: _buildErrorView(ownerState.error!, isDark, lang),
                )
              else if (filteredList.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 60),
                  child: _buildEmptyState(ownerState.myEquipment.isEmpty, isDark, lang),
                )
              else
                ...filteredList.map((item) => _buildEquipmentCard(item, ownerState, isDark, lang)),
            ],
          ),
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(bool isDark, String lang, int unread) {
    return AppBar(
      backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
      elevation: 0,
      scrolledUnderElevation: 1,
      surfaceTintColor: Colors.transparent,
      title: Text(
        'fleet_management'.tr(lang),
        style: TextStyle(
          fontWeight: FontWeight.w800,
          fontSize: 18,
          color: isDark ? Colors.white : AppTheme.textDarkNavy,
        ),
      ),
      actions: [
        IconButton(
          icon: Stack(
            clipBehavior: Clip.none,
            children: [
              Icon(
                Icons.notifications_outlined,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
                size: 24,
              ),
              if (unread > 0)
                Positioned(
                  right: -2,
                  top: -2,
                  child: Container(
                    padding: const EdgeInsets.all(3),
                    decoration: const BoxDecoration(
                      color: Color(0xFFE53935),
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(minWidth: 14, minHeight: 14),
                    child: Text(
                      '$unread',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
          onPressed: () => context.push('/notifications'),
        ),
        IconButton(
          icon: Icon(
            Icons.refresh_rounded,
            color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
          ),
          onPressed: () => ref.read(ownerProvider.notifier).fetchDashboardData(),
        ),
      ],
    );
  }

  Widget _buildFilterBar(bool isDark, String lang, String availabilityFilter) {
    return Container(
      color: isDark ? AppTheme.darkCard : Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 42,
            decoration: BoxDecoration(
              color: isDark ? AppTheme.darkBackground : const Color(0xFFF4F6F5),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isDark ? Colors.white12 : const Color(0xFFE0E0E0),
              ),
            ),
            child: TextField(
              controller: _searchController,
              onChanged: (val) => setState(() => _searchQuery = val),
              style: TextStyle(
                fontSize: 14,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
              decoration: InputDecoration(
                hintText: 'search'.tr(lang),
                hintStyle: TextStyle(
                  color: isDark ? Colors.white38 : AppTheme.textMutedGray,
                  fontSize: 13.5,
                ),
                prefixIcon: Icon(
                  Icons.search_rounded,
                  size: 20,
                  color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                ),
                suffixIcon: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (_searchQuery.isNotEmpty)
                      IconButton(
                        icon: const Icon(Icons.clear_rounded, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                      ),
                    IconButton(
                      icon: const Icon(Icons.mic_rounded, color: AppTheme.primaryGreen, size: 20),
                      onPressed: () {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (ctx) => VoiceInteractionModal(
                            onQuerySubmitted: (query) {
                              _searchController.text = query;
                              if (mounted) setState(() => _searchQuery = query);
                            },
                          ),
                        );
                      },
                    ),
                  ],
                ),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
              ),
            ),
          ),
          const SizedBox(height: 10),
          // Availability Quick Toggle
          Row(
            children: [
              _buildAvailabilityChip('ALL', 'all_equipment'.tr(lang).isEmpty || 'all_equipment'.tr(lang) == 'all_equipment' ? 'All' : 'all_equipment'.tr(lang), availabilityFilter, isDark),
              const SizedBox(width: 8),
              _buildAvailabilityChip('AVAILABLE', 'available'.tr(lang), availabilityFilter, isDark),
              const SizedBox(width: 8),
              _buildAvailabilityChip('UNAVAILABLE', 'unavailable'.tr(lang), availabilityFilter, isDark),
            ],
          ),
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _categories.map((cat) {
                final isSelected = _selectedCategory == cat;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(
                      cat == 'ALL' ? 'all'.tr(lang) : AppLocalizations.localizedEquipmentCategory(cat, lang),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        color: isSelected
                            ? Colors.white
                            : (isDark ? Colors.white70 : AppTheme.textDarkNavy),
                      ),
                    ),
                    selected: isSelected,
                    selectedColor: AppTheme.primaryGreen,
                    backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF1F5F2),
                    showCheckmark: false,
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: BorderSide(
                        color: isSelected
                            ? AppTheme.primaryGreen
                            : (isDark ? Colors.white10 : Colors.transparent),
                      ),
                    ),
                    onSelected: (_) => setState(() => _selectedCategory = cat),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvailabilityChip(String filterKey, String label, String activeFilter, bool isDark) {
    final isSelected = activeFilter == filterKey;
    Color activeColor;
    if (filterKey == 'AVAILABLE') {
      activeColor = const Color(0xFF2E7D32);
    } else if (filterKey == 'UNAVAILABLE') {
      activeColor = const Color(0xFFC62828);
    } else {
      activeColor = AppTheme.primaryGreen;
    }

    return ChoiceChip(
      label: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
          color: isSelected ? Colors.white : (isDark ? Colors.white70 : AppTheme.textDarkNavy),
        ),
      ),
      selected: isSelected,
      selectedColor: activeColor,
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF1F5F2),
      showCheckmark: false,
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isSelected ? activeColor : (isDark ? Colors.white12 : Colors.grey.shade300),
        ),
      ),
      onSelected: (_) => ref.read(ownerEquipmentAvailabilityFilterProvider.notifier).state = filterKey,
    );
  }

  Widget _buildEquipmentCard(Equipment item, OwnerState ownerState, bool isDark, String lang) {
    debugPrint('[BUILD_EQUIP_CARD] starting for ${item.id} - ${item.title}');
    try {
      final isActionPending = ownerState.isEquipmentActionPending(item.id);
      final localizedCat = AppLocalizations.localizedEquipmentCategory(item.category, lang);

      return Container(
      key: ValueKey('equipment_card_${item.id}'),
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          InkWell(
            onTap: () => context.push('/equipment-detail', extra: item),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Machine Thumbnail
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      width: 76,
                      height: 76,
                      color: isDark ? AppTheme.darkBackground : const Color(0xFFF1F5F2),
                      child: item.imageUrl.isNotEmpty
                          ? Image.network(
                              item.imageUrl,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) => const Icon(
                                Icons.agriculture_rounded,
                                size: 36,
                                color: AppTheme.primaryGreen,
                              ),
                            )
                          : const Icon(
                              Icons.agriculture_rounded,
                              size: 36,
                              color: AppTheme.primaryGreen,
                            ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  // Machine Info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                localizedCat,
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.primaryGreen,
                                ),
                              ),
                            ),
                            const Spacer(),
                            // Availability Switch
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  item.available
                                      ? 'available'.tr(lang)
                                      : 'unavailable'.tr(lang),
                                  style: TextStyle(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w600,
                                    color: item.available
                                        ? const Color(0xFF2E7D32)
                                        : Colors.red.shade400,
                                  ),
                                ),
                                SizedBox(
                                  height: 28,
                                  width: 44,
                                  child: FittedBox(
                                    fit: BoxFit.contain,
                                    child: Switch(
                                      value: item.available,
                                      activeThumbColor: AppTheme.primaryGreen,
                                      onChanged: isActionPending
                                          ? null
                                          : (val) async {
                                              final success = await ref
                                                  .read(ownerProvider.notifier)
                                                  .updateEquipmentAvailability(item.id, val);
                                              if (mounted) {
                                                ScaffoldMessenger.of(context).showSnackBar(
                                                  SnackBar(
                                                    content: Text(
                                                      success
                                                          ? 'availability_updated'.tr(lang)
                                                          : 'failed_to_update_availability'.tr(lang),
                                                      style: const TextStyle(fontWeight: FontWeight.w600),
                                                    ),
                                                    backgroundColor: success ? AppTheme.primaryGreen : const Color(0xFFC62828),
                                                    behavior: SnackBarBehavior.floating,
                                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                                  ),
                                                );
                                              }
                                            },
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          item.title,
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white : AppTheme.textDarkNavy,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Text(
                              item.pricePerDay != null
                                  ? '₹${item.pricePerDay!.toStringAsFixed(0)}'
                                  : 'not_available'.tr(lang),
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                color: AppTheme.primaryGreen,
                              ),
                            ),
                            Text(
                              ' / ${'day'.tr(lang)}',
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                              ),
                            ),
                            if (item.location != null && item.location!.isNotEmpty) ...[
                              const SizedBox(width: 8),
                              const Text('•', style: TextStyle(color: Colors.grey)),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  item.location!,
                                  style: TextStyle(
                                    fontSize: 11.5,
                                    color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Card Action Buttons
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: isDark
                  ? AppTheme.darkBackground.withValues(alpha: 0.5)
                  : const Color(0xFFFAFAFA),
              borderRadius: const BorderRadius.vertical(bottom: Radius.circular(18)),
              border: Border(
                top: BorderSide(
                  color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05),
                ),
              ),
            ),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  TextButton.icon(
                    onPressed: () => context.push('/equipment-detail', extra: item),
                    icon: const Icon(Icons.visibility_outlined, size: 16, color: AppTheme.primaryGreen),
                    label: Text(
                      'view_details'.tr(lang),
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.primaryGreen,
                      ),
                    ),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton.icon(
                    onPressed: isActionPending
                        ? null
                        : () => _confirmDeleteEquipment(item, isDark, lang),
                    icon: const Icon(Icons.delete_outline_rounded, size: 16, color: Color(0xFFD32F2F)),
                    label: Text(
                      'delete'.tr(lang),
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFFD32F2F),
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFFFFCDD2)),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton.icon(
                    onPressed: isActionPending
                        ? null
                        : () => context.push('/edit-equipment', extra: item),
                    icon: const Icon(Icons.edit_rounded, size: 16, color: Colors.white),
                    label: Text(
                      'edit'.tr(lang),
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryGreen,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
    } catch (e, stack) {
      debugPrint('[EQUIP_CARD_ERR] Failed building card for ${item.id}: $e\n$stack');
      return Container(
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.amber.shade100,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.amber.shade700),
        ),
        child: Text(
          'Error displaying equipment (${item.title}): $e',
          style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.bold),
        ),
      );
    }
  }

  void _confirmDeleteEquipment(Equipment item, bool isDark, String lang) async {
    if (ref.read(ownerProvider).isEquipmentActionPending(item.id)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('equipment_action_in_progress'.tr(lang)),
          backgroundColor: const Color(0xFFC62828),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Row(
          children: [
            const Icon(Icons.warning_amber_rounded, color: Color(0xFFD32F2F), size: 24),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'delete_equipment'.tr(lang),
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
              ),
            ),
          ],
        ),
        content: Text(
          'delete_equipment_confirm'.tr(lang),
          style: TextStyle(
            fontSize: 13.5,
            color: isDark ? Colors.white70 : AppTheme.textMutedGray,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(
              'cancel'.tr(lang),
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white60 : AppTheme.textMutedGray,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFD32F2F),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text(
              'delete'.tr(lang),
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      final success = await ref.read(ownerProvider.notifier).deleteEquipment(item.id);
      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'equipment_deleted_success'.tr(lang),
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              backgroundColor: AppTheme.primaryGreen,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          );
        } else {
          final err = ref.read(ownerProvider).error;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                err ?? 'failed_to_delete_equipment'.tr(lang),
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              backgroundColor: const Color(0xFFC62828),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    }
  }

  Widget _buildEmptyState(bool isZeroEquipment, bool isDark, String lang) {
    if (!isZeroEquipment) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  color: isDark
                      ? AppTheme.darkCard
                      : AppTheme.primaryGreen.withValues(alpha: 0.08),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.filter_alt_off_rounded,
                  size: 48,
                  color: AppTheme.primaryGreen,
                ),
              ),
              const SizedBox(height: 18),
              Text(
                'no_equipment_found_matching_filter'.tr(lang),
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () {
                  setState(() {
                    _selectedCategory = 'ALL';
                    _searchQuery = '';
                  });
                },
                icon: const Icon(Icons.clear_all_rounded, size: 18),
                label: Text('clear_filters'.tr(lang)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryGreen,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                color: isDark
                    ? AppTheme.darkCard
                    : AppTheme.primaryGreen.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.inventory_2_outlined,
                size: 48,
                color: AppTheme.primaryGreen,
              ),
            ),
            const SizedBox(height: 18),
            Text(
              'no_equipment_added_yet'.tr(lang),
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'add_first_equipment_prompt'.tr(lang),
              style: TextStyle(
                fontSize: 13,
                height: 1.4,
                color: isDark ? Colors.white60 : AppTheme.textMutedGray,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () => context.push('/add-equipment'),
              icon: const Icon(Icons.add_rounded, size: 18),
              label: Text('add_equipment'.tr(lang)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryGreen,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorView(String error, bool isDark, String lang) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.cloud_off_rounded, size: 48, color: Colors.red.shade400),
            const SizedBox(height: 14),
            Text(
              'unable_to_load_equipment'.tr(lang),
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => ref.read(ownerProvider.notifier).fetchDashboardData(),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryGreen,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text('retry'.tr(lang)),
            ),
          ],
        ),
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// OWNER BOOKINGS & RENTAL LIFECYCLE TAB
// -----------------------------------------------------------------------------
class _OwnerBookingsTab extends ConsumerStatefulWidget {
  const _OwnerBookingsTab({super.key});

  @override
  ConsumerState<_OwnerBookingsTab> createState() => _OwnerBookingsTabState();
}

class _OwnerBookingsTabState extends ConsumerState<_OwnerBookingsTab> {
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();
  final List<String> _filters = [
    'ALL',
    'PENDING',
    'ACCEPTED',
    'ACTIVE',
    'RETURN_PENDING',
    'COMPLETED',
    'CANCELLED',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (ref.read(ownerProvider).bookings.isEmpty) {
        ref.read(ownerProvider.notifier).fetchDashboardData();
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  int _getCountForFilter(List<Booking> bookings, String filter) {
    if (filter == 'ALL') return bookings.length;
    if (filter == 'ACTIVE') {
      return bookings.where((b) => b.status == 'ACTIVE' || b.status == 'DISPATCHED' || b.status == 'OUT_FOR_DELIVERY' || b.status == 'IN_TRANSIT').length;
    }
    return bookings.where((b) => b.status.toUpperCase() == filter.toUpperCase()).length;
  }

  @override
  Widget build(BuildContext context) {
    final ownerState = ref.watch(ownerProvider);
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final unread = ref.watch(unreadNotificationsCountProvider);

    final activeFilter = ref.watch(ownerBookingFilterProvider);

    final filteredBookings = ownerState.bookings.where((b) {
      bool matchesFilter;
      if (activeFilter == 'ALL') {
        matchesFilter = true;
      } else if (activeFilter == 'ACTIVE') {
        matchesFilter = b.status == 'ACTIVE' || b.status == 'DISPATCHED' || b.status == 'OUT_FOR_DELIVERY' || b.status == 'IN_TRANSIT';
      } else {
        matchesFilter = b.status.toUpperCase() == activeFilter.toUpperCase();
      }

      final query = _searchQuery.trim().toLowerCase();
      final matchesSearch = query.isEmpty ||
          (b.equipment?.title.toLowerCase().contains(query) ?? false) ||
          (b.farmer?.name.toLowerCase().contains(query) ?? false) ||
          b.id.toLowerCase().contains(query);

      return matchesFilter && matchesSearch;
    }).toList();

    debugPrint('[BOOKINGS_TAB] bookings=${ownerState.bookings.length}, filtered=${filteredBookings.length}, loading=${ownerState.isLoading}, error=${ownerState.error}');

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
      appBar: _buildAppBar(isDark, lang, unread),
      body: RefreshIndicator(
        color: AppTheme.primaryGreen,
        onRefresh: () => ref.read(ownerProvider.notifier).fetchDashboardData(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 80),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Search Box
              Container(
                color: isDark ? AppTheme.darkCard : Colors.white,
                padding: const EdgeInsets.fromLTRB(0, 4, 0, 8),
                child: TextField(
                  controller: _searchController,
                  onChanged: (val) => setState(() => _searchQuery = val),
                  decoration: InputDecoration(
                    hintText: 'search_bookings_hint'.tr(lang),
                    hintStyle: TextStyle(
                      fontSize: 13,
                      color: isDark ? Colors.white38 : AppTheme.textMutedGray,
                    ),
                    prefixIcon: const Icon(Icons.search_rounded, size: 20, color: AppTheme.primaryGreen),
                    suffixIcon: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (_searchQuery.isNotEmpty)
                          IconButton(
                            icon: const Icon(Icons.clear_rounded, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _searchQuery = '');
                            },
                          ),
                        IconButton(
                          icon: const Icon(Icons.mic_rounded, color: AppTheme.primaryGreen, size: 20),
                          onPressed: () {
                            showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: Colors.transparent,
                              builder: (ctx) => VoiceInteractionModal(
                                onQuerySubmitted: (query) {
                                  _searchController.text = query;
                                  if (mounted) setState(() => _searchQuery = query);
                                },
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                    filled: true,
                    fillColor: isDark ? AppTheme.darkBackground : const Color(0xFFF1F5F2),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
              ),

              // Filter Chips Row with Badge Counts
              Container(
                color: isDark ? AppTheme.darkCard : Colors.white,
                padding: const EdgeInsets.fromLTRB(0, 4, 0, 12),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _filters.map((f) {
                      final isSelected = activeFilter == f;
                      final count = _getCountForFilter(ownerState.bookings, f);
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(
                            f == 'ALL'
                                ? '${'all'.tr(lang)} ($count)'
                                : '${AppLocalizations.localizedBookingStatus(f, lang)} ($count)',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                              color: isSelected
                                  ? Colors.white
                                  : (isDark ? Colors.white70 : AppTheme.textDarkNavy),
                            ),
                          ),
                          selected: isSelected,
                          selectedColor: AppTheme.primaryGreen,
                          backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF1F5F2),
                          showCheckmark: false,
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                            side: BorderSide(
                              color: isSelected
                                  ? AppTheme.primaryGreen
                                  : (isDark ? Colors.white10 : Colors.transparent),
                            ),
                          ),
                          onSelected: (_) => ref.read(ownerBookingFilterProvider.notifier).state = f,
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Bookings List
              if (ownerState.isLoading && ownerState.bookings.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 80),
                  child: Center(
                    child: CircularProgressIndicator(color: AppTheme.primaryGreen),
                  ),
                )
              else if (ownerState.error != null && ownerState.bookings.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 60),
                  child: _buildErrorView(ownerState.error!, isDark, lang),
                )
              else if (filteredBookings.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.receipt_long_outlined,
                        size: 56,
                        color: isDark ? Colors.white24 : Colors.grey.shade300,
                      ),
                      const SizedBox(height: 14),
                      Text(
                        ownerState.bookings.isEmpty
                            ? 'no_bookings_found'.tr(lang)
                            : 'no_bookings_matching_filter'.tr(lang),
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                        ),
                      ),
                      const SizedBox(height: 14),
                      if (ownerState.bookings.isNotEmpty) ...[
                        ElevatedButton.icon(
                          onPressed: () {
                            setState(() => _searchQuery = '');
                            ref.read(ownerBookingFilterProvider.notifier).state = 'ALL';
                          },
                          icon: const Icon(Icons.clear_all_rounded, size: 18),
                          label: Text('clear_filters'.tr(lang)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryGreen,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ] else ...[
                        ElevatedButton.icon(
                          onPressed: () => ref.read(ownerProvider.notifier).fetchDashboardData(),
                          icon: const Icon(Icons.refresh_rounded, size: 18),
                          label: Text('refresh'.tr(lang)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryGreen,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ],
                    ],
                  ),
                )
              else
                ...filteredBookings.map((booking) => _buildBookingCard(booking, ownerState, isDark, lang)),
            ],
          ),
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(bool isDark, String lang, int unread) {
    return AppBar(
      backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
      elevation: 0,
      scrolledUnderElevation: 1,
      surfaceTintColor: Colors.transparent,
      title: Text(
        'booking_details'.tr(lang),
        style: TextStyle(
          fontWeight: FontWeight.w800,
          fontSize: 18,
          color: isDark ? Colors.white : AppTheme.textDarkNavy,
        ),
      ),
      actions: [
        IconButton(
          icon: Stack(
            clipBehavior: Clip.none,
            children: [
              Icon(
                Icons.notifications_outlined,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
                size: 24,
              ),
              if (unread > 0)
                Positioned(
                  right: -2,
                  top: -2,
                  child: Container(
                    padding: const EdgeInsets.all(3),
                    decoration: const BoxDecoration(
                      color: Color(0xFFE53935),
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(minWidth: 14, minHeight: 14),
                    child: Text(
                      '$unread',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
          onPressed: () => context.push('/notifications'),
        ),
        IconButton(
          icon: Icon(
            Icons.refresh_rounded,
            color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
          ),
          onPressed: () => ref.read(ownerProvider.notifier).fetchDashboardData(),
        ),
      ],
    );
  }

  Widget _buildBookingCard(Booking booking, OwnerState ownerState, bool isDark, String lang) {
    debugPrint('[BUILD_BOOKING_CARD] starting for ${booking.id}');
    try {
      final equipmentTitle = booking.equipment?.title ?? 'Equipment';
    final farmerName = booking.farmer?.name ?? 'Farmer';
    final isPending = booking.status == 'PENDING';
    final startDateStr = DateFormat('dd MMM yyyy').format(booking.startDate);
    final endDateStr = DateFormat('dd MMM yyyy').format(booking.endDate);

    Color statusColor;
    if (booking.status == 'PENDING') {
      statusColor = const Color(0xFFF57C00);
    } else if (booking.status == 'ACCEPTED' || booking.status == 'ACTIVE' || booking.status == 'CONFIRMED') {
      statusColor = const Color(0xFF2E7D32);
    } else if (booking.status == 'COMPLETED') {
      statusColor = const Color(0xFF00897B);
    } else if (booking.status == 'REJECTED' || booking.status == 'CANCELLED') {
      statusColor = const Color(0xFFD32F2F);
    } else {
      statusColor = const Color(0xFF1976D2);
    }

    final isActionPending = ownerState.isBookingActionPending(booking.id);

    return Container(
      key: ValueKey('booking_card_${booking.id}'),
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isPending
              ? const Color(0xFFF57C00).withValues(alpha: 0.4)
              : (isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06)),
          width: isPending ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () async {
            await Navigator.push(
              context,
              MaterialPageRoute(
                builder: (ctx) => OwnerBookingDetailScreen(booking: booking),
              ),
            );
            if (mounted) {
              ref.read(ownerProvider.notifier).fetchDashboardData();
            }
          },
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header: Booking ID & Status Tag
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            '#${booking.id.length > 8 ? booking.id.substring(0, 8) : booking.id}',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.primaryGreen,
                            ),
                          ),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        AppLocalizations.localizedBookingStatus(booking.status, lang),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: statusColor,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const Divider(height: 1, thickness: 0.7),

              // Details: Machine, Farmer, Dates, Total
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      equipmentTitle,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : AppTheme.textDarkNavy,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(
                          Icons.person_outline_rounded,
                          size: 15,
                          color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          farmerName,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(
                          Icons.calendar_today_outlined,
                          size: 14,
                          color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '$startDateStr  →  $endDateStr',
                          style: TextStyle(
                            fontSize: 12.5,
                            color: isDark ? Colors.white60 : AppTheme.textMutedGray,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'total_amount'.tr(lang),
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: isDark ? Colors.white60 : AppTheme.textMutedGray,
                          ),
                        ),
                        Text(
                          booking.totalPrice != null
                              ? '₹${booking.totalPrice!.toStringAsFixed(0)}'
                              : 'not_available'.tr(lang),
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w900,
                            color: AppTheme.primaryGreen,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Action Buttons Bottom Bar
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: isDark
                      ? AppTheme.darkBackground.withValues(alpha: 0.5)
                      : const Color(0xFFFAFAFA),
                  borderRadius: const BorderRadius.vertical(bottom: Radius.circular(18)),
                  border: Border(
                    top: BorderSide(
                      color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05),
                    ),
                  ),
                ),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      // Chat Action
                      OutlinedButton.icon(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (ctx) => ChatScreen(booking: booking),
                            ),
                          );
                        },
                        icon: const Icon(Icons.chat_bubble_outline_rounded, size: 16),
                        label: Text('chat'.tr(lang)),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppTheme.primaryGreen,
                          side: const BorderSide(color: AppTheme.primaryGreen),
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                      const SizedBox(width: 6),
                      // Call Farmer Relay Action
                      OutlinedButton.icon(
                        onPressed: () {
                          CallRelayService.initiatePrivateCall(
                            bookingId: booking.id,
                            context: context,
                            lang: lang,
                            isDark: isDark,
                          );
                        },
                        icon: const Icon(Icons.phone_in_talk_outlined, size: 16),
                        label: Text('call_farmer'.tr(lang)),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF16A34A),
                          side: const BorderSide(color: Color(0xFF16A34A)),
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                      const SizedBox(width: 8),

                      // Authoritative Permitted Owner Actions
                      if (isActionPending)
                        const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primaryGreen),
                        )
                      else if (booking.isOwnerAcceptable || booking.isOwnerRejectable) ...[
                        if (booking.isOwnerRejectable)
                          OutlinedButton(
                            onPressed: () => _handleReject(booking, lang),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFFD32F2F),
                              side: const BorderSide(color: Color(0xFFFFCDD2)),
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            child: Text(
                              'reject'.tr(lang),
                              style: const TextStyle(fontWeight: FontWeight.w700),
                            ),
                          ),
                        if (booking.isOwnerAcceptable && booking.isOwnerRejectable)
                          const SizedBox(width: 8),
                        if (booking.isOwnerAcceptable)
                          ElevatedButton(
                            onPressed: () => _handleAccept(booking, lang),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primaryGreen,
                              foregroundColor: Colors.white,
                              elevation: 0,
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            child: Text(
                              'accept'.tr(lang),
                              style: const TextStyle(fontWeight: FontWeight.w700),
                            ),
                          ),
                      ] else if (booking.isOwnerDispatchable) ...[
                        ElevatedButton(
                          onPressed: () => _updateStatus(booking.id, 'DISPATCHED', lang),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF1976D2),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: Text('dispatch'.tr(lang)),
                        ),
                      ] else if (booking.status == 'DISPATCHED' || booking.status == 'OUT_FOR_DELIVERY' || booking.status == 'IN_TRANSIT') ...[
                        ElevatedButton(
                          onPressed: () => _updateStatus(booking.id, 'ACTIVE', lang),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryGreen,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: Text('mark_active'.tr(lang)),
                        ),
                      ] else if (booking.isOwnerReturnInspectable) ...[
                        ElevatedButton.icon(
                          onPressed: () => _openReturnInspectionSheet(booking, lang),
                          icon: const Icon(Icons.assignment_turned_in_outlined, size: 16),
                          label: Text('complete_return_inspection'.tr(lang)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF00897B),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ] else ...[
                        OutlinedButton(
                          onPressed: () async {
                            await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (ctx) => OwnerBookingDetailScreen(booking: booking),
                              ),
                            );
                            if (mounted) {
                              ref.read(ownerProvider.notifier).fetchDashboardData();
                            }
                          },
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: Text('view_details'.tr(lang)),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
    } catch (e, stack) {
      debugPrint('[BOOKING_CARD_ERR] Failed building card for ${booking.id}: $e\n$stack');
      return Container(
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.amber.shade100,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.amber.shade700),
        ),
        child: Text(
          'Error displaying booking (${booking.id}): $e',
          style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.bold),
        ),
      );
    }
  }

  void _openReturnInspectionSheet(Booking booking, String lang) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    String selectedCondition = 'GOOD';
    final deductionController = TextEditingController(text: '0');
    final notesController = TextEditingController();
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          return Padding(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 20,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'complete_return_inspection'.tr(lang),
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${booking.equipment?.title ?? 'Equipment'} • ${booking.farmer?.name ?? 'Farmer'}',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.white60 : AppTheme.textMutedGray,
                    ),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    'equipment_condition'.tr(lang),
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      ('EXCELLENT', 'condition_excellent'.tr(lang)),
                      ('GOOD', 'condition_good'.tr(lang)),
                      ('FAIR', 'condition_fair'.tr(lang)),
                      ('DAMAGED', 'condition_damaged'.tr(lang)),
                    ].map((tuple) {
                      final isSelected = selectedCondition == tuple.$1;
                      return ChoiceChip(
                        label: Text(tuple.$2),
                        selected: isSelected,
                        selectedColor: tuple.$1 == 'DAMAGED'
                            ? const Color(0xFFD32F2F)
                            : AppTheme.primaryGreen,
                        labelStyle: TextStyle(
                          color: isSelected
                              ? Colors.white
                              : (isDark ? Colors.white70 : AppTheme.textDarkNavy),
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        ),
                        backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF1F5F2),
                        onSelected: (val) {
                          if (val) setModalState(() => selectedCondition = tuple.$1);
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    'deduction_amount'.tr(lang),
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                    ),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: deductionController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: InputDecoration(
                      prefixText: '₹ ',
                      hintText: 'deduction_hint'.tr(lang),
                      helperText: booking.securityDeposit != null
                          ? '${'security_deposit'.tr(lang)}: ₹${booking.securityDeposit!.toStringAsFixed(0)}'
                          : null,
                      filled: true,
                      fillColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAF9),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(
                          color: isDark ? Colors.white12 : Colors.grey.shade300,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'inspection_notes'.tr(lang),
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                    ),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: notesController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      hintText: 'inspection_notes_hint'.tr(lang),
                      filled: true,
                      fillColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAF9),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(
                          color: isDark ? Colors.white12 : Colors.grey.shade300,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 22),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: isSubmitting
                          ? null
                          : () async {
                              if (!booking.isOwnerReturnInspectable) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('invalid_inspection_status'.tr(lang)),
                                    backgroundColor: const Color(0xFFD32F2F),
                                  ),
                                );
                                return;
                              }
                              final deductionVal = double.tryParse(deductionController.text.trim()) ?? 0.0;
                              if (deductionVal < 0) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('deduction_negative'.tr(lang)),
                                    backgroundColor: const Color(0xFFD32F2F),
                                  ),
                                );
                                return;
                              }
                              final maxDeposit = booking.securityDeposit ?? 0.0;
                              if (maxDeposit > 0 && deductionVal > maxDeposit) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('${'deduction_exceeds_deposit'.tr(lang)} (₹${maxDeposit.toStringAsFixed(0)})'),
                                    backgroundColor: const Color(0xFFD32F2F),
                                  ),
                                );
                                return;
                              }

                              setModalState(() => isSubmitting = true);
                              final success = await ref.read(ownerProvider.notifier).completeInspection(
                                booking.id,
                                {
                                  'condition': selectedCondition,
                                  'deductionAmount': deductionVal,
                                  'notes': notesController.text.trim(),
                                },
                              );

                              if (!mounted) return;
                              if (success) {
                                if (ctx.mounted) Navigator.of(ctx).pop();
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('inspection_completed_success'.tr(lang)),
                                    backgroundColor: AppTheme.primaryGreen,
                                    behavior: SnackBarBehavior.floating,
                                  ),
                                );
                              } else {
                                setModalState(() => isSubmitting = false);
                                final err = ref.read(ownerProvider).error ?? 'failed_to_complete_inspection'.tr(lang);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(err),
                                    backgroundColor: const Color(0xFFD32F2F),
                                    behavior: SnackBarBehavior.floating,
                                  ),
                                );
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryGreen,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: isSubmitting
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.2),
                            )
                          : Text(
                              'submit_inspection'.tr(lang),
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _confirmOwnerAction({
    required String title,
    required String message,
    required VoidCallback onConfirm,
    required String lang,
    bool isDestructive = false,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTheme.cardRadius)),
        title: Text(
          title,
          style: TextStyle(
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
        ),
        content: Text(
          message,
          style: TextStyle(color: isDark ? Colors.white70 : AppTheme.textDarkNavy),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              'cancel'.tr(lang),
              style: TextStyle(color: isDark ? Colors.white54 : AppTheme.textMutedGray),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              onConfirm();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: isDestructive ? const Color(0xFFD32F2F) : AppTheme.primaryGreen,
              foregroundColor: Colors.white,
            ),
            child: Text(title),
          ),
        ],
      ),
    );
  }

  void _handleAccept(Booking booking, String lang) {
    _confirmOwnerAction(
      title: 'accept'.tr(lang),
      message: 'accept_booking_confirm'.tr(lang),
      lang: lang,
      isDestructive: false,
      onConfirm: () async {
        final success = await ref
            .read(ownerProvider.notifier)
            .updateBookingStatus(booking.id, 'ACCEPTED');
        if (success && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'booking_accepted_success'.tr(lang),
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              backgroundColor: AppTheme.primaryGreen,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          );
        } else if (!success && mounted) {
          final err = ref.read(ownerProvider).error ?? 'Failed to accept booking';
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                err,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              backgroundColor: const Color(0xFFD32F2F),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          );
        }
      },
    );
  }

  void _handleReject(Booking booking, String lang) {
    _confirmOwnerAction(
      title: 'reject'.tr(lang),
      message: 'reject_booking_confirm'.tr(lang),
      lang: lang,
      isDestructive: true,
      onConfirm: () async {
        final success = await ref
            .read(ownerProvider.notifier)
            .updateBookingStatus(booking.id, 'REJECTED');
        if (success && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'booking_rejected_success'.tr(lang),
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              backgroundColor: const Color(0xFFD32F2F),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          );
        } else if (!success && mounted) {
          final err = ref.read(ownerProvider).error ?? 'Failed to reject booking';
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                err,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              backgroundColor: const Color(0xFFD32F2F),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          );
        }
      },
    );
  }

  void _updateStatus(String bookingId, String targetStatus, String lang) {
    final title = targetStatus == 'ACTIVE'
        ? 'mark_active'.tr(lang)
        : targetStatus == 'DISPATCHED'
            ? 'dispatch_equipment'.tr(lang)
            : 'accept_return_complete'.tr(lang);
    final message = targetStatus == 'ACTIVE'
        ? 'activate_booking_confirm'.tr(lang)
        : targetStatus == 'DISPATCHED'
            ? 'dispatch_confirm'.tr(lang)
            : 'complete_booking_confirm'.tr(lang);

    _confirmOwnerAction(
      title: title,
      message: message,
      lang: lang,
      isDestructive: false,
      onConfirm: () async {
        final success = await ref
            .read(ownerProvider.notifier)
            .updateBookingStatus(bookingId, targetStatus);
        if (success && mounted) {
          final successMsg = targetStatus == 'ACTIVE'
              ? 'booking_activated_success'.tr(lang)
              : targetStatus == 'DISPATCHED'
                  ? 'equipment_dispatched_success'.tr(lang)
                  : targetStatus == 'COMPLETED'
                      ? 'rental_completed_success'.tr(lang)
                      : 'status_updated_success'.tr(lang);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                successMsg,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              backgroundColor: AppTheme.primaryGreen,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          );
        } else if (!success && mounted) {
          final err = ref.read(ownerProvider).error ?? 'Failed to update booking status';
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                err,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              backgroundColor: const Color(0xFFD32F2F),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          );
        }
      },
    );
  }
  Widget _buildErrorView(String error, bool isDark, String lang) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.cloud_off_rounded, size: 48, color: Colors.red.shade400),
            const SizedBox(height: 14),
            Text(
              'unable_to_load_bookings'.tr(lang),
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              error,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                color: isDark ? Colors.white60 : AppTheme.textMutedGray,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => ref.read(ownerProvider.notifier).fetchDashboardData(),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryGreen,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text('retry'.tr(lang)),
            ),
          ],
        ),
      ),
    );
  }
}
