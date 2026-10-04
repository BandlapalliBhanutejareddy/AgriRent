import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../models/equipment.dart';
import '../../../shared/theme/app_theme.dart';
import 'equipment_details_screen.dart';

class EquipmentLoaderScreen extends StatefulWidget {
  final String equipmentId;
  const EquipmentLoaderScreen({super.key, required this.equipmentId});

  @override
  State<EquipmentLoaderScreen> createState() => _EquipmentLoaderScreenState();
}

class _EquipmentLoaderScreenState extends State<EquipmentLoaderScreen> {
  Equipment? _equipment;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchEquipment();
  }

  Future<void> _fetchEquipment() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final res = await ApiClient().dio.get('equipment/${widget.equipmentId}');
      final dynamic raw = res.data;
      final dynamic data = (raw is Map && raw.containsKey('data')) ? raw['data'] : raw;
      if (data is Map) {
        setState(() {
          _equipment = Equipment.fromJson(data);
          _isLoading = false;
        });
        return;
      }
      throw Exception('Invalid equipment response format');
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Unable to load equipment details.';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: AppTheme.primaryGreen),
        ),
      );
    }

    if (_error != null || _equipment == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Equipment Details')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: Colors.red),
                const SizedBox(height: 16),
                Text(_error ?? 'Equipment not found', style: const TextStyle(fontSize: 16)),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: _fetchEquipment,
                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen),
                  child: const Text('Retry', style: TextStyle(color: Colors.white)),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return EquipmentDetailsScreen(equipment: _equipment!);
  }
}
