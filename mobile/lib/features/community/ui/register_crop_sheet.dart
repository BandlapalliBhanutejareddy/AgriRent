import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../shared/theme/app_theme.dart';
import '../providers/community_provider.dart';

class RegisterCropSheet extends ConsumerStatefulWidget {
  const RegisterCropSheet({super.key});

  @override
  ConsumerState<RegisterCropSheet> createState() => _RegisterCropSheetState();
}

class _RegisterCropSheetState extends ConsumerState<RegisterCropSheet> {
  final _formKey = GlobalKey<FormState>();

  String _currentCrop = 'Rice';
  String _currentStage = 'SOWING';
  String _currentSeason = 'Kharif';
  String _farmLocation = 'Guntur, Andhra Pradesh';
  double _area = 5.0;

  bool _includeNextCrop = false;
  String _nextCrop = 'Cotton';
  String _nextSeason = 'Rabi';

  bool _isSaving = false;
  String? _errorMessage;

  final List<String> _crops = [
    'Rice',
    'Cotton',
    'Chilli',
    'Maize',
    'Wheat',
    'Tomato',
    'Groundnut',
    'Sugarcane',
    'Turmeric',
    'Soybean'
  ];

  final List<String> _stages = [
    'SOWING',
    'GERMINATION',
    'SEEDLING',
    'VEGETATIVE',
    'FLOWERING',
    'FRUITING',
    'MATURITY',
    'HARVEST'
  ];

  final List<String> _seasons = ['Kharif', 'Rabi', 'Zaid', 'Perennial'];

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    try {
      final service = ref.read(communityServiceProvider);
      final data = await service.fetchMyCrops();
      if (mounted) {
        final current = data['currentCrop'] as Map<String, dynamic>?;
        final next = data['nextCrop'] as Map<String, dynamic>?;
        final farm = data['farm'] as Map<String, dynamic>?;

        setState(() {
          if (current != null) {
            _currentCrop = current['cropName']?.toString() ?? 'Rice';
            _currentStage = current['stage']?.toString() ?? 'SOWING';
            _currentSeason = current['season']?.toString() ?? 'Kharif';
          }
          if (farm != null) {
            _farmLocation = farm['location']?.toString() ?? _farmLocation;
            _area = double.tryParse(farm['area']?.toString() ?? '') ?? 5.0;
          }
          if (next != null) {
            _includeNextCrop = true;
            _nextCrop = next['cropName']?.toString() ?? 'Cotton';
            _nextSeason = next['season']?.toString() ?? 'Rabi';
          }
        });
      }
    } catch (_) {}
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();

    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });

    final currentCropData = {
      'cropName': _currentCrop,
      'stage': _currentStage,
      'season': _currentSeason,
      'farmLocation': _farmLocation,
      'area': _area,
    };

    final nextCropData = _includeNextCrop
        ? {
            'cropName': _nextCrop,
            'season': _nextSeason,
          }
        : null;

    final success = await ref.read(communityProvider.notifier).saveMyCrops(
          currentCrop: currentCropData,
          nextCrop: nextCropData,
        );

    if (mounted) {
      setState(() => _isSaving = false);
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Crop registration updated successfully!'),
            backgroundColor: AppTheme.primaryGreen,
          ),
        );
        Navigator.of(context).pop(true);
      } else {
        setState(() {
          _errorMessage = 'Failed to save crop registration. Please check inputs.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.88,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header Handle & Title
              Center(
                child: Container(
                  width: 48,
                  height: 5,
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white24 : Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.grass_rounded, color: AppTheme.primaryGreen, size: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'register_my_crops'.tr(lang),
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white : AppTheme.textDarkNavy,
                          ),
                        ),
                        Text(
                          'register_my_crops_desc'.tr(lang),
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Text(
                    _errorMessage!,
                    style: TextStyle(color: Colors.red.shade800, fontSize: 13),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Section 1: Current Cultivated Crop
              Text(
                'current_cultivated_crop'.tr(lang).toUpperCase(),
                style: const TextStyle(
                  fontSize: 12,
                  letterSpacing: 1.0,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.primaryGreen,
                ),
              ),
              const SizedBox(height: 12),

              // Crop Dropdown
              DropdownButtonFormField<String>(
                initialValue: _crops.contains(_currentCrop) ? _currentCrop : _crops.first,
                decoration: InputDecoration(
                  labelText: 'Crop Name',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  prefixIcon: const Icon(Icons.eco_rounded, color: AppTheme.primaryGreen),
                ),
                items: _crops.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _currentCrop = val);
                },
              ),
              const SizedBox(height: 14),

              // Stage Dropdown
              DropdownButtonFormField<String>(
                initialValue: _stages.contains(_currentStage) ? _currentStage : _stages.first,
                decoration: InputDecoration(
                  labelText: 'Current Growth Stage',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  prefixIcon: const Icon(Icons.timeline_rounded, color: AppTheme.primaryGreen),
                ),
                items: _stages.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _currentStage = val);
                },
              ),
              const SizedBox(height: 14),

              // Season Dropdown
              DropdownButtonFormField<String>(
                initialValue: _seasons.contains(_currentSeason) ? _currentSeason : _seasons.first,
                decoration: InputDecoration(
                  labelText: 'Current Season',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  prefixIcon: const Icon(Icons.wb_sunny_outlined, color: AppTheme.primaryGreen),
                ),
                items: _seasons.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _currentSeason = val);
                },
              ),
              const SizedBox(height: 14),

              // Farm Location & Area
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: TextFormField(
                      initialValue: _farmLocation,
                      decoration: InputDecoration(
                        labelText: 'Village / District',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        prefixIcon: const Icon(Icons.location_on_outlined, size: 20),
                      ),
                      validator: (val) => val == null || val.trim().isEmpty ? 'Required' : null,
                      onSaved: (val) => _farmLocation = val!.trim(),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 1,
                    child: TextFormField(
                      initialValue: _area.toString(),
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(
                        labelText: 'Area (acres)',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      validator: (val) => double.tryParse(val ?? '') == null ? 'Invalid' : null,
                      onSaved: (val) => _area = double.tryParse(val ?? '5.0') ?? 5.0,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              const Divider(),
              const SizedBox(height: 8),

              // Section 2: Next Planned Crop Toggle
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                activeThumbColor: AppTheme.primaryGreen,
                title: const Text(
                  'Register Next Planned Crop',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                ),
                subtitle: const Text(
                  'Plan equipment and community demand for your next cycle',
                  style: TextStyle(fontSize: 12),
                ),
                value: _includeNextCrop,
                onChanged: (val) => setState(() => _includeNextCrop = val),
              ),

              if (_includeNextCrop) ...[
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: _crops.contains(_nextCrop) ? _nextCrop : _crops[1],
                  decoration: InputDecoration(
                    labelText: 'Next Planned Crop',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    prefixIcon: const Icon(Icons.spa_outlined, color: Colors.orange),
                  ),
                  items: _crops.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _nextCrop = val);
                  },
                ),
                const SizedBox(height: 14),
                DropdownButtonFormField<String>(
                  initialValue: _seasons.contains(_nextSeason) ? _nextSeason : _seasons[1],
                  decoration: InputDecoration(
                    labelText: 'Planned Sowing Season',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    prefixIcon: const Icon(Icons.calendar_month_outlined, color: Colors.orange),
                  ),
                  items: _seasons.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _nextSeason = val);
                  },
                ),
              ],

              const SizedBox(height: 24),

              // Save Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _handleSave,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryGreen,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: _isSaving
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                        )
                      : Text(
                          '${'save'.tr(lang)} & Update',
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                        ),
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }
}
