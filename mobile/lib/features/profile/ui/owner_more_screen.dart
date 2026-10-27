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
import '../providers/owner_provider.dart';
import '../../../shared/widgets/profile_header_painters.dart';
import 'owner_bank_details_dialog.dart';
import 'owner_maintenance_dialog.dart';

class OwnerMoreScreen extends ConsumerStatefulWidget {
  final void Function(int index)? onNavigateTab;

  const OwnerMoreScreen({super.key, this.onNavigateTab});

  @override
  ConsumerState<OwnerMoreScreen> createState() => _OwnerMoreScreenState();
}

class _OwnerMoreScreenState extends ConsumerState<OwnerMoreScreen> {
  bool _isUploadingPhoto = false;
  String? _savedBankMasked;

  @override
  void initState() {
    super.initState();
    _loadInitialBankDetails();
  }

  Future<void> _loadInitialBankDetails() async {
    try {
      final res = await ApiClient().dio.get('owner/bank-details');
      if (res.statusCode == 200 && res.data != null && res.data['success'] == true) {
        final data = res.data['data'];
        if (data != null && data is Map<String, dynamic>) {
          if (mounted) {
            setState(() {
              _savedBankMasked = data['accountNumberMasked']?.toString();
            });
          }
        }
      }
    } catch (_) {}
  }

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
          color: isDark ? AppTheme.darkCard : Colors.white,
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
                iconColor: const Color(0xFFD97706),
                iconBg: const Color(0xFFFEF3C7),
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
                iconColor: const Color(0xFFD97706),
                iconBg: const Color(0xFFFEF3C7),
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
              backgroundColor: const Color(0xFFD97706),
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
            backgroundColor: const Color(0xFFD97706),
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
                ? const Color(0xFFD97706).withValues(alpha: 0.15)
                : (isDark ? Colors.white.withValues(alpha: 0.04) : Colors.grey.shade50),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? const Color(0xFFD97706) : (isDark ? Colors.white10 : Colors.grey.shade200),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 20, color: isSelected ? const Color(0xFFD97706) : (isDark ? Colors.white70 : Colors.grey.shade700)),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isSelected ? const Color(0xFFD97706) : (isDark ? Colors.white70 : AppTheme.textDarkNavy),
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
      selectedColor: const Color(0xFFD97706).withValues(alpha: 0.2),
      backgroundColor: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.grey.shade100,
      labelStyle: TextStyle(
        fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
        fontSize: 13,
        color: isSelected ? const Color(0xFFD97706) : (isDark ? Colors.white70 : AppTheme.textDarkNavy),
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isSelected ? const Color(0xFFD97706) : Colors.transparent,
        ),
      ),
    );
  }

  void _showServiceMaintenanceDialog(BuildContext context, String lang, bool isDark) {
    OwnerMaintenanceDialog.show(context);
  }

  Future<void> _showBankDetailsDialog(BuildContext context, String lang, bool isDark) async {
    final result = await OwnerBankDetailsDialog.show(context);
    if (result != null && mounted) {
      setState(() {
        _savedBankMasked = result['accountNumberMasked']?.toString();
      });
    }
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
    final ownerState = ref.watch(ownerProvider);

    final userName = user?.name.isNotEmpty == true ? user!.name : 'Equipment Owner';
    final userInitial = userName.substring(0, 1).toUpperCase();
    final profileImage = user?.profileImage;
    final userPhone = user?.phone?.isNotEmpty == true ? user!.phone! : null;
    final userLocation = (ownerState.myEquipment.isNotEmpty && (ownerState.myEquipment.first.location?.isNotEmpty ?? false))
        ? ownerState.myEquipment.first.location
        : null;
    final userLang = _getLanguageName(user?.preferredLanguage ?? lang);

    final equipmentCount = ownerState.myEquipment.length;
    final bookingCount = ownerState.bookings.length;
    final double earnings = (ownerState.analytics?['monthlyEarnings'] is num)
        ? (ownerState.analytics!['monthlyEarnings'] as num).toDouble()
        : (ownerState.analytics?['revenue'] is num ? (ownerState.analytics!['revenue'] as num).toDouble() : 0.0);
    final String monthlyRevenue = earnings > 0
        ? AppFormatters.formatCurrency(earnings)
        : '₹0';
    final double? ratingVal = (ownerState.analytics?['averageRating'] is num)
        ? (ownerState.analytics!['averageRating'] as num).toDouble()
        : (ownerState.analytics?['rating'] is num ? (ownerState.analytics!['rating'] as num).toDouble() : null);
    final String ratingStr = (ratingVal != null && ratingVal > 0) ? ratingVal.toStringAsFixed(1) : 'N/A';

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
      body: SafeArea(
        top: false,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ---------------------------------------------------------------
              // SCENIC HARVEST LANDSCAPE HEADER (Owner Portal - Amber Theme)
              // ---------------------------------------------------------------
              Stack(
                children: [
                  CustomPaint(
                    size: const Size(double.infinity, 250),
                    painter: HarvestLandscapePainter(isDark: isDark),
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
                                  color: isDark ? Colors.white : const Color(0xFF451A03),
                                  onPressed: () => Navigator.of(context).pop(),
                                ),
                              Text(
                                'profile'.tr(lang),
                                style: TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w900,
                                  color: isDark ? Colors.white : const Color(0xFF451A03),
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
                                color: isDark ? Colors.white : const Color(0xFF451A03),
                              ),
                            ),
                            tooltip: 'edit_profile'.tr(lang),
                            onPressed: () => context.push('/edit-profile'),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Avatar & Owner Details Overlay
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
                                    child: CircularProgressIndicator(color: Color(0xFFD97706), strokeWidth: 3),
                                  ),
                                )
                              else
                                Positioned(
                                  bottom: 0,
                                  right: 0,
                                  child: Container(
                                    padding: const EdgeInsets.all(6),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFB45309),
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
                                    color: Color(0xFFD97706),
                                    size: 18,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),

                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFEF3C7),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  'equipment_owner'.tr(lang),
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFFD97706),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 6),

                              if (userPhone != null)
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 2),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.phone_outlined, size: 13, color: Color(0xFFD97706)),
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

                              if (userLocation != null)
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 2),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.location_on_outlined, size: 13, color: Color(0xFFD97706)),
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

                              Row(
                                children: [
                                  const Icon(Icons.language_rounded, size: 13, color: Color(0xFFD97706)),
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
                        color: const Color(0xFFD97706).withValues(alpha: isDark ? 0.08 : 0.05),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      _buildMetricColumn(
                        context: context,
                        icon: Icons.agriculture_rounded,
                        iconColor: const Color(0xFFD97706),
                        value: '$equipmentCount',
                        label: 'equipments'.tr(lang),
                        isDark: isDark,
                        onTap: () => context.push('/add-equipment'),
                      ),
                      _buildMetricDivider(isDark),
                      _buildMetricColumn(
                        context: context,
                        icon: Icons.calendar_month_rounded,
                        iconColor: const Color(0xFF2563EB),
                        value: '$bookingCount',
                        label: 'total_bookings'.tr(lang),
                        isDark: isDark,
                        onTap: () => widget.onNavigateTab?.call(2),
                      ),
                      _buildMetricDivider(isDark),
                      _buildMetricColumn(
                        context: context,
                        icon: Icons.currency_rupee_rounded,
                        iconColor: const Color(0xFF16A34A),
                        value: monthlyRevenue,
                        label: 'this_month'.tr(lang),
                        isDark: isDark,
                        onTap: () => context.push('/payments-received'),
                      ),
                      _buildMetricDivider(isDark),
                      _buildMetricColumn(
                        context: context,
                        icon: Icons.star_rounded,
                        iconColor: const Color(0xFFEAB308),
                        value: ratingStr,
                        label: 'rating'.tr(lang),
                        isDark: isDark,
                        onTap: () => context.push('/feedback'),
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
                          iconColor: const Color(0xFFD97706),
                          iconBg: const Color(0xFFFEF3C7),
                          title: 'personal_information'.tr(lang),
                          subtitle: 'name_contact_address'.tr(lang),
                          isDark: isDark,
                          onTap: () => context.push('/edit-profile'),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // SECTION 2: EQUIPMENT & RENTALS
                    _buildMenuGroup(
                      isDark: isDark,
                      items: [
                        _buildMenuTile(
                          icon: Icons.agriculture_rounded,
                          iconColor: const Color(0xFF16A34A),
                          iconBg: const Color(0xFFF0FDF4),
                          title: 'my_equipment'.tr(lang),
                          subtitle: 'my_equipment_subtitle'.tr(lang),
                          isDark: isDark,
                          onTap: () => widget.onNavigateTab != null ? widget.onNavigateTab!(1) : context.push('/add-equipment'),
                        ),
                        _buildMenuDivider(isDark),
                        _buildMenuTile(
                          icon: Icons.calendar_month_rounded,
                          iconColor: const Color(0xFFEA580C),
                          iconBg: const Color(0xFFFFF7ED),
                          title: 'bookings_and_requests'.tr(lang),
                          subtitle: 'bookings_requests_subtitle'.tr(lang),
                          isDark: isDark,
                          onTap: () => widget.onNavigateTab?.call(2),
                        ),
                        _buildMenuDivider(isDark),
                        _buildMenuTile(
                          icon: Icons.history_rounded,
                          iconColor: const Color(0xFF7C3AED),
                          iconBg: const Color(0xFFF5F3FF),
                          title: 'rental_history'.tr(lang).isEmpty || 'rental_history'.tr(lang) == 'rental_history'
                              ? 'Rental History'
                              : 'rental_history'.tr(lang),
                          subtitle: 'View all completed past rental records',
                          isDark: isDark,
                          onTap: () {
                            ref.read(ownerBookingFilterProvider.notifier).state = 'COMPLETED';
                            if (widget.onNavigateTab != null) {
                              widget.onNavigateTab!(2);
                            } else {
                              ref.read(ownerTabIndexProvider.notifier).state = 2;
                            }
                          },
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // SECTION 3: PAYMENTS & BUSINESS
                    _buildMenuGroup(
                      isDark: isDark,
                      items: [
                        _buildMenuTile(
                          icon: Icons.analytics_rounded,
                          iconColor: const Color(0xFF16A34A),
                          iconBg: const Color(0xFFF0FDF4),
                          title: 'analytics_performance'.tr(lang),
                          subtitle: 'performance_overview_subtitle'.tr(lang),
                          isDark: isDark,
                          onTap: () => context.push('/owner-analytics'),
                        ),
                        _buildMenuDivider(isDark),
                        _buildMenuTile(
                          icon: Icons.currency_rupee_rounded,
                          iconColor: const Color(0xFFE11D48),
                          iconBg: const Color(0xFFFFF1F2),
                          title: 'earnings_and_payouts'.tr(lang),
                          subtitle: 'earnings_payouts_subtitle'.tr(lang),
                          isDark: isDark,
                          onTap: () => context.push('/payments-received'),
                        ),
                        _buildMenuDivider(isDark),
                        _buildMenuTile(
                          icon: Icons.handyman_rounded,
                          iconColor: const Color(0xFFF97316),
                          iconBg: const Color(0xFFFFF7ED),
                          title: 'service_maintenance'.tr(lang),
                          subtitle: 'service_maintenance_subtitle'.tr(lang),
                          isDark: isDark,
                          onTap: () => _showServiceMaintenanceDialog(context, lang, isDark),
                        ),
                        _buildMenuDivider(isDark),
                        _buildMenuTile(
                          icon: Icons.star_rounded,
                          iconColor: const Color(0xFFCA8A04),
                          iconBg: const Color(0xFFFEF9C3),
                          title: 'reviews_ratings'.tr(lang),
                          subtitle: 'reviews_ratings_subtitle'.tr(lang),
                          isDark: isDark,
                          onTap: () => context.push('/feedback'),
                        ),
                        _buildMenuDivider(isDark),
                        _buildMenuTile(
                          icon: Icons.account_balance_rounded,
                          iconColor: const Color(0xFF1D4ED8),
                          iconBg: const Color(0xFFEFF6FF),
                          title: 'bank_details'.tr(lang).isEmpty || 'bank_details'.tr(lang) == 'bank_details'
                              ? 'Bank Details & Payouts'
                              : 'bank_details'.tr(lang),
                          subtitle: _savedBankMasked != null
                              ? 'Payout Account: $_savedBankMasked'
                              : ('bank_details_subtitle'.tr(lang).isEmpty || 'bank_details_subtitle'.tr(lang) == 'bank_details_subtitle'
                                  ? 'Configure direct deposit account'
                                  : 'bank_details_subtitle'.tr(lang)),
                          isDark: isDark,
                          onTap: () => _showBankDetailsDialog(context, lang, isDark),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // SECTION 4: PREFERENCES
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
      color: const Color(0xFFFEF3C7),
      child: Center(
        child: Text(
          initial,
          style: const TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.w900,
            color: Color(0xFFD97706),
          ),
        ),
      ),
    );
  }

  Widget _buildMetricColumn({
    required BuildContext context,
    required IconData icon,
    required Color iconColor,
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
              Icon(icon, color: iconColor, size: 22),
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
