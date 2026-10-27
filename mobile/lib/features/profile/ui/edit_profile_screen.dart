import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../shared/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late String _selectedLanguage;
  bool _isLoading = false;
  bool _isUploadingPhoto = false;

  final Map<String, String> _languages = {
    'en': 'English',
    'te': 'తెలుగు (Telugu)',
    'hi': 'हिन्दी (Hindi)',
    'ta': 'தமிழ் (Tamil)',
    'kn': 'ಕನ್ನಡ (Kannada)',
  };

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    _nameController = TextEditingController(text: user?.name ?? '');
    _phoneController = TextEditingController(text: user?.phone ?? '');

    final lang = (user?.preferredLanguage ?? 'en').toLowerCase();
    if (_languages.containsKey(lang)) {
      _selectedLanguage = lang;
    } else {
      _selectedLanguage = 'en';
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _handlePhotoAction(BuildContext context, String lang, bool isDark) async {
    final user = ref.read(authProvider).user;
    final hasPhoto = user?.profileImage != null && user!.profileImage!.isNotEmpty;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E2620) : Colors.white,
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
    bool isDestructive = false,
    required bool isDark,
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
          border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                  color: isDestructive ? Colors.red : (isDark ? Colors.white : AppTheme.textDarkNavy),
                ),
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: isDark ? Colors.grey.shade500 : Colors.grey.shade400),
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

  Future<void> _submit() async {
    final currentLang = ref.read(languageProvider);
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Name cannot be empty.', style: TextStyle(color: Colors.white)),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final phoneInput = _phoneController.text.trim();
    if (phoneInput.isNotEmpty) {
      final cleanedPhone = phoneInput.replaceAll(RegExp(r'[\s\-\(\)\+]'), '');
      final isValid = RegExp(r'^[6-9]\d{9}$').hasMatch(cleanedPhone) || RegExp(r'^91[6-9]\d{9}$').hasMatch(cleanedPhone);
      if (!isValid) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('invalid_phone_number'.tr(currentLang)),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }
    }

    final userRole = (ref.read(authProvider).user?.role ?? '').toUpperCase();
    if (userRole == 'OWNER' && phoneInput.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('phone_required_for_owners'.tr(currentLang)),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final data = {
        'name': name,
        'phone': phoneInput,
        'preferredLanguage': _selectedLanguage,
      };

      final response = await ApiClient().dio.put(ApiConstants.me, data: data);

      if (response.data['success'] == true) {
        await ref.read(authProvider.notifier).checkAuth();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Profile updated successfully!', style: TextStyle(color: Colors.white)),
              backgroundColor: AppTheme.primaryGreen,
            ),
          );
          context.pop();
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(response.data['error'] ?? 'Failed to update', style: const TextStyle(color: Colors.white)),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Unable to update your profile. Check your internet connection and try again.', style: TextStyle(color: Colors.white)),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentLang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final user = ref.watch(authProvider).user;
    final userRole = (user?.role ?? 'Farmer').toUpperCase();
    final profileImage = user?.profileImage;
    final initial = (user?.name.isNotEmpty == true) ? user!.name[0].toUpperCase() : 'U';
    final userEmail = user?.email ?? 'farmer@agrorent.ai';

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0D140E) : const Color(0xFFF4F7F4),
      appBar: AppBar(
        title: Text(
          'edit_profile'.tr(currentLang),
          style: TextStyle(
            fontWeight: FontWeight.w900,
            fontSize: 20,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
        ),
        centerTitle: false,
        backgroundColor: Colors.transparent,
        foregroundColor: isDark ? Colors.white : AppTheme.textDarkNavy,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // SCENIC TOP HERO BACKDROP & CIRCULAR AVATAR (Matches Reference 2)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDark
                      ? [const Color(0xFF132A18), const Color(0xFF0E1A11)]
                      : [const Color(0xFFDCF2DE), const Color(0xFFEAF8EC)],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
                borderRadius: BorderRadius.circular(28),
                border: Border.all(
                  color: isDark ? const Color(0xFF16A34A).withValues(alpha: 0.25) : const Color(0xFFBBE5C3),
                  width: 1.2,
                ),
              ),
              child: Column(
                children: [
                  GestureDetector(
                    onTap: _isUploadingPhoto ? null : () => _handlePhotoAction(context, currentLang, isDark),
                    child: Stack(
                      children: [
                        Container(
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: const Color(0xFF16A34A), width: 3),
                          ),
                          child: CircleAvatar(
                            radius: 52,
                            backgroundColor: isDark ? const Color(0xFF1E2E20) : Colors.white,
                            backgroundImage: (profileImage != null && profileImage.isNotEmpty)
                                ? NetworkImage(profileImage)
                                : null,
                            child: (profileImage == null || profileImage.isEmpty)
                                ? Text(
                                    initial,
                                    style: const TextStyle(
                                      fontSize: 42,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF16A34A),
                                    ),
                                  )
                                : null,
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
                            bottom: 2,
                            right: 2,
                            child: Container(
                              padding: const EdgeInsets.all(7),
                              decoration: BoxDecoration(
                                color: const Color(0xFF0F172A),
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: isDark ? const Color(0xFF132A18) : Colors.white,
                                  width: 2.5,
                                ),
                              ),
                              child: const Icon(Icons.camera_alt, size: 16, color: Colors.white),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'tap_to_change_photo'.tr(currentLang),
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.grey.shade300 : const Color(0xFF166534),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // FORM FIELDS (Matches Reference 2 styling with icons & visible labels)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF162118) : Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE2EBE2),
                  width: 1.2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.03),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. NAME
                  _buildFieldLabel('full_name'.tr(currentLang), isDark),
                  const SizedBox(height: 6),
                  _buildStyledInput(
                    controller: _nameController,
                    icon: Icons.person_outline_rounded,
                    hint: 'Enter your name',
                    isDark: isDark,
                  ),
                  const SizedBox(height: 16),

                  // 2. PHONE
                  _buildFieldLabel('${'phone_number'.tr(currentLang)}${userRole == 'OWNER' ? ' *' : ''}', isDark),
                  const SizedBox(height: 6),
                  _buildStyledInput(
                    controller: _phoneController,
                    icon: Icons.phone_outlined,
                    hint: '+91 98765 43210',
                    keyboardType: TextInputType.phone,
                    isDark: isDark,
                  ),
                  const SizedBox(height: 16),

                  // 3. EMAIL (Read-only/informative)
                  _buildFieldLabel('Email', isDark),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withValues(alpha: 0.03) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.mail_outline_rounded, size: 20, color: Colors.grey.shade500),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            userEmail,
                            style: TextStyle(
                              fontSize: 14.5,
                              fontWeight: FontWeight.w600,
                              color: isDark ? Colors.grey.shade400 : Colors.grey.shade700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 4. ROLE (Read-only badge matching reference)
                  _buildFieldLabel('Role', isDark),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withValues(alpha: 0.03) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.eco_outlined, size: 20, color: Color(0xFF16A34A)),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            AppLocalizations.localizedRole(userRole, currentLang),
                            style: TextStyle(
                              fontSize: 14.5,
                              fontWeight: FontWeight.w700,
                              color: isDark ? Colors.white : AppTheme.textDarkNavy,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 5. PREFERRED LANGUAGE
                  _buildFieldLabel('preferred_language'.tr(currentLang), isDark),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    initialValue: _selectedLanguage,
                    dropdownColor: isDark ? const Color(0xFF1E2620) : Colors.white,
                    style: TextStyle(
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                      fontSize: 14.5,
                      fontWeight: FontWeight.w600,
                    ),
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.language_rounded, size: 20, color: Color(0xFF7C3AED)),
                      filled: true,
                      fillColor: isDark ? Colors.white.withValues(alpha: 0.04) : const Color(0xFFF8FAFC),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide(color: isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide(color: isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: const BorderSide(color: Color(0xFF16A34A), width: 1.5),
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    ),
                    items: _languages.entries.map((entry) {
                      return DropdownMenuItem<String>(
                        value: entry.key,
                        child: Text(entry.value),
                      );
                    }).toList(),
                    onChanged: (value) {
                      if (value != null) {
                        setState(() {
                          _selectedLanguage = value;
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 24),

                  // 6. SAVE BUTTON (Deep agricultural green matching reference)
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF166534),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                            )
                          : Text(
                              'save_changes'.tr(currentLang),
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                            ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _buildFieldLabel(String label, bool isDark) {
    return Text(
      label,
      style: TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w700,
        color: isDark ? Colors.grey.shade300 : const Color(0xFF475569),
      ),
    );
  }

  Widget _buildStyledInput({
    required TextEditingController controller,
    required IconData icon,
    required String hint,
    TextInputType keyboardType = TextInputType.text,
    required bool isDark,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      style: TextStyle(
        fontSize: 14.5,
        fontWeight: FontWeight.w600,
        color: isDark ? Colors.white : AppTheme.textDarkNavy,
      ),
      decoration: InputDecoration(
        prefixIcon: Icon(icon, size: 20, color: Colors.grey.shade500),
        hintText: hint,
        hintStyle: TextStyle(fontSize: 14, color: isDark ? Colors.grey.shade500 : Colors.grey.shade400),
        filled: true,
        fillColor: isDark ? Colors.white.withValues(alpha: 0.04) : const Color(0xFFF8FAFC),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFF16A34A), width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }
}
