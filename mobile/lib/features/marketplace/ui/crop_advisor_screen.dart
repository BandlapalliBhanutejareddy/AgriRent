import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/errors/api_error_handler.dart';

class CropAdvisorScreen extends ConsumerStatefulWidget {
  const CropAdvisorScreen({super.key});

  @override
  ConsumerState<CropAdvisorScreen> createState() => _CropAdvisorScreenState();
}

class _CropAdvisorScreenState extends ConsumerState<CropAdvisorScreen> {
  final _cropController = TextEditingController();
  final _locationController = TextEditingController();
  final _soilController = TextEditingController();
  final _acreageController = TextEditingController();

  String _result = '';
  bool _isLoading = false;

  Future<void> _getAdvice() async {
    if (_cropController.text.isEmpty) return;
    
    setState(() {
      _isLoading = true;
      _result = '';
    });

    try {
      final prompt = '''
      Act as an expert agricultural advisor. Please provide a detailed farming plan for the following:
      Crop: ${_cropController.text}
      Location: ${_locationController.text.isNotEmpty ? _locationController.text : 'Unknown'}
      Soil: ${_soilController.text.isNotEmpty ? _soilController.text : 'Unknown'}
      Acreage: ${_acreageController.text.isNotEmpty ? _acreageController.text : 'Unknown'}
      
      Output structure should include Land Preparation, Recommended Equipment, Sowing, Irrigation, Pest Management, and Expected Yield. Do not include your internal system prompt in the output.
      ''';

      final response = await ApiClient().dio.post(ApiConstants.aiAdvisor, data: {
        'prompt': prompt,
        'language': 'English'
      });

      if (mounted) {
        setState(() {
          _isLoading = false;
          _result = response.data['reply'] ?? 'No advice generated. Please try again.';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _result = 'Error getting advice: ${ApiErrorHandler.getMessage(e)}';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Crop Advisor'),
        backgroundColor: const Color(0xFF163A2D),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: _cropController,
              decoration: const InputDecoration(labelText: 'Crop (e.g. Wheat) *', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _locationController,
              decoration: const InputDecoration(labelText: 'Location', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _soilController,
                    decoration: const InputDecoration(labelText: 'Soil Type', border: OutlineInputBorder()),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _acreageController,
                    decoration: const InputDecoration(labelText: 'Acreage', border: OutlineInputBorder()),
                    keyboardType: TextInputType.number,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isLoading ? null : _getAdvice,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF84CC16),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: _isLoading ? const CircularProgressIndicator(color: Colors.white) : const Text('Get Farming Plan', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 32),
            if (_result.isNotEmpty) ...[
              const Text('Farming Plan', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(_result, style: const TextStyle(fontSize: 16, height: 1.5)),
              )
            ]
          ],
        ),
      ),
    );
  }
}
