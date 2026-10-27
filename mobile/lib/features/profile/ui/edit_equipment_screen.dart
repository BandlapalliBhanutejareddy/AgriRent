import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/api/api_client.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../models/equipment.dart';
import '../../../shared/theme/app_theme.dart';
import '../providers/owner_provider.dart';

class EditEquipmentScreen extends ConsumerStatefulWidget {
  final Equipment? equipment;
  final String? equipmentId;

  const EditEquipmentScreen({
    super.key,
    this.equipment,
    this.equipmentId,
  });

  @override
  ConsumerState<EditEquipmentScreen> createState() => _EditEquipmentScreenState();
}

class _EditEquipmentScreenState extends ConsumerState<EditEquipmentScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _descriptionController;
  late TextEditingController _priceController;
  late TextEditingController _locationController;
  late String _selectedCategory;
  late bool _available;
  String _existingImageUrl = '';
  File? _newSelectedImageFile;
  bool _isSaving = false;
  bool _isDeleting = false;
  Equipment? _currentEquipment;
  bool _notFound = false;

  final List<String> _categories = [
    'TRACTORS_AND_POWER_UNITS',
    'LAND_PREPARATION',
    'SEEDING_AND_PLANTING',
    'CROP_CARE_AND_INTERCULTURE',
    'IRRIGATION_EQUIPMENT',
    'HARVESTING_EQUIPMENT',
    'THRESHING_AND_POST_HARVEST',
    'MATERIAL_HANDLING_AND_TRANSPORT',
    'SOIL_TESTING_AND_TOOLS',
    'CROP_PROCESSING',
    'STORAGE_EQUIPMENT',
    'HAND_TOOLS',
    'SPECIALIZED_CROP_EQUIPMENT',
    'SAFETY_AND_ACCESSORIES',
    'TRACTOR',
    'HARVESTER',
    'SEEDER',
    'PLOUGH',
    'CULTIVATOR',
    'SPRAYER',
    'OTHER',
  ];

  @override
  void initState() {
    super.initState();
    _initEquipment();
  }

  void _initEquipment() {
    if (widget.equipment != null) {
      _currentEquipment = widget.equipment;
    } else if (widget.equipmentId != null && widget.equipmentId!.isNotEmpty) {
      final myEq = ref.read(ownerProvider).myEquipment;
      try {
        _currentEquipment = myEq.firstWhere((e) => e.id == widget.equipmentId);
      } catch (_) {
        _currentEquipment = null;
      }
    }

    if (_currentEquipment != null) {
      _titleController = TextEditingController(text: _currentEquipment!.title);
      _descriptionController = TextEditingController(text: _currentEquipment!.description);
      _priceController = TextEditingController(
        text: _currentEquipment!.pricePerDay != null
            ? _currentEquipment!.pricePerDay!.toStringAsFixed(0)
            : '',
      );
      _locationController = TextEditingController(text: _currentEquipment!.location ?? '');
      _existingImageUrl = _currentEquipment!.imageUrl;
      _selectedCategory = _currentEquipment!.category.toUpperCase();
      if (!_categories.contains(_selectedCategory)) {
        _categories.add(_selectedCategory);
      }
      _available = _currentEquipment!.available;
      _notFound = false;
    } else {
      _titleController = TextEditingController();
      _descriptionController = TextEditingController();
      _priceController = TextEditingController();
      _locationController = TextEditingController();
      _selectedCategory = 'TRACTOR';
      _available = true;
      _notFound = true;
    }
  }

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
          _newSelectedImageFile = file;
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
    if (_isSaving || _isDeleting || _currentEquipment == null) return;
    if (ref.read(ownerProvider).isEquipmentActionPending(_currentEquipment!.id)) return;

    final lang = ref.read(languageProvider);
    if (!_formKey.currentState!.validate()) return;

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

    setState(() => _isSaving = true);

    String finalImageUrl = _existingImageUrl;

    // 1. Upload new image if selected (preserve existing if upload fails)
    if (_newSelectedImageFile != null) {
      try {
        final fileName = _newSelectedImageFile!.path.split(Platform.pathSeparator).last;
        final formData = FormData.fromMap({
          'image': await MultipartFile.fromFile(
            _newSelectedImageFile!.path,
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
          finalImageUrl = resData['url'] ?? resData['data']?['url'] ?? _existingImageUrl;
        }
      } catch (uploadError) {
        if (mounted) {
          setState(() => _isSaving = false);
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

    // 2. Update Equipment in DB - only send editable fields per API schema
    final data = {
      'title': _titleController.text.trim(),
      'description': _descriptionController.text.trim(),
      'pricePerDay': price,
      'category': _selectedCategory,
      'location': _locationController.text.trim(),
      'imageUrl': finalImageUrl,
      'available': _available,
    };

    final success = await ref
        .read(ownerProvider.notifier)
        .updateEquipment(_currentEquipment!.id, data);
    if (!mounted) return;
    setState(() => _isSaving = false);

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'equipment_updated_success'.tr(lang),
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          backgroundColor: AppTheme.primaryGreen,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      Navigator.pop(context);
    } else {
      final err = ref.read(ownerProvider).error;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            err ?? 'failed_to_update_equipment'.tr(lang),
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          backgroundColor: const Color(0xFFC62828),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _delete() async {
    if (_isSaving || _isDeleting || _currentEquipment == null) return;
    if (ref.read(ownerProvider).isEquipmentActionPending(_currentEquipment!.id)) return;

    final lang = ref.read(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Row(
          children: [
            const Icon(Icons.warning_amber_rounded, color: Color(0xFFD32F2F), size: 24),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'delete_equipment'.tr(lang),
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
              ),
            ),
          ],
        ),
        content: Text(
          'delete_equipment_confirm'.tr(lang),
          style: TextStyle(
            fontSize: 13.5,
            color: isDark ? Colors.white70 : AppTheme.textMutedGray,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(
              'cancel'.tr(lang),
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white60 : AppTheme.textMutedGray,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFD32F2F),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text(
              'delete'.tr(lang),
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      setState(() => _isDeleting = true);
      final success = await ref
          .read(ownerProvider.notifier)
          .deleteEquipment(_currentEquipment!.id);
      if (!mounted) return;
      setState(() => _isDeleting = false);

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'equipment_deleted_success'.tr(lang),
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            backgroundColor: AppTheme.primaryGreen,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
        Navigator.pop(context);
      } else {
        final err = ref.read(ownerProvider).error;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              err ?? 'failed_to_delete_equipment'.tr(lang),
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            backgroundColor: const Color(0xFFC62828),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_notFound || _currentEquipment == null) {
      return Scaffold(
        backgroundColor: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
        appBar: AppBar(
          title: Text(
            'edit_equipment'.tr(lang),
            style: TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 18,
              color: isDark ? Colors.white : AppTheme.textDarkNavy,
            ),
          ),
          backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: Icon(
              Icons.arrow_back_ios_new_rounded,
              size: 20,
              color: isDark ? Colors.white : AppTheme.textDarkNavy,
            ),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.search_off_rounded,
                  size: 64,
                  color: isDark ? Colors.white38 : AppTheme.textMutedGray,
                ),
                const SizedBox(height: 16),
                Text(
                  'equipment_not_found'.tr(lang),
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryGreen,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text('return_to_fleet'.tr(lang)),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
      appBar: AppBar(
        title: Text(
          'edit_equipment'.tr(lang),
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
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline_rounded, color: Color(0xFFD32F2F)),
            onPressed: (_isSaving || _isDeleting) ? null : _delete,
            tooltip: 'delete_equipment'.tr(lang),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
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

                    // Title
                    _buildTextField(
                      controller: _titleController,
                      label: '${'title'.tr(lang)} *',
                      hint: 'e.g. John Deere 5050D 4WD',
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
                        fillColor: isDark
                            ? AppTheme.darkBackground
                            : const Color(0xFFF7F9F8),
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
                        contentPadding:
                            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      ),
                      items: _categories
                          .map((c) => DropdownMenuItem(
                                value: c,
                                child: Text(AppLocalizations.localizedEquipmentCategory(c, lang)),
                              ))
                          .toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedCategory = val);
                      },
                    ),
                    const SizedBox(height: 16),

                    // Price
                    _buildTextField(
                      controller: _priceController,
                      label: '${'rental_rate'.tr(lang)} (₹/${'day'.tr(lang)}) *',
                      hint: 'e.g. 2500',
                      isDark: isDark,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
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

                    // Location
                    _buildTextField(
                      controller: _locationController,
                      label: 'location'.tr(lang),
                      hint: 'e.g. Guntur, Andhra Pradesh',
                      isDark: isDark,
                    ),
                    const SizedBox(height: 16),

                    // Real Photo Picker Section
                    _buildPhotoPickerSection(lang, isDark),
                    const SizedBox(height: 16),

                    // Availability Switch
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: isDark ? AppTheme.darkBackground : const Color(0xFFF7F9F8),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isDark ? Colors.white10 : const Color(0xFFE0E0E0),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'status'.tr(lang),
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                ),
                              ),
                              Text(
                                _available ? 'active_listing'.tr(lang) : 'hidden_listing'.tr(lang),
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: _available ? AppTheme.primaryGreen : Colors.red.shade400,
                                ),
                              ),
                            ],
                          ),
                          Switch(
                            value: _available,
                            activeTrackColor: AppTheme.primaryGreen,
                            onChanged: (_isSaving || _isDeleting)
                                ? null
                                : (val) => setState(() => _available = val),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Description
                    _buildTextField(
                      controller: _descriptionController,
                      label: 'description'.tr(lang),
                      hint: 'Provide details about power, attachments, condition...',
                      isDark: isDark,
                      maxLines: 3,
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

              const SizedBox(height: 24),

              // Save Button
              ElevatedButton(
                onPressed: (_isSaving || _isDeleting) ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryGreen,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.6),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 0,
                ),
                child: _isSaving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2.2,
                        ),
                      )
                    : Text(
                        'save_equipment'.tr(lang),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPhotoPickerSection(String lang, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'add_equipment_photo'.tr(lang),
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
          ),
        ),
        const SizedBox(height: 8),
        if (_newSelectedImageFile != null)
          _buildPreviewContainer(
            Image.file(
              _newSelectedImageFile!,
              height: 180,
              width: double.infinity,
              fit: BoxFit.cover,
            ),
            lang,
            isDark,
            onRemove: () => setState(() => _newSelectedImageFile = null),
          )
        else if (_existingImageUrl.isNotEmpty)
          _buildPreviewContainer(
            Image.network(
              _existingImageUrl,
              height: 180,
              width: double.infinity,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => Container(
                height: 180,
                color: Colors.grey.shade300,
                child: const Icon(Icons.broken_image, size: 40, color: Colors.grey),
              ),
            ),
            lang,
            isDark,
            onRemove: () => setState(() => _existingImageUrl = ''),
          )
        else
          InkWell(
            onTap: () => _showImageSourceDialog(lang, isDark),
            borderRadius: BorderRadius.circular(16),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkBackground : const Color(0xFFF7F9F8),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? Colors.white12 : Colors.grey.shade300,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.add_a_photo_outlined,
                      color: AppTheme.primaryGreen,
                      size: 26,
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

  Widget _buildPreviewContainer(
    Widget imageWidget,
    String lang,
    bool isDark, {
    required VoidCallback onRemove,
  }) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white24 : AppTheme.primaryGreen.withValues(alpha: 0.3),
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(15),
        child: Stack(
          alignment: Alignment.topRight,
          children: [
            imageWidget,
            Container(
              margin: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    icon: const Icon(Icons.edit_rounded, color: Colors.white, size: 18),
                    onPressed: () => _showImageSourceDialog(lang, isDark),
                    tooltip: 'change_photo'.tr(lang),
                    constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                    padding: EdgeInsets.zero,
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: Colors.white, size: 18),
                    onPressed: onRemove,
                    tooltip: 'remove_photo'.tr(lang),
                    constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                    padding: EdgeInsets.zero,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
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
