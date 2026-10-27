const fs = require('fs');

// 1. farmer_main_screen.dart
let fMain = `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/localization/app_localizations.dart';
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
          destinations: [
            NavigationDestination(
              icon: const Icon(Icons.home_outlined),
              selectedIcon: const Icon(Icons.home_rounded, color: AppTheme.primaryGreen),
              label: 'home'.tr(lang),
            ),
            NavigationDestination(
              icon: const Icon(Icons.agriculture_outlined),
              selectedIcon: const Icon(Icons.agriculture_rounded, color: AppTheme.primaryGreen),
              label: 'farm'.tr(lang),
            ),
            NavigationDestination(
              icon: const Icon(Icons.storefront_outlined),
              selectedIcon: const Icon(Icons.storefront_rounded, color: AppTheme.primaryGreen),
              label: 'marketplace'.tr(lang),
            ),
            NavigationDestination(
              icon: const Icon(Icons.receipt_long_outlined),
              selectedIcon: const Icon(Icons.receipt_long_rounded, color: AppTheme.primaryGreen),
              label: 'bookings'.tr(lang),
            ),
            NavigationDestination(
              icon: const Icon(Icons.menu_outlined),
              selectedIcon: const Icon(Icons.menu_rounded, color: AppTheme.primaryGreen),
              label: 'more'.tr(lang),
            ),
          ],
        ),
      ),
    );
  }
}
`;
fs.writeFileSync('mobile/lib/features/marketplace/ui/farmer_main_screen.dart', fMain, 'utf8');
console.log('Fixed farmer_main_screen.dart');

// 2. owner_main_screen.dart
let oMain = fs.readFileSync('mobile/lib/features/profile/ui/owner_main_screen.dart', 'utf8');
oMain = oMain.replace(/const NavigationDestination\(\s*icon: Icon\(Icons\.analytics_outlined\),\s*selectedIcon: Icon\(Icons\.analytics_rounded, color: AppTheme\.primaryGreen\),\s*label: 'Analytics',\s*\),/g,
  `NavigationDestination(
                icon: const Icon(Icons.analytics_outlined),
                selectedIcon: const Icon(Icons.analytics_rounded, color: AppTheme.primaryGreen),
                label: 'analytics'.tr(lang),
              ),`);
fs.writeFileSync('mobile/lib/features/profile/ui/owner_main_screen.dart', oMain, 'utf8');
console.log('Fixed owner_main_screen.dart');

// 3. app_localizations.dart
let appLoc = fs.readFileSync('mobile/lib/core/localization/app_localizations.dart', 'utf8');
// add IMPLEMENTS in localizedEquipmentCategory
appLoc = appLoc.replace(/case 'TOOLS':\s*return get\('cat_tools', lang\);/g,
  `case 'TOOLS':
        return get('cat_tools', lang);
      case 'IMPLEMENTS':
      case 'IMPLEMENT':
        return get('cat_implements', lang);`);

// add cat_implements, analytics, equipment keys
appLoc = appLoc.replace(/'en': \{/g, `'en': {\n      'cat_implements': 'Agricultural Implements',\n      'analytics': 'Analytics',\n      'equipment': 'Equipment',`);
appLoc = appLoc.replace(/'te': \{/g, `'te': {\n      'cat_implements': 'వ్యవసాయ పరికరాలు',\n      'analytics': 'విశ్లేషణలు',\n      'equipment': 'యంత్రాలు',`);
appLoc = appLoc.replace(/'hi': \{/g, `'hi': {\n      'cat_implements': 'कृषि उपकरण',\n      'analytics': 'विश्लेषण',\n      'equipment': 'उपकरण',`);
appLoc = appLoc.replace(/'ta': \{/g, `'ta': {\n      'cat_implements': 'வேளாண் கருவிகள்',\n      'analytics': 'பகுப்பாய்வு',\n      'equipment': 'உபகரணங்கள்',`);
appLoc = appLoc.replace(/'kn': \{/g, `'kn': {\n      'cat_implements': 'ಕೃಷಿ ಉಪಕರಣಗಳು',\n      'analytics': 'ವಿಶ್ಲೇಷಣೆ',\n      'equipment': 'ಉಪಕರಣಗಳು',`);

fs.writeFileSync('mobile/lib/core/localization/app_localizations.dart', appLoc, 'utf8');
console.log('Fixed app_localizations.dart');
