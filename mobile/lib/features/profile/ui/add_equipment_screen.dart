import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/api/api_client.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../core/constants/agricultural_catalog.dart';
import '../../../shared/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/owner_provider.dart';
import 'owner_bank_details_dialog.dart';

class AddEquipmentScreen extends ConsumerStatefulWidget {
  const AddEquipmentScreen({super.key});

  @override
  ConsumerState<AddEquipmentScreen> createState() => _AddEquipmentScreenState();
}

class _AddEquipmentScreenState extends ConsumerState<AddEquipmentScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();
  final _locationController = TextEditingController();
  String _selectedCategory = 'TRACTORS_AND_POWER_UNITS';
  EquipmentCatalogItem? _selectedCatalogItem;
  String? _catalogImageUrl;
  File? _selectedImageFile;
  bool _isSubmitting = false;

  final List<EquipmentCategoryDefinition> _categories = AgriculturalCatalog.categories;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );
      if (pickedFile != null) {
        final file = File(pickedFile.path);
        final fileBytes = await file.length();
        if (fileBytes > 5 * 1024 * 1024) {
          if (mounted) {
            final lang = ref.read(languageProvider);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('image_size_exceeded'.tr(lang)),
                backgroundColor: const Color(0xFFC62828),
                behavior: SnackBarBehavior.floating,
              ),
            );
          }
          return;
        }
        setState(() {
          _selectedImageFile = file;
        });
      }
    } catch (e) {
      if (mounted) {
        final lang = ref.read(languageProvider);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${'failed_to_upload_image'.tr(lang)}: $e'),
            backgroundColor: const Color(0xFFC62828),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  void _showImageSourceDialog(String lang, bool isDark) {
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'add_equipment_photo'.tr(lang),
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: const CircleAvatar(
                  backgroundColor: Color(0xFFE8F5E9),
                  child: Icon(Icons.photo_library_rounded, color: AppTheme.primaryGreen),
                ),
                title: Text(
                  'choose_from_gallery'.tr(lang),
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  ),
                ),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImage(ImageSource.gallery);
                },
              ),
              ListTile(
                leading: const CircleAvatar(
                  backgroundColor: Color(0xFFE8F5E9),
                  child: Icon(Icons.camera_alt_rounded, color: AppTheme.primaryGreen),
                ),
                title: Text(
                  'take_photo'.tr(lang),
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  ),
                ),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImage(ImageSource.camera);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (_isSubmitting) return;
    final lang = ref.read(languageProvider);
    if (!_formKey.currentState!.validate()) {
      return;
    }

    // Enforce Owner Phone Number Requirement
    final authUser = ref.read(authProvider).user;
    final ownerPhone = authUser?.phone?.trim() ?? '';
    final cleanedOwnerPhone = ownerPhone.replaceAll(RegExp(r'[\s\-\(\)\+]'), '');
    final isValidOwnerPhone = RegExp(r'^[6-9]\d{9}$').hasMatch(cleanedOwnerPhone) || RegExp(r'^91[6-9]\d{9}$').hasMatch(cleanedOwnerPhone);

    if (!isValidOwnerPhone) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('phone_required_for_listing'.tr(lang)),
          backgroundColor: const Color(0xFFC62828),
          behavior: SnackBarBehavior.floating,
          action: SnackBarAction(
            label: 'update_phone'.tr(lang),
            textColor: Colors.white,
            onPressed: () => context.push('/edit-profile'),
          ),
        ),
      );
      return;
    }

    // Enforce Owner Bank Details Requirement before listing equipment for rent
    try {
      final bankRes = await ApiClient().dio.get('owner/bank-details');
      final bankData = bankRes.data?['data'];
      final hasBankDetails = bankRes.statusCode == 200 &&
          bankData != null &&
          (bankData['maskedAccountNumber'] != null && bankData['maskedAccountNumber'].toString().isNotEmpty);

      if (!hasBankDetails) {
        if (!mounted) return;
        final shouldAdd = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.account_balance_wallet_rounded, color: AppTheme.primaryGreen),
                SizedBox(width: 10),
                Expanded(child: Text('Bank Details Required', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold))),
              ],
            ),
            content: const Text(
              'To list equipment and receive rental earnings securely, you must provide and save your bank payout details first.\n\nWould you like to set up your bank details now?',
              style: TextStyle(fontSize: 14),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen),
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Add Bank Details', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        );

        if (shouldAdd == true && mounted) {
          final result = await OwnerBankDetailsDialog.show(context);
          if (result == null) {
            return;
          }
        } else {
          return;
        }
      }
    } catch (_) {
      // Backend will enforce if network check failed
    }

    if (!mounted) return;

    final price = double.tryParse(_priceController.text.trim());
    if (price == null || price <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('enter_valid_price'.tr(lang)),
          backgroundColor: const Color(0xFFC62828),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    String? uploadedImageUrl;

    // 1. If an image file was selected, upload it to Supabase Storage via backend /upload endpoint
    if (_selectedImageFile != null) {
      try {
        final fileName = _selectedImageFile!.path.split(Platform.pathSeparator).last;
        final formData = FormData.fromMap({
          'image': await MultipartFile.fromFile(
            _selectedImageFile!.path,
            filename: fileName,
          ),
          'bucket': 'equipment-images',
        });

        final uploadResponse = await ApiClient().dio.post(
          'upload',
          data: formData,
          options: Options(
            headers: {'Content-Type': 'multipart/form-data'},
          ),
        );

        final dynamic resData = uploadResponse.data;
        if (resData is Map) {
          uploadedImageUrl = resData['url'] ?? resData['data']?['url'];
        }
      } catch (uploadError) {
        if (mounted) {
          setState(() => _isSubmitting = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('${'failed_to_upload_image'.tr(lang)}: $uploadError'),
              backgroundColor: const Color(0xFFC62828),
              behavior: SnackBarBehavior.floating,
            ),
          );
          return;
        }
      }
    }

    // 2. Create Equipment in DB
    final resolvedImageUrl = uploadedImageUrl ??
        _catalogImageUrl ??
        AgriculturalCatalog.resolveImageUrl(
          category: _selectedCategory,
          title: _titleController.text.trim(),
        );

    final data = <String, dynamic>{
      'title': _titleController.text.trim(),
      'description': _descriptionController.text.trim(),
      'pricePerDay': price,
      'category': _selectedCategory.toUpperCase(),
      'location': _locationController.text.trim(),
      'imageUrl': resolvedImageUrl,
    };

    final success = await ref.read(ownerProvider.notifier).createEquipment(data);
    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'equipment_added_success'.tr(lang),
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          backgroundColor: AppTheme.primaryGreen,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      context.pop();
    } else {
      final err = ref.read(ownerProvider).error;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            err ?? 'failed_to_create_equipment'.tr(lang),
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          backgroundColor: const Color(0xFFC62828),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final authUser = ref.watch(authProvider).user;
    final ownerPhone = authUser?.phone?.trim() ?? '';
    final cleanedOwnerPhone = ownerPhone.replaceAll(RegExp(r'[\s\-\(\)\+]'), '');
    final isValidOwnerPhone = RegExp(r'^[6-9]\d{9}$').hasMatch(cleanedOwnerPhone) || RegExp(r'^91[6-9]\d{9}$').hasMatch(cleanedOwnerPhone);

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
      appBar: AppBar(
        title: Text(
          'add_equipment'.tr(lang),
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 18,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
        ),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_ios_new_rounded,
            size: 20,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (!isValidOwnerPhone)
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFFECACA)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.warning_amber_rounded, color: Color(0xFFDC2626), size: 22),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'phone_required_for_owners'.tr(lang),
                              style: const TextStyle(
                                color: Color(0xFF991B1B),
                                fontWeight: FontWeight.bold,
                                fontSize: 13.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'phone_required_for_listing'.tr(lang),
                        style: const TextStyle(color: Color(0xFF7F1D1D), fontSize: 12),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 36,
                        child: ElevatedButton.icon(
                          onPressed: () => context.push('/edit-profile'),
                          icon: const Icon(Icons.edit, size: 16),
                          label: Text('update_phone'.tr(lang), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFDC2626),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.darkCard : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'equipment_details'.tr(lang),
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : AppTheme.textDarkNavy,
                      ),
                    ),
                    const SizedBox(height: 18),

                    // Machine Title Field (min 3 chars required)
                    _buildTextField(
                      controller: _titleController,
                      label: '${'title'.tr(lang)} *',
                      hint: 'e.g. Mahindra 575 DI 45HP Tractor',
                      isDark: isDark,
                      validator: (val) {
                        if (val == null || val.trim().isEmpty) {
                          return 'fill_required_fields'.tr(lang);
                        }
                        if (val.trim().length < 3) {
                          return 'enter_valid_title'.tr(lang);
                        }
                        if (val.trim().length > 100) {
                          return 'Maximum 100 characters allowed';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Category Dropdown
                    DropdownButtonFormField<String>(
                      initialValue: _selectedCategory,
                      dropdownColor: isDark ? AppTheme.darkCard : Colors.white,
                      style: TextStyle(
                        fontSize: 14.5,
                        color: isDark ? Colors.white : AppTheme.textDarkNavy,
                      ),
                      decoration: InputDecoration(
                        labelText: '${'category'.tr(lang)} *',
                        labelStyle: TextStyle(
                          color: isDark ? Colors.white60 : AppTheme.textMutedGray,
                          fontSize: 13,
                        ),
                        filled: true,
                        fillColor: isDark ? AppTheme.darkBackground : const Color(0xFFF7F9F8),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide(
                            color: isDark ? Colors.white10 : const Color(0xFFE0E0E0),
                          ),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide(
                            color: isDark ? Colors.white10 : const Color(0xFFE0E0E0),
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(
                            color: AppTheme.primaryGreen,
                            width: 1.8,
                          ),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      ),
                      items: _categories.map((cat) {
                        return DropdownMenuItem<String>(
                          value: cat.id,
                          child: Row(
                            children: [
                              Icon(cat.icon, size: 18, color: AppTheme.primaryGreen),
                              const SizedBox(width: 10),
                              Text(
                                cat.name,
                                style: const TextStyle(fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            _selectedCategory = val;
                            _selectedCatalogItem = null;
                            _catalogImageUrl = null;
                          });
                        }
                      },
                    ),
                    const SizedBox(height: 12),

                    // Standard Catalog Quick-Fill Section
                    Text(
                      'Agricultural Catalog (Tap to Auto-fill)',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: isDark ? Colors.white70 : AppTheme.textMutedGray,
                      ),
                    ),
                    const SizedBox(height: 8),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: AgriculturalCatalog.getItemsForCategory(_selectedCategory).map((item) {
                          final isSelected = _selectedCatalogItem?.id == item.id;
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ActionChip(
                              avatar: Icon(item.icon, size: 16, color: isSelected ? Colors.white : AppTheme.primaryGreen),
                              label: Text(item.name),
                              labelStyle: TextStyle(
                                fontSize: 12,
                                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                color: isSelected ? Colors.white : (isDark ? Colors.white : AppTheme.textDarkNavy),
                              ),
                              backgroundColor: isSelected ? AppTheme.primaryGreen : (isDark ? Colors.white10 : const Color(0xFFF1F5F2)),
                              onPressed: () {
                                setState(() {
                                  _selectedCatalogItem = item;
                                  _titleController.text = item.name;
                                  _priceController.text = item.defaultPricePerDay.toStringAsFixed(0);
                                  _descriptionController.text = item.description;
                                  _catalogImageUrl = item.defaultImageUrl;
                                });
                              },
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Daily Rental Rate
                    _buildTextField(
                      controller: _priceController,
                      label: '${'rental_rate'.tr(lang)} (₹/${'day'.tr(lang)}) *',
                      hint: 'e.g. 1500',
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      isDark: isDark,
                      validator: (val) {
                        if (val == null || val.trim().isEmpty) {
                          return 'fill_required_fields'.tr(lang);
                        }
                        final num = double.tryParse(val.trim());
                        if (num == null || num <= 0) {
                          return 'enter_valid_price'.tr(lang);
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Farm Location
                    _buildTextField(
                      controller: _locationController,
                      label: 'location'.tr(lang),
                      hint: 'e.g. Guntur, Andhra Pradesh',
                      isDark: isDark,
                    ),
                    const SizedBox(height: 16),

                    // Description Field (max 1000 chars)
                    _buildTextField(
                      controller: _descriptionController,
                      label: 'description'.tr(lang),
                      hint: 'Provide details about implements, horse power, condition...',
                      maxLines: 3,
                      isDark: isDark,
                      validator: (val) {
                        if (val != null && val.trim().length > 1000) {
                          return 'Maximum 1000 characters allowed';
                        }
                        return null;
                      },
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Image Upload Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.darkCard : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'equipment_photo'.tr(lang),
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : AppTheme.textDarkNavy,
                      ),
                    ),
                    const SizedBox(height: 12),
                    _buildImagePicker(isDark, lang),
                  ],
                ),
              ),

              const SizedBox(height: 28),

              // Submit Button
              SizedBox(
                height: 52,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryGreen,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.6),
                    elevation: 2,
                    shadowColor: AppTheme.primaryGreen.withValues(alpha: 0.4),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            color: Colors.white,
                          ),
                        )
                      : Text(
                          'submit_equipment'.tr(lang),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImagePicker(bool isDark, String lang) {
    return Column(
      children: [
        if (_selectedImageFile != null)
          Stack(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Image.file(
                  _selectedImageFile!,
                  width: double.infinity,
                  height: 180,
                  fit: BoxFit.cover,
                ),
              ),
              Positioned(
                top: 8,
                right: 8,
                child: InkWell(
                  onTap: () => setState(() => _selectedImageFile = null),
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: const BoxDecoration(
                      color: Colors.black54,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.close, size: 16, color: Colors.white),
                  ),
                ),
              ),
            ],
          )
        else if (_catalogImageUrl != null && _catalogImageUrl!.isNotEmpty)
          Stack(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Image.network(
                  _catalogImageUrl!,
                  width: double.infinity,
                  height: 180,
                  fit: BoxFit.cover,
                  errorBuilder: (ctx, err, stack) => Container(
                    width: double.infinity,
                    height: 140,
                    color: isDark ? AppTheme.darkBackground : const Color(0xFFF1F5F2),
                    child: const Icon(Icons.agriculture_rounded, size: 48, color: AppTheme.primaryGreen),
                  ),
                ),
              ),
              Positioned(
                bottom: 8,
                left: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.black87,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.verified_rounded, size: 14, color: AppTheme.accentLime),
                      const SizedBox(width: 4),
                      Text(
                        'catalog_image'.tr(lang),
                        style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ),
              Positioned(
                top: 8,
                right: 8,
                child: InkWell(
                  onTap: () => _showImageSourceDialog(lang, isDark),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(
                      color: Colors.black54,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.camera_alt, size: 16, color: Colors.white),
                  ),
                ),
              ),
            ],
          )
        else
          InkWell(
            onTap: () => _showImageSourceDialog(lang, isDark),
            borderRadius: BorderRadius.circular(16),
            child: Container(
              width: double.infinity,
              height: 140,
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkBackground : const Color(0xFFF7F9F8),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? Colors.white12 : const Color(0xFFE0E0E0),
                  style: BorderStyle.solid,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.add_a_photo_outlined,
                      color: AppTheme.primaryGreen,
                      size: 28,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'add_equipment_photo'.tr(lang),
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'tap_to_select_photo'.tr(lang),
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required bool isDark,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      style: TextStyle(
        fontSize: 14.5,
        color: isDark ? Colors.white : AppTheme.textDarkNavy,
      ),
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(
          color: isDark ? Colors.white60 : AppTheme.textMutedGray,
          fontSize: 13,
        ),
        hintText: hint,
        hintStyle: TextStyle(
          color: isDark ? Colors.white24 : Colors.grey.shade400,
          fontSize: 13,
        ),
        filled: true,
        fillColor: isDark ? AppTheme.darkBackground : const Color(0xFFF7F9F8),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(
            color: isDark ? Colors.white10 : const Color(0xFFE0E0E0),
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(
            color: isDark ? Colors.white10 : const Color(0xFFE0E0E0),
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(
            color: AppTheme.primaryGreen,
            width: 1.8,
          ),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }
}
