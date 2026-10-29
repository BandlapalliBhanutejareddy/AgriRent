import '../../../core/localization/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../shared/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../../farm/providers/farm_provider.dart';
import '../providers/marketplace_provider.dart';
import '../../../core/api/api_client.dart';
import '../../farm/models/farm_model.dart';
import '../../farm/providers/expenses_provider.dart';
import '../../notifications/providers/notification_provider.dart';
import '../../ai_assistant/ui/voice_interaction_modal.dart';
import '../../weather/ui/weather_widget.dart';
import '../../weather/providers/weather_provider.dart';
import '../../farm/ui/next_operation_widget.dart';
import 'widgets/search_suggestions_overlay.dart';

const List<String> kCanonicalStages = [
  'SOWING',
  'GERMINATION',
  'SEEDLING',
  'VEGETATIVE',
  'TILLERING',
  'PANICLE_INITIATION',
  'FLOWERING',
  'FRUITING',
  'MATURITY',
  'HARVEST'
];

class FarmerHomeScreen extends ConsumerStatefulWidget {
  final Function(int)? onTabSelected;

  const FarmerHomeScreen({super.key, this.onTabSelected});

  @override
  ConsumerState<FarmerHomeScreen> createState() => _FarmerHomeScreenState();
}

class _FarmerHomeScreenState extends ConsumerState<FarmerHomeScreen> {
  Map<String, dynamic>? _analytics;
  String _selectedAnalyticsPeriod = 'Last 30 days';
  bool _isLoadingAnalytics = false;
  String? _analyticsError;
  int _analyticsRequestId = 0;
  String? _selectedCropId;
  int _selectedCategoryChipIndex = 0;

  String _getTimeGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(farmProvider.notifier).fetchFarms().then((_) {
        _fetchAnalytics();
      });
      ref.read(marketplaceProvider.notifier).fetchInitial();
      ref.read(unreadNotificationsCountProvider.notifier).refresh();
    });
  }

  Future<void> _fetchAnalytics() async {
    final currentFarm = ref.read(farmProvider).selectedFarm;
    if (currentFarm == null) {
      if (mounted) {
        setState(() {
          _analytics = null;
          _isLoadingAnalytics = false;
          _analyticsError = null;
        });
      }
      return;
    }

    final currentCrop = currentFarm.crops.isNotEmpty == true
        ? (_selectedCropId != null
            ? currentFarm.crops.firstWhere((c) => c.id == _selectedCropId, orElse: () => currentFarm.crops.first)
            : currentFarm.crops.first)
        : null;

    final fId = currentFarm.id;
    final cId = currentCrop?.id;
    final requestId = ++_analyticsRequestId;

    setState(() {
      _isLoadingAnalytics = true;
      _analyticsError = null;
      _analytics = null; // Clear stale farm data immediately
    });

    try {
      final url = (fId.isNotEmpty)
          ? 'analytics/farmer?farmId=$fId${cId != null && cId.isNotEmpty ? '&cropId=$cId' : ''}'
          : 'analytics/farmer';

      final response = await ApiClient().dio.get(url);
      if (mounted && requestId == _analyticsRequestId) {
        final activeFarm = ref.read(farmProvider).selectedFarm;
        if (activeFarm?.id == fId) {
          final dynamic raw = response.data;
          setState(() {
            if (raw is Map<String, dynamic>) {
              _analytics = raw['data'] is Map<String, dynamic> ? raw['data'] : raw;
            }
            _isLoadingAnalytics = false;
            _analyticsError = null;
          });
        }
      }
    } catch (e) {
      if (mounted && requestId == _analyticsRequestId) {
        setState(() {
          _isLoadingAnalytics = false;
          _analyticsError = e.toString();
        });
      }
    }
  }

  void _showCropSelectionModal(BuildContext context, List<FarmModel> farms, bool isDark) {
    if (farms.isEmpty) return;

    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Select Farm & Crop',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ...farms.map((f) {
                final crops = f.crops.isNotEmpty ? f.crops : [FarmCropModel(id: '', farmId: f.id, cropName: 'General', variety: '', season: 'Active', stage: 'Growing', status: 'ACTIVE')];
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6.0),
                      child: Text(
                        '${f.name} (${f.area} ${f.areaUnit})',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.grey.shade400 : Colors.grey.shade700,
                        ),
                      ),
                    ),
                    ...crops.map((c) {
                      final currentSelectedFarmId = ref.read(farmProvider).selectedFarmId ?? farms.first.id;
                      final isSelected = (currentSelectedFarmId == f.id) &&
                          (_selectedCropId == c.id || (_selectedCropId == null && (f.crops.isEmpty || f.crops.first.id == c.id)));

                      return ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
                        leading: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: isSelected ? AppTheme.primaryGreen : (isDark ? Colors.white12 : Colors.grey.shade200),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(Icons.eco_rounded, color: isSelected ? Colors.white : (isDark ? Colors.grey : Colors.grey.shade700), size: 20),
                        ),
                        title: Text(
                          c.cropName.isNotEmpty ? c.cropName : 'Main Crop',
                          style: TextStyle(
                            fontWeight: isSelected ? FontWeight.w900 : FontWeight.w600,
                            color: isSelected ? AppTheme.primaryGreen : (isDark ? Colors.white : AppTheme.textDarkNavy),
                          ),
                        ),
                        subtitle: Text(
                          '${c.season} • Stage: ${c.stage}',
                          style: TextStyle(fontSize: 12, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                        ),
                        trailing: isSelected ? const Icon(Icons.check_circle, color: AppTheme.primaryGreen) : null,
                        onTap: () async {
                          Navigator.pop(ctx);
                          setState(() {
                            _selectedCropId = c.id;
                          });
                          await ref.read(farmProvider.notifier).selectFarm(f.id);
                          _fetchAnalytics();
                          ref.read(expensesProvider.notifier).fetchExpenses(f.id);
                        },
                      );
                    }),
                    const Divider(height: 16),
                  ],
                );
              }),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final user = ref.watch(authProvider).user;
    final farmState = ref.watch(farmProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    ref.listen<FarmState>(farmProvider, (previous, next) {
      if (previous?.selectedFarmId != next.selectedFarmId) {
        setState(() {
          _selectedCropId = null;
        });
        _fetchAnalytics();
        if (next.selectedFarmId != null && next.selectedFarmId!.isNotEmpty) {
          ref.read(expensesProvider.notifier).fetchExpenses(next.selectedFarmId!);
        }
      }
    });

    final farm = farmState.selectedFarm;
    final crop = farm?.crops.isNotEmpty == true
        ? (_selectedCropId != null
            ? farm!.crops.firstWhere((c) => c.id == _selectedCropId, orElse: () => farm.crops.first)
            : farm!.crops.first)
        : null;

    final farmerName = user?.name.isNotEmpty == true ? user!.name : 'Ravi';
    final initial = farmerName.isNotEmpty ? farmerName[0].toUpperCase() : 'R';

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF6F8FA),
      body: SafeArea(
        child: RefreshIndicator(
          color: AppTheme.primaryGreen,
          onRefresh: () async {
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
                _buildHeader(farmerName, initial, isDark, farm, lang),
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
                _buildCropBannerCard(crop, farm, farmState.farms, isDark, lang),
                const SizedBox(height: 18),

                // 8. CURRENT STAGE & NEXT STAGE DUAL CARD
                _buildStageProgressionCard(crop, farm, isDark, lang),
                const SizedBox(height: 16),

                // 9. NEXT IMPORTANT OPERATIONS CARD
                _buildNextOperationsCard(crop, farm, isDark, lang),
                const SizedBox(height: 20),

                // 10. FARMER ANALYTICS (GRID OF 4 CARDS)
                _buildFarmerAnalyticsSection(farm, crop, isDark, lang),
                const SizedBox(height: 20),

                // 11. RECENT ACTIVITY TIMELINE
                _buildRecentActivitySection(isDark, lang),
                const SizedBox(height: 30),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 1. HEADER WIDGET
  // ---------------------------------------------------------------------------
  Widget _buildHeader(String farmerName, String initial, bool isDark, FarmModel? farm, String lang) {
    final unreadCount = ref.watch(unreadNotificationsCountProvider);
    final loc = AppLocalizations.of(context);
    final greeting = _getTimeGreeting();
    final farmLoc = farm != null && farm.location.isNotEmpty ? farm.location : (farm?.name ?? loc.translate('no_farm_selected'));
    String weatherText = '';
    if (farm != null && farm.id.isNotEmpty) {
      final weatherState = ref.watch(weatherProvider(farm.id));
      final temp = weatherState.weatherData?.current.temperature;
      if (temp != null) {
        weatherText = ' • ${temp.round()}°C';
      } else if (weatherState.isLoading) {
        weatherText = ' • ...';
      }
    }

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
                    '$greeting $farmerName',
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
                      '$farmLoc$weatherText',
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
                        unreadCount > 99 ? '99+' : '$unreadCount',
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
                    context.push('/ai-assistant?query=${Uri.encodeComponent(query)}');
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
      {'title': 'all'.tr(lang), 'icon': Icons.grid_view_rounded},
      {'title': 'crops'.tr(lang), 'icon': Icons.grass_rounded},
      {'title': 'equipment'.tr(lang), 'icon': Icons.agriculture_rounded},
      {'title': 'community'.tr(lang), 'icon': Icons.groups_rounded},
      {'title': 'learning'.tr(lang), 'icon': Icons.menu_book_rounded},
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
                context.push('/knowledge');
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
    final loc = AppLocalizations.of(context);
    final activeOps = (_analytics?['activeOperations'] as num?)?.toInt() ?? 0;
    final totalTasks = (_analytics?['totalTasks'] as num?)?.toInt() ?? 0;
    final completedTasks = (_analytics?['completedTasks'] as num?)?.toInt() ?? 0;
    final unreadCount = ref.watch(unreadNotificationsCountProvider);

    // Weather Card telemetry
    String weatherMain = loc.translate('weather_unavailable');
    String weatherSub = '--';
    if (farm != null && farm.id.isNotEmpty) {
      final weatherState = ref.watch(weatherProvider(farm.id));
      final current = weatherState.weatherData?.current;
      if (current?.temperature != null) {
        weatherMain = '${current!.temperature!.round()}°C';
        final hum = current.humidity != null ? '${current.humidity!.round()}% Hum' : '';
        final wind = current.windSpeed != null ? '${current.windSpeed!.round()} km/h' : '';
        weatherSub = [hum, wind].where((s) => s.isNotEmpty).join(' • ');
        if (weatherSub.isEmpty) weatherSub = weatherState.weatherData?.source ?? 'Live Telemetry';
      } else if (weatherState.isLoading) {
        weatherMain = '...';
        weatherSub = 'Loading weather...';
      }
    } else {
      weatherMain = loc.translate('no_farm_selected');
      weatherSub = loc.translate('weather_unavailable');
    }

    // Tasks Card telemetry
    String taskMain = loc.translate('no_active_tasks');
    String taskSub = '0 pending tasks';
    if (farm != null) {
      if (activeOps > 0) {
        taskMain = '$activeOps Active Ops';
        taskSub = totalTasks > 0 ? '$completedTasks of $totalTasks tasks done' : '$activeOps pending operations';
      } else if (totalTasks > 0) {
        taskMain = '$completedTasks / $totalTasks Done';
        taskSub = '$totalTasks total tasks';
      } else {
        taskMain = loc.translate('no_active_tasks');
        taskSub = '0 pending tasks';
      }
    }

    // Crop Stage Card
    String cropMain = loc.translate('no_crop_registered');
    String cropSub = farm != null ? farm.name : loc.translate('no_farm_selected');
    if (crop != null) {
      final cName = crop.cropName.isNotEmpty ? crop.cropName : loc.translate('current_crop');
      final cStage = crop.stage.isNotEmpty ? crop.stage.replaceAll('_', ' ') : loc.translate('current_stage');
      cropMain = '$cName • $cStage';
      if (crop.sowingDate != null) {
        final days = DateTime.now().difference(crop.sowingDate!).inDays;
        cropSub = 'Day $days since sowing';
      } else if (crop.season.isNotEmpty) {
        cropSub = '${crop.season} Season';
      } else if (crop.variety?.isNotEmpty == true) {
        cropSub = crop.variety!;
      } else {
        cropSub = 'Active Crop';
      }
    }

    // Farm Alerts
    final alertMain = unreadCount > 0 ? '$unreadCount Alert${unreadCount > 1 ? 's' : ''}' : loc.translate('all_clear');
    final alertSub = unreadCount > 0 ? 'Action required' : 'No critical alerts';

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildStatusTile(
                title: loc.translate('weather'),
                mainText: weatherMain,
                subText: weatherSub,
                icon: Icons.wb_sunny_rounded,
                iconColor: const Color(0xFFF57F17),
                bgColor: const Color(0xFFFFF8E1),
                isDark: isDark,
                onTap: () {
                  final targetFarmId = (farm != null && farm.id.isNotEmpty) ? farm.id : 'current-lookup';
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
                            WeatherWidget(farmId: targetFarmId),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatusTile(
                title: loc.translate('todays_tasks'),
                mainText: taskMain,
                subText: taskSub,
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
                title: loc.translate('crop_stage'),
                mainText: cropMain,
                subText: cropSub,
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
                title: loc.translate('farm_alerts'),
                mainText: alertMain,
                subText: alertSub,
                icon: Icons.warning_amber_rounded,
                iconColor: const Color(0xFFE65100),
                bgColor: const Color(0xFFFFF3E0),
                isDark: isDark,
                onTap: () => context.push(
                  crop != null
                      ? '/ai-assistant?query=${Uri.encodeComponent("What farming advisories apply for ${crop.cropName} in ${crop.stage} stage?")}'
                      : '/notifications',
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
              'recommended_equipment'.tr(lang),
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
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: Text(
                  'view_all'.tr(lang),
                  style: const TextStyle(
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
              'no_equipment_found'.tr(lang),
              style: TextStyle(fontSize: 13, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
            ),
          )
        else
          SizedBox(
            height: 215,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: items.length,
              separatorBuilder: (_, _) => const SizedBox(width: 12),
              itemBuilder: (ctx, idx) {
                final eq = items[idx];
                final hasPrice = eq.pricePerDay != null && eq.pricePerDay! > 0;
                final price = hasPrice
                    ? '${AppFormatters.currency(eq.pricePerDay, lang: lang)}/${'per_day'.tr(lang)}'
                    : 'not_available'.tr(lang);
                final ownerName = (eq.owner?.name.isNotEmpty == true)
                    ? eq.owner!.name
                    : 'verified_owner'.tr(lang);

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
                                  onPressed: () => context.push('/equipment/${eq.id}'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppTheme.primaryGreen,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                    minimumSize: const Size(0, 28),
                                    elevation: 0,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                  child: Text('rent_book'.tr(lang), style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
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
  }

  // ---------------------------------------------------------------------------
  // 2. CURRENT CROP BANNER CARD
  // ---------------------------------------------------------------------------
  Widget _buildCropBannerCard(FarmCropModel? crop, FarmModel? farm, List<FarmModel> farms, bool isDark, String lang) {
    final loc = AppLocalizations.of(context);

    if (farm == null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          color: isDark ? AppTheme.darkCard : Colors.white,
          border: Border.all(color: isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.info_outline_rounded, color: Colors.orange, size: 24),
                const SizedBox(width: 10),
                Text(
                  loc.translate('no_farm_selected'),
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Select or register a farm to view live crop progress and operations.',
              style: TextStyle(fontSize: 13, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: () => context.push('/farm-setup?mode=create'),
              icon: const Icon(Icons.add_location_alt_rounded, size: 18),
              label: Text(loc.translate('set_up_farm')),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryGreen,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      );
    }

    if (crop == null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          color: isDark ? AppTheme.darkCard : Colors.white,
          border: Border.all(color: isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.grass_rounded, color: AppTheme.primaryGreen, size: 24),
                const SizedBox(width: 10),
                Text(
                  loc.translate('no_crop_registered'),
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '${farm.name} has no active crop registered. Add a crop to track lifecycle stages.',
              style: TextStyle(fontSize: 13, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: () => context.push('/farm-setup?mode=edit&farmId=${farm.id}'),
              icon: const Icon(Icons.eco_rounded, size: 18),
              label: Text(loc.translate('edit_farm')),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryGreen,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      );
    }

    final cropName = crop.cropName.isNotEmpty ? crop.cropName : loc.translate('current_crop');
    final stageName = crop.stage.isNotEmpty ? crop.stage.replaceAll('_', ' ') : loc.translate('current_stage');
    final totalTasks = (_analytics?['totalTasks'] as num?)?.toInt() ?? 0;
    final completedTasks = (_analytics?['completedTasks'] as num?)?.toInt() ?? 0;
    final progressVal = totalTasks > 0 ? (completedTasks / totalTasks).clamp(0.0, 1.0) : 0.0;
    final progressPct = (progressVal * 100).toInt();
    final progressText = totalTasks > 0 ? '$progressPct% Complete' : 'No tasks recorded';

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          colors: [Color(0xFF1B5E20), Color(0xFF2E7D32), Color(0xFF43A047)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF2E7D32).withValues(alpha: 0.3),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: -10,
            bottom: -10,
            child: Opacity(
              opacity: 0.22,
              child: Icon(Icons.grass_rounded, size: 160, color: Colors.white.withValues(alpha: 0.8)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  loc.translate('current_crop'),
                  style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                InkWell(
                  onTap: () => _showCropSelectionModal(context, farms, isDark),
                  borderRadius: BorderRadius.circular(10),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 2.0),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          cropName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.3,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(Icons.keyboard_arrow_down_rounded, color: Colors.white, size: 22),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF66BB6A),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        stageName,
                        style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: LinearProgressIndicator(
                              value: progressVal,
                              backgroundColor: Colors.white24,
                              valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                              minHeight: 6,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      progressText,
                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                ElevatedButton(
                  onPressed: () => _showCropDetailsDialog(context, crop, farm, isDark),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF1B5E20),
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: Text(
                    loc.translate('view_crop_details'),
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 3. CURRENT STAGE & NEXT STAGE DUAL CARD
  // ---------------------------------------------------------------------------
  Widget _buildStageProgressionCard(FarmCropModel? crop, FarmModel? farm, bool isDark, String lang) {
    final loc = AppLocalizations.of(context);
    if (crop == null) {
      return const SizedBox.shrink();
    }

    final currentStage = crop.stage.isNotEmpty ? crop.stage.replaceAll('_', ' ') : loc.translate('current_stage');
    final currentIdx = kCanonicalStages.indexOf(crop.stage);
    final String nextStage;
    if (currentIdx >= 0 && currentIdx + 1 < kCanonicalStages.length) {
      nextStage = kCanonicalStages[currentIdx + 1].replaceAll('_', ' ');
    } else if (currentIdx == kCanonicalStages.length - 1) {
      nextStage = 'Harvest Complete';
    } else {
      nextStage = loc.translate('next_stage');
    }

    final currentSub = crop.sowingDate != null
        ? 'Day ${DateTime.now().difference(crop.sowingDate!).inDays}'
        : (crop.season.isNotEmpty ? crop.season : 'Active');
    final nextSub = nextStage != 'Harvest Complete' ? 'Upcoming Stage' : 'Final Cycle';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFE8ECEF)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          // Current Stage Box
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE8F5E9),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.spa_rounded, color: Color(0xFF2E7D32), size: 16),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      loc.translate('current_stage'),
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  currentStage,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  currentSub,
                  style: TextStyle(fontSize: 11, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                ),
                const SizedBox(height: 8),
                OutlinedButton(
                  onPressed: () => _showStageDetailsDialog(context, currentStage, crop, farm, isDark),
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: isDark ? Colors.white24 : Colors.grey.shade300),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    minimumSize: const Size(0, 28),
                  ),
                  child: Text(
                    'View Details',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: isDark ? Colors.white : AppTheme.textDarkNavy),
                  ),
                ),
              ],
            ),
          ),

          // Divider / Arrow
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Icon(Icons.arrow_forward_rounded, color: Colors.grey.shade400, size: 20),
          ),

          // Next Stage Box
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF8E1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.grain_rounded, color: Color(0xFFF57F17), size: 16),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      loc.translate('next_stage'),
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  nextStage,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  nextSub,
                  style: TextStyle(fontSize: 11, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                ),
                const SizedBox(height: 8),
                ElevatedButton(
                  onPressed: () => _showStageDetailsDialog(context, nextStage, crop, farm, isDark),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1B5E20),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    minimumSize: const Size(0, 28),
                  ),
                  child: const Text(
                    'View Details',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 4. NEXT IMPORTANT OPERATIONS CARD
  // ---------------------------------------------------------------------------
  Widget _buildNextOperationsCard(FarmCropModel? crop, FarmModel? farm, bool isDark, String lang) {
    if (farm == null || farm.id.isEmpty) {
      final loc = AppLocalizations.of(context);
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : const Color(0xFFFFFDF2),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFFFE082)),
        ),
        child: Text(
          loc.translate('no_farm_selected'),
          style: TextStyle(fontWeight: FontWeight.w600, color: isDark ? Colors.white70 : const Color(0xFF424242)),
        ),
      );
    }

    final targetCropId = crop?.id ?? (farm.crops.isNotEmpty ? farm.crops.first.id : '');
    return NextOperationWidget(
      farmId: farm.id,
      cropId: targetCropId,
      margin: EdgeInsets.zero,
    );
  }

  // ---------------------------------------------------------------------------
  // 5. QUICK ACTIONS ROW
  // ---------------------------------------------------------------------------
  Widget _buildQuickActionsRow(bool isDark) {
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
        'title': 'AI Copilot',
        'icon': Icons.smart_toy_rounded,
        'color': const Color(0xFF6A1B9A),
        'bg': const Color(0xFFF3E5F5),
        'onTap': () {
          final farmState = ref.read(farmProvider);
          final activeFarm = farmState.selectedFarm;
          final fId = activeFarm?.id ?? '';
          final cId = (activeFarm?.crops.isNotEmpty == true) ? activeFarm!.crops.first.id : '';
          context.push('/farm-copilot?farmId=$fId&cropId=$cId');
        },
      },
    ];

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: actions.map((act) {
        return GestureDetector(
          onTap: act['onTap'] as VoidCallback,
          child: SizedBox(
            width: 64,
            child: Column(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: isDark ? (act['bg'] as Color).withValues(alpha: 0.15) : act['bg'] as Color,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: (act['color'] as Color).withValues(alpha: isDark ? 0.1 : 0.12),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Icon(act['icon'] as IconData, color: act['color'] as Color, size: 26),
                ),
                const SizedBox(height: 6),
                Text(
                  act['title'] as String,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    height: 1.1,
                    color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  // ---------------------------------------------------------------------------
  // 6. FARMER ANALYTICS (GRID OF 4 INTERACTIVE CARDS)
  // ---------------------------------------------------------------------------
  Widget _buildFarmerAnalyticsSection(FarmModel? farm, FarmCropModel? crop, bool isDark, String lang) {
    final loc = AppLocalizations.of(context);
    final activeOps = (_analytics?['activeOperations'] as num?)?.toInt() ?? 0;
    final completedTasks = (_analytics?['completedTasks'] as num?)?.toInt() ?? 0;
    final totalRentals = (_analytics?['totalRentals'] as num?)?.toInt() ?? ((_analytics?['completedRentals'] as num?)?.toInt() ?? 0);
    final totalSpentNum = (_analytics?['totalSpending'] ?? _analytics?['totalSpent']) as num?;
    final formattedSpent = totalSpentNum != null
        ? NumberFormat.currency(locale: 'en_IN', symbol: '₹ ', decimalDigits: 0).format(totalSpentNum)
        : (farm == null ? loc.translate('no_farm_selected') : (_analyticsError != null ? 'Unavailable' : '₹ 0'));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Text(
                  loc.translate('farmer_analytics'),
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
            ),
            PopupMenuButton<String>(
              initialValue: _selectedAnalyticsPeriod,
              onSelected: (val) => setState(() => _selectedAnalyticsPeriod = val),
              color: isDark ? AppTheme.darkCard : Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Row(
                children: [
                  if (_isLoadingAnalytics) ...[
                    const SizedBox(
                      width: 12,
                      height: 12,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primaryGreen),
                    ),
                    const SizedBox(width: 6),
                  ],
                  Text(
                    _selectedAnalyticsPeriod,
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.grey.shade300 : Colors.grey.shade700,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: isDark ? Colors.grey.shade300 : Colors.grey.shade700),
                ],
              ),
              itemBuilder: (context) => [
                const PopupMenuItem(value: 'Last 7 days', child: Text('Last 7 days')),
                const PopupMenuItem(value: 'Last 30 days', child: Text('Last 30 days')),
                const PopupMenuItem(value: 'This Season', child: Text('This Season')),
                const PopupMenuItem(value: 'All Time', child: Text('All Time')),
              ],
            ),
          ],
        ),
        if (_analyticsError != null) ...[
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.red.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.error_outline, size: 16, color: Colors.red),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Failed to load latest analytics',
                    style: TextStyle(fontSize: 12, color: isDark ? Colors.red.shade300 : Colors.red.shade700),
                  ),
                ),
                TextButton(
                  onPressed: _fetchAnalytics,
                  child: const Text('Retry', style: TextStyle(fontSize: 12)),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 14),

        // 2x2 Analytics Grid
        Row(
          children: [
            // Active Operations Card
            Expanded(
              child: _buildAnalyticsCard(
                title: loc.translate('active_operations'),
                value: '$activeOps',
                icon: Icons.spa_rounded,
                iconColor: const Color(0xFF2E7D32),
                iconBg: const Color(0xFFE8F5E9),
                isDark: isDark,
                onTap: () => context.push('/farm-plan'),
              ),
            ),
            const SizedBox(width: 12),
            // Completed Tasks Card
            Expanded(
              child: _buildAnalyticsCard(
                title: loc.translate('completed_tasks'),
                value: '$completedTasks',
                icon: Icons.check_circle_rounded,
                iconColor: const Color(0xFF1565C0),
                iconBg: const Color(0xFFE3F2FD),
                isDark: isDark,
                onTap: () => context.push('/completed-tasks?farmId=${farm?.id ?? ''}&cropId=${crop?.id ?? ''}'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            // Total Rentals Card
            Expanded(
              child: _buildAnalyticsCard(
                title: loc.translate('total_rentals'),
                value: '$totalRentals',
                icon: Icons.agriculture_rounded,
                iconColor: const Color(0xFFE65100),
                iconBg: const Color(0xFFFFF3E0),
                isDark: isDark,
                onTap: () => _showRentalsDetailsDialog(context, isDark),
              ),
            ),
            const SizedBox(width: 12),
            // Total Spending Card
            Expanded(
              child: _buildAnalyticsCard(
                title: loc.translate('total_spending'),
                value: formattedSpent,
                icon: Icons.currency_rupee_rounded,
                iconColor: const Color(0xFF6A1B9A),
                iconBg: const Color(0xFFF3E5F5),
                isDark: isDark,
                onTap: () => _showAnalyticsDetailScreen(context, isDark),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildAnalyticsCard({
    required String title,
    required String value,
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFE8ECEF)),
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
                    color: isDark ? iconBg.withValues(alpha: 0.15) : iconBg,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: iconColor, size: 20),
                ),
                Icon(Icons.chevron_right_rounded, color: isDark ? Colors.grey.shade500 : Colors.grey.shade400, size: 20),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              title,
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
                color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 7. RECENT ACTIVITY TIMELINE
  // ---------------------------------------------------------------------------
  Widget _buildRecentActivitySection(bool isDark, String lang) {
    final loc = AppLocalizations.of(context);
    final recentBookings = List<dynamic>.from(_analytics?['recentBookings'] ?? []);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              loc.translate('recent_activity'),
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
                letterSpacing: -0.3,
              ),
            ),
            TextButton(
              onPressed: () => context.push('/farm-plan'),
              child: Text(
                loc.translate('view_all'),
                style: const TextStyle(color: AppTheme.primaryGreen, fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFE8ECEF)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: recentBookings.isEmpty
              ? Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.history_rounded, size: 36, color: isDark ? Colors.grey.shade600 : Colors.grey.shade400),
                        const SizedBox(height: 8),
                        Text(
                          loc.translate('no_recent_activity'),
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                          ),
                        ),
                        const SizedBox(height: 10),
                        OutlinedButton(
                          onPressed: () => widget.onTabSelected?.call(2),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: AppTheme.primaryGreen),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          ),
                          child: const Text('Book Equipment', style: TextStyle(color: AppTheme.primaryGreen, fontSize: 12, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ),
                )
              : ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: recentBookings.take(4).length,
                  separatorBuilder: (_, _) => Divider(height: 1, indent: 64, color: isDark ? Colors.white10 : Colors.grey.shade100),
                  itemBuilder: (context, idx) {
                    final b = recentBookings[idx];
                    final title = b['equipment']?['title'] ?? 'Equipment Rental';
                    final dateStr = b['createdAt'] != null
                        ? DateFormat.yMMMd().format(DateTime.parse(b['createdAt']))
                        : 'Recent';
                    final status = (b['status'] ?? 'CONFIRMED').toString().toUpperCase();
                    final price = b['totalPrice'] != null ? '₹ ${b['totalPrice']}' : 'Unavailable';

                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.agriculture_rounded, color: AppTheme.primaryGreen, size: 20),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  title,
                                  style: TextStyle(
                                    fontSize: 13.5,
                                    fontWeight: FontWeight.w700,
                                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '$dateStr • $price',
                                  style: TextStyle(fontSize: 11.5, color: isDark ? Colors.grey.shade400 : Colors.grey.shade500),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: status == 'COMPLETED'
                                  ? const Color(0xFFE8F5E9)
                                  : (status == 'PENDING' ? const Color(0xFFFFF3E0) : const Color(0xFFE3F2FD)),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              status,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: status == 'COMPLETED'
                                    ? const Color(0xFF2E7D32)
                                    : (status == 'PENDING' ? const Color(0xFFE65100) : const Color(0xFF1976D2)),
                              ),
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

  // ===========================================================================
  // CONNECTED DRILLDOWN SCREENS & DIALOGS
  // ===========================================================================

  // 1. CROP DETAILS SCREEN / DIALOG
  void _showCropDetailsDialog(BuildContext context, FarmCropModel? crop, FarmModel? farm, bool isDark) {
    final totalTasks = (_analytics?['totalTasks'] as num?)?.toInt() ?? 0;
    final completedTasks = (_analytics?['completedTasks'] as num?)?.toInt() ?? 0;
    final progressVal = totalTasks > 0 ? (completedTasks / totalTasks).clamp(0.0, 1.0) : 0.0;
    final progressPct = (progressVal * 100).toInt();
    final progressLabel = totalTasks > 0 ? '$progressPct% Complete' : 'No tasks recorded';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.88,
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: DefaultTabController(
          length: 4,
          child: Column(
            children: [
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 14, 16, 8),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            crop?.cropName.isNotEmpty == true ? crop!.cropName : 'No Crop Registered',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: isDark ? Colors.white : AppTheme.textDarkNavy),
                          ),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(color: AppTheme.primaryGreen, borderRadius: BorderRadius.circular(6)),
                                child: Text(crop?.stage.isNotEmpty == true ? crop!.stage.replaceAll('_', ' ') : 'Inactive', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                              ),
                              const SizedBox(width: 8),
                              Text(progressLabel, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const TabBar(
                isScrollable: true,
                labelColor: AppTheme.primaryGreen,
                unselectedLabelColor: Colors.grey,
                indicatorColor: AppTheme.primaryGreen,
                tabs: [
                  Tab(text: 'Overview'),
                  Tab(text: 'Stages'),
                  Tab(text: 'Tasks'),
                  Tab(text: 'Expenses'),
                ],
              ),
              Expanded(
                child: TabBarView(
                  children: [
                    // Overview Tab
                    ListView(
                      padding: const EdgeInsets.all(20),
                      children: [
                        _buildDetailRow('Farm Name', farm?.name ?? 'Not selected', isDark),
                        _buildDetailRow('Acreage', farm != null ? '${farm.area} ${farm.areaUnit}' : 'Unavailable', isDark),
                        _buildDetailRow('Soil Type', farm?.soilType ?? 'Not specified', isDark),
                        _buildDetailRow('Season', crop?.season.isNotEmpty == true ? crop!.season : 'Not specified', isDark),
                        _buildDetailRow('Sowing Date', crop?.sowingDate != null ? DateFormat.yMMMd().format(crop!.sowingDate!) : 'Not configured', isDark),
                        _buildDetailRow('Expected Harvest', crop?.expectedHarvestDate != null ? DateFormat.yMMMd().format(crop!.expectedHarvestDate!) : 'Not configured', isDark),
                      ],
                    ),
                    // Stages Tab
                    ListView(
                      padding: const EdgeInsets.all(20),
                      children: kCanonicalStages.map((st) {
                        final currentIdx = crop != null ? kCanonicalStages.indexOf(crop.stage) : -1;
                        final thisIdx = kCanonicalStages.indexOf(st);
                        final String statusLabel;
                        final IconData icon;
                        final Color color;
                        if (currentIdx != -1 && thisIdx < currentIdx) {
                          statusLabel = 'Completed';
                          icon = Icons.check_circle;
                          color = Colors.green;
                        } else if (currentIdx == thisIdx) {
                          statusLabel = 'Current Stage';
                          icon = Icons.spa;
                          color = Colors.blue;
                        } else {
                          statusLabel = 'Upcoming';
                          icon = Icons.grain;
                          color = Colors.grey;
                        }
                        return _buildStageItem(st.replaceAll('_', ' '), statusLabel, icon, color, isDark);
                      }).toList(),
                    ),
                    // Tasks Tab
                    ListView(
                      padding: const EdgeInsets.all(20),
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Text(
                            totalTasks > 0 ? '$completedTasks of $totalTasks tasks completed' : 'No task records found for this crop',
                            style: TextStyle(fontWeight: FontWeight.w600, color: isDark ? Colors.grey.shade300 : AppTheme.textDarkNavy),
                          ),
                        ),
                        ElevatedButton(
                          onPressed: () {
                            Navigator.pop(ctx);
                            context.push('/farm-plan');
                          },
                          style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen, foregroundColor: Colors.white),
                          child: const Text('View Full Farm Operations Plan'),
                        ),
                      ],
                    ),
                    // Expenses Tab
                    Consumer(
                      builder: (context, ref, _) {
                        final totalSpentNum = (_analytics?['totalSpending'] ?? _analytics?['totalSpent']) as num?;
                        final rentalSpentNum = (_analytics?['rentalSpending']) as num?;
                        final otherSpentNum = (_analytics?['otherExpenses']) as num?;
                        final expData = ref.watch(expensesProvider).farmExpenses[farm?.id ?? ''];
                        final expItems = expData?.expenses ?? [];

                        return ListView(
                          padding: const EdgeInsets.all(20),
                          children: [
                            if (rentalSpentNum != null)
                              _buildDetailRow('Machinery Rentals', '₹ ${rentalSpentNum.round()}', isDark),
                            if (otherSpentNum != null)
                              _buildDetailRow('Other Operations', '₹ ${otherSpentNum.round()}', isDark),
                            ...expItems.take(5).map((e) => _buildDetailRow(e.title, '₹ ${e.amount.round()}', isDark)),
                            if (rentalSpentNum == null && otherSpentNum == null && expItems.isEmpty)
                              Padding(
                                padding: const EdgeInsets.symmetric(vertical: 16.0),
                                child: Text('No expense records logged for this farm.', style: TextStyle(color: isDark ? Colors.grey.shade400 : Colors.grey.shade600)),
                              ),
                            const Divider(),
                            _buildDetailRow(
                              'Total Spending',
                              totalSpentNum != null ? '₹ ${totalSpentNum.round()}' : (expItems.isNotEmpty ? '₹ ${expData?.totalSpent.round()}' : 'Unavailable'),
                              isDark,
                              isBold: true,
                            ),
                          ],
                        );
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // 2. STAGE DETAILS SCREEN / DIALOG
  void _showStageDetailsDialog(BuildContext context, String stageName, FarmCropModel? crop, FarmModel? farm, bool isDark) {
    final stageSub = (crop != null && crop.stage.replaceAll('_', ' ') == stageName.replaceAll('_', ' ') && crop.sowingDate != null)
        ? 'Day ${DateTime.now().difference(crop.sowingDate!).inDays} since sowing'
        : 'Recommended Stage Advisory';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      stageName,
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: isDark ? Colors.white : AppTheme.textDarkNavy),
                    ),
                    Text(stageSub, style: const TextStyle(color: Colors.grey, fontSize: 13)),
                  ],
                ),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              'About this stage',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: isDark ? Colors.white : AppTheme.textDarkNavy),
            ),
            const SizedBox(height: 6),
            Text(
              _getStageDescription(stageName),
              style: TextStyle(fontSize: 13, height: 1.4, color: isDark ? Colors.grey.shade400 : Colors.grey.shade700),
            ),
            const SizedBox(height: 18),
            Text(
              'Recommended Operations',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: isDark ? Colors.white : AppTheme.textDarkNavy),
            ),
            const SizedBox(height: 8),
            _buildOperationChecklist('Follow localized nutrient scheduling and moisture monitoring'),
            _buildOperationChecklist('Conduct regular pest scouting for early preventive management'),
            _buildOperationChecklist('Verify equipment readiness for scheduled operations'),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(ctx);
                  _showStageRelatedEquipmentDialog(context, stageName, isDark);
                },
                icon: const Icon(Icons.agriculture_rounded),
                label: const Text('View Related Equipment', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryGreen,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getStageDescription(String stage) {
    switch (stage.toLowerCase().replaceAll(' ', '_')) {
      case 'land_preparation':
        return 'Tillage, harrowing, leveling, and basal nutrient application to prepare fertile seedbed.';
      case 'sowing':
      case 'transplanting':
        return 'Seed placement, seedling transplantation, and initial moisture management.';
      case 'tillering':
      case 'vegetative':
        return 'Vegetative canopy development, shoot multiplication, and weed suppression.';
      case 'panicle_initiation':
      case 'flowering':
        return 'Reproductive differentiation, flowering, and critical water/nutrient maintenance.';
      case 'grain_filling':
      case 'ripening':
        return 'Grain development, starch deposition, and moisture taper before harvest.';
      case 'harvesting':
      case 'harvest':
        return 'Crop maturity, cutting, threshing, and post-harvest storage management.';
      default:
        return 'Active crop growth stage. Maintain scheduled monitoring and nutrient applications.';
    }
  }

  // 3. STAGE RELATED EQUIPMENT SCREEN / DIALOG
  void _showStageRelatedEquipmentDialog(BuildContext context, String stageName, bool isDark) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Consumer(
        builder: (context, ref, _) {
          final lang = ref.watch(languageProvider);
          final mktState = ref.watch(marketplaceProvider);
          final allEquip = mktState.equipment;

          if (mktState.isLoading && allEquip.isEmpty) {
            return Container(
              height: 300,
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkCard : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen)),
            );
          }

          // Filter relevant equipment from real DB
          final stageUpper = stageName.toUpperCase();
          final matching = allEquip.where((e) {
            final cat = e.category.toUpperCase();
            final title = e.title.toUpperCase();
            if (stageUpper.contains('SOW') || stageUpper.contains('PREP') || stageUpper.contains('SEED') || stageUpper.contains('GERM')) {
              return cat.contains('TRACTOR') || title.contains('ROTAVATOR') || title.contains('PLOUGH') || title.contains('TILLER') || title.contains('SEED');
            }
            if (stageUpper.contains('TILLER') || stageUpper.contains('VEGET') || stageUpper.contains('PANICLE') || stageUpper.contains('FLOWER') || stageUpper.contains('FRUIT')) {
              return cat.contains('SPRAY') || cat.contains('WEED') || title.contains('WEEDER') || title.contains('SPRAY') || title.contains('PUMP') || cat.contains('TRACTOR');
            }
            if (stageUpper.contains('HARVEST') || stageUpper.contains('MATUR')) {
              return cat.contains('HARVEST') || title.contains('HARVEST') || title.contains('THRESHER') || title.contains('BALER');
            }
            return true;
          }).toList();

          final displayList = matching.isNotEmpty ? matching : allEquip;

          return Container(
            height: MediaQuery.of(context).size.height * 0.75,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.darkCard : Colors.white,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        'Equipment for $stageName Stage',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: isDark ? Colors.white : AppTheme.textDarkNavy),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                  ],
                ),
                const SizedBox(height: 14),
                Expanded(
                  child: displayList.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.agriculture_rounded, size: 48, color: Colors.grey.shade400),
                              const SizedBox(height: 12),
                              Text('no_equipment_for_stage'.tr(lang), style: const TextStyle(color: Colors.grey)),
                            ],
                          ),
                        )
                      : ListView.separated(
                          itemCount: displayList.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 12),
                          itemBuilder: (context, idx) {
                        final eq = displayList[idx];
                        final hasPrice = eq.pricePerDay != null && eq.pricePerDay! > 0;
                        final priceStr = hasPrice
                            ? '${AppFormatters.currency(eq.pricePerDay, lang: lang)}/${'per_day'.tr(lang)}'
                            : 'not_available'.tr(lang);
                        return InkWell(
                          onTap: () {
                            Navigator.pop(ctx);
                            context.push('/equipment-detail', extra: eq);
                          },
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: isDark ? AppTheme.darkBackground : const Color(0xFFF9FBFA),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(Icons.agriculture_rounded, color: AppTheme.primaryGreen, size: 28),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        eq.title,
                                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: isDark ? Colors.white : AppTheme.textDarkNavy),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        priceStr,
                                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: AppTheme.primaryGreen),
                                      ),
                                      Text(
                                        eq.location ?? 'Available nearby',
                                        style: TextStyle(fontSize: 11.5, color: isDark ? Colors.grey.shade400 : Colors.grey.shade500),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 8),
                                ElevatedButton(
                                  onPressed: () {
                                    Navigator.pop(ctx);
                                    context.push('/equipment-detail', extra: eq);
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppTheme.primaryGreen,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                  ),
                                  child: const Text('Book Now', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5)),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      );
    }),
  );
  }

  // 4. RENTALS & SPENDING DETAILS SCREEN / DIALOG
  void _showRentalsDetailsDialog(BuildContext context, bool isDark) {
    final recentBookings = List<dynamic>.from(_analytics?['recentBookings'] ?? []);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Rentals & Spending Details',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: isDark ? Colors.white : AppTheme.textDarkNavy),
                ),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
              ],
            ),
            const SizedBox(height: 12),
            Expanded(
              child: recentBookings.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.receipt_long_outlined, size: 48, color: Colors.grey.shade400),
                          const SizedBox(height: 8),
                          const Text('No rental transactions yet.', style: TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                    )
                  : ListView.separated(
                      itemCount: recentBookings.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 10),
                      itemBuilder: (context, idx) {
                        final b = recentBookings[idx];
                        final title = b['equipment']?['title'] ?? 'Farm Machinery';
                        final amount = b['totalPrice'] ?? 0;
                        final status = b['status'] ?? 'COMPLETED';
                        final dateStr = b['createdAt'] != null
                            ? DateFormat('dd MMM yyyy').format(DateTime.parse(b['createdAt']))
                            : 'Recent';

                        return Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAF9),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(Icons.agriculture_rounded, color: AppTheme.primaryGreen, size: 24),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      title,
                                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: isDark ? Colors.white : AppTheme.textDarkNavy),
                                    ),
                                    Text(
                                      '$dateStr • 1 day',
                                      style: TextStyle(fontSize: 12, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                                    ),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    '₹ $amount',
                                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: isDark ? Colors.white : AppTheme.textDarkNavy),
                                  ),
                                  const SizedBox(height: 4),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: status == 'COMPLETED' ? const Color(0xFFE8F5E9) : const Color(0xFFE3F2FD),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      status,
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w700,
                                        color: status == 'COMPLETED' ? const Color(0xFF2E7D32) : const Color(0xFF1976D2),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  // 5. ANALYTICS DETAIL SCREEN (SPENDING ON RENTALS)
  void _showAnalyticsDetailScreen(BuildContext context, bool isDark) {
    final monthly = List<dynamic>.from(_analytics?['monthlySpending'] ?? (_analytics?['spendingGraph'] ?? []));
    final totalSpent = (_analytics?['totalSpending'] ?? _analytics?['totalSpent']) as num?;
    final categories = Map<String, dynamic>.from(_analytics?['categoryBreakdown'] ?? {});
    final formattedSpent = totalSpent != null
        ? NumberFormat.currency(locale: 'en_IN', symbol: '₹ ', decimalDigits: 0).format(totalSpent)
        : 'Unavailable';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.88,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Spending on Rentals',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: isDark ? Colors.white : AppTheme.textDarkNavy),
                  ),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
              const SizedBox(height: 16),

              // Monthly Bar Chart or Empty State
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAF9),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Monthly Spending Breakdown', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        if (monthly.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(color: const Color(0xFF1976D2), borderRadius: BorderRadius.circular(8)),
                            child: Text(
                              '${monthly.length} Months',
                              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    if (monthly.isEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 24),
                        child: Center(
                          child: Text(
                            'No monthly spending breakdown recorded yet.',
                            style: TextStyle(fontSize: 13, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                          ),
                        ),
                      )
                    else
                      Builder(
                        builder: (context) {
                          double maxAmt = 1.0;
                          for (final m in monthly) {
                            final a = (m['amount'] as num?)?.toDouble() ?? 0.0;
                            if (a > maxAmt) maxAmt = a;
                          }
                          return Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: monthly.map((m) {
                              final mName = (m['month'] ?? m['name'] ?? '').toString();
                              final amt = ((m['amount'] as num?) ?? 0).toDouble();
                              const maxH = 100.0;
                              final barH = (amt / maxAmt * maxH).clamp(12.0, maxH);
                              final isPeak = amt == maxAmt && maxAmt > 0;

                              return Column(
                                children: [
                                  Container(
                                    width: 24,
                                    height: barH,
                                    decoration: BoxDecoration(
                                      color: isPeak ? const Color(0xFF1976D2) : const Color(0xFF81D4FA),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(mName, style: TextStyle(fontSize: 11, fontWeight: isPeak ? FontWeight.bold : FontWeight.normal)),
                                ],
                              );
                            }).toList(),
                          );
                        },
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Total Summary
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Total Spent', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                  Text(formattedSpent, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.primaryGreen)),
                ],
              ),
              const SizedBox(height: 12),

              // Category-wise list
              if (categories.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Text(
                    'No category-wise rental expenses recorded yet.',
                    style: TextStyle(fontSize: 13, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                  ),
                )
              else
                ...categories.entries.map((e) {
                  final cat = e.key.replaceAll('_', ' ');
                  final val = e.value;
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('$cat Rentals', style: TextStyle(fontSize: 13.5, color: isDark ? Colors.grey.shade300 : Colors.grey.shade700)),
                        Text('₹ $val', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                      ],
                    ),
                  );
                }),
            ],
          ),
        ),
      ),
    );
  }

  // 6. ADD EXPENSE DIALOG
  void _showAddExpenseDialog(BuildContext context, bool isDark) {
    final titleController = TextEditingController();
    final amountController = TextEditingController();
    final farmState = ref.read(farmProvider);
    final farm = farmState.selectedFarm;
    bool isSubmitting = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text('Add Farm Expense', style: TextStyle(fontWeight: FontWeight.bold)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Expense Description',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.grey.shade300 : AppTheme.textDarkNavy,
                  ),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: titleController,
                  enabled: !isSubmitting,
                  decoration: const InputDecoration(hintText: 'e.g. Organic fertilizer bags', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 14),
                Text(
                  'Amount (₹)',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.grey.shade300 : AppTheme.textDarkNavy,
                  ),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: amountController,
                  keyboardType: TextInputType.number,
                  enabled: !isSubmitting,
                  decoration: const InputDecoration(hintText: 'e.g. 2500', border: OutlineInputBorder()),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: isSubmitting ? null : () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: isSubmitting
                  ? null
                  : () async {
                      final title = titleController.text.trim();
                      final amount = double.tryParse(amountController.text.trim()) ?? 0;
                      if (title.isEmpty || amount <= 0) return;
                      final messenger = ScaffoldMessenger.of(context);
                      if (farm == null) {
                        Navigator.pop(ctx);
                        messenger.showSnackBar(
                          const SnackBar(content: Text('Please select or set up a farm first.')),
                        );
                        return;
                      }
                      setDialogState(() => isSubmitting = true);
                      try {
                        await ApiClient().dio.post(
                          'farms/${farm.id}/financials/expense',
                          data: {'title': title, 'amount': amount, 'category': 'OTHER'},
                        );
                        _fetchAnalytics();
                        if (!mounted) return;
                        if (ctx.mounted) {
                          Navigator.pop(ctx);
                        }
                        messenger.showSnackBar(
                          const SnackBar(content: Text('Expense recorded successfully!'), backgroundColor: AppTheme.primaryGreen),
                        );
                      } catch (_) {
                        if (!mounted) return;
                        if (ctx.mounted) {
                          setDialogState(() => isSubmitting = false);
                        }
                        messenger.showSnackBar(
                          const SnackBar(content: Text('Failed to record expense. Please try again.'), backgroundColor: Colors.red),
                        );
                      }
                    },
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen, foregroundColor: Colors.white),
              child: isSubmitting
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Save Expense'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, bool isDark, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 14, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600)),
          Text(
            value,
            style: TextStyle(
              fontSize: isBold ? 16 : 14,
              fontWeight: isBold ? FontWeight.w900 : FontWeight.w700,
              color: isDark ? Colors.white : AppTheme.textDarkNavy,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStageItem(String name, String subtitle, IconData icon, Color color, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAF9),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: isDark ? Colors.white : AppTheme.textDarkNavy)),
                Text(subtitle, style: TextStyle(fontSize: 12, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600)),
              ],
            ),
          ),
        ],
      ),
    );
  }


  Widget _buildOperationChecklist(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          const Icon(Icons.check_circle_outline_rounded, color: Color(0xFF2E7D32), size: 18),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }
}
