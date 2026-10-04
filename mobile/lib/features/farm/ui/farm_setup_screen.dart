import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../shared/theme/app_theme.dart';
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

class FarmSetupScreen extends ConsumerStatefulWidget {
  const FarmSetupScreen({super.key});

  @override
  ConsumerState<FarmSetupScreen> createState() => _FarmSetupScreenState();
}

class _FarmSetupScreenState extends ConsumerState<FarmSetupScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;
  String? _existingFarmId;

  final TextEditingController _cropController = TextEditingController(text: 'Maize');
  final TextEditingController _varietyController = TextEditingController(text: 'Local');
  final TextEditingController _acreageController = TextEditingController(text: '5.0');
  final TextEditingController _plantingDateController = TextEditingController(text: '2024-05-15');
  final TextEditingController _locationController = TextEditingController(text: 'Bangalore Rural');
  final TextEditingController _farmNameController = TextEditingController(text: 'Green Valley Farm');
  String _soilType = 'Loamy';
  String _currentStage = 'VEGETATIVE';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final farmState = ref.read(farmProvider);
      if (farmState.farms.isNotEmpty) {
        final farm = farmState.farms.first;
        final crop = farm.crops.isNotEmpty ? farm.crops.first : null;
        setState(() {
          _existingFarmId = farm.id;
          _farmNameController.text = farm.name;
          _locationController.text = farm.location;
          _acreageController.text = farm.area.toString();
          _soilType = farm.soilType.isNotEmpty ? farm.soilType : 'Loamy';
          if (crop != null) {
            _cropController.text = crop.cropName;
            final st = crop.stage.toUpperCase();
            if (kCanonicalStages.contains(st)) {
              _currentStage = st;
            }
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _cropController.dispose();
    _varietyController.dispose();
    _acreageController.dispose();
    _plantingDateController.dispose();
    _locationController.dispose();
    _farmNameController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now.subtract(const Duration(days: 30)),
      firstDate: DateTime(now.year - 2),
      lastDate: DateTime(now.year + 2),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: AppTheme.primaryGreen,
              onPrimary: Colors.white,
              surface: Colors.white,
              onSurface: AppTheme.textDarkNavy,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _plantingDateController.text =
            '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();

    setState(() => _loading = true);

    try {
      final double areaNum = double.tryParse(_acreageController.text) ?? 5.0;

      final payload = {
        'name': _farmNameController.text.trim().isNotEmpty ? _farmNameController.text.trim() : 'Green Valley Farm',
        'location': _locationController.text.trim().isNotEmpty ? _locationController.text.trim() : 'Bangalore Rural',
        'area': areaNum,
        'areaUnit': 'acres',
        'soilType': _soilType,
        'cropName': _cropController.text.trim().isNotEmpty ? _cropController.text.trim() : 'Maize',
        'variety': _varietyController.text.trim(),
        'season': 'Summer 2024',
        'stage': _currentStage,
        'plantingDate': _plantingDateController.text.trim(),
        'totalBudget': 50000.0,
      };

      if (_existingFarmId != null && _existingFarmId!.isNotEmpty) {
        await ApiClient().dio.put('/farms/$_existingFarmId', data: payload);
      } else {
        await ApiClient().dio.post('/farms', data: payload);
      }

      await ref.read(farmProvider.notifier).fetchFarms();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_existingFarmId != null ? 'Crop & farm details saved successfully!' : 'Farm created successfully!'),
            backgroundColor: AppTheme.primaryGreen,
          ),
        );
        if (context.canPop()) {
          context.pop();
        } else {
          context.go('/farmer');
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save crop details: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Crop Details', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 19)),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        foregroundColor: isDark ? Colors.white : AppTheme.textDarkNavy,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/farmer');
            }
          },
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Crop Name Field
                _buildFieldLabel('Crop', isDark),
                const SizedBox(height: 6),
                _buildTextField(
                  controller: _cropController,
                  hint: 'e.g. Maize, Wheat, Paddy',
                  isDark: isDark,
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Please enter crop name' : null,
                ),
                const SizedBox(height: 18),

                // Variety Field
                _buildFieldLabel('Variety', isDark),
                const SizedBox(height: 6),
                _buildTextField(
                  controller: _varietyController,
                  hint: 'e.g. Local, Hybrid, Pusa',
                  isDark: isDark,
                ),
                const SizedBox(height: 18),

                // Acreage Field
                _buildFieldLabel('Acreage', isDark),
                const SizedBox(height: 6),
                _buildTextField(
                  controller: _acreageController,
                  hint: 'e.g. 5.0',
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  isDark: isDark,
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Please enter acreage' : null,
                ),
                const SizedBox(height: 18),

                // Planting Date Field (With Date Picker Icon)
                _buildFieldLabel('Planting Date', isDark),
                const SizedBox(height: 6),
                GestureDetector(
                  onTap: _selectDate,
                  child: AbsorbPointer(
                    child: _buildTextField(
                      controller: _plantingDateController,
                      hint: 'YYYY-MM-DD',
                      isDark: isDark,
                      suffixIcon: const Icon(Icons.calendar_today_outlined, color: AppTheme.primaryGreen, size: 20),
                    ),
                  ),
                ),
                const SizedBox(height: 18),

                // Current Stage Dropdown Field
                _buildFieldLabel('Current Stage', isDark),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  decoration: BoxDecoration(
                    color: isDark ? AppTheme.darkCard : Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: isDark ? Colors.white12 : Colors.grey.shade300),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _currentStage,
                      isExpanded: true,
                      dropdownColor: isDark ? AppTheme.darkCard : Colors.white,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: isDark ? Colors.white : AppTheme.textDarkNavy,
                      ),
                      items: kCanonicalStages.map((st) {
                        return DropdownMenuItem(
                          value: st,
                          child: Text(st[0] + st.substring(1).toLowerCase()),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setState(() => _currentStage = val);
                        }
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 36),

                // Save Button
                SizedBox(
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryGreen,
                      foregroundColor: Colors.white,
                      elevation: 2,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: _loading
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                          )
                        : const Text(
                            'Save',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
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

  Widget _buildFieldLabel(String label, bool isDark) {
    return Text(
      label,
      style: TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w800,
        color: isDark ? Colors.grey.shade300 : AppTheme.textDarkNavy,
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required bool isDark,
    TextInputType? keyboardType,
    Widget? suffixIcon,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      validator: validator,
      style: TextStyle(color: isDark ? Colors.white : AppTheme.textDarkNavy, fontSize: 15),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: isDark ? Colors.grey.shade600 : Colors.grey.shade400, fontSize: 14),
        filled: true,
        fillColor: isDark ? AppTheme.darkCard : Colors.white,
        suffixIcon: suffixIcon,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: isDark ? Colors.white12 : Colors.grey.shade300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: isDark ? Colors.white12 : Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppTheme.primaryGreen, width: 1.5),
        ),
      ),
    );
  }
}
