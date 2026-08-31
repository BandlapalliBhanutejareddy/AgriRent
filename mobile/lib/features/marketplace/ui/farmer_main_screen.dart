import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/localization/app_localizations.dart';
import 'farmer_dashboard_screen.dart';
import 'farmer_home_screen.dart'; // This is actually the marketplace
import 'my_rentals_screen.dart';
import 'crop_advisor_screen.dart';
import '../../profile/ui/profile_screen.dart';

class FarmerMainScreen extends ConsumerStatefulWidget {
  const FarmerMainScreen({super.key});

  @override
  ConsumerState<FarmerMainScreen> createState() => _FarmerMainScreenState();
}

class _FarmerMainScreenState extends ConsumerState<FarmerMainScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const FarmerDashboardScreen(),
    const FarmerHomeScreen(), // Marketplace
    const MyRentalsScreen(),
    const CropAdvisorScreen(), // AI Advisor
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        destinations: [
          NavigationDestination(icon: const Icon(Icons.dashboard_outlined), selectedIcon: const Icon(Icons.dashboard), label: 'home'.tr(lang)),
          NavigationDestination(icon: const Icon(Icons.storefront_outlined), selectedIcon: const Icon(Icons.storefront), label: 'marketplace'.tr(lang)),
          NavigationDestination(icon: const Icon(Icons.receipt_long_outlined), selectedIcon: const Icon(Icons.receipt_long), label: 'my_rentals'.tr(lang)),
          NavigationDestination(icon: const Icon(Icons.auto_awesome_outlined), selectedIcon: const Icon(Icons.auto_awesome), label: 'ai_advisor'.tr(lang)),
          NavigationDestination(icon: const Icon(Icons.person_outline), selectedIcon: const Icon(Icons.person), label: 'profile'.tr(lang)),
        ],
      ),
    );
  }
}
