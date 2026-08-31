import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../auth/providers/auth_provider.dart';
import '../../ai_advisor/ui/ai_advisor_screen.dart';
import '../providers/marketplace_provider.dart';
import 'equipment_details_screen.dart';
import 'saved_equipment_screen.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/api/api_client.dart';
import '../../../core/localization/app_localizations.dart';

class FarmerDashboardScreen extends ConsumerStatefulWidget {
  const FarmerDashboardScreen({super.key});

  @override
  ConsumerState<FarmerDashboardScreen> createState() => _FarmerDashboardScreenState();
}

class _FarmerDashboardScreenState extends ConsumerState<FarmerDashboardScreen> {
  Map<String, dynamic>? _analytics;
  bool _isLoadingAnalytics = true;

  @override
  void initState() {
    super.initState();
    _fetchAnalytics();
  }

  Future<void> _fetchAnalytics() async {
    try {
      final response = await ApiClient().dio.get('/analytics/farmer');
      if (mounted) {
        setState(() {
          _analytics = response.data;
          _isLoadingAnalytics = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingAnalytics = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final mkState = ref.watch(marketplaceProvider);
    final lang = ref.watch(languageProvider);

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 180.0,
            floating: false,
            pinned: true,
            elevation: 0,
            backgroundColor: AppTheme.primaryGreen,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppTheme.primaryGreen, AppTheme.secondaryGreen],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Stack(
                  children: [
                    Positioned(
                      right: -50,
                      top: -50,
                      child: Container(
                        width: 200,
                        height: 200,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withValues(alpha: 0.1),
                        ),
                      ),
                    ),
                    SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.all(20.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Good Morning,',
                                      style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 14, fontWeight: FontWeight.w500),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      user?.name ?? 'Farmer',
                                      style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                                CircleAvatar(
                                  radius: 24,
                                  backgroundColor: AppTheme.accentGreen,
                                  backgroundImage: user?.profileImage != null ? NetworkImage(user!.profileImage!) : null,
                                  child: user?.profileImage == null
                                      ? Text(user?.name.substring(0, 1).toUpperCase() ?? 'F', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold))
                                      : null,
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                const Icon(Icons.location_on, color: AppTheme.accentGreen, size: 16),
                                const SizedBox(width: 4),
                                Text('Punjab, India', style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: 12)),
                                const Spacer(),
                                const Icon(Icons.wb_sunny, color: Colors.orange, size: 16),
                                const SizedBox(width: 4),
                                Text('28°C Sunny', style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: 12)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Search Bar Fake
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4)),
                      ],
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.search, color: Colors.grey),
                        const SizedBox(width: 12),
                        Expanded(child: Text('search'.tr(lang), style: const TextStyle(color: Colors.grey))),
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(color: AppTheme.primaryGreen.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                          child: const Icon(Icons.tune, color: AppTheme.primaryGreen, size: 18),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Quick Actions
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildActionItem(context, 'ai_advisor'.tr(lang), Icons.auto_awesome, AppTheme.accentGreen, () {
                        Navigator.push(context, MaterialPageRoute(builder: (context) => const AiAdvisorScreen()));
                      }),
                      _buildActionItem(context, 'crop_advisor'.tr(lang), Icons.grass, Colors.green, () => context.push('/crop-advisor')),
                      _buildActionItem(context, 'knowledge_base'.tr(lang), Icons.menu_book, Colors.blue, () => context.push('/knowledge')),
                      _buildActionItem(context, 'saved_equipment'.tr(lang), Icons.favorite_border, Colors.pink, () {
                        Navigator.push(context, MaterialPageRoute(builder: (context) => const SavedEquipmentScreen()));
                      }),
                    ],
                  ),
                  
                  const SizedBox(height: 32),
                  Text('dashboard'.tr(lang), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textDark)),
                  const SizedBox(height: 16),
                  
                  // Stats Grid
                  _isLoadingAnalytics
                      ? const Center(child: CircularProgressIndicator())
                      : Row(
                          children: [
                            Expanded(child: _buildStatCard('Active Rentals', _analytics?['activeRentals']?.toString() ?? '0', Icons.agriculture, Colors.blue)),
                            const SizedBox(width: 16),
                            Expanded(child: _buildStatCard('Completed', _analytics?['completedRentals']?.toString() ?? '0', Icons.check_circle_outline, Colors.green)),
                          ],
                        ),

                  const SizedBox(height: 32),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Recommended For You', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textDark)),
                    ],
                  ),
                  
                  // Recommended Equipment Horizontal List
                  if (mkState.isLoading && mkState.equipment.isEmpty)
                    const SizedBox(height: 180, child: Center(child: CircularProgressIndicator()))
                  else if (mkState.equipment.isEmpty)
                    const SizedBox(height: 100, child: Center(child: Text('No equipment available.')))
                  else
                    SizedBox(
                      height: 220,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: mkState.equipment.where((e) => e.available).take(5).length,
                        itemBuilder: (context, index) {
                          final eq = mkState.equipment.where((e) => e.available).toList()[index];
                          return Container(
                            width: 160,
                            margin: const EdgeInsets.only(right: 16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 8, offset: const Offset(0, 2))],
                            ),
                            child: InkWell(
                              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => EquipmentDetailsScreen(equipment: eq))),
                              borderRadius: BorderRadius.circular(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  ClipRRect(
                                    borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                                    child: eq.imageUrl.isNotEmpty
                                        ? Image.network(eq.imageUrl, height: 110, width: double.infinity, fit: BoxFit.cover, errorBuilder: (c,e,s) => Container(height: 110, color: Colors.grey.shade200, child: const Icon(Icons.agriculture, size: 40, color: Colors.grey)))
                                        : Container(height: 110, color: Colors.grey.shade200, child: const Icon(Icons.agriculture, size: 40, color: Colors.grey)),
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.all(12.0),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(eq.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                                        const SizedBox(height: 4),
                                        Text('₹${eq.pricePerDay}/day', style: const TextStyle(color: AppTheme.primaryGreen, fontWeight: FontWeight.w600, fontSize: 13)),
                                        const SizedBox(height: 4),
                                        Row(
                                          children: [
                                            const Icon(Icons.location_on, size: 10, color: Colors.grey),
                                            const SizedBox(width: 2),
                                            Expanded(child: Text(eq.location ?? 'Unknown', style: const TextStyle(color: Colors.grey, fontSize: 10), maxLines: 1, overflow: TextOverflow.ellipsis)),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    
                  const SizedBox(height: 80), // Padding for bottom nav
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionItem(BuildContext context, String title, IconData icon, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: 8),
          Text(title, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textDark)),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
            child: Icon(icon, size: 20, color: color),
          ),
          const SizedBox(height: 12),
          Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppTheme.textDark)),
          Text(title, style: const TextStyle(fontSize: 12, color: AppTheme.textLight, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}
