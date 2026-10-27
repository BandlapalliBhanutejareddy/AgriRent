import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../../farm/providers/farm_provider.dart';
import '../../marketplace/providers/marketplace_provider.dart';

class AboutProfileScreen extends ConsumerWidget {
  const AboutProfileScreen({super.key});

  String _getLanguageName(String code) {
    switch (code.toLowerCase()) {
      case 'te': return 'తెలుగు (Telugu)';
      case 'hi': return 'हिन्दी (Hindi)';
      case 'ta': return 'தமிழ் (Tamil)';
      case 'kn': return 'ಕನ್ನಡ (Kannada)';
      case 'en':
      default: return 'English';
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final user = ref.watch(authProvider).user;
    final farmState = ref.watch(farmProvider);
    final marketplaceState = ref.watch(marketplaceProvider);

    final userName = user?.name.isNotEmpty == true ? user!.name : 'User';
    final userRole = user?.role ?? 'FARMER';
    final userInitial = userName.isNotEmpty ? userName[0].toUpperCase() : 'U';
    final profileImage = user?.profileImage;
    final userPhone = user?.phone?.isNotEmpty == true ? user!.phone! : 'not_available'.tr(lang);
    final userEmail = user?.email.isNotEmpty == true ? user!.email : 'not_available'.tr(lang);

    final farmCount = farmState.farms.length;
    final equipmentCount = marketplaceState.equipment.length;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0D140E) : const Color(0xFFF4F7F4),
      appBar: AppBar(
        title: Text(
          'about_this_profile'.tr(lang),
          style: TextStyle(
            fontWeight: FontWeight.w900,
            fontSize: 20,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
        ),
        backgroundColor: Colors.transparent,
        foregroundColor: isDark ? Colors.white : AppTheme.textDarkNavy,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        child: Column(
          children: [
            // 1. HERO IDENTITY CARD
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDark
                      ? [const Color(0xFF132A18), const Color(0xFF0E1A11)]
                      : [const Color(0xFFDCF2DE), const Color(0xFFEAF8EC)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(26),
                border: Border.all(
                  color: isDark ? const Color(0xFF16A34A).withValues(alpha: 0.25) : const Color(0xFFBBE5C3),
                  width: 1.2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.04),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFF16A34A), width: 3),
                    ),
                    child: CircleAvatar(
                      radius: 46,
                      backgroundColor: isDark ? const Color(0xFF1E2E20) : Colors.white,
                      backgroundImage: (profileImage != null && profileImage.isNotEmpty)
                          ? NetworkImage(profileImage)
                          : null,
                      child: (profileImage == null || profileImage.isEmpty)
                          ? Text(
                              userInitial,
                              style: const TextStyle(
                                fontSize: 36,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF16A34A),
                              ),
                            )
                          : null,
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    userName,
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                      letterSpacing: -0.3,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF16A34A).withValues(alpha: isDark ? 0.25 : 0.15),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      AppLocalizations.localizedRole(userRole, lang),
                      style: const TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF16A34A),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.eco, size: 15, color: Color(0xFF16A34A)),
                      const SizedBox(width: 6),
                      Text(
                        'growing_better_tomorrow'.tr(lang),
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF16A34A),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // 2. PROFILE INFORMATION DETAILS
            _buildInfoSection(
              title: 'account_information'.tr(lang),
              isDark: isDark,
              rows: [
                _buildInfoRow(
                  icon: Icons.phone_outlined,
                  iconColor: const Color(0xFF16A34A),
                  label: 'phone_number'.tr(lang),
                  value: userPhone,
                  isDark: isDark,
                ),
                _buildInfoRow(
                  icon: Icons.mail_outline_rounded,
                  iconColor: const Color(0xFF2563EB),
                  label: 'email'.tr(lang),
                  value: userEmail,
                  isDark: isDark,
                ),
                _buildInfoRow(
                  icon: Icons.language_rounded,
                  iconColor: const Color(0xFF7C3AED),
                  label: 'preferred_language'.tr(lang),
                  value: _getLanguageName(user?.preferredLanguage ?? lang),
                  isDark: isDark,
                ),
                _buildInfoRow(
                  icon: Icons.verified_user_outlined,
                  iconColor: const Color(0xFF16A34A),
                  label: 'account_status'.tr(lang),
                  value: 'verified'.tr(lang),
                  valueColor: const Color(0xFF16A34A),
                  isDark: isDark,
                ),
              ],
            ),
            const SizedBox(height: 16),

            // 3. AGRICULTURAL & PLATFORM SUMMARY
            _buildInfoSection(
              title: 'agricultural_summary'.tr(lang),
              isDark: isDark,
              rows: [
                if (userRole == 'FARMER' || userRole == 'BOTH')
                  _buildInfoRow(
                    icon: Icons.grass_rounded,
                    iconColor: const Color(0xFF16A34A),
                    label: 'registered_farms'.tr(lang),
                    value: '$farmCount ${'farms'.tr(lang)}',
                    isDark: isDark,
                  ),
                if (userRole == 'OWNER' || userRole == 'BOTH')
                  _buildInfoRow(
                    icon: Icons.agriculture_rounded,
                    iconColor: const Color(0xFFEA580C),
                    label: 'listed_equipment'.tr(lang),
                    value: '$equipmentCount ${'items'.tr(lang)}',
                    isDark: isDark,
                  ),
                _buildInfoRow(
                  icon: Icons.security_rounded,
                  iconColor: const Color(0xFF0D9488),
                  label: 'privacy_protection'.tr(lang),
                  value: 'active_private_calling'.tr(lang),
                  valueColor: const Color(0xFF16A34A),
                  isDark: isDark,
                ),
              ],
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoSection({
    required String title,
    required bool isDark,
    required List<Widget> rows,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            title,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: isDark ? Colors.grey.shade300 : AppTheme.textDarkNavy,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF162118) : Colors.white,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(
              color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE2EBE2),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.02),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: rows,
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
    Color? valueColor,
    required bool isDark,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: iconColor, size: 18),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: isDark ? Colors.grey.shade400 : Colors.grey.shade700,
              ),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: valueColor ?? (isDark ? Colors.white : AppTheme.textDarkNavy),
            ),
          ),
        ],
      ),
    );
  }
}
