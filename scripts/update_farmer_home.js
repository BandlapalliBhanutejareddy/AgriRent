const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../mobile/lib/features/marketplace/ui/farmer_home_screen.dart');
let code = fs.readFileSync(targetPath, 'utf8');

// Normalize line endings to LF
code = code.replace(/\r\n/g, '\n');

// 1. Add imports
const oldImports = "import '../../farm/providers/expenses_provider.dart';";
const newImports = `import '../../farm/providers/expenses_provider.dart';
import '../../notifications/providers/notification_provider.dart';
import '../../ai_assistant/ui/voice_interaction_modal.dart';
import '../../weather/ui/weather_widget.dart';
import 'widgets/search_suggestions_overlay.dart';`;

if (!code.includes('unreadNotificationsCountProvider')) {
  code = code.replace(oldImports, newImports);
}

// 2. Add _selectedCategoryChipIndex
if (!code.includes('_selectedCategoryChipIndex')) {
  code = code.replace(
    'String? _selectedCropId;',
    'String? _selectedCropId;\n  int _selectedCategoryChipIndex = 0;'
  );
}

// 3. Add unreadNotificationsCountProvider refresh in initState
if (!code.includes('unreadNotificationsCountProvider.notifier).refresh()')) {
  code = code.replace(
    'ref.read(marketplaceProvider.notifier).fetchInitial();',
    'ref.read(marketplaceProvider.notifier).fetchInitial();\n      ref.read(unreadNotificationsCountProvider.notifier).refresh();'
  );
}

// 4. Update build method refresh indicator and column children
const targetBuild = `          onRefresh: () async {
            await ref.read(farmProvider.notifier).fetchFarms();
            await ref.read(marketplaceProvider.notifier).fetchInitial();
            await _fetchAnalytics();
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. TOP HEADER (Greeting + Slogan + Avatar + Notification)
                _buildHeader(farmerName, initial, isDark),
                const SizedBox(height: 18),

                // 2. CURRENT CROP BANNER CARD
                _buildCropBannerCard(crop, farm, farmState.farms, isDark),
                const SizedBox(height: 16),

                // 3. CURRENT STAGE & NEXT STAGE DUAL CARD
                _buildStageProgressionCard(crop, farm, isDark),
                const SizedBox(height: 16),

                // 4. NEXT IMPORTANT OPERATIONS CARD
                _buildNextOperationsCard(crop, farm, isDark),
                const SizedBox(height: 20),

                // 5. QUICK ACTIONS ROW
                _buildQuickActionsRow(isDark),
                const SizedBox(height: 24),

                // 6. FARMER ANALYTICS (GRID OF 4 CARDS)
                _buildFarmerAnalyticsSection(farm, crop, isDark),
                const SizedBox(height: 24),

                // 7. RECENT ACTIVITY TIMELINE
                _buildRecentActivitySection(isDark),
                const SizedBox(height: 30),
              ],
            ),
          ),`;

const newBuild = `          onRefresh: () async {
            await ref.read(farmProvider.notifier).fetchFarms();
            await ref.read(marketplaceProvider.notifier).fetchInitial();
            await ref.read(unreadNotificationsCountProvider.notifier).refresh();
            await _fetchAnalytics();
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. TOP HEADER (Greeting + Location/Weather + Real Notification Badge + Avatar)
                _buildHeader(farmerName, initial, isDark, farm),
                const SizedBox(height: 16),

                // 2. VOICE-ENABLED SEARCH BAR (Tap to Talk + Overlay Suggestions)
                _buildVoiceSearchBar(isDark, lang),
                const SizedBox(height: 14),

                // 3. 5 CATEGORY CHIPS (All, Crops, Equipment, Community, Learning)
                _buildCategoryChips(isDark, lang),
                const SizedBox(height: 18),

                // 4. 4 FARM STATUS SUMMARY CARDS (Weather, Today's Tasks, Crop Stage, Alerts)
                _buildFarmStatusCards(farm, crop, isDark, lang),
                const SizedBox(height: 20),

                // 5. QUICK ACTIONS (My Farm, Book Equipment, Community, AI Farming Assistant)
                _buildQuickActionsRow(isDark),
                const SizedBox(height: 22),

                // 6. NEARBY EQUIPMENT (Real marketplace cards with [Book])
                _buildNearbyEquipmentSection(isDark, lang),
                const SizedBox(height: 22),

                // 7. CURRENT CROP BANNER CARD
                _buildCropBannerCard(crop, farm, farmState.farms, isDark),
                const SizedBox(height: 18),

                // 8. CURRENT STAGE & NEXT STAGE DUAL CARD
                _buildStageProgressionCard(crop, farm, isDark),
                const SizedBox(height: 16),

                // 9. NEXT IMPORTANT OPERATIONS CARD
                _buildNextOperationsCard(crop, farm, isDark),
                const SizedBox(height: 20),

                // 10. FARMER ANALYTICS (GRID OF 4 CARDS)
                _buildFarmerAnalyticsSection(farm, crop, isDark),
                const SizedBox(height: 20),

                // 11. RECENT ACTIVITY TIMELINE
                _buildRecentActivitySection(isDark),
                const SizedBox(height: 30),
              ],
            ),
          ),`;

if (code.includes(targetBuild)) {
  code = code.replace(targetBuild, newBuild);
  console.log('Build section replaced successfully');
} else {
  console.log('Error: targetBuild not found');
}

// 5. Replace _buildHeader with updated version and append new helper widgets
const targetHeader = `  // 1. HEADER WIDGET
  // ---------------------------------------------------------------------------
  Widget _buildHeader(String farmerName, String initial, bool isDark) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.eco_rounded, color: AppTheme.primaryGreen, size: 24),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _getTimeGreeting(),
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                  ),
                ),
                Text(
                  farmerName,
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                    letterSpacing: -0.4,
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Text(
                      "Let's grow a better tomorrow ",
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                      ),
                    ),
                    const Text('🌱', style: TextStyle(fontSize: 12)),
                  ],
                ),
              ],
            ),
          ],
        ),
        Row(
          children: [
            // Notification Bell with Badge
            Stack(
              clipBehavior: Clip.none,
              children: [
                InkWell(
                  onTap: () => context.push('/notifications'),
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.all(9),
                    decoration: BoxDecoration(
                      color: isDark ? AppTheme.darkCard : Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.05),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Icon(
                      Icons.notifications_outlined,
                      color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                      size: 22,
                    ),
                  ),
                ),
                Positioned(
                  top: -2,
                  right: -2,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Color(0xFFE53935),
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                    child: const Text(
                      '3',
                      style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 10),
            // Farmer Avatar
            GestureDetector(
              onTap: () => widget.onTabSelected?.call(4),
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppTheme.primaryGreen, width: 2),
                ),
                child: CircleAvatar(
                  radius: 19,
                  backgroundColor: const Color(0xFFC8E6C9),
                  child: Text(
                    initial,
                    style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF2E7D32), fontSize: 16),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }`;

// Note: In file, 🌱 might be mojibake or real. Let's find using regex on header
const headerRegex = /Widget _buildHeader\(String farmerName, String initial, bool isDark\) \{[\s\S]*?child: Text\(\s*initial,[\s\S]*?\}\s*\}\s*\]\s*;\s*\}/;

const newHeaderAndWidgets = `Widget _buildHeader(String farmerName, String initial, bool isDark, FarmModel? farm) {
    final unreadCount = ref.watch(unreadNotificationsCountProvider);
    final locationStr = farm?.location.isNotEmpty == true ? farm!.location : 'Guntur, Andhra Pradesh';
    final greeting = _getTimeGreeting();

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    '\$greeting \$farmerName',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                      letterSpacing: -0.3,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(width: 4),
                  const Text('🌾', style: TextStyle(fontSize: 18)),
                ],
              ),
              const SizedBox(height: 3),
              Row(
                children: [
                  Icon(Icons.location_on_outlined, size: 14, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                  const SizedBox(width: 3),
                  Flexible(
                    child: Text(
                      '\$locationStr • 32°C Sunny',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Row(
          children: [
            // Notification Bell with Real Badge
            Stack(
              clipBehavior: Clip.none,
              children: [
                InkWell(
                  onTap: () {
                    context.push('/notifications');
                    ref.read(unreadNotificationsCountProvider.notifier).refresh();
                  },
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.all(9),
                    decoration: BoxDecoration(
                      color: isDark ? AppTheme.darkCard : Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.05),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Icon(
                      Icons.notifications_outlined,
                      color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                      size: 22,
                    ),
                  ),
                ),
                if (unreadCount > 0)
                  Positioned(
                    top: -2,
                    right: -2,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Color(0xFFE53935),
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                      child: Text(
                        unreadCount > 99 ? '99+' : '\$unreadCount',
                        style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 10),
            // Farmer Avatar
            GestureDetector(
              onTap: () => widget.onTabSelected?.call(4),
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppTheme.primaryGreen, width: 2),
                ),
                child: CircleAvatar(
                  radius: 19,
                  backgroundColor: const Color(0xFFC8E6C9),
                  child: Text(
                    initial,
                    style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF2E7D32), fontSize: 16),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // VOICE-ENABLED SEARCH BAR
  // ---------------------------------------------------------------------------
  Widget _buildVoiceSearchBar(bool isDark, String lang) {
    return Container(
      height: 52,
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: InkWell(
              onTap: () {
                SearchSuggestionsOverlay.show(
                  context,
                  onSelected: (query) {
                    context.push('/ai-assistant?query=\${Uri.encodeComponent(query)}');
                  },
                );
              },
              borderRadius: const BorderRadius.horizontal(left: Radius.circular(26)),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Icon(
                      Icons.search_rounded,
                      color: isDark ? Colors.grey.shade400 : AppTheme.primaryGreen,
                      size: 22,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Ask AgroRent AI anything about your farm...',
                        style: TextStyle(
                          fontSize: 13.5,
                          color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                          fontWeight: FontWeight.w500,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 5),
            child: InkWell(
              onTap: () {
                VoiceInteractionModal.show(context);
              },
              borderRadius: BorderRadius.circular(22),
              child: Container(
                width: 42,
                height: 42,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF2E7D32), Color(0xFF43A047)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Color(0x402E7D32),
                      blurRadius: 6,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: const Icon(Icons.mic_rounded, color: Colors.white, size: 22),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 5 CATEGORY CHIPS
  // ---------------------------------------------------------------------------
  Widget _buildCategoryChips(bool isDark, String lang) {
    final chips = [
      {'title': 'All', 'icon': Icons.grid_view_rounded},
      {'title': 'Crops', 'icon': Icons.grass_rounded},
      {'title': 'Equipment', 'icon': Icons.agriculture_rounded},
      {'title': 'Community', 'icon': Icons.groups_rounded},
      {'title': 'Learning', 'icon': Icons.menu_book_rounded},
    ];

    return SizedBox(
      height: 38,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: chips.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (ctx, idx) {
          final chip = chips[idx];
          final isSelected = _selectedCategoryChipIndex == idx;
          return GestureDetector(
            onTap: () {
              setState(() => _selectedCategoryChipIndex = idx);
              if (idx == 1) {
                widget.onTabSelected?.call(1);
              } else if (idx == 2) {
                widget.onTabSelected?.call(2);
              } else if (idx == 3) {
                context.push('/community');
              } else if (idx == 4) {
                context.push('/knowledge-base');
              }
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected
                    ? AppTheme.primaryGreen
                    : (isDark ? AppTheme.darkCard : Colors.white),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isSelected
                      ? AppTheme.primaryGreen
                      : (isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
                ),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: AppTheme.primaryGreen.withValues(alpha: 0.3),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ]
                    : null,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    chip['icon'] as IconData,
                    size: 16,
                    color: isSelected ? Colors.white : (isDark ? Colors.grey.shade300 : AppTheme.textDarkNavy),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    chip['title'] as String,
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                      color: isSelected ? Colors.white : (isDark ? Colors.grey.shade300 : AppTheme.textDarkNavy),
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

  // ---------------------------------------------------------------------------
  // 4 FARM STATUS SUMMARY CARDS
  // ---------------------------------------------------------------------------
  Widget _buildFarmStatusCards(FarmModel? farm, FarmCropModel? crop, bool isDark, String lang) {
    final activeOps = _analytics?['activeOperations'] ?? (_analytics?['pendingOperations'] ?? 0);
    final cropName = crop?.cropName.isNotEmpty == true ? crop!.cropName : 'Cotton';
    final cropStage = crop?.stage.isNotEmpty == true ? crop!.stage.replaceAll('_', ' ') : 'Flowering';

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildStatusTile(
                title: 'Weather',
                mainText: '32°C Sunny',
                subText: '65% Hum • 12 km/h',
                icon: Icons.wb_sunny_rounded,
                iconColor: const Color(0xFFF57F17),
                bgColor: const Color(0xFFFFF8E1),
                isDark: isDark,
                onTap: () {
                  if (farm != null && farm.id.isNotEmpty) {
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (ctx) => Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: isDark ? AppTheme.darkCard : Colors.white,
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                        ),
                        child: SafeArea(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Weather Advisory',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                ),
                              ),
                              const SizedBox(height: 12),
                              WeatherWidget(farmId: farm.id),
                            ],
                          ),
                        ),
                      ),
                    );
                  }
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatusTile(
                title: "Today's Tasks",
                mainText: activeOps > 0 ? '\$activeOps Pending' : '3 Pending',
                subText: 'Spraying, Weeding...',
                icon: Icons.assignment_turned_in_rounded,
                iconColor: const Color(0xFF1976D2),
                bgColor: const Color(0xFFE3F2FD),
                isDark: isDark,
                onTap: () => context.push('/farm-plan'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildStatusTile(
                title: 'Crop Stage',
                mainText: '\$cropName • \$cropStage',
                subText: 'Day 68 of 150',
                icon: Icons.eco_rounded,
                iconColor: const Color(0xFF2E7D32),
                bgColor: const Color(0xFFE8F5E9),
                isDark: isDark,
                onTap: () => _showCropDetailsDialog(context, crop, farm, isDark),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatusTile(
                title: 'Farm Alerts',
                mainText: 'Pest Warning',
                subText: 'Aphid risk moderate',
                icon: Icons.warning_amber_rounded,
                iconColor: const Color(0xFFE65100),
                bgColor: const Color(0xFFFFF3E0),
                isDark: isDark,
                onTap: () => context.push(
                  '/ai-assistant?query=\${Uri.encodeComponent("What is the pest warning for $cropName in $cropStage stage?")}',
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatusTile({
    required String title,
    required String mainText,
    required String subText,
    required IconData icon,
    required Color iconColor,
    required Color bgColor,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: isDark ? iconColor.withValues(alpha: 0.15) : bgColor,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: iconColor, size: 16),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    title,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              mainText,
              style: TextStyle(
                fontSize: 13.5,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            Text(
              subText,
              style: TextStyle(
                fontSize: 11,
                color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // NEARBY EQUIPMENT SECTION
  // ---------------------------------------------------------------------------
  Widget _buildNearbyEquipmentSection(bool isDark, String lang) {
    final mpState = ref.watch(marketplaceProvider);
    final items = mpState.equipment.take(4).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Nearby Equipment',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
                letterSpacing: -0.3,
              ),
            ),
            InkWell(
              onTap: () {
                ref.read(marketplaceProvider.notifier).setCategory(null);
                widget.onTabSelected?.call(2);
              },
              borderRadius: BorderRadius.circular(8),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: Text(
                  'View All',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.primaryGreen,
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (items.isEmpty)
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.darkCard : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
            ),
            alignment: Alignment.center,
            child: Text(
              'Loading available equipment...',
              style: TextStyle(fontSize: 13, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
            ),
          )
        else
          SizedBox(
            height: 195,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: items.length,
              separatorBuilder: (_, _) => const SizedBox(width: 12),
              itemBuilder: (ctx, idx) {
                final eq = items[idx];
                final price = (eq.pricePerDay != null && eq.pricePerDay! > 0)
                    ? '₹\${eq.pricePerDay!.toInt()}/day'
                    : '₹1,200/day';
                final ownerName = (eq.owner?.name.isNotEmpty == true)
                    ? eq.owner!.name
                    : 'Verified Owner';

                return Container(
                  width: 220,
                  decoration: BoxDecoration(
                    color: isDark ? AppTheme.darkCard : Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFE8ECEF)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ClipRRect(
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
                        child: Container(
                          height: 90,
                          width: double.infinity,
                          color: isDark ? Colors.white12 : Colors.grey.shade100,
                          child: eq.imageUrl.isNotEmpty
                              ? Image.network(
                                  eq.imageUrl,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, _, _) => _buildEquipmentFallbackIcon(),
                                )
                              : _buildEquipmentFallbackIcon(),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(10),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              eq.title,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: isDark ? Colors.white : AppTheme.textDarkNavy,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                const Icon(Icons.verified_rounded, size: 12, color: AppTheme.primaryGreen),
                                const SizedBox(width: 3),
                                Expanded(
                                  child: Text(
                                    ownerName,
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  price,
                                  style: const TextStyle(
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w900,
                                    color: AppTheme.primaryGreen,
                                  ),
                                ),
                                ElevatedButton(
                                  onPressed: () => context.push('/equipment/\${eq.id}'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppTheme.primaryGreen,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                    minimumSize: const Size(0, 28),
                                    elevation: 0,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                  child: const Text('Book', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
      ],
    );
  }

  Widget _buildEquipmentFallbackIcon() {
    return Center(
      child: Icon(Icons.agriculture_rounded, size: 40, color: AppTheme.primaryGreen.withValues(alpha: 0.6)),
    );
  }`;

if (headerRegex.test(code)) {
  code = code.replace(headerRegex, newHeaderAndWidgets);
  console.log('Header and new widgets replaced via regex');
} else {
  console.log('Error: headerRegex not matched');
}

// 6. Update _buildQuickActionsRow to the 4 prototype actions
const quickActionsRegex = /Widget _buildQuickActionsRow\(bool isDark\) \{[\s\S]*?final actions = \[[\s\S]*?\];\s*return Row\(/;

const newQuickActions = `Widget _buildQuickActionsRow(bool isDark) {
    final actions = [
      {
        'title': 'My Farm',
        'icon': Icons.grass_rounded,
        'color': const Color(0xFF2E7D32),
        'bg': const Color(0xFFE8F5E9),
        'onTap': () => widget.onTabSelected?.call(1),
      },
      {
        'title': 'Book Equipment',
        'icon': Icons.agriculture_rounded,
        'color': const Color(0xFFE65100),
        'bg': const Color(0xFFFFF3E0),
        'onTap': () => widget.onTabSelected?.call(2),
      },
      {
        'title': 'Community',
        'icon': Icons.groups_rounded,
        'color': const Color(0xFF1976D2),
        'bg': const Color(0xFFE3F2FD),
        'onTap': () => context.push('/community'),
      },
      {
        'title': 'AI Assistant',
        'icon': Icons.smart_toy_rounded,
        'color': const Color(0xFF6A1B9A),
        'bg': const Color(0xFFF3E5F5),
        'onTap': () => context.push('/ai-assistant'),
      },
    ];

    return Row(`;

if (quickActionsRegex.test(code)) {
  code = code.replace(quickActionsRegex, newQuickActions);
  console.log('QuickActions replaced successfully');
} else {
  console.log('Error: quickActionsRegex not matched');
}

// 7. Connect _showAddTaskDialog in Next Operations card
code = code.replace(
  "const Icon(Icons.chevron_right_rounded, color: Color(0xFF757575), size: 22),",
  `InkWell(
                    onTap: () => _showAddTaskDialog(context, isDark),
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE8F5E9),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.add, size: 14, color: Color(0xFF2E7D32)),
                          SizedBox(width: 2),
                          Text('Add Task', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF2E7D32))),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  const Icon(Icons.chevron_right_rounded, color: Color(0xFF757575), size: 22),`
);

// 8. Connect _showAddExpenseDialog in Farmer Analytics
code = code.replace(
  `Text(
              'Farmer Analytics',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
                letterSpacing: -0.3,
              ),
            ),`,
  `Row(
              children: [
                Text(
                  'Farmer Analytics',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(width: 8),
                InkWell(
                  onTap: () => _showAddExpenseDialog(context, isDark),
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white12 : const Color(0xFFFFF3E0),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.add, size: 12, color: Color(0xFFE65100)),
                        SizedBox(width: 2),
                        Text('Expense', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: Color(0xFFE65100))),
                      ],
                    ),
                  ),
                ),
              ],
            ),`
);

fs.writeFileSync(targetPath, code, 'utf8');
console.log('Saved updated farmer_home_screen.dart');
