import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../core/providers/theme_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  String _getLanguageName(String code) {
    switch (code.toLowerCase()) {
      case 'te': return 'Ã Â°Â¤Ã Â±â€ Ã Â°Â²Ã Â±ÂÃ Â°â€”Ã Â±Â (Telugu)';
      case 'hi': return 'Ã Â¤Â¹Ã Â¤Â¿Ã Â¤â€šÃ Â¤Â¦Ã Â¥â‚¬ (Hindi)';
      case 'ta': return 'Ã Â®Â¤Ã Â®Â®Ã Â®Â¿Ã Â®Â´Ã Â¯Â (Tamil)';
      case 'kn': return 'Ã Â²â€¢Ã Â²Â¨Ã Â³ÂÃ Â²Â¨Ã Â²Â¡ (Kannada)';
      case 'en':
      default: return 'English';
    }
  }

  String _getThemeName(ThemeMode mode, String lang) {
    switch (mode) {
      case ThemeMode.light: return 'light_mode'.tr(lang);
      case ThemeMode.dark: return 'dark_mode'.tr(lang);
      case ThemeMode.system: return 'system_default'.tr(lang);
    }
  }

  void _showLanguageDialog(BuildContext context, WidgetRef ref, String currentLang) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkCard : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: const EdgeInsets.all(24),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'preferred_language'.tr(currentLang),
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
                const SizedBox(height: 16),
                _buildLanguageOption(ctx, ref, 'English', 'en', currentLang, isDark),
                _buildLanguageOption(ctx, ref, 'Ã Â°Â¤Ã Â±â€ Ã Â°Â²Ã Â±ÂÃ Â°â€”Ã Â±Â (Telugu)', 'te', currentLang, isDark),
                _buildLanguageOption(ctx, ref, 'Ã Â¤Â¹Ã Â¤Â¿Ã Â¤â€šÃ Â¤Â¦Ã Â¥â‚¬ (Hindi)', 'hi', currentLang, isDark),
                _buildLanguageOption(ctx, ref, 'Ã Â®Â¤Ã Â®Â®Ã Â®Â¿Ã Â®Â´Ã Â¯Â (Tamil)', 'ta', currentLang, isDark),
                _buildLanguageOption(ctx, ref, 'Ã Â²â€¢Ã Â²Â¨Ã Â³ÂÃ Â²Â¨Ã Â²Â¡ (Kannada)', 'kn', currentLang, isDark),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildLanguageOption(
    BuildContext ctx,
    WidgetRef ref,
    String name,
    String code,
    String currentLang,
    bool isDark,
  ) {
    final isSelected = currentLang == code;
    return InkWell(
      onTap: () {
        ref.read(languageProvider.notifier).setLanguage(code);
        Navigator.pop(ctx);
      },
      borderRadius: BorderRadius.circular(14),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.primaryGreen.withValues(alpha: 0.12)
              : (isDark ? Colors.white.withValues(alpha: 0.04) : Colors.grey.shade50),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? AppTheme.primaryGreen : (isDark ? Colors.white10 : Colors.grey.shade200),
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                name,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  color: isSelected
                      ? AppTheme.primaryGreen
                      : (isDark ? Colors.white : AppTheme.textDarkNavy),
                ),
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle, color: AppTheme.primaryGreen, size: 20),
          ],
        ),
      ),
    );
  }

  void _showThemeDialog(BuildContext context, WidgetRef ref, String currentLang, ThemeMode currentMode) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkCard : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: const EdgeInsets.all(24),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'appearance'.tr(currentLang),
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
                const SizedBox(height: 16),
                _buildThemeOption(
                  ctx,
                  title: 'system_default'.tr(currentLang),
                  icon: Icons.brightness_auto,
                  isSelected: currentMode == ThemeMode.system,
                  isDark: isDark,
                  onTap: () {
                    ref.read(themeModeProvider.notifier).setThemeMode(ThemeMode.system);
                    Navigator.pop(ctx);
                  },
                ),
                const SizedBox(height: 8),
                _buildThemeOption(
                  ctx,
                  title: 'light_mode'.tr(currentLang),
                  icon: Icons.light_mode_outlined,
                  isSelected: currentMode == ThemeMode.light,
                  isDark: isDark,
                  onTap: () {
                    ref.read(themeModeProvider.notifier).setThemeMode(ThemeMode.light);
                    Navigator.pop(ctx);
                  },
                ),
                const SizedBox(height: 8),
                _buildThemeOption(
                  ctx,
                  title: 'dark_mode'.tr(currentLang),
                  icon: Icons.dark_mode_outlined,
                  isSelected: currentMode == ThemeMode.dark,
                  isDark: isDark,
                  onTap: () {
                    ref.read(themeModeProvider.notifier).setThemeMode(ThemeMode.dark);
                    Navigator.pop(ctx);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildThemeOption(
    BuildContext ctx, {
    required String title,
    required IconData icon,
    required bool isSelected,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.primaryGreen.withValues(alpha: 0.12)
              : (isDark ? Colors.white.withValues(alpha: 0.04) : Colors.grey.shade50),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? AppTheme.primaryGreen : (isDark ? Colors.white10 : Colors.grey.shade200),
          ),
        ),
        child: Row(
          children: [
            Icon(icon, color: isSelected ? AppTheme.primaryGreen : Colors.grey, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  color: isSelected ? AppTheme.primaryGreen : (isDark ? Colors.white : AppTheme.textDarkNavy),
                ),
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle, color: AppTheme.primaryGreen, size: 20),
          ],
        ),
      ),
    );
  }

  void _showHelpDialog(BuildContext context, bool isDark) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text('Help & Support', style: TextStyle(fontWeight: FontWeight.bold)),
        content: const Text(
          'AgroRent AI Support is available 24/7.\n\nEmail: support@agrorent.ai\nHelpline: 1800-419-AGRO\n\nFor rental disputes, use the Chat with Owner feature or report complaints through the admin channel.',
          style: TextStyle(fontSize: 14, height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close', style: TextStyle(color: AppTheme.primaryGreen, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final currentLang = ref.watch(languageProvider);
    final currentTheme = ref.watch(themeModeProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final userName = user?.name.isNotEmpty == true ? user!.name : 'Kumar';
    final userRole = user?.role ?? 'Farmer';
    final userInitial = userName.substring(0, 1).toUpperCase();

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Profile', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20)),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        foregroundColor: isDark ? Colors.white : AppTheme.textDarkNavy,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          children: [
            // 1. PROFILE HEADER (Avatar + Name + Role)
            Center(
              child: Column(
                children: [
                  Stack(
                    children: [
                      CircleAvatar(
                        radius: 44,
                        backgroundColor: AppTheme.primaryGreen,
                        child: Text(
                          userInitial,
                          style: const TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: isDark ? AppTheme.darkCard : Colors.white,
                            shape: BoxShape.circle,
                            border: Border.all(color: isDark ? Colors.white24 : Colors.grey.shade200),
                          ),
                          child: const Icon(Icons.edit, size: 14, color: AppTheme.primaryGreen),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    userName,
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    userRole[0] + userRole.substring(1).toLowerCase(),
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryGreen,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // 2. ACCOUNT SECTION CONTAINER
            Container(
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkCard : Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  _buildMenuItem(
                    icon: Icons.person_outline,
                    title: 'Personal Information',
                    subtitle: user?.email ?? '',
                    isDark: isDark,
                    onTap: () => context.push('/edit-profile'),
                  ),
                  _buildDivider(isDark),
                  _buildMenuItem(
                    icon: Icons.language,
                    title: 'Language',
                    subtitle: _getLanguageName(currentLang),
                    isDark: isDark,
                    onTap: () => _showLanguageDialog(context, ref, currentLang),
                  ),
                  _buildDivider(isDark),
                  _buildMenuItem(
                    icon: Icons.palette_outlined,
                    title: 'Appearance',
                    subtitle: _getThemeName(currentTheme, currentLang),
                    isDark: isDark,
                    onTap: () => _showThemeDialog(context, ref, currentLang, currentTheme),
                  ),
                  if (user?.role == 'FARMER') ...[
                    _buildDivider(isDark),
                    _buildMenuItem(
                      icon: Icons.grass,
                      title: 'my_farm'.tr(currentLang),
                      subtitle: 'manage_land_active_crops'.tr(currentLang),
                      isDark: isDark,
                      onTap: () => context.push('/farm-setup'),
                    ),
                    _buildDivider(isDark),
                    _buildMenuItem(
                      icon: Icons.favorite_border,
                      title: 'saved_equipment'.tr(currentLang),
                      isDark: isDark,
                      onTap: () => context.push('/saved'),
                    ),
                    _buildDivider(isDark),
                    _buildMenuItem(
                      icon: Icons.receipt_long_outlined,
                      title: 'my_bookings'.tr(currentLang),
                      isDark: isDark,
                      onTap: () => context.push('/my-rentals'),
                    ),
                  ] else if (user?.role == 'OWNER') ...[
                    _buildDivider(isDark),
                    _buildMenuItem(
                      icon: Icons.inventory_2_outlined,
                      title: 'fleet_management'.tr(currentLang),
                      subtitle: 'manage_machines_listings'.tr(currentLang),
                      isDark: isDark,
                      onTap: () => context.push('/my-equipment'),
                    ),
                    _buildDivider(isDark),
                    _buildMenuItem(
                      icon: Icons.receipt_long_outlined,
                      title: 'owner_bookings'.tr(currentLang),
                      subtitle: 'rental_requests_active'.tr(currentLang),
                      isDark: isDark,
                      onTap: () => context.push('/owner-bookings'),
                    ),
                  ],
                  _buildDivider(isDark),
                  _buildMenuItem(
                    icon: Icons.notifications_none,
                    title: 'Notifications',
                    isDark: isDark,
                    onTap: () => context.push('/notifications'),
                  ),
                  _buildDivider(isDark),
                  _buildMenuItem(
                    icon: Icons.lock_outline,
                    title: 'Settings',
                    subtitle: 'Password & Security',
                    isDark: isDark,
                    onTap: () => context.push('/change-password'),
                  ),
                  _buildDivider(isDark),
                  _buildMenuItem(
                    icon: Icons.help_outline,
                    title: 'Help & Support',
                    isDark: isDark,
                    onTap: () => _showHelpDialog(context, isDark),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 3. LOG OUT BUTTON
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      title: const Text('Log Out', style: TextStyle(fontWeight: FontWeight.bold)),
                      content: const Text('Are you sure you want to log out of AgroRent AI?'),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(ctx),
                          child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
                        ),
                        ElevatedButton(
                          onPressed: () {
                            Navigator.pop(ctx);
                            ref.read(authProvider.notifier).logout();
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.red,
                            foregroundColor: Colors.white,
                          ),
                          child: const Text('Log Out'),
                        ),
                      ],
                    ),
                  );
                },
                icon: const Icon(Icons.logout, color: Colors.red, size: 20),
                label: const Text('Log Out', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 15)),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: Colors.red.withValues(alpha: 0.3)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                ),
              ),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    String? subtitle,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: AppTheme.primaryGreen, size: 20),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                    ),
                  ),
                  if (subtitle != null && subtitle.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: TextStyle(fontSize: 12, color: isDark ? Colors.grey.shade400 : Colors.grey.shade500),
                    ),
                  ],
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: isDark ? Colors.grey.shade600 : Colors.grey.shade400, size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildDivider(bool isDark) {
    return Divider(
      height: 1,
      indent: 64,
      endIndent: 20,
      color: isDark ? Colors.white10 : Colors.grey.shade100,
    );
  }
}
