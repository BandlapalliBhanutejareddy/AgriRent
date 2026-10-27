import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../shared/theme/app_theme.dart';
import '../models/farm_model.dart';
import '../providers/farm_provider.dart';

const List<String> kCanonicalStages = [
  'SOWING',
  'GERMINATION',
  'SEEDLING',
  'VEGETATIVE',
  'FLOWERING',
  'FRUITING',
  'MATURITY',
  'HARVEST'
];

const List<String> kSupportedSoilTypes = [
  'Alluvial Soil',
  'Black Soil',
  'Red Soil',
  'Laterite Soil',
  'Loamy Soil',
  'Clayey Soil',
  'Sandy Soil',
];

const List<String> kSupportedSeasons = [
  'Kharif',
  'Rabi',
  'Zaid',
  'Perennial',
];

const List<String> kSupportedAreaUnits = [
  'acres',
  'hectares',
  'guntas',
  'cents',
];

const List<String> kSuggestedCrops = [
  'Rice',
  'Wheat',
  'Cotton',
  'Maize',
  'Chilli',
  'Tomato',
  'Sugarcane',
  'Groundnut',
];

class FarmSetupScreen extends ConsumerStatefulWidget {
  final String? farmId;
  final bool isCreate;

  const FarmSetupScreen({
    super.key,
    this.farmId,
    this.isCreate = false,
  });

  @override
  ConsumerState<FarmSetupScreen> createState() => _FarmSetupScreenState();
}

class _FarmSetupScreenState extends ConsumerState<FarmSetupScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isSubmitting = false;
  String? _existingFarmId;
  String? _errorMessage;

  final TextEditingController _farmNameController = TextEditingController();
  final TextEditingController _locationController = TextEditingController();
  final TextEditingController _areaController = TextEditingController();
  final TextEditingController _cropController = TextEditingController();
  final TextEditingController _budgetController = TextEditingController();

  String _areaUnit = 'acres';
  String _soilType = 'Alluvial Soil';
  String _season = 'Kharif';
  String _currentStage = 'SOWING';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeForm();
    });
  }

  void _initializeForm() {
    if (widget.isCreate) {
      // Clean creation mode: Leave fields empty for farmer input
      _existingFarmId = null;
      return;
    }

    final farmState = ref.read(farmProvider);
    FarmModel? farmToEdit;

    if (widget.farmId != null && widget.farmId!.isNotEmpty) {
      farmToEdit = farmState.farms.where((f) => f.id == widget.farmId).firstOrNull;
    } else if (farmState.farms.isNotEmpty) {
      farmToEdit = farmState.selectedFarm ?? farmState.farms.first;
    }

    if (farmToEdit != null) {
      final crop = farmToEdit.crops.isNotEmpty ? farmToEdit.crops.first : null;
      setState(() {
        _existingFarmId = farmToEdit!.id;
        _farmNameController.text = farmToEdit.name;
        _locationController.text = farmToEdit.location;
        _areaController.text = farmToEdit.area > 0 ? farmToEdit.area.toString() : '';
        if (kSupportedAreaUnits.contains(farmToEdit.areaUnit.toLowerCase())) {
          _areaUnit = farmToEdit.areaUnit.toLowerCase();
        }
        if (farmToEdit.soilType.isNotEmpty) {
          final matchedSoil = kSupportedSoilTypes.firstWhere(
            (s) => s.toLowerCase() == farmToEdit!.soilType.toLowerCase(),
            orElse: () => farmToEdit!.soilType,
          );
          _soilType = matchedSoil;
        }
        if (crop != null) {
          _cropController.text = crop.cropName;
          if (crop.season.isNotEmpty && kSupportedSeasons.contains(crop.season)) {
            _season = crop.season;
          }
          final st = crop.stage.toUpperCase();
          if (kCanonicalStages.contains(st)) {
            _currentStage = st;
          }
        }
      });
    }
  }

  @override
  void dispose() {
    _farmNameController.dispose();
    _locationController.dispose();
    _areaController.dispose();
    _cropController.dispose();
    _budgetController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    // 1. Double tap prevention
    if (_isSubmitting) return;

    // 2. Form field validation
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    final loc = AppLocalizations.of(context);
    final double? areaNum = double.tryParse(_areaController.text.trim());
    if (areaNum == null || areaNum <= 0) {
      setState(() {
        _isSubmitting = false;
        _errorMessage = loc.translate('enter_valid_area');
      });
      return;
    }

    double? budgetNum;
    if (_budgetController.text.trim().isNotEmpty) {
      budgetNum = double.tryParse(_budgetController.text.trim());
      if (budgetNum == null || budgetNum < 0) {
        setState(() {
          _isSubmitting = false;
          _errorMessage = loc.translate('enter_valid_budget');
        });
        return;
      }
    }

    try {
      final farmNotifier = ref.read(farmProvider.notifier);
      final isEditing = _existingFarmId != null && _existingFarmId!.isNotEmpty;

      if (isEditing) {
        await farmNotifier.updateFarm(
          farmId: _existingFarmId!,
          name: _farmNameController.text.trim(),
          location: _locationController.text.trim(),
          area: areaNum,
          areaUnit: _areaUnit,
          soilType: _soilType,
          cropName: _cropController.text.trim().isNotEmpty ? _cropController.text.trim() : null,
          season: _season,
          stage: _currentStage,
          totalBudget: budgetNum,
        );
      } else {
        await farmNotifier.createFarm(
          name: _farmNameController.text.trim(),
          location: _locationController.text.trim(),
          area: areaNum,
          areaUnit: _areaUnit,
          soilType: _soilType,
          cropName: _cropController.text.trim().isNotEmpty ? _cropController.text.trim() : null,
          season: _season,
          stage: _currentStage,
          totalBudget: budgetNum,
        );
      }

      if (mounted) {
        final successMsg = isEditing
            ? loc.translate('farm_updated_successfully')
            : loc.translate('farm_created_successfully');

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(successMsg),
            backgroundColor: AppTheme.primaryGreen,
          ),
        );

        if (context.canPop()) {
          context.pop();
        } else {
          context.go('/farm');
        }
      }
    } catch (e) {
      // 3. User input preservation on failure
      if (mounted) {
        final errorText = e.toString().replaceAll('Exception: ', '');
        setState(() {
          _errorMessage = errorText;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorText),
            backgroundColor: Colors.red.shade700,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final loc = AppLocalizations.of(context);
    final isEditing = _existingFarmId != null && _existingFarmId!.isNotEmpty;
    final screenTitle = isEditing ? loc.translate('edit_farm') : loc.translate('add_new_farm');

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          screenTitle,
          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 19),
        ),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        foregroundColor: isDark ? Colors.white : AppTheme.textDarkNavy,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/farm');
            }
          },
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 16,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Info banner / mode badge
                _buildModeBanner(isEditing, isDark, loc),
                const SizedBox(height: 18),

                if (_errorMessage != null) ...[
                  _buildErrorBanner(_errorMessage!, isDark),
                  const SizedBox(height: 16),
                ],

                // =========================================================
                // SECTION 1: FARM PROFILE (REQUIRED)
                // =========================================================
                _buildSectionCard(
                  isDark: isDark,
                  title: loc.translate('farm_details'),
                  icon: Icons.landscape_rounded,
                  children: [
                    // Farm Name
                    _buildFieldLabel(loc.translate('farm_name'), isDark, isRequired: true),
                    const SizedBox(height: 6),
                    _buildTextField(
                      controller: _farmNameController,
                      hint: 'e.g. Sunrise Farm, North Plot',
                      prefixIcon: const Icon(Icons.drive_file_rename_outline_rounded, size: 20),
                      isDark: isDark,
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) {
                          return loc.translate('enter_farm_name');
                        }
                        if (v.trim().length < 2) {
                          return loc.translate('enter_farm_name');
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Farm Location
                    _buildFieldLabel(loc.translate('farm_location'), isDark, isRequired: true),
                    const SizedBox(height: 6),
                    _buildTextField(
                      controller: _locationController,
                      hint: 'e.g. Guntur, Mandya, Warangal',
                      prefixIcon: const Icon(Icons.location_on_outlined, size: 20),
                      isDark: isDark,
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) {
                          return loc.translate('enter_farm_location');
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Area & Unit Row
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Land Area
                        Expanded(
                          flex: 3,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildFieldLabel(loc.translate('area_acres'), isDark, isRequired: true),
                              const SizedBox(height: 6),
                              _buildTextField(
                                controller: _areaController,
                                hint: 'e.g. 5.0',
                                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                prefixIcon: const Icon(Icons.aspect_ratio_rounded, size: 20),
                                isDark: isDark,
                                validator: (v) {
                                  if (v == null || v.trim().isEmpty) {
                                    return loc.translate('enter_valid_area');
                                  }
                                  final num = double.tryParse(v.trim());
                                  if (num == null || num <= 0) {
                                    return loc.translate('enter_valid_area');
                                  }
                                  return null;
                                },
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        // Area Unit Dropdown
                        Expanded(
                          flex: 2,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildFieldLabel('Unit', isDark),
                              const SizedBox(height: 6),
                              _buildDropdownContainer(
                                isDark: isDark,
                                child: DropdownButton<String>(
                                  value: _areaUnit,
                                  isExpanded: true,
                                  dropdownColor: isDark ? AppTheme.darkCard : Colors.white,
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                  ),
                                  items: kSupportedAreaUnits.map((u) {
                                    return DropdownMenuItem(
                                      value: u,
                                      child: Text(u[0].toUpperCase() + u.substring(1)),
                                    );
                                  }).toList(),
                                  onChanged: (val) {
                                    if (val != null) setState(() => _areaUnit = val);
                                  },
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Soil Type Dropdown
                    _buildFieldLabel(loc.translate('soil_type'), isDark, isRequired: true),
                    const SizedBox(height: 6),
                    _buildDropdownContainer(
                      isDark: isDark,
                      child: DropdownButton<String>(
                        value: kSupportedSoilTypes.contains(_soilType) ? _soilType : kSupportedSoilTypes.first,
                        isExpanded: true,
                        dropdownColor: isDark ? AppTheme.darkCard : Colors.white,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
                        ),
                        items: kSupportedSoilTypes.map((st) {
                          return DropdownMenuItem(
                            value: st,
                            child: Text(st),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _soilType = val);
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),

                // =========================================================
                // SECTION 2: CROP CONTEXT (RECOMMENDED)
                // =========================================================
                _buildSectionCard(
                  isDark: isDark,
                  title: loc.translate('crop_name'),
                  icon: Icons.eco_rounded,
                  children: [
                    // Crop Name Input
                    _buildFieldLabel(loc.translate('crop_name'), isDark),
                    const SizedBox(height: 6),
                    _buildTextField(
                      controller: _cropController,
                      hint: 'e.g. Rice, Cotton, Maize, Chilli',
                      prefixIcon: const Icon(Icons.grass_rounded, size: 20),
                      isDark: isDark,
                    ),
                    const SizedBox(height: 10),

                    // Quick suggestion chips
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: kSuggestedCrops.map((c) {
                        final isSelected = _cropController.text.trim().toLowerCase() == c.toLowerCase();
                        return ChoiceChip(
                          label: Text(c, style: TextStyle(fontSize: 12, fontWeight: isSelected ? FontWeight.bold : FontWeight.w500)),
                          selected: isSelected,
                          selectedColor: AppTheme.primaryGreen.withValues(alpha: 0.2),
                          backgroundColor: isDark ? Colors.white10 : Colors.grey.shade100,
                          side: BorderSide(
                            color: isSelected ? AppTheme.primaryGreen : (isDark ? Colors.white12 : Colors.grey.shade300),
                          ),
                          onSelected: (selected) {
                            setState(() {
                              _cropController.text = selected ? c : '';
                            });
                          },
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 16),

                    // Season & Lifecycle Stage Row
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Season
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildFieldLabel(loc.translate('season'), isDark),
                              const SizedBox(height: 6),
                              _buildDropdownContainer(
                                isDark: isDark,
                                child: DropdownButton<String>(
                                  value: _season,
                                  isExpanded: true,
                                  dropdownColor: isDark ? AppTheme.darkCard : Colors.white,
                                  style: TextStyle(
                                    fontSize: 13.5,
                                    fontWeight: FontWeight.w700,
                                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                  ),
                                  items: kSupportedSeasons.map((s) {
                                    return DropdownMenuItem(
                                      value: s,
                                      child: Text(s),
                                    );
                                  }).toList(),
                                  onChanged: (val) {
                                    if (val != null) setState(() => _season = val);
                                  },
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        // Current Stage
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildFieldLabel(loc.translate('crop_stage'), isDark),
                              const SizedBox(height: 6),
                              _buildDropdownContainer(
                                isDark: isDark,
                                child: DropdownButton<String>(
                                  value: _currentStage,
                                  isExpanded: true,
                                  dropdownColor: isDark ? AppTheme.darkCard : Colors.white,
                                  style: TextStyle(
                                    fontSize: 13.5,
                                    fontWeight: FontWeight.w700,
                                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                  ),
                                  items: kCanonicalStages.map((st) {
                                    return DropdownMenuItem(
                                      value: st,
                                      child: Text(
                                        st[0] + st.substring(1).toLowerCase().replaceAll('_', ' '),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    );
                                  }).toList(),
                                  onChanged: (val) {
                                    if (val != null) setState(() => _currentStage = val);
                                  },
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 18),

                // =========================================================
                // SECTION 3: FARM BUDGET (OPTIONAL)
                // =========================================================
                _buildSectionCard(
                  isDark: isDark,
                  title: loc.translate('farm_finance'),
                  icon: Icons.account_balance_wallet_rounded,
                  children: [
                    _buildFieldLabel('${loc.translate('budget')} (₹) - ${loc.translate('optional_helper')}', isDark),
                    const SizedBox(height: 6),
                    _buildTextField(
                      controller: _budgetController,
                      hint: 'e.g. 50000',
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      prefixIcon: const Icon(Icons.currency_rupee_rounded, size: 20),
                      isDark: isDark,
                      validator: (v) {
                        if (v != null && v.trim().isNotEmpty) {
                          final num = double.tryParse(v.trim());
                          if (num == null || num < 0) {
                            return loc.translate('enter_valid_budget');
                          }
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Planned budget helps Farm Copilot recommend cost-optimized operations and equipment rentals.',
                      style: TextStyle(
                        fontSize: 11.5,
                        color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 28),

                // =========================================================
                // SUBMIT BUTTON (WITH DUPLICATE SUBMIT GUARD)
                // =========================================================
                SizedBox(
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _isSubmitting ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryGreen,
                      foregroundColor: Colors.white,
                      elevation: 2,
                      disabledBackgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: _isSubmitting
                        ? Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                              ),
                              const SizedBox(width: 12),
                              Text(
                                loc.translate('saving_farm'),
                                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                              ),
                            ],
                          )
                        : Text(
                            isEditing ? loc.translate('edit_farm') : loc.translate('set_up_farm'),
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                          ),
                  ),
                ),
                const SizedBox(height: 14),

                // Cancel button
                Center(
                  child: TextButton(
                    onPressed: _isSubmitting
                        ? null
                        : () {
                            if (context.canPop()) {
                              context.pop();
                            } else {
                              context.go('/farm');
                            }
                          },
                    child: Text(
                      loc.translate('cancel'),
                      style: TextStyle(
                        color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildModeBanner(bool isEditing, bool isDark, AppLocalizations loc) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isEditing
            ? (isDark ? const Color(0xFF1E3A8A).withValues(alpha: 0.3) : const Color(0xFFEFF6FF))
            : (isDark ? const Color(0xFF14532D).withValues(alpha: 0.3) : const Color(0xFFF0FDF4)),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isEditing
              ? (isDark ? Colors.blue.shade800 : Colors.blue.shade200)
              : (isDark ? Colors.green.shade800 : Colors.green.shade200),
        ),
      ),
      child: Row(
        children: [
          Icon(
            isEditing ? Icons.edit_note_rounded : Icons.add_location_alt_rounded,
            color: isEditing ? Colors.blue.shade600 : AppTheme.primaryGreen,
            size: 24,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              isEditing
                  ? 'Updating registered field. Unchanged fields preserve current configuration.'
                  : 'Register a new field. Authoritative digital twin and operations schedule will initialize.',
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorBanner(String message, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? Colors.red.shade900.withValues(alpha: 0.3) : Colors.red.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.red.shade300),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded, color: Colors.red, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                fontSize: 12.5,
                color: isDark ? Colors.red.shade200 : Colors.red.shade800,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionCard({
    required bool isDark,
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
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
          Row(
            children: [
              Icon(icon, color: AppTheme.primaryGreen, size: 20),
              const SizedBox(width: 8),
              Text(
                title,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          ...children,
        ],
      ),
    );
  }

  Widget _buildFieldLabel(String label, bool isDark, {bool isRequired = false}) {
    return Row(
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.grey.shade300 : AppTheme.textDarkNavy,
          ),
        ),
        if (isRequired)
          const Text(
            ' *',
            style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 13),
          ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required bool isDark,
    TextInputType? keyboardType,
    Widget? prefixIcon,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      validator: validator,
      style: TextStyle(color: isDark ? Colors.white : AppTheme.textDarkNavy, fontSize: 14.5),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: isDark ? Colors.grey.shade600 : Colors.grey.shade400, fontSize: 13.5),
        filled: true,
        fillColor: isDark ? const Color(0xFF1E293B) : Colors.grey.shade50,
        prefixIcon: prefixIcon,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: isDark ? Colors.white12 : Colors.grey.shade300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: isDark ? Colors.white12 : Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.primaryGreen, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.red, width: 1.2),
        ),
      ),
    );
  }

  Widget _buildDropdownContainer({
    required bool isDark,
    required Widget child,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isDark ? Colors.white12 : Colors.grey.shade300),
      ),
      child: DropdownButtonHideUnderline(child: child),
    );
  }
}
