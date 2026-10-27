import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../core/providers/theme_provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../../farm/providers/farm_provider.dart';
import '../../../shared/widgets/profile_header_painters.dart';

class FarmerMoreScreen extends ConsumerStatefulWidget {
  const FarmerMoreScreen({super.key});

  @override
  ConsumerState<FarmerMoreScreen> createState() => _FarmerMoreScreenState();
}

class _FarmerMoreScreenState extends ConsumerState<FarmerMoreScreen> {
  bool _isUploadingPhoto = false;

  String _getLanguageName(String? code) {
    switch ((code ?? 'en').toLowerCase()) {
      case 'te': return 'Telugu';
      case 'hi': return 'Hindi';
      case 'ta': return 'Tamil';
      case 'kn': return 'Kannada';
      case 'en':
      default: return 'English';
    }
  }

  Future<void> _handlePhotoAction(BuildContext context, String lang, bool isDark) async {
    final user = ref.read(authProvider).user;
    final hasPhoto = user?.profileImage != null && user!.profileImage!.isNotEmpty;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF162118) : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 36,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Text(
                'profile_photo'.tr(lang),
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
              ),
              const SizedBox(height: 16),
              _buildModalTile(
                icon: Icons.camera_alt_rounded,
                iconColor: const Color(0xFF16A34A),
                iconBg: const Color(0xFF16A34A).withValues(alpha: 0.12),
                title: 'take_photo'.tr(lang),
                isDark: isDark,
                onTap: () {
                  Navigator.pop(ctx);
                  _pickAndUploadImage(ImageSource.camera);
                },
              ),
              const SizedBox(height: 8),
              _buildModalTile(
                icon: Icons.photo_library_rounded,
                iconColor: const Color(0xFF16A34A),
                iconBg: const Color(0xFF16A34A).withValues(alpha: 0.12),
                title: 'choose_from_gallery'.tr(lang),
                isDark: isDark,
                onTap: () {
                  Navigator.pop(ctx);
                  _pickAndUploadImage(ImageSource.gallery);
                },
              ),
              if (hasPhoto) ...[
                const SizedBox(height: 8),
                _buildModalTile(
                  icon: Icons.delete_outline_rounded,
                  iconColor: Colors.red,
                  iconBg: Colors.red.withValues(alpha: 0.12),
                  title: 'remove_photo'.tr(lang),
                  isDark: isDark,
                  isDestructive: true,
                  onTap: () {
                    Navigator.pop(ctx);
                    _removeProfilePhoto();
                  },
                ),
              ],
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    backgroundColor: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.grey.shade100,
                  ),
                  child: Text(
                    'cancel'.tr(lang),
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildModalTile({
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String title,
    String? subtitle,
    required bool isDark,
    bool isDestructive = false,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? Colors.white10 : Colors.grey.shade200,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: iconColor, size: 20),
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
                      fontWeight: FontWeight.w700,
                      color: isDestructive
                          ? Colors.red
                          : (isDark ? Colors.white : AppTheme.textDarkNavy),
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            Icon(
              Icons.chevron_right_rounded,
              size: 20,
              color: isDark ? Colors.white30 : Colors.grey.shade400,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickAndUploadImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(
        source: source,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );

      if (picked == null) return;

      setState(() => _isUploadingPhoto = true);

      final fileName = 'profile_${DateTime.now().millisecondsSinceEpoch}.jpg';
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(picked.path, filename: fileName),
      });

      final uploadRes = await ApiClient().dio.post(
        'upload/profile-image',
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );

      final publicUrl = uploadRes.data['url'] ?? uploadRes.data['data']?['url'];

      if (publicUrl != null && publicUrl.toString().isNotEmpty) {
        await ApiClient().dio.put(
          ApiConstants.me,
          data: {'profileImage': publicUrl.toString()},
        );

        if (mounted) {
          final currentUser = ref.read(authProvider).user;
          if (currentUser != null) {
            final updatedUser = currentUser.copyWith(profileImage: publicUrl.toString());
            ref.read(authProvider.notifier).setUser(updatedUser);
          }
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('profile_photo_updated'.tr(ref.read(languageProvider))),
              backgroundColor: AppTheme.primaryGreen,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to upload profile photo: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploadingPhoto = false);
    }
  }

  Future<void> _removeProfilePhoto() async {
    try {
      setState(() => _isUploadingPhoto = true);
      await ApiClient().dio.put(ApiConstants.me, data: {'profileImage': null});

      if (mounted) {
        final currentUser = ref.read(authProvider).user;
        if (currentUser != null) {
          final updatedUser = currentUser.copyWith(profileImage: '');
          ref.read(authProvider.notifier).setUser(updatedUser);
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('profile_photo_removed'.tr(ref.read(languageProvider))),
            backgroundColor: AppTheme.primaryGreen,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to remove photo: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploadingPhoto = false);
    }
  }

  void _showPreferencesSheet(BuildContext context, String lang, bool isDark) {
    final currentTheme = ref.read(themeModeProvider);
    final currentLang = ref.read(languageProvider);

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white24 : Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Text(
                'preferences'.tr(lang),
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
              ),
              const SizedBox(height: 16),

              // Theme Selector
              Text(
                'theme'.tr(lang),
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white70 : AppTheme.textMutedGray,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  _buildThemeOption(ctx, ThemeMode.light, Icons.wb_sunny_rounded, 'Light', currentTheme == ThemeMode.light, isDark),
                  const SizedBox(width: 8),
                  _buildThemeOption(ctx, ThemeMode.dark, Icons.nightlight_round, 'Dark', currentTheme == ThemeMode.dark, isDark),
                  const SizedBox(width: 8),
                  _buildThemeOption(ctx, ThemeMode.system, Icons.brightness_auto_rounded, 'System', currentTheme == ThemeMode.system, isDark),
                ],
              ),
              const SizedBox(height: 16),

              // Language Selector
              Text(
                'language'.tr(lang),
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white70 : AppTheme.textMutedGray,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _buildLangChip(ctx, 'en', 'English', currentLang == 'en', isDark),
                  _buildLangChip(ctx, 'te', 'తెలుగు (Telugu)', currentLang == 'te', isDark),
                  _buildLangChip(ctx, 'hi', 'हिन्दी (Hindi)', currentLang == 'hi', isDark),
                  _buildLangChip(ctx, 'ta', 'தமிழ் (Tamil)', currentLang == 'ta', isDark),
                  _buildLangChip(ctx, 'kn', 'ಕನ್ನಡ (Kannada)', currentLang == 'kn', isDark),
                ],
              ),
              const SizedBox(height: 20),

              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    backgroundColor: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.grey.shade100,
                  ),
                  child: Text(
                    'close'.tr(lang),
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildThemeOption(BuildContext ctx, ThemeMode mode, IconData icon, String label, bool isSelected, bool isDark) {
    return Expanded(
      child: InkWell(
        onTap: () {
          ref.read(themeModeProvider.notifier).setThemeMode(mode);
          Navigator.pop(ctx);
        },
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected
                ? AppTheme.primaryGreen.withValues(alpha: 0.15)
                : (isDark ? Colors.white.withValues(alpha: 0.04) : Colors.grey.shade50),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? AppTheme.primaryGreen : (isDark ? Colors.white10 : Colors.grey.shade200),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 20, color: isSelected ? AppTheme.primaryGreen : (isDark ? Colors.white70 : Colors.grey.shade700)),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isSelected ? AppTheme.primaryGreen : (isDark ? Colors.white70 : AppTheme.textDarkNavy),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLangChip(BuildContext ctx, String code, String label, bool isSelected, bool isDark) {
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) {
        ref.read(languageProvider.notifier).setLanguage(code);
        Navigator.pop(ctx);
      },
      selectedColor: AppTheme.primaryGreen.withValues(alpha: 0.2),
      backgroundColor: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.grey.shade100,
      labelStyle: TextStyle(
        fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
        fontSize: 13,
        color: isSelected ? AppTheme.primaryGreen : (isDark ? Colors.white70 : AppTheme.textDarkNavy),
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isSelected ? AppTheme.primaryGreen : Colors.transparent,
        ),
      ),
    );
  }

  void _showLogoutDialog(BuildContext context, String lang, bool isDark) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text(
          'logout'.tr(lang),
          style: TextStyle(
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
        ),
        content: Text(
          'logout_confirm'.tr(lang),
          style: TextStyle(
            fontSize: 14,
            color: isDark ? Colors.white70 : const Color(0xFF475569),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              'cancel'.tr(lang),
              style: TextStyle(
                color: isDark ? Colors.white60 : Colors.grey.shade600,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(authProvider.notifier).logout();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text('logout'.tr(lang), style: const TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final user = ref.watch(authProvider).user;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final farmState = ref.watch(farmProvider);

    final farms = farmState.farms;
    final int fieldsCount = farms.length;
    final double totalAcres = farms.fold<double>(0.0, (sum, f) => sum + f.area);
    final String activeCropName = (farms.isNotEmpty && farms.first.crops.isNotEmpty)
        ? farms.first.crops.first.cropName
        : '';
    final String expectedHarvestDate = (farms.isNotEmpty && farms.first.crops.isNotEmpty)
        ? farms.first.crops.first.stage
        : (farms.isNotEmpty ? 'Active' : '—');

    final userName = user?.name.isNotEmpty == true ? user!.name : 'Farmer';
    final userInitial = userName.substring(0, 1).toUpperCase();
    final profileImage = user?.profileImage;
    final userPhone = user?.phone?.isNotEmpty == true ? user!.phone! : null;
    final userLocation = (farms.isNotEmpty && farms.first.location.isNotEmpty)
        ? farms.first.location
        : null;
    final userLang = _getLanguageName(user?.preferredLanguage ?? lang);

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
      body: SafeArea(
        top: false,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ---------------------------------------------------------------
              // SCENIC FARM LANDSCAPE HEADER (Farmer Portal - Green Theme)
              // ---------------------------------------------------------------
              Stack(
                children: [
                  // Scenic Landscape Background
                  CustomPaint(
                    size: const Size(double.infinity, 250),
                    painter: FarmerLandscapePainter(isDark: isDark),
                  ),

                  // Top App Bar Controls
                  SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              if (Navigator.of(context).canPop())
                                IconButton(
                                  icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
                                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                  onPressed: () => Navigator.of(context).pop(),
                                ),
                              Text(
                                'profile'.tr(lang),
                                style: TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w900,
                                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                ),
                              ),
                            ],
                          ),
                          IconButton(
                            icon: Container(
                              padding: const EdgeInsets.all(7),
                              decoration: BoxDecoration(
                                color: (isDark ? Colors.black38 : Colors.white70),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                Icons.edit_outlined,
                                size: 18,
                                color: isDark ? Colors.white : AppTheme.textDarkNavy,
                              ),
                            ),
                            tooltip: 'edit_profile'.tr(lang),
                            onPressed: () => context.push('/edit-profile'),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Avatar & Farmer Details Overlay
                  Positioned(
                    left: 20,
                    right: 20,
                    bottom: 16,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Circular Avatar with Camera Badge
                        GestureDetector(
                          onTap: _isUploadingPhoto ? null : () => _handlePhotoAction(context, lang, isDark),
                          child: Stack(
                            clipBehavior: Clip.none,
                            children: [
                              Container(
                                width: 84,
                                height: 84,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white, width: 3.5),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.15),
                                      blurRadius: 10,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: ClipOval(
                                  child: (profileImage != null && profileImage.isNotEmpty)
                                      ? Image.network(
                                          profileImage,
                                          fit: BoxFit.cover,
                                          errorBuilder: (context, error, stackTrace) => _buildAvatarFallback(userInitial),
                                        )
                                      : _buildAvatarFallback(userInitial),
                                ),
                              ),

                              if (_isUploadingPhoto)
                                const Positioned.fill(
                                  child: Center(
                                    child: CircularProgressIndicator(color: AppTheme.primaryGreen, strokeWidth: 3),
                                  ),
                                )
                              else
                                Positioned(
                                  bottom: 0,
                                  right: 0,
                                  child: Container(
                                    padding: const EdgeInsets.all(6),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF14532D),
                                      shape: BoxShape.circle,
                                      border: Border.all(color: Colors.white, width: 2),
                                    ),
                                    child: const Icon(
                                      Icons.camera_alt_rounded,
                                      color: Colors.white,
                                      size: 14,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),

                        // Name, Role Badge, Phone, Location, Language
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              // Name with Verified checkmark
                              Row(
                                children: [
                                  Flexible(
                                    child: Text(
                                      userName,
                                      style: TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.w900,
                                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  const Icon(
                                    Icons.verified_rounded,
                                    color: Color(0xFF16A34A),
                                    size: 18,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),

                              // Role Pill
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFDCFCE7),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  'farmer'.tr(lang),
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF16A34A),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 6),

                              // Phone
                              if (userPhone != null)
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 2),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.phone_outlined, size: 13, color: Color(0xFF16A34A)),
                                      const SizedBox(width: 5),
                                      Text(
                                        userPhone,
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          color: isDark ? Colors.white70 : const Color(0xFF334155),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                              // Location
                              if (userLocation != null)
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 2),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.location_on_outlined, size: 13, color: Color(0xFF16A34A)),
                                      const SizedBox(width: 5),
                                      Expanded(
                                        child: Text(
                                          userLocation,
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w500,
                                            color: isDark ? Colors.white70 : const Color(0xFF334155),
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                              // Language
                              Row(
                                children: [
                                  const Icon(Icons.language_rounded, size: 13, color: Color(0xFF16A34A)),
                                  const SizedBox(width: 5),
                                  Text(
                                    userLang,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                      color: isDark ? Colors.white70 : const Color(0xFF334155),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              // ---------------------------------------------------------------
              // 4-COLUMN SUMMARY METRICS CARD
              // ---------------------------------------------------------------
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
                  decoration: BoxDecoration(
                    color: isDark ? AppTheme.darkCard : Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF16A34A).withValues(alpha: isDark ? 0.08 : 0.05),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      _buildMetricColumn(
                        context: context,
                        icon: Icons.eco_rounded,
                        value: fieldsCount > 0 ? '$fieldsCount' : '0',
                        label: 'fields'.tr(lang),
                        isDark: isDark,
                        onTap: () => context.push('/farm'),
                      ),
                      _buildMetricDivider(isDark),
                      _buildMetricColumn(
                        context: context,
                        icon: Icons.grid_on_rounded,
                        value: totalAcres > 0
                            ? (totalAcres % 1 == 0 ? totalAcres.toInt().toString() : totalAcres.toStringAsFixed(1))
                            : '0',
                        label: 'total_acres'.tr(lang),
                        isDark: isDark,
                        onTap: () => context.push('/farm'),
                      ),
                      _buildMetricDivider(isDark),
                      _buildMetricColumn(
                        context: context,
                        icon: Icons.grass_rounded,
                        value: activeCropName.isNotEmpty ? activeCropName : 'None',
                        label: 'current_crop'.tr(lang),
                        isDark: isDark,
                        onTap: () => context.push('/crop-lifecycle'),
                      ),
                      _buildMetricDivider(isDark),
                      _buildMetricColumn(
                        context: context,
                        icon: Icons.calendar_month_rounded,
                        value: expectedHarvestDate,
                        label: 'expected_harvest'.tr(lang),
                        isDark: isDark,
                        onTap: () => context.push('/farm-plan'),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 12),

              // ---------------------------------------------------------------
              // GROUPED PROFILE MENU SECTIONS
              // ---------------------------------------------------------------
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  children: [
                    // SECTION 1: PERSONAL INFORMATION
                    _buildMenuGroup(
                      isDark: isDark,
                      items: [
                        _buildMenuTile(
                          icon: Icons.person_rounded,
                          iconColor: const Color(0xFF2563EB),
                          iconBg: const Color(0xFFEFF6FF),
                          title: 'personal_information'.tr(lang),
                          subtitle: 'name_contact_language_address'.tr(lang),
                          isDark: isDark,
                          onTap: () => context.push('/edit-profile'),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // SECTION 2: FARMING
                    _buildMenuGroup(
                      isDark: isDark,
                      items: [
                        _buildMenuTile(
                          icon: Icons.fence_rounded,
                          iconColor: const Color(0xFF16A34A),
                          iconBg: const Color(0xFFF0FDF4),
                          title: 'my_farm_fields'.tr(lang),
                          subtitle: 'my_farm_fields_subtitle'.tr(lang),
                          isDark: isDark,
                          onTap: () => context.push('/farm'),
                        ),
                        _buildMenuDivider(isDark),
                        _buildMenuTile(
                          icon: Icons.add_business_rounded,
                          iconColor: const Color(0xFF059669),
                          iconBg: const Color(0xFFECFDF5),
                          title: 'add_new_farm'.tr(lang),
                          subtitle: 'set_up_farm'.tr(lang),
                          isDark: isDark,
                          onTap: () => context.push('/farm-setup?mode=create'),
                        ),
                        _buildMenuDivider(isDark),
                        _buildMenuTile(
                          icon: Icons.event_note_rounded,
                          iconColor: const Color(0xFFEA580C),
                          iconBg: const Color(0xFFFFF7ED),
                          title: 'farm_plan_tasks'.tr(lang),
                          subtitle: 'farm_plan_tasks_subtitle'.tr(lang),
                          isDark: isDark,
                          onTap: () => context.push('/farm-plan'),
                        ),
                        _buildMenuDivider(isDark),
                        _buildMenuTile(
                          icon: Icons.currency_rupee_rounded,
                          iconColor: const Color(0xFF9333EA),
                          iconBg: const Color(0xFFFAF5FF),
                          title: 'farm_finance'.tr(lang),
                          subtitle: 'farm_finance_subtitle'.tr(lang),
                          isDark: isDark,
                          onTap: () => context.push('/all-expenses'),
                        ),
                        _buildMenuDivider(isDark),
                        _buildMenuTile(
                          icon: Icons.agriculture_rounded,
                          iconColor: const Color(0xFFD97706),
                          iconBg: const Color(0xFFFFFBEB),
                          title: 'equipment_bookings'.tr(lang),
                          subtitle: 'equipment_bookings_subtitle'.tr(lang),
                          isDark: isDark,
                          onTap: () => context.push('/my-rentals'),
                        ),
                        _buildMenuDivider(isDark),
                        _buildMenuTile(
                          icon: Icons.favorite_rounded,
                          iconColor: const Color(0xFFE11D48),
                          iconBg: const Color(0xFFFFF1F2),
                          title: 'saved_equipment'.tr(lang),
                          subtitle: 'saved_equipment_subtitle'.tr(lang),
                          isDark: isDark,
                          onTap: () => context.push('/saved'),
                        ),
                        _buildMenuDivider(isDark),
                        _buildMenuTile(
                          icon: Icons.groups_rounded,
                          iconColor: const Color(0xFF0D9488),
                          iconBg: const Color(0xFFF0FDFA),
                          title: 'crop_groups_selling'.tr(lang),
                          subtitle: 'crop_groups_selling_subtitle'.tr(lang),
                          isDark: isDark,
                          onTap: () => context.push('/community'),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // SECTION 3: PREFERENCES
                    _buildMenuGroup(
                      isDark: isDark,
                      items: [
                        _buildMenuTile(
                          icon: Icons.settings_suggest_rounded,
                          iconColor: const Color(0xFF475569),
                          iconBg: const Color(0xFFF1F5F9),
                          title: 'preferences'.tr(lang),
                          subtitle: 'preferences_subtitle'.tr(lang),
                          isDark: isDark,
                          onTap: () => _showPreferencesSheet(context, lang, isDark),
                        ),
                        _buildMenuDivider(isDark),
                        _buildMenuTile(
                          icon: Icons.lock_reset_rounded,
                          iconColor: const Color(0xFF2563EB),
                          iconBg: const Color(0xFFEFF6FF),
                          title: 'Change Password',
                          subtitle: 'Update your account security password',
                          isDark: isDark,
                          onTap: () => context.push('/change-password'),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // LOGOUT BUTTON
                    InkWell(
                      onTap: () => _showLogoutDialog(context, lang, isDark),
                      borderRadius: BorderRadius.circular(18),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF2F2),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: const Color(0xFFFCA5A5)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.logout_rounded, color: Color(0xFFDC2626), size: 20),
                            const SizedBox(width: 8),
                            Text(
                              'logout'.tr(lang),
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFFDC2626),
                              ),
                            ),
                          ],
                        ),
                      ),
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

  Widget _buildAvatarFallback(String initial) {
    return Container(
      color: const Color(0xFFDCFCE7),
      child: Center(
        child: Text(
          initial,
          style: const TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.w900,
            color: Color(0xFF16A34A),
          ),
        ),
      ),
    );
  }

  Widget _buildMetricColumn({
    required BuildContext context,
    required IconData icon,
    required String value,
    required String label,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: const Color(0xFF16A34A), size: 22),
              const SizedBox(height: 6),
              Text(
                value,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.white60 : const Color(0xFF64748B),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetricDivider(bool isDark) {
    return Container(
      width: 1,
      height: 38,
      color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
    );
  }

  Widget _buildMenuGroup({
    required bool isDark,
    required List<Widget> items,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.15 : 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: items,
      ),
    );
  }

  Widget _buildMenuDivider(bool isDark) {
    return Divider(
      height: 1,
      thickness: 1,
      color: isDark ? Colors.white.withValues(alpha: 0.06) : const Color(0xFFF1F5F9),
      indent: 68,
    );
  }

  Widget _buildMenuTile({
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String title,
    required String subtitle,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: iconColor, size: 22),
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
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: isDark ? Colors.white60 : const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right_rounded,
              color: isDark ? Colors.white30 : Colors.grey.shade400,
              size: 22,
            ),
          ],
        ),
      ),
    );
  }
}
