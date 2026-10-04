import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/localization/app_localizations.dart';

const List<String> stages = ['SOWING', 'GERMINATION', 'SEEDLING', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'MATURITY', 'HARVEST'];

class CropAdvisorScreen extends ConsumerStatefulWidget {
  const CropAdvisorScreen({super.key});

  @override
  ConsumerState<CropAdvisorScreen> createState() => _CropAdvisorScreenState();
}

class _CropAdvisorScreenState extends ConsumerState<CropAdvisorScreen> {
  final _formKey = GlobalKey<FormState>();

  String _crop = '';
  String _soilType = 'Black Soil';
  String _acreage = '';
  String _location = '';
  String _season = 'Kharif';
  String _farmingStage = 'SOWING';
  String _objective = 'Reduce Cost';
  String _budget = '';
  String _question = '';

  bool _loading = false;
  Map<String, dynamic>? _plan;
  String? _error;

  Future<void> _generatePlan(String lang) async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();

    setState(() {
      _loading = true;
      _plan = null;
      _error = null;
    });

    try {
      final response = await ApiClient().dio.post('/ai/smart-plan', data: {
        'crop': _crop,
        'soilType': _soilType,
        'acreage': double.tryParse(_acreage) ?? 5.0,
        'location': _location.isEmpty ? 'Unknown' : _location,
        'season': _season,
        'farmingStage': _farmingStage,
        'objective': _objective,
        'budget': _budget.isNotEmpty ? double.tryParse(_budget) : null,
        'question': _question,
        'language': lang,
      });

      if (mounted) {
        final dynamic raw = response.data;
        final Map<String, dynamic>? planData = (raw is Map<String, dynamic> && raw.containsKey('data') && raw['data'] is Map<String, dynamic>)
            ? raw['data'] as Map<String, dynamic>
            : (raw is Map<String, dynamic> ? raw : null);
        setState(() {
          _plan = planData;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        String errorMsg = 'Failed to generate smart plan';
        if (e is Exception) {
          errorMsg = e.toString().replaceFirst('Exception: ', '');
        }
        setState(() {
          _error = errorMsg;
          _loading = false;
        });
      }
    }
  }

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      labelStyle: TextStyle(color: Colors.grey.shade600, fontWeight: FontWeight.bold),
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey.shade200)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey.shade200)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: AppTheme.primaryGreen, width: 2)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
    );
  }

  Color _getTierColor(String tier) {
    switch (tier) {
      case 'Excellent Match': return Colors.green.shade600;
      case 'Very Good Match': return Colors.teal.shade500;
      case 'Good Match': return Colors.blue.shade500;
      case 'Possible Match': return Colors.orange.shade500;
      default: return Colors.grey.shade500;
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: Text('smart_farming_advisor'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header description
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFF064E3B), Color(0xFF0F172A)]),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.smart_toy, color: Colors.greenAccent, size: 40),
                    const SizedBox(height: 12),
                    Text('smart_farming_desc'.tr(lang), textAlign: TextAlign.center, style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.5)),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Form
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.grey.shade200)),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      TextFormField(
                        decoration: _inputDecoration('crop_name'.tr(lang)),
                        validator: (v) => v!.isEmpty ? 'required_field'.tr(lang) : null,
                        onSaved: (v) => _crop = v!,
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              initialValue: _soilType,
                              decoration: _inputDecoration('soil_type'.tr(lang)),
                              items: [
                                DropdownMenuItem(value: 'Black Soil', child: Text('black_soil'.tr(lang))),
                                DropdownMenuItem(value: 'Red Soil', child: Text('red_soil'.tr(lang))),
                                DropdownMenuItem(value: 'Alluvial Soil', child: Text('alluvial_soil'.tr(lang))),
                              ],
                              onChanged: (v) => setState(() => _soilType = v!),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextFormField(
                              decoration: _inputDecoration('area_acres'.tr(lang)),
                              keyboardType: TextInputType.number,
                              onSaved: (v) => _acreage = v ?? '',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              decoration: _inputDecoration('location'.tr(lang)),
                              onSaved: (v) => _location = v ?? '',
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              initialValue: _season,
                              decoration: _inputDecoration('season'.tr(lang)),
                              items: [
                                DropdownMenuItem(value: 'Kharif', child: Text('kharif'.tr(lang))),
                                DropdownMenuItem(value: 'Rabi', child: Text('rabi'.tr(lang))),
                                DropdownMenuItem(value: 'Zaid', child: Text('zaid'.tr(lang))),
                              ],
                              onChanged: (v) => setState(() => _season = v!),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        initialValue: _farmingStage,
                        decoration: _inputDecoration('current_stage'.tr(lang)),
                        items: stages.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                        onChanged: (v) => setState(() => _farmingStage = v!),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              initialValue: _objective,
                              decoration: _inputDecoration('objective'.tr(lang)),
                              items: [
                                DropdownMenuItem(value: 'Reduce Cost', child: Text('reduce_cost'.tr(lang))),
                                DropdownMenuItem(value: 'Maximum Yield', child: Text('maximum_yield'.tr(lang))),
                                DropdownMenuItem(value: 'Fast Execution', child: Text('fast_execution'.tr(lang))),
                              ],
                              onChanged: (v) => setState(() => _objective = v!),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextFormField(
                              decoration: _inputDecoration('budget_inr'.tr(lang)),
                              keyboardType: TextInputType.number,
                              onSaved: (v) => _budget = v ?? '',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        decoration: _inputDecoration('specific_question'.tr(lang)),
                        maxLines: 2,
                        onSaved: (v) => _question = v ?? '',
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: _loading ? null : () => _generatePlan(lang),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green.shade600,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: _loading
                            ? Row(mainAxisAlignment: MainAxisAlignment.center, children: [const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)), const SizedBox(width: 12), Text('generating_smart_plan'.tr(lang))])
                            : Text('generate_smart_plan'.tr(lang), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 12),
                        Text(_error!, style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                      ]
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Results Section
              if (!_loading && _plan == null)
                Container(
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.grey.shade200, style: BorderStyle.solid)),
                  child: Column(
                    children: [
                      Icon(Icons.assignment, size: 48, color: Colors.grey.shade300),
                      const SizedBox(height: 16),
                      Text('plan_will_appear_here'.tr(lang), textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 8),
                      Text('fill_details_for_plan'.tr(lang), textAlign: TextAlign.center, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                    ],
                  ),
                ),

              if (_loading)
                const Center(child: Padding(padding: EdgeInsets.all(40.0), child: CircularProgressIndicator(color: Colors.green))),

              if (_plan != null) ...[
                // Executive Summary
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.green.shade100)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            decoration: BoxDecoration(color: Colors.green.shade200, borderRadius: BorderRadius.circular(12)),
                            child: Text(_plan!['farmingStage'], style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.green.shade900)),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text('farm_size'.tr(lang), style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey.shade600)),
                              Text('${_plan!['farmSize']} Acres', style: const TextStyle(fontWeight: FontWeight.w900)),
                            ],
                          )
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(_plan!['summary'], style: TextStyle(color: Colors.grey.shade800, height: 1.5)),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Operations & Strategy
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.grey.shade200)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('recommended_operations'.tr(lang), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
                      const SizedBox(height: 12),
                      ...List.generate(_plan!['operations'].length, (i) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8.0),
                          child: Row(
                            children: [
                              CircleAvatar(radius: 12, backgroundColor: Colors.green, child: Text('${i + 1}', style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold))),
                              const SizedBox(width: 12),
                              Expanded(child: Text(_plan!['operations'][i], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13))),
                            ],
                          ),
                        );
                      }),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Budget & Cost Analysis
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.grey.shade200)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('cost_and_budget_intelligence'.tr(lang), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(16)),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('est_rental_cost'.tr(lang), style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade600)),
                                Text('Ã¢â€šÂ¹${_plan!['estimatedCost']['totalEstimatedCost']}', style: const TextStyle(fontWeight: FontWeight.w900, color: Colors.green, fontSize: 18)),
                              ],
                            ),
                            if (_plan!['estimatedCost']['farmerBudget'] > 0) ...[
                              const SizedBox(height: 8),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('your_budget'.tr(lang), style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade600)),
                                  Text('Ã¢â€šÂ¹${_plan!['estimatedCost']['farmerBudget']}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                                ],
                              ),
                            ],
                            const SizedBox(height: 12),
                            const Divider(),
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              decoration: BoxDecoration(color: _plan!['estimatedCost']['withinBudget'] ? Colors.green.shade100 : Colors.red.shade100, borderRadius: BorderRadius.circular(12)),
                              child: Text(_plan!['estimatedCost']['budgetStatus'].toString().replaceAll('_', ' '), style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: _plan!['estimatedCost']['withinBudget'] ? Colors.green.shade900 : Colors.red.shade900)),
                            ),
                            const SizedBox(height: 8),
                            Text(_plan!['estimatedCost']['analysis'], style: TextStyle(fontSize: 12, color: Colors.grey.shade700)),
                          ],
                        ),
                      )
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // AI Recommended Equipment
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.grey.shade200)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('ai_recommended_equipment'.tr(lang), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
                      const SizedBox(height: 4),
                      Text('matched_from_inventory'.tr(lang), style: TextStyle(fontSize: 10, color: Colors.grey.shade500)),
                      const SizedBox(height: 16),
                      if (_plan!['matchedEquipment'] != null && _plan!['matchedEquipment'].isNotEmpty)
                        ...(_plan!['matchedEquipment'] as List).map((eq) => Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade200)),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(color: _getTierColor(eq['matchTier']), borderRadius: BorderRadius.circular(12)),
                                    child: Text('${eq['matchTier']} (${eq['matchScore']}%)', style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.white)),
                                  ),
                                  Text('Ã¢â€šÂ¹${eq['pricePerDay']}/day', style: const TextStyle(fontWeight: FontWeight.w900, color: Colors.green, fontSize: 16)),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(eq['title'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                              Text('${eq['category']} Ã¢â‚¬Â¢ ${eq['location'] ?? 'Local'}', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                              const SizedBox(height: 8),
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
                                child: Text('Ã°Å¸â€™Â¡ ${eq['matchReason']}', style: TextStyle(fontSize: 12, color: Colors.grey.shade700)),
                              ),
                              const SizedBox(height: 12),
                              const Divider(),
                              const SizedBox(height: 8),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('${'owner'.tr(lang)}: ${eq['owner']['name']}', style: TextStyle(fontSize: 10, color: Colors.grey.shade600)),
                                  Text('${'est_total'.tr(lang)}: Ã¢â€šÂ¹${eq['estimatedTotalCost']} (${eq['recommendedDays']} ${'days'.tr(lang)})', style: TextStyle(fontSize: 10, color: Colors.grey.shade600, fontWeight: FontWeight.bold)),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: ElevatedButton(
                                      onPressed: () => context.push('/marketplace?id=${eq['id']}'),
                                      style: ElevatedButton.styleFrom(backgroundColor: Colors.black, foregroundColor: Colors.white),
                                      child: Text('view_details'.tr(lang), style: const TextStyle(fontSize: 12)),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: ElevatedButton(
                                      onPressed: () => context.push('/marketplace?bookId=${eq['id']}'),
                                      style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                                      child: Text('book_equipment'.tr(lang), style: const TextStyle(fontSize: 12)),
                                    ),
                                  ),
                                ],
                              )
                            ],
                          ),
                        ))
                      else
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Text('no_equipment_found'.tr(lang), textAlign: TextAlign.center, style: TextStyle(color: Colors.grey.shade500)),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Action Plan & Risks Grid
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.grey.shade200)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('day_by_day_plan'.tr(lang), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
                      const SizedBox(height: 16),
                      ...(_plan!['actionPlan'] as List).map((ap) => Padding(
                        padding: const EdgeInsets.only(bottom: 12.0),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(12)),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(ap['day'], style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.green)),
                              const SizedBox(height: 4),
                              Text(ap['task'], style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      )),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.grey.shade200)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('farming_risks_and_tips'.tr(lang), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: Colors.orange.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.orange.shade100)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('identified_risks'.tr(lang), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.orange.shade800)),
                            const SizedBox(height: 8),
                            ...(_plan!['risks'] as List).map((r) => Padding(
                              padding: const EdgeInsets.only(bottom: 4.0),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Ã¢â‚¬Â¢ ', style: TextStyle(color: Colors.orange.shade900)),
                                  Expanded(child: Text(r, style: TextStyle(fontSize: 12, color: Colors.orange.shade900))),
                                ],
                              ),
                            )),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.green.shade100)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('cost_saving_tips'.tr(lang), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.green.shade800)),
                            const SizedBox(height: 8),
                            ...(_plan!['costSavingTips'] as List).map((t) => Padding(
                              padding: const EdgeInsets.only(bottom: 4.0),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Ã¢â‚¬Â¢ ', style: TextStyle(color: Colors.green.shade900)),
                                  Expanded(child: Text(t, style: TextStyle(fontSize: 12, color: Colors.green.shade900))),
                                ],
                              ),
                            )),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ]
            ],
          ),
        ),
      ),
    );
  }
}
