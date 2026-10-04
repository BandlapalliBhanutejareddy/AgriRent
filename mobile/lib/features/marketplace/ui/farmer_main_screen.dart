import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/theme/app_theme.dart';
import 'farmer_home_screen.dart';
import 'farmer_marketplace_screen.dart';
import 'my_rentals_screen.dart';
import '../../farm/ui/my_farm_screen.dart';
import '../../profile/ui/profile_screen.dart';

class FarmerMainScreen extends ConsumerStatefulWidget {
  const FarmerMainScreen({super.key});

  @override
  ConsumerState<FarmerMainScreen> createState() => _FarmerMainScreenState();
}

class _FarmerMainScreenState extends ConsumerState<FarmerMainScreen> {
  int _currentIndex = 0;
  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      FarmerHomeScreen(
        key: const ValueKey('farmer_home_tab'),
        onTabSelected: (index) {
          if (mounted) setState(() => _currentIndex = index);
        },
      ),
      const MyFarmScreen(key: ValueKey('farmer_farm_tab')),
      const FarmerMarketplaceScreen(key: ValueKey('farmer_marketplace_tab')),
      const MyRentalsScreen(key: ValueKey('farmer_rentals_tab')),
      const ProfileScreen(key: ValueKey('farmer_profile_tab')),
    ];
  }

  @override
  Widget build(BuildContext context) {
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
        body: IndexedStack(
          index: _currentIndex,
          children: _screens,
        ),
        bottomNavigationBar: NavigationBar(
          selectedIndex: _currentIndex,
          backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
          indicatorColor: isDark
              ? AppTheme.primaryGreen.withValues(alpha: 0.3)
              : AppTheme.primaryGreen.withValues(alpha: 0.15),
          elevation: 8,
          surfaceTintColor: Colors.transparent,
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          onDestinationSelected: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home_rounded, color: AppTheme.primaryGreen),
              label: 'Home',
            ),
            NavigationDestination(
              icon: Icon(Icons.agriculture_outlined),
              selectedIcon: Icon(Icons.agriculture_rounded, color: AppTheme.primaryGreen),
              label: 'Farm',
            ),
            NavigationDestination(
              icon: Icon(Icons.storefront_outlined),
              selectedIcon: Icon(Icons.storefront_rounded, color: AppTheme.primaryGreen),
              label: 'Market',
            ),
            NavigationDestination(
              icon: Icon(Icons.receipt_long_outlined),
              selectedIcon: Icon(Icons.receipt_long_rounded, color: AppTheme.primaryGreen),
              label: 'Bookings',
            ),
            NavigationDestination(
              icon: Icon(Icons.menu_outlined),
              selectedIcon: Icon(Icons.menu_rounded, color: AppTheme.primaryGreen),
              label: 'More',
            ),
          ],
        ),
      ),
    );
  }
}
