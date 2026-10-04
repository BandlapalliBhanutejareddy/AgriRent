import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../../farm/providers/farm_provider.dart';

class FarmerHubScreen extends ConsumerWidget {
  final Function(int)? onTabSelected;

  const FarmerHubScreen({super.key, this.onTabSelected});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final farmState = ref.watch(farmProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final userName = user?.name.isNotEmpty == true ? user!.name.split(' ').first : 'Farmer';
    final farm = farmState.farms.isNotEmpty ? farmState.farms.first : null;
    final crop = farm?.crops.isNotEmpty == true ? farm!.crops.first : null;

    final navItems = [
      {
        'title': 'Home',
        'icon': Icons.home_rounded,
        'color': const Color(0xFF16A34A),
        'onTap': () {
          if (onTabSelected != null) onTabSelected!(0);
        },
      },
      {
        'title': 'Farm',
        'icon': Icons.spa_rounded,
        'color': const Color(0xFF0D9488),
        'onTap': () {
          if (onTabSelected != null) onTabSelected!(1);
        },
      },
      {
        'title': 'Farm Plan',
        'icon': Icons.assignment_rounded,
        'color': const Color(0xFF0284C7),
        'onTap': () {
          if (onTabSelected != null) onTabSelected!(2);
        },
      },
      {
        'title': 'Operations',
        'icon': Icons.build_circle_rounded,
        'color': const Color(0xFFD97706),
        'onTap': () => context.push('/operations'),
      },
      {
        'title': 'Learning',
        'icon': Icons.menu_book_rounded,
        'color': const Color(0xFF8B5CF6),
        'onTap': () => context.push('/guides'),
      },
      {
        'title': 'AI Copilot',
        'icon': Icons.smart_toy_rounded,
        'color': const Color(0xFFEC4899),
        'onTap': () {
          final fId = farm?.id ?? '';
          final cId = crop?.id ?? '';
          context.push('/farm-copilot?farmId=$fId&cropId=$cId');
        },
      },
    ];

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'AgroRent AI',
          style: TextStyle(
            fontWeight: FontWeight.w900,
            fontSize: 20,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
        ),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        elevation: 0,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: InkWell(
              onTap: () => context.push('/profile'),
              borderRadius: BorderRadius.circular(20),
              child: CircleAvatar(
                radius: 18,
                backgroundColor: AppTheme.primaryGreen,
                child: Text(
                  userName.isNotEmpty ? userName.substring(0, 1).toUpperCase() : 'F',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                ),
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Explore Farmer Hub',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Access your farm digital twin, agronomy schedules & tools',
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 24),

              // 2x3 Grid (Screen 4 Prototype)
              Expanded(
                child: GridView.builder(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                    childAspectRatio: 1.15,
                  ),
                  itemCount: navItems.length,
                  itemBuilder: (context, index) {
                    final item = navItems[index];
                    final color = item['color'] as Color;
                    final icon = item['icon'] as IconData;
                    final title = item['title'] as String;
                    final onTap = item['onTap'] as VoidCallback;

                    return InkWell(
                      onTap: onTap,
                      borderRadius: BorderRadius.circular(20),
                      child: Container(
                        decoration: BoxDecoration(
                          color: isDark ? AppTheme.darkCard : Colors.white,
                          borderRadius: BorderRadius.circular(20),
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
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: color.withValues(alpha: 0.12),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(icon, color: color, size: 30),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              title,
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                                color: isDark ? Colors.white : AppTheme.textDarkNavy,
                              ),
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
        ),
      ),
    );
  }
}
