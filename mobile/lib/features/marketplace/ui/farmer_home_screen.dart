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
  String? _selectedFarmId;
  String? _selectedCropId;

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
    });
  }

  Future<void> _fetchAnalytics() async {
    setState(() => _isLoadingAnalytics = true);
    try {
      final farms = ref.read(farmProvider).farms;
      final currentFarm = farms.isNotEmpty
          ? (_selectedFarmId != null
              ? farms.firstWhere((f) => f.id == _selectedFarmId, orElse: () => farms.first)
              : farms.first)
          : null;
      final currentCrop = currentFarm?.crops.isNotEmpty == true
          ? (_selectedCropId != null
              ? currentFarm!.crops.firstWhere((c) => c.id == _selectedCropId, orElse: () => currentFarm.crops.first)
              : currentFarm!.crops.first)
          : null;

      final fId = currentFarm?.id;
      final cId = currentCrop?.id;
      final url = (fId != null && fId.isNotEmpty)
          ? 'analytics/farmer?farmId=$fId${cId != null ? '&cropId=$cId' : ''}'
          : 'analytics/farmer';

      final response = await ApiClient().dio.get(url);
      if (mounted) {
        final dynamic raw = response.data;
        setState(() {
          if (raw is Map<String, dynamic>) {
            _analytics = raw['data'] is Map<String, dynamic> ? raw['data'] : raw;
          }
          _isLoadingAnalytics = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingAnalytics = false);
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
                      final isSelected = (_selectedFarmId == f.id || (_selectedFarmId == null && farms.first.id == f.id)) &&
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
                          '${c.season} Ã¢â‚¬Â¢ Stage: ${c.stage}',
                          style: TextStyle(fontSize: 12, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                        ),
                        trailing: isSelected ? const Icon(Icons.check_circle, color: AppTheme.primaryGreen) : null,
                        onTap: () {
                          Navigator.pop(ctx);
                          setState(() {
                            _selectedFarmId = f.id;
                            _selectedCropId = c.id;
                          });
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
    final user = ref.watch(authProvider).user;
    final farmState = ref.watch(farmProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final farm = farmState.farms.isNotEmpty
        ? (_selectedFarmId != null
            ? farmState.farms.firstWhere((f) => f.id == _selectedFarmId, orElse: () => farmState.farms.first)
            : farmState.farms.first)
        : null;
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
          ),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 1. HEADER WIDGET
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
                    const Text('Ã°Å¸Å’Â¿', style: TextStyle(fontSize: 12)),
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
  }

  // ---------------------------------------------------------------------------
  // 2. CURRENT CROP BANNER CARD
  // ---------------------------------------------------------------------------
  Widget _buildCropBannerCard(FarmCropModel? crop, FarmModel? farm, List<FarmModel> farms, bool isDark) {
    final cropName = crop?.cropName.isNotEmpty == true ? crop!.cropName : 'Paddy (Rice)';
    final stageName = crop?.stage.isNotEmpty == true ? crop!.stage.replaceAll('_', ' ') : 'Growing';
    const progressVal = 0.65;

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
          // Background decorative crop illustration
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
                const Text(
                  'Current Crop',
                  style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600),
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
                            child: const LinearProgressIndicator(
                              value: progressVal,
                              backgroundColor: Colors.white24,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              minHeight: 6,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    const Text(
                      '65% Complete',
                      style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w800),
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
                  child: const Text(
                    'View Crop Details',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5),
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
  Widget _buildStageProgressionCard(FarmCropModel? crop, FarmModel? farm, bool isDark) {
    final currentStage = crop?.stage.isNotEmpty == true ? crop!.stage : 'Tillering';
    const nextStage = 'Panicle Initiation';

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
                      'Current Stage',
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
                  'Ã°Å¸â€œâ€¦ Day 25 Ã¢â‚¬â€œ 40',
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
                      'Next Stage',
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
                  'Ã°Å¸â€œâ€¦ Day 41 Ã¢â‚¬â€œ 60',
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
  Widget _buildNextOperationsCard(FarmCropModel? crop, FarmModel? farm, bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFFFFDF2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFFE082)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFF57F17).withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          InkWell(
            onTap: () => context.push('/farm-plan'),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 14, 10),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(5),
                    decoration: const BoxDecoration(
                      color: Color(0xFFFFA000),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.bolt_rounded, color: Colors.white, size: 14),
                  ),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'Next important operations',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                        color: Color(0xFF424242),
                      ),
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded, color: Color(0xFF757575), size: 22),
                ],
              ),
            ),
          ),
          const Divider(height: 1, color: Color(0xFFFFECB3)),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
            child: Column(
              children: [
                _buildOperationRow('Apply nitrogen top dressing', 'In 3 days'),
                const SizedBox(height: 8),
                _buildOperationRow('Maintain 2-5 cm water level', 'In 3 days'),
                const SizedBox(height: 8),
                _buildOperationRow('Pest monitoring (stem borer)', 'In 5 days'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOperationRow(String title, String dueIn) {
    return Row(
      children: [
        const Icon(Icons.check_circle_rounded, color: Color(0xFFF57F17), size: 18),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            title,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF212121)),
          ),
        ),
        Row(
          children: [
            const Icon(Icons.calendar_today_outlined, size: 13, color: Color(0xFF757575)),
            const SizedBox(width: 4),
            Text(
              dueIn,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF616161)),
            ),
          ],
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // 5. QUICK ACTIONS ROW
  // ---------------------------------------------------------------------------
  Widget _buildQuickActionsRow(bool isDark) {
    final actions = [
      {
        'title': 'Farm Plan',
        'icon': Icons.grass_rounded,
        'color': const Color(0xFF2E7D32),
        'bg': const Color(0xFFE8F5E9),
        'onTap': () => context.push('/farm-plan'),
      },
      {
        'title': 'Farm Copilot',
        'icon': Icons.smart_toy_outlined,
        'color': const Color(0xFF1976D2),
        'bg': const Color(0xFFE3F2FD),
        'onTap': () => context.push('/farm-copilot'),
      },
      {
        'title': 'Add Task',
        'icon': Icons.post_add_rounded,
        'color': const Color(0xFF00796B),
        'bg': const Color(0xFFE0F2F1),
        'onTap': () => _showAddTaskDialog(context, isDark),
      },
      {
        'title': 'Add Expense',
        'icon': Icons.currency_rupee_rounded,
        'color': const Color(0xFFE65100),
        'bg': const Color(0xFFFFF3E0),
        'onTap': () => _showAddExpenseDialog(context, isDark),
      },
      {
        'title': 'Book\nEquipment',
        'icon': Icons.agriculture_rounded,
        'color': const Color(0xFF0288D1),
        'bg': const Color(0xFFE1F5FE),
        'onTap': () => widget.onTabSelected?.call(2),
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
  Widget _buildFarmerAnalyticsSection(FarmModel? farm, FarmCropModel? crop, bool isDark) {
    final activeOps = _analytics?['activeOperations'] ?? 0;
    final completedTasks = _analytics?['completedTasks'] ?? 0;
    final totalRentals = _analytics?['totalRentals'] ?? (_analytics?['completedRentals'] ?? 0);
    final totalSpent = (_analytics?['totalSpending'] ?? _analytics?['totalSpent'] ?? 0) as num;
    final formattedSpent = NumberFormat.currency(locale: 'en_IN', symbol: 'Ã¢â€šÂ¹ ', decimalDigits: 0).format(totalSpent);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
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
            PopupMenuButton<String>(
              initialValue: _selectedAnalyticsPeriod,
              onSelected: (val) => setState(() => _selectedAnalyticsPeriod = val),
              color: isDark ? AppTheme.darkCard : Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Row(
                children: [
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
        const SizedBox(height: 14),

        // 2x2 Analytics Grid
        Row(
          children: [
            // Active Operations Card
            Expanded(
              child: _buildAnalyticsCard(
                title: 'Active Operations',
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
                title: 'Completed Tasks',
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
                title: 'Total Rentals',
                value: '$totalRentals',
                icon: Icons.agriculture_rounded,
                iconColor: const Color(0xFFE65100),
                iconBg: const Color(0xFFFFF3E0),
                isDark: isDark,
                onTap: () => _showRentalsDetailsDialog(context, isDark),
              ),
            ),
            const SizedBox(width: 12),
            // Total Spent on Rentals Card
            Expanded(
              child: _buildAnalyticsCard(
                title: 'Total Spending',
                value: formattedSpent,
                icon: Icons.currency_rupee_rounded,
                iconColor: const Color(0xFF6A1B9A),
                iconBg: const Color(0xFFF3E5F5),
                isDark: isDark,
                onTap: () => context.push('/all-expenses?farmId=${farm?.id ?? ''}'),
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
  Widget _buildRecentActivitySection(bool isDark) {
    final activities = [
      {
        'title': 'Tractor booked for land preparation',
        'time': '2 days ago',
        'icon': Icons.agriculture_rounded,
        'color': const Color(0xFF1976D2),
        'bg': const Color(0xFFE3F2FD),
      },
      {
        'title': 'Completed field preparation task',
        'time': '3 days ago',
        'icon': Icons.check_circle_rounded,
        'color': const Color(0xFF2E7D32),
        'bg': const Color(0xFFE8F5E9),
      },
      {
        'title': 'Fertilizer application planned',
        'time': '5 days ago',
        'icon': Icons.description_rounded,
        'color': const Color(0xFFE65100),
        'bg': const Color(0xFFFFF3E0),
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Recent Activity',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
                letterSpacing: -0.3,
              ),
            ),
            TextButton(
              onPressed: () => context.push('/farm-plan'),
              child: const Text(
                'View All',
                style: TextStyle(color: AppTheme.primaryGreen, fontWeight: FontWeight.bold, fontSize: 13),
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
          child: ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: activities.length,
            separatorBuilder: (_, __) => Divider(height: 1, indent: 64, color: isDark ? Colors.white10 : Colors.grey.shade100),
            itemBuilder: (context, idx) {
              final act = activities[idx];
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: isDark ? (act['bg'] as Color).withValues(alpha: 0.15) : act['bg'] as Color,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(act['icon'] as IconData, color: act['color'] as Color, size: 20),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            act['title'] as String,
                            style: TextStyle(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w700,
                              color: isDark ? Colors.white : AppTheme.textDarkNavy,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            act['time'] as String,
                            style: TextStyle(fontSize: 11.5, color: isDark ? Colors.grey.shade400 : Colors.grey.shade500),
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

  // ===========================================================================
  // CONNECTED DRILLDOWN SCREENS & DIALOGS
  // ===========================================================================

  // 1. CROP DETAILS SCREEN / DIALOG
  void _showCropDetailsDialog(BuildContext context, FarmCropModel? crop, FarmModel? farm, bool isDark) {
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
                            crop?.cropName.isNotEmpty == true ? crop!.cropName : 'Paddy (Rice)',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: isDark ? Colors.white : AppTheme.textDarkNavy),
                          ),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(color: AppTheme.primaryGreen, borderRadius: BorderRadius.circular(6)),
                                child: Text(crop?.stage.isNotEmpty == true ? crop!.stage : 'Growing', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                              ),
                              const SizedBox(width: 8),
                              const Text('65% Complete', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey)),
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
                        _buildDetailRow('Farm Name', farm?.name ?? 'Green Valley Farm', isDark),
                        _buildDetailRow('Acreage', '${farm?.area ?? 5.0} Acres', isDark),
                        _buildDetailRow('Soil Type', farm?.soilType ?? 'Loamy Soil', isDark),
                        _buildDetailRow('Season', crop?.season ?? 'Kharif', isDark),
                        _buildDetailRow('Sowing Date', '15 Jan 2025', isDark),
                        _buildDetailRow('Expected Harvest', '15 May 2025', isDark),
                      ],
                    ),
                    // Stages Tab
                    ListView(
                      padding: const EdgeInsets.all(20),
                      children: [
                        _buildStageItem('Land Preparation', 'Completed', Icons.check_circle, Colors.green, isDark),
                        _buildStageItem('Sowing / Transplanting', 'Completed', Icons.check_circle, Colors.green, isDark),
                        _buildStageItem('Tillering', 'Current Stage Ã¢â‚¬Â¢ Day 25-40', Icons.spa, Colors.blue, isDark),
                        _buildStageItem('Panicle Initiation', 'Upcoming Ã¢â‚¬Â¢ Day 41-60', Icons.grain, Colors.orange, isDark),
                        _buildStageItem('Flowering', 'Upcoming Ã¢â‚¬Â¢ Day 61-80', Icons.local_florist, Colors.grey, isDark),
                      ],
                    ),
                    // Tasks Tab
                    ListView(
                      padding: const EdgeInsets.all(20),
                      children: [
                        _buildTaskItem('Apply basal fertilizer', true, isDark),
                        _buildTaskItem('Initial bund weeding', true, isDark),
                        _buildTaskItem('Apply nitrogen top dressing', false, isDark),
                        _buildTaskItem('Maintain 2-5 cm standing water', false, isDark),
                      ],
                    ),
                    // Expenses Tab
                    ListView(
                      padding: const EdgeInsets.all(20),
                      children: [
                        _buildDetailRow('Seed Cost', 'Ã¢â€šÂ¹ 2,400', isDark),
                        _buildDetailRow('Machinery Rentals', 'Ã¢â€šÂ¹ 11,250', isDark),
                        _buildDetailRow('Fertilizer & Pesticides', 'Ã¢â€šÂ¹ 4,500', isDark),
                        _buildDetailRow('Labor Expenses', 'Ã¢â€šÂ¹ 6,000', isDark),
                        const Divider(),
                        _buildDetailRow('Total Invested', 'Ã¢â€šÂ¹ 24,150', isDark, isBold: true),
                      ],
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
                    const Text('Day 25 Ã¢â‚¬â€œ 40', style: TextStyle(color: Colors.grey, fontSize: 13)),
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
              'Tillering is the vegetative stage where multiple shoots develop from the base of the plant, leading to maximum yield potential. Ensure optimal standing water and timely nitrogen application.',
              style: TextStyle(fontSize: 13, height: 1.4, color: isDark ? Colors.grey.shade400 : Colors.grey.shade700),
            ),
            const SizedBox(height: 18),
            Text(
              'Recommended Operations',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: isDark ? Colors.white : AppTheme.textDarkNavy),
            ),
            const SizedBox(height: 8),
            _buildOperationChecklist('Apply nitrogen top dressing (Urea @ 30kg/acre)'),
            _buildOperationChecklist('Maintain 2-5 cm standing water level'),
            _buildOperationChecklist('Pest monitoring for stem borer and leaf folder'),
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

  // 3. STAGE RELATED EQUIPMENT SCREEN / DIALOG
  void _showStageRelatedEquipmentDialog(BuildContext context, String stageName, bool isDark) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Consumer(
        builder: (context, ref, _) {
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
                              const Text('No specific equipment listed for this stage.', style: TextStyle(color: Colors.grey)),
                            ],
                          ),
                        )
                      : ListView.separated(
                          itemCount: displayList.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, idx) {
                        final eq = displayList[idx];
                        final priceStr = eq.pricePerDay != null ? 'Ã¢â€šÂ¹ ${eq.pricePerDay!.toInt()} / day' : 'Contact for Price';
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
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
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
                                      '$dateStr Ã¢â‚¬Â¢ 1 day',
                                      style: TextStyle(fontSize: 12, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                                    ),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    'Ã¢â€šÂ¹ $amount',
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
    final monthly = List<dynamic>.from(_analytics?['monthlySpending'] ?? []);
    final totalSpent = (_analytics?['totalSpent'] ?? 11250) as num;
    final categories = Map<String, dynamic>.from(_analytics?['categoryBreakdown'] ?? {
      'TRACTOR': 6500,
      'SPRAYER': 2000,
      'POWER_WEEDER': 1750,
      'OTHER': 1000,
    });

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

              // Monthly Bar Chart
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
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(color: const Color(0xFF1976D2), borderRadius: BorderRadius.circular(8)),
                          child: const Text('Ã¢â€šÂ¹ 3,200 (Apr)', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: (monthly.isNotEmpty ? monthly : [
                        {'month': 'Jan', 'amount': 1500},
                        {'month': 'Feb', 'amount': 2200},
                        {'month': 'Mar', 'amount': 1800},
                        {'month': 'Apr', 'amount': 3200},
                        {'month': 'May', 'amount': 1250},
                        {'month': 'Jun', 'amount': 1300},
                      ]).map((m) {
                        final mName = m['month'] as String;
                        final amt = (m['amount'] as num).toDouble();
                        final maxH = 100.0;
                        final barH = (amt / 4000.0 * maxH).clamp(15.0, maxH);
                        final isPeak = mName == 'Apr';

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
                  Text('Ã¢â€šÂ¹ $totalSpent', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.primaryGreen)),
                ],
              ),
              const SizedBox(height: 12),

              // Category-wise list
              ...categories.entries.map((e) {
                final cat = e.key.replaceAll('_', ' ');
                final val = e.value;
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('$cat Rentals', style: TextStyle(fontSize: 13.5, color: isDark ? Colors.grey.shade300 : Colors.grey.shade700)),
                      Text('Ã¢â€šÂ¹ $val', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
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

  // 6. ADD TASK DIALOG
  void _showAddTaskDialog(BuildContext context, bool isDark) {
    final titleController = TextEditingController();
    final farmState = ref.read(farmProvider);
    final farm = farmState.farms.isNotEmpty ? farmState.farms.first : null;
    final crop = farm?.crops.isNotEmpty == true ? farm!.crops.first : null;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Add Farm Task', style: TextStyle(fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Task Title',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.grey.shade300 : AppTheme.textDarkNavy,
                ),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: titleController,
                autofocus: true,
                decoration: const InputDecoration(
                  hintText: 'e.g. Inspect soil moisture before irrigation',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final text = titleController.text.trim();
              if (text.isEmpty) return;
              Navigator.pop(ctx);
              if (farm != null && crop != null) {
                try {
                  final opRes = await ApiClient().dio.get('farms/${farm.id}/crops/${crop.id}/operations');
                  final opList = opRes.data['data'] ?? opRes.data;
                  final opId = (opList is List && opList.isNotEmpty) ? opList[0]['id'] : 'default_op';

                  await ApiClient().dio.post(
                    'farms/${farm.id}/crops/${crop.id}/operations/$opId/tasks',
                    data: {'title': text, 'status': 'PENDING'},
                  );
                  ref.read(farmProvider.notifier).fetchFarms();
                  _fetchAnalytics();
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Task added successfully!'), backgroundColor: AppTheme.primaryGreen),
                    );
                  }
                } catch (_) {}
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen, foregroundColor: Colors.white),
            child: const Text('Add Task'),
          ),
        ],
      ),
    );
  }

  // 7. ADD EXPENSE DIALOG
  void _showAddExpenseDialog(BuildContext context, bool isDark) {
    final titleController = TextEditingController();
    final amountController = TextEditingController();
    final farmState = ref.read(farmProvider);
    final farm = farmState.farms.isNotEmpty ? farmState.farms.first : null;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
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
                decoration: const InputDecoration(hintText: 'e.g. Organic fertilizer bags', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 14),
              Text(
                'Amount (Ã¢â€šÂ¹)',
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
                decoration: const InputDecoration(hintText: 'e.g. 2500', border: OutlineInputBorder()),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final title = titleController.text.trim();
              final amount = double.tryParse(amountController.text.trim()) ?? 0;
              if (title.isEmpty || amount <= 0) return;
              Navigator.pop(ctx);
              if (farm != null) {
                try {
                  await ApiClient().dio.post(
                    'farms/${farm.id}/financials/expense',
                    data: {'title': title, 'amount': amount, 'category': 'OTHER'},
                  );
                  _fetchAnalytics();
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Expense recorded successfully!'), backgroundColor: AppTheme.primaryGreen),
                    );
                  }
                } catch (_) {}
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen, foregroundColor: Colors.white),
            child: const Text('Save Expense'),
          ),
        ],
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

  Widget _buildTaskItem(String title, bool isCompleted, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAF9),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Icon(isCompleted ? Icons.check_circle : Icons.radio_button_unchecked, color: isCompleted ? Colors.green : Colors.grey, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              title,
              style: TextStyle(
                fontSize: 13.5,
                fontWeight: FontWeight.w600,
                decoration: isCompleted ? TextDecoration.lineThrough : null,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
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
