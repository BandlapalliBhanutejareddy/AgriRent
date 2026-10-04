import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/theme/app_theme.dart';
import '../providers/farm_provider.dart';

class MyFarmScreen extends ConsumerStatefulWidget {
  const MyFarmScreen({super.key});

  @override
  ConsumerState<MyFarmScreen> createState() => _MyFarmScreenState();
}

class _MyFarmScreenState extends ConsumerState<MyFarmScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(farmProvider.notifier).fetchFarms();
    });
  }

  @override
  Widget build(BuildContext context) {
    final farmState = ref.watch(farmProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (farmState.isLoading && farmState.farms.isEmpty) {
      return Scaffold(
        backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
        appBar: AppBar(
          title: const Text('My Farm', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 19)),
          backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
          foregroundColor: isDark ? Colors.white : AppTheme.textDarkNavy,
          elevation: 0,
        ),
        body: const Center(
          child: CircularProgressIndicator(color: AppTheme.primaryGreen),
        ),
      );
    }

    if (farmState.farms.isEmpty) {
      return Scaffold(
        backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
        appBar: AppBar(
          title: const Text('My Farm', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 19)),
          backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
          foregroundColor: isDark ? Colors.white : AppTheme.textDarkNavy,
          elevation: 0,
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.add_location_alt_outlined, size: 48, color: AppTheme.primaryGreen),
                ),
                const SizedBox(height: 16),
                Text(
                  'No farm added yet',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Set up your farm details to access farm monitoring, digital twin metrics, and crop planning.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: isDark ? Colors.grey.shade400 : Colors.grey.shade600, height: 1.4),
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () => context.push('/farm-setup'),
                  icon: const Icon(Icons.add),
                  label: const Text('Set Up Farm', style: TextStyle(fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryGreen,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final farm = farmState.farms.first;
    final crop = farm.crops.isNotEmpty ? farm.crops.first : null;

    final farmName = farm.name.isNotEmpty ? farm.name : 'My Farm';
    final areaText = '${farm.area} ${farm.areaUnit}';
    final locationText = farm.location.isNotEmpty ? farm.location : 'Karnataka';
    final soilText = farm.soilType.isNotEmpty ? farm.soilType : 'Loamy';
    final cropName = crop?.cropName.isNotEmpty == true ? crop!.cropName : 'Active Crop';
    final seasonText = crop?.season.isNotEmpty == true ? crop!.season : 'Kharif';
    final currentStage = (crop?.stage.isNotEmpty == true ? crop!.stage : 'VEGETATIVE').toUpperCase();
    final stageFormatted = currentStage.isNotEmpty ? '${currentStage[0]}${currentStage.substring(1).toLowerCase()}' : 'Active';

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('My Farm', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 19)),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        foregroundColor: isDark ? Colors.white : AppTheme.textDarkNavy,
        elevation: 0,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12.0),
            child: TextButton(
              onPressed: () => context.push('/farm-setup'),
              style: TextButton.styleFrom(
                backgroundColor: AppTheme.primaryGreen,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              ),
              child: const Text('Edit', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppTheme.primaryGreen,
        onRefresh: () async {
          await ref.read(farmProvider.notifier).fetchFarms();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Hero Panoramic Farm Image Banner (Screen 4 in prototype)
              Container(
                height: 180,
                width: double.infinity,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(0xFF065F46),
                      Color(0xFF047857),
                      Color(0xFF0D9488),
                    ],
                  ),
                ),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Center(
                      child: Icon(
                        Icons.landscape_rounded,
                        size: 96,
                        color: Colors.white.withValues(alpha: 0.15),
                      ),
                    ),
                    Positioned(
                      bottom: 16,
                      left: 20,
                      right: 20,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                farmName,
                                style: const TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(width: 6),
                              const Icon(Icons.location_on, color: Colors.white, size: 18),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '$areaText • $locationText',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.white.withValues(alpha: 0.9),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 2x2 Information Grid (Screen 4 in prototype)
                    Row(
                      children: [
                        Expanded(
                          child: _buildInfoCard(
                            title: 'Crop',
                            value: cropName,
                            icon: Icons.grass_rounded,
                            isDark: isDark,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildInfoCard(
                            title: 'Acreage',
                            value: areaText,
                            icon: Icons.straighten_rounded,
                            isDark: isDark,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildInfoCard(
                            title: 'Soil Type',
                            value: soilText,
                            icon: Icons.layers_rounded,
                            isDark: isDark,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildInfoCard(
                            title: 'Season',
                            value: seasonText,
                            icon: Icons.calendar_today_rounded,
                            isDark: isDark,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Crop Lifecycle Card with Mini Timeline (Screen 4 in prototype)
                    InkWell(
                      onTap: () => context.push('/crop-lifecycle'),
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
                              blurRadius: 10,
                              offset: const Offset(0, 3),
                            ),
                          ],
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
                                      'Crop Lifecycle',
                                      style: TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w900,
                                        color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            'Current: $stageFormatted',
                                            style: const TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                              color: AppTheme.primaryGreen,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          'Day 28 of 120',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                const Icon(Icons.chevron_right_rounded, color: AppTheme.primaryGreen, size: 24),
                              ],
                            ),
                            const SizedBox(height: 16),

                            // Mini Horizontal Progression Line
                            Row(
                              children: [
                                _buildMiniStageNode('Sowing', true, isDark),
                                _buildMiniStageLine(true, isDark),
                                _buildMiniStageNode('Germination', true, isDark),
                                _buildMiniStageLine(true, isDark),
                                _buildMiniStageNode('Seedling', true, isDark),
                                _buildMiniStageLine(true, isDark),
                                _buildMiniStageNode('Vegetative', false, isDark, isCurrent: true),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Actions List
                    _buildFarmNavTile(
                      title: 'Farm Plan & Operations',
                      subtitle: 'Comprehensive schedule, tasks, and budget',
                      icon: Icons.assignment_rounded,
                      isDark: isDark,
                      onTap: () => context.push('/farm-plan'),
                    ),
                    const SizedBox(height: 10),

                    _buildFarmNavTile(
                      title: 'Farm Copilot',
                      subtitle: 'Ask AI agronomic questions for $cropName',
                      icon: Icons.smart_toy_rounded,
                      isDark: isDark,
                      onTap: () {
                        final fId = farm.id;
                        final cId = crop?.id ?? '';
                        context.push('/farm-copilot?farmId=$fId&cropId=$cId');
                      },
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoCard({
    required String title,
    required String value,
    required IconData icon,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppTheme.primaryGreen.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppTheme.primaryGreen, size: 20),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMiniStageNode(String label, bool isCompleted, bool isDark, {bool isCurrent = false}) {
    return Column(
      children: [
        Container(
          width: 18,
          height: 18,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isCompleted
                ? AppTheme.primaryGreen
                : (isCurrent ? const Color(0xFF0284C7) : (isDark ? Colors.white12 : Colors.grey.shade300)),
            border: isCurrent ? Border.all(color: const Color(0xFF38BDF8), width: 2) : null,
          ),
          child: Center(
            child: isCompleted
                ? const Icon(Icons.check, color: Colors.white, size: 12)
                : (isCurrent
                    ? Container(width: 6, height: 6, decoration: const BoxDecoration(shape: BoxShape.circle, color: Colors.white))
                    : null),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 9,
            fontWeight: isCurrent ? FontWeight.bold : FontWeight.w500,
            color: isCurrent
                ? (isDark ? Colors.white : const Color(0xFF0284C7))
                : (isCompleted ? AppTheme.primaryGreen : (isDark ? Colors.grey.shade500 : Colors.grey.shade600)),
          ),
        ),
      ],
    );
  }

  Widget _buildMiniStageLine(bool isCompleted, bool isDark) {
    return Expanded(
      child: Container(
        height: 2,
        margin: const EdgeInsets.only(bottom: 14),
        color: isCompleted ? AppTheme.primaryGreen : (isDark ? Colors.white12 : Colors.grey.shade300),
      ),
    );
  }

  Widget _buildFarmNavTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
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
              child: Icon(icon, color: AppTheme.primaryGreen, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: isDark ? Colors.grey.shade500 : Colors.grey.shade400, size: 20),
          ],
        ),
      ),
    );
  }
}
