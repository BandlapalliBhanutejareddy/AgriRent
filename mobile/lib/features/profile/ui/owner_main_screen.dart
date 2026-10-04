import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import '../providers/owner_provider.dart';
import 'edit_equipment_screen.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/localization/app_localizations.dart';
import 'owner_home_screen.dart';
import 'profile_screen.dart';
import 'analytics_report_screen.dart';
import '../../notifications/providers/notification_provider.dart';
import '../../marketplace/ui/chat_screen.dart';
import '../../../models/equipment.dart';
import '../../../models/booking.dart';

class OwnerMainScreen extends ConsumerStatefulWidget {
  const OwnerMainScreen({super.key});

  @override
  ConsumerState<OwnerMainScreen> createState() => _OwnerMainScreenState();
}

class _OwnerMainScreenState extends ConsumerState<OwnerMainScreen> {
  int _currentIndex = 0;
  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      OwnerHomeScreen(
        key: const ValueKey('owner_home_tab'),
        onNavigateTab: (index) {
          if (mounted) setState(() => _currentIndex = index);
        },
      ),
      const _OwnerEquipmentTab(key: ValueKey('owner_equipment_tab')),
      const _OwnerBookingsTab(key: ValueKey('owner_bookings_tab')),
      const _OwnerAnalyticsTab(key: ValueKey('owner_analytics_tab')),
      const ProfileScreen(key: ValueKey('owner_profile_tab')),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return PopScope(
      canPop: _currentIndex == 0,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) {
          setState(() {
            _currentIndex = 0;
          });
        }
      },
      child: Scaffold(
        backgroundColor: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
        body: IndexedStack(
          index: _currentIndex,
          children: _screens,
        ),
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
            selectedIndex: _currentIndex,
            backgroundColor: Colors.transparent,
            indicatorColor: AppTheme.primaryGreen.withValues(alpha: 0.15),
            elevation: 0,
            onDestinationSelected: (index) {
              setState(() {
                _currentIndex = index;
              });
            },
            destinations: [
              NavigationDestination(
                icon: const Icon(Icons.dashboard_outlined),
                selectedIcon: const Icon(Icons.dashboard_rounded, color: AppTheme.primaryGreen),
                label: 'home'.tr(lang),
              ),
              NavigationDestination(
                icon: const Icon(Icons.inventory_2_outlined),
                selectedIcon: const Icon(Icons.inventory_2_rounded, color: AppTheme.primaryGreen),
                label: 'equipment'.tr(lang),
              ),
              NavigationDestination(
                icon: const Icon(Icons.receipt_long_outlined),
                selectedIcon: const Icon(Icons.receipt_long_rounded, color: AppTheme.primaryGreen),
                label: 'bookings'.tr(lang),
              ),
              const NavigationDestination(
                icon: Icon(Icons.analytics_outlined),
                selectedIcon: Icon(Icons.analytics_rounded, color: AppTheme.primaryGreen),
                label: 'Analytics',
              ),
              NavigationDestination(
                icon: const Icon(Icons.person_outline_rounded),
                selectedIcon: const Icon(Icons.person_rounded, color: AppTheme.primaryGreen),
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

  final List<String> _categories = [
    'ALL',
    'TRACTOR',
    'HARVESTER',
    'SEEDER',
    'PLOUGH',
    'CULTIVATOR',
    'SPRAYER',
    'OTHER',
  ];

  @override
  Widget build(BuildContext context) {
    final ownerState = ref.watch(ownerProvider);
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final unread = ref.watch(unreadNotificationsCountProvider);

    final filteredList = ownerState.myEquipment.where((item) {
      final matchesCat = _selectedCategory == 'ALL' ||
          item.category.toUpperCase() == _selectedCategory.toUpperCase();
      final matchesSearch = _searchQuery.isEmpty ||
          item.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          item.category.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    }).toList();

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
      appBar: AppBar(
        title: Text(
          'fleet_management'.tr(lang),
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 18,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
        ),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        surfaceTintColor: Colors.transparent,
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
      ),
      body: Column(
        children: [
          // Search & Category Filter Bar
          _buildFilterBar(isDark, lang),

          // Equipment List Body
          Expanded(
            child: ownerState.isLoading && ownerState.myEquipment.isEmpty
                ? const Center(
                    child: CircularProgressIndicator(color: AppTheme.primaryGreen),
                  )
                : ownerState.error != null && ownerState.myEquipment.isEmpty
                    ? _buildErrorView(ownerState.error!, isDark, lang)
                    : filteredList.isEmpty
                        ? _buildEmptyState(isDark, lang)
                        : RefreshIndicator(
                            color: AppTheme.primaryGreen,
                            onRefresh: () =>
                                ref.read(ownerProvider.notifier).fetchDashboardData(),
                            child: ListView.builder(
                              padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
                              itemCount: filteredList.length,
                              itemBuilder: (context, index) {
                                final item = filteredList[index];
                                return _buildEquipmentCard(item, isDark, lang);
                              },
                            ),
                          ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
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
      ),
    );
  }

  Widget _buildFilterBar(bool isDark, String lang) {
    return Container(
      color: isDark ? AppTheme.darkCard : Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
      child: Column(
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
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
              ),
            ),
          ),
          const SizedBox(height: 10),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _categories.map((cat) {
                final isSelected = _selectedCategory == cat;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(
                      cat == 'ALL' ? 'all'.tr(lang) : cat,
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

  Widget _buildEquipmentCard(Equipment item, bool isDark, String lang) {
    return Container(
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
        children: [
          Padding(
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
                              item.category,
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
                              Transform.scale(
                                scale: 0.75,
                                child: Switch(
                                  value: item.available,
                                  activeThumbColor: AppTheme.primaryGreen,
                                  onChanged: (val) {
                                    ref
                                        .read(ownerProvider.notifier)
                                        .updateEquipmentAvailability(item.id, val);
                                  },
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
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                OutlinedButton.icon(
                  onPressed: () => _confirmDeleteEquipment(item, isDark, lang),
                  icon: const Icon(Icons.delete_outline_rounded, size: 16, color: Color(0xFFD32F2F)),
                  label: Text(
                    'cancel'.tr(lang),
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
                const SizedBox(width: 10),
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (ctx) => EditEquipmentScreen(equipment: item),
                      ),
                    );
                  },
                  icon: const Icon(Icons.edit_rounded, size: 16, color: Colors.white),
                  label: Text(
                    'edit_equipment'.tr(lang),
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryGreen,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _confirmDeleteEquipment(Equipment item, bool isDark, String lang) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Row(
          children: [
            const Icon(Icons.warning_amber_rounded, color: Color(0xFFD32F2F), size: 24),
            const SizedBox(width: 10),
            Text(
              'delete_equipment'.tr(lang),
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
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
            child: Text('reject'.tr(lang)),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      final success = await ref.read(ownerProvider.notifier).deleteEquipment(item.id);
      if (success && mounted) {
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
      }
    }
  }

  Widget _buildEmptyState(bool isDark, String lang) {
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
              'unable_to_load_messages'.tr(lang),
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
  String _selectedStatusFilter = 'ALL';

  final List<String> _filters = [
    'ALL',
    'PENDING',
    'ACTIVE',
    'COMPLETED',
    'RETURN_PENDING',
    'CANCELLED',
  ];

  @override
  Widget build(BuildContext context) {
    final ownerState = ref.watch(ownerProvider);
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final unread = ref.watch(unreadNotificationsCountProvider);

    final filteredBookings = ownerState.bookings.where((b) {
      if (_selectedStatusFilter == 'ALL') return true;
      if (_selectedStatusFilter == 'ACTIVE') {
        return b.status == 'ACTIVE' || b.status == 'ACCEPTED';
      }
      return b.status.toUpperCase() == _selectedStatusFilter.toUpperCase();
    }).toList();

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
      appBar: AppBar(
        title: Text(
          'booking_details'.tr(lang),
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 18,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
        ),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        surfaceTintColor: Colors.transparent,
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
      ),
      body: Column(
        children: [
          // Filter Chips Row
          Container(
            color: isDark ? AppTheme.darkCard : Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 6, 16, 12),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _filters.map((f) {
                  final isSelected = _selectedStatusFilter == f;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(
                        f == 'ALL' ? 'all'.tr(lang) : f.replaceAll('_', ' '),
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
                      onSelected: (_) => setState(() => _selectedStatusFilter = f),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),

          // Bookings List
          Expanded(
            child: ownerState.isLoading && ownerState.bookings.isEmpty
                ? const Center(
                    child: CircularProgressIndicator(color: AppTheme.primaryGreen),
                  )
                : filteredBookings.isEmpty
                    ? Center(
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
                              'no_bookings_found'.tr(lang),
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                              ),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        color: AppTheme.primaryGreen,
                        onRefresh: () =>
                            ref.read(ownerProvider.notifier).fetchDashboardData(),
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: filteredBookings.length,
                          itemBuilder: (context, index) {
                            final booking = filteredBookings[index];
                            return _buildBookingCard(booking, isDark, lang);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildBookingCard(Booking booking, bool isDark, String lang) {
    final equipmentTitle = booking.equipment?.title ?? 'Equipment';
    final farmerName = booking.farmer?.name ?? 'Farmer';
    final isPending = booking.status == 'PENDING';
    final isReturnPending = booking.status == 'RETURN_PENDING';
    final isAccepted = booking.status == 'ACCEPTED';

    final startDateStr = DateFormat('dd MMM yyyy').format(booking.startDate);
    final endDateStr = DateFormat('dd MMM yyyy').format(booking.endDate);

    Color statusColor;
    if (booking.status == 'PENDING') {
      statusColor = const Color(0xFFF57C00);
    } else if (booking.status == 'ACCEPTED' || booking.status == 'ACTIVE') {
      statusColor = const Color(0xFF2E7D32);
    } else if (booking.status == 'COMPLETED') {
      statusColor = const Color(0xFF00897B);
    } else if (booking.status == 'REJECTED' || booking.status == 'CANCELLED') {
      statusColor = const Color(0xFFD32F2F);
    } else {
      statusColor = const Color(0xFF1976D2);
    }

    return Container(
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
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
                    booking.status.replaceAll('_', ' '),
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
            child: Row(
              children: [
                // Chat with Farmer Action
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
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
                const Spacer(),

                // Pending Actions: Accept & Reject
                if (isPending) ...[
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
                  const SizedBox(width: 8),
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
                ] else if (isAccepted) ...[
                  ElevatedButton(
                    onPressed: () => _updateStatus(booking.id, 'ACTIVE', lang),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1976D2),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('Mark Dispatched / Active'),
                  ),
                ] else if (isReturnPending) ...[
                  ElevatedButton(
                    onPressed: () => _updateStatus(booking.id, 'COMPLETED', lang),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF00897B),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('Accept Return & Complete'),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _handleAccept(Booking booking, String lang) async {
    final success = await ref
        .read(ownerProvider.notifier)
        .updateBookingStatus(booking.id, 'ACCEPTED');
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'status_updated_success'.tr(lang),
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          backgroundColor: AppTheme.primaryGreen,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }

  void _handleReject(Booking booking, String lang) async {
    final success = await ref
        .read(ownerProvider.notifier)
        .updateBookingStatus(booking.id, 'REJECTED');
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'status_updated_success'.tr(lang),
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          backgroundColor: const Color(0xFFD32F2F),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }

    void _updateStatus(String bookingId, String targetStatus, String lang) async {
    final success = await ref
        .read(ownerProvider.notifier)
        .updateBookingStatus(bookingId, targetStatus);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'status_updated_success'.tr(lang),
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          backgroundColor: AppTheme.primaryGreen,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }
}

// -----------------------------------------------------------------------------
// OWNER ANALYTICS TAB
// -----------------------------------------------------------------------------
class _OwnerAnalyticsTab extends ConsumerWidget {
  const _OwnerAnalyticsTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ownerState = ref.watch(ownerProvider);
    final analytics = ownerState.analytics;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final totalRevenue = (analytics?['totalRevenue'] as num?)?.toDouble() ?? 0.0;
    final activeRentals = (analytics?['activeRentals'] as num?)?.toInt() ?? 0;
    final pendingRequests = (analytics?['pendingRequests'] as num?)?.toInt() ?? 0;
    final completedRentals = (analytics?['completedRentals'] as num?)?.toInt() ?? 0;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
      appBar: AppBar(
        title: const Text(
          'Owner Analytics',
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 20),
        ),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        foregroundColor: isDark ? Colors.white : AppTheme.textDarkNavy,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ref.read(ownerProvider.notifier).fetchDashboardData(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(ownerProvider.notifier).fetchDashboardData(),
        color: AppTheme.primaryGreen,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Financial & Fleet Performance',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 12),
              // Revenue Card
              _buildAnalyticsCard(
                context,
                title: 'Total Revenue',
                value: '₹${NumberFormat('#,##,###').format(totalRevenue)}',
                subtitle: 'Tap to view revenue drilldown',
                icon: Icons.currency_rupee_rounded,
                color: const Color(0xFF16A34A),
                isDark: isDark,
                onTap: () {
                  final qualifying = ownerState.bookings.where((b) => b.status == 'COMPLETED' || b.paymentStatus == 'COMPLETED').toList();
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (ctx) => AnalyticsReportScreen(
                        title: 'Total Revenue Report',
                        subtitle: 'Authoritative earnings from paid & completed rentals',
                        metricValue: '₹${NumberFormat('#,##,###').format(totalRevenue)}',
                        metricLabel: 'Total Verified Earnings',
                        columns: const ['Booking ID', 'Equipment', 'Farmer', 'Amount', 'Status'],
                        totalSum: totalRevenue,
                        rows: qualifying.map((b) => ReportRowData(
                          values: {
                            'Booking ID': '#${b.id.substring(0, b.id.length > 8 ? 8 : b.id.length)}',
                            'Equipment': b.equipment?.title ?? 'Equipment',
                            'Farmer': b.farmer?.name ?? 'Farmer',
                            'Amount': '₹${b.totalPrice?.toStringAsFixed(0) ?? '0'}',
                            'Status': b.status,
                          },
                          status: b.status,
                          amount: b.totalPrice,
                        )).toList(),
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildAnalyticsCard(
                      context,
                      title: 'Active Rentals',
                      value: '$activeRentals',
                      subtitle: 'In the field',
                      icon: Icons.agriculture_rounded,
                      color: const Color(0xFF0284C7),
                      isDark: isDark,
                      onTap: () {
                        final active = ownerState.bookings.where((b) => b.status == 'ACTIVE' || b.status == 'DELIVERED').toList();
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (ctx) => AnalyticsReportScreen(
                              title: 'Active Rentals Report',
                              subtitle: 'Equipment currently in active operation',
                              metricValue: '$activeRentals',
                              metricLabel: 'Active Deployments',
                              columns: const ['Booking ID', 'Equipment', 'Farmer', 'Start Date', 'End Date'],
                              rows: active.map((b) => ReportRowData(
                                values: {
                                  'Booking ID': '#${b.id.substring(0, b.id.length > 8 ? 8 : b.id.length)}',
                                  'Equipment': b.equipment?.title ?? 'Equipment',
                                  'Farmer': b.farmer?.name ?? 'Farmer',
                                  'Start Date': DateFormat('MMM d').format(b.startDate),
                                  'End Date': DateFormat('MMM d').format(b.endDate),
                                },
                                status: b.status,
                              )).toList(),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildAnalyticsCard(
                      context,
                      title: 'Pending Requests',
                      value: '$pendingRequests',
                      subtitle: 'Awaiting review',
                      icon: Icons.pending_actions_rounded,
                      color: const Color(0xFFD97706),
                      isDark: isDark,
                      onTap: () {
                        final pending = ownerState.bookings.where((b) => b.status == 'PENDING').toList();
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (ctx) => AnalyticsReportScreen(
                              title: 'Pending Requests Report',
                              subtitle: 'Incoming booking requests requiring action',
                              metricValue: '$pendingRequests',
                              metricLabel: 'Pending Reviews',
                              columns: const ['Booking ID', 'Equipment', 'Farmer', 'Dates', 'Total Value'],
                              rows: pending.map((b) => ReportRowData(
                                values: {
                                  'Booking ID': '#${b.id.substring(0, b.id.length > 8 ? 8 : b.id.length)}',
                                  'Equipment': b.equipment?.title ?? 'Equipment',
                                  'Farmer': b.farmer?.name ?? 'Farmer',
                                  'Dates': '${DateFormat('MMM d').format(b.startDate)} - ${DateFormat('MMM d').format(b.endDate)}',
                                  'Total Value': '₹${b.totalPrice?.toStringAsFixed(0) ?? '0'}',
                                },
                                status: b.status,
                                amount: b.totalPrice,
                              )).toList(),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _buildAnalyticsCard(
                context,
                title: 'Completed Rentals',
                value: '$completedRentals',
                subtitle: 'Successfully returned and settled',
                icon: Icons.check_circle_outline_rounded,
                color: const Color(0xFF7C3AED),
                isDark: isDark,
                onTap: () {
                  final completed = ownerState.bookings.where((b) => b.status == 'COMPLETED' || b.status == 'RETURNED').toList();
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (ctx) => AnalyticsReportScreen(
                        title: 'Completed Rentals Report',
                        subtitle: 'Full history of settled equipment rentals',
                        metricValue: '$completedRentals',
                        metricLabel: 'Completed Cycles',
                        columns: const ['Booking ID', 'Equipment', 'Farmer', 'Settled Amount', 'Status'],
                        rows: completed.map((b) => ReportRowData(
                          values: {
                            'Booking ID': '#${b.id.substring(0, b.id.length > 8 ? 8 : b.id.length)}',
                            'Equipment': b.equipment?.title ?? 'Equipment',
                            'Farmer': b.farmer?.name ?? 'Farmer',
                            'Settled Amount': '₹${b.totalPrice?.toStringAsFixed(0) ?? '0'}',
                            'Status': b.status,
                          },
                          status: b.status,
                          amount: b.totalPrice,
                        )).toList(),
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAnalyticsCard(
    BuildContext context, {
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
    required Color color,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
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
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: color, size: 20),
                ),
                Icon(Icons.chevron_right, color: isDark ? Colors.grey.shade600 : Colors.grey.shade400, size: 18),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              value,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              title,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.grey.shade300 : Colors.grey.shade800,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 11,
                color: isDark ? Colors.grey.shade400 : Colors.grey.shade500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
