import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../shared/widgets/custom_text_field.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/localization/app_localizations.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  String _selectedLanguage = 'en';
  bool _isLoading = false;

  final Map<String, String> _languages = {
    'en': 'English',
    'te': 'Telugu',
    'hi': 'Hindi',
    'ta': 'Tamil',
    'kn': 'Kannada',
  };

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    _nameController = TextEditingController(text: user?.name ?? '');
    _phoneController = TextEditingController(text: user?.phone ?? '');

    // Ensure the preferredLanguage is one of the supported ones
    final lang = (user?.preferredLanguage ?? 'en').toLowerCase();
    if (_languages.containsKey(lang)) {
      _selectedLanguage = lang;
    } else {
      _selectedLanguage = 'en';
    }
  }

  Future<void> _submit() async {
    if (_nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Name cannot be empty.', style: TextStyle(color: Colors.white)), backgroundColor: Colors.red));
      return;
    }

    setState(() => _isLoading = true);
    try {
      final data = {
        'name': _nameController.text.trim(),
        'phone': _phoneController.text.trim(),
        'preferredLanguage': _selectedLanguage,
      };

      final response = await ApiClient().dio.put(ApiConstants.me, data: data);

      if (response.data['success'] == true) {
        await ref.read(authProvider.notifier).checkAuth();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated successfully!', style: TextStyle(color: Colors.white)), backgroundColor: AppTheme.primaryGreen));
          context.pop();
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(response.data['error'] ?? 'Failed to update', style: const TextStyle(color: Colors.white)), backgroundColor: Colors.red));
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Unable to update your profile. Check your internet connection and try again.', style: TextStyle(color: Colors.white)), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentLang = ref.watch(languageProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('edit_profile'.tr(currentLang), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20)),
        centerTitle: false,
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        foregroundColor: isDark ? Colors.white : AppTheme.textDarkNavy,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
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
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'personal_information'.tr(currentLang),
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : AppTheme.textDark,
                    ),
                  ),
                  const SizedBox(height: 24),
                  CustomTextField(
                    label: '${'full_name'.tr(currentLang)} *',
                    controller: _nameController,
                  ),
                  const SizedBox(height: 16),
                  CustomTextField(
                    label: 'phone'.tr(currentLang),
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    // ignore: deprecated_member_use
                    value: _selectedLanguage,
                    dropdownColor: isDark ? AppTheme.darkCard : Colors.white,
                    style: TextStyle(
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                      fontSize: 14,
                    ),
                    decoration: InputDecoration(
                      labelText: 'preferred_language'.tr(currentLang),
                      labelStyle: TextStyle(
                        color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                      ),
                      filled: true,
                      fillColor: isDark ? const Color(0xFF1E2620) : Colors.grey.shade50,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide.none,
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide(color: isDark ? Colors.white10 : Colors.grey.shade200),
                      ),
                    ),
                    items: _languages.entries.map((e) {
                      return DropdownMenuItem<String>(
                        value: e.key,
                        child: Text(e.value, style: TextStyle(color: isDark ? Colors.white : AppTheme.textDarkNavy)),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) {
                        setState(() => _selectedLanguage = val);
                      }
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _isLoading ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryGreen,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 0,
              ),
              child: _isLoading
                  ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : Text('save_changes'.tr(currentLang), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}
