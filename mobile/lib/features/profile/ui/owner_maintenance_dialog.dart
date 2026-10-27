import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/api/api_client.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../models/equipment.dart';
import '../../../shared/theme/app_theme.dart';
import '../providers/owner_provider.dart';

class OwnerMaintenanceDialog extends ConsumerStatefulWidget {
  final String? initialEquipmentId;
  final bool startOnHistory;

  const OwnerMaintenanceDialog({
    super.key,
    this.initialEquipmentId,
    this.startOnHistory = false,
  });

  static Future<void> show(
    BuildContext context, {
    String? equipmentId,
    bool startOnHistory = false,
  }) {
    return showDialog<void>(
      context: context,
      barrierDismissible: true,
      builder: (_) => OwnerMaintenanceDialog(
        initialEquipmentId: equipmentId,
        startOnHistory: startOnHistory,
      ),
    );
  }

  @override
  ConsumerState<OwnerMaintenanceDialog> createState() => _OwnerMaintenanceDialogState();
}

class _OwnerMaintenanceDialogState extends ConsumerState<OwnerMaintenanceDialog>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _formKey = GlobalKey<FormState>();

  String? _selectedEquipmentId;
  String _selectedServiceType = 'Routine Service';
  DateTime _serviceDate = DateTime.now();
  DateTime? _nextServiceDueDate;
  final _costCtrl = TextEditingController();
  final _providerCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  bool _isSaving = false;
  bool _isLoadingHistory = false;
  List<Map<String, dynamic>> _historyRecords = [];
  String? _serverError;

  final List<String> _serviceTypes = const [
    'Routine Service',
    'Engine Oil & Filter Service',
    'Hydraulic System Service',
    'Tyre / Track Maintenance',
    'Blade & Implement Sharpening',
    'Transmission & Clutch Repair',
    'Electrical & Battery Check',
    'Brake System Service',
    'General Inspection',
    'Other Repair',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 2,
      vsync: this,
      initialIndex: widget.startOnHistory ? 1 : 0,
    );
    _tabController.addListener(() {
      if (_tabController.index == 1 && mounted) {
        _fetchHistory();
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final ownerState = ref.read(ownerProvider);
      if (widget.initialEquipmentId != null &&
          ownerState.myEquipment.any((e) => e.id == widget.initialEquipmentId)) {
        setState(() => _selectedEquipmentId = widget.initialEquipmentId);
      } else if (ownerState.myEquipment.isNotEmpty) {
        setState(() => _selectedEquipmentId = ownerState.myEquipment.first.id);
      }

      if (widget.startOnHistory) {
        _fetchHistory();
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _costCtrl.dispose();
    _providerCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchHistory() async {
    if (_selectedEquipmentId == null) return;

    setState(() {
      _isLoadingHistory = true;
      _serverError = null;
    });

    try {
      final res = await ApiClient().dio.get('equipment/$_selectedEquipmentId/maintenance');
      if (res.statusCode == 200 && res.data != null && res.data['success'] == true) {
        final list = (res.data['data'] as List<dynamic>? ?? [])
            .map((item) => Map<String, dynamic>.from(item as Map))
            .toList();
        if (mounted) {
          setState(() {
            _historyRecords = list;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _serverError = 'Failed to load maintenance history.');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoadingHistory = false);
      }
    }
  }

  Future<void> _pickDate({required bool isNextDue}) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: isNextDue ? (_nextServiceDueDate ?? DateTime.now().add(const Duration(days: 90))) : _serviceDate,
      firstDate: isNextDue ? DateTime.now() : DateTime.now().subtract(const Duration(days: 730)),
      lastDate: DateTime.now().add(const Duration(days: 1095)),
      builder: (context, child) {
        final isDark = Theme.of(context).brightness == Brightness.dark;
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: const Color(0xFFD97706),
              onPrimary: Colors.white,
              surface: isDark ? AppTheme.darkCard : Colors.white,
              onSurface: isDark ? Colors.white : AppTheme.textDarkNavy,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        if (isNextDue) {
          _nextServiceDueDate = picked;
        } else {
          _serviceDate = picked;
        }
      });
    }
  }

  Future<void> _saveMaintenance() async {
    if (_selectedEquipmentId == null) {
      setState(() => _serverError = 'Please select an equipment to log maintenance for.');
      return;
    }

    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSaving = true;
      _serverError = null;
    });

    try {
      final cost = double.tryParse(_costCtrl.text.trim()) ?? 0.0;
      final payload = {
        'serviceType': _selectedServiceType,
        'serviceDate': _serviceDate.toIso8601String(),
        'cost': cost,
        'providerName': _providerCtrl.text.trim(),
        'notes': _notesCtrl.text.trim(),
        if (_nextServiceDueDate != null) 'nextServiceDue': _nextServiceDueDate!.toIso8601String(),
      };

      final res = await ApiClient().dio.post('equipment/$_selectedEquipmentId/maintenance', data: payload);
      if (res.statusCode == 200 && res.data != null && res.data['success'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Maintenance record logged successfully.'),
              backgroundColor: Color(0xFF16A34A),
              behavior: SnackBarBehavior.floating,
            ),
          );
          _costCtrl.clear();
          _notesCtrl.clear();
          _nextServiceDueDate = null;
          _tabController.animateTo(1);
          _fetchHistory();
        }
      } else {
        setState(() {
          _serverError = res.data?['message']?.toString() ?? 'Failed to log maintenance record.';
        });
      }
    } catch (e) {
      setState(() {
        _serverError = 'Failed to submit record. Please check connection and try again.';
      });
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final ownerState = ref.watch(ownerProvider);
    final equipmentList = ownerState.myEquipment;

    return Dialog(
      backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 550, maxHeight: 720),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Top Bar
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 12, 0),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEA580C).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(Icons.handyman_rounded, color: Color(0xFFEA580C), size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'service_maintenance'.tr(lang),
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 18,
                            color: isDark ? Colors.white : AppTheme.textDarkNavy,
                          ),
                        ),
                        Text(
                          'Service logs, inspection & maintenance telemetry',
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded),
                    onPressed: () => Navigator.of(context).pop(),
                    color: isDark ? Colors.white54 : Colors.grey.shade600,
                  ),
                ],
              ),
            ),

            // Equipment Selector (Global to both tabs)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 8),
              child: equipmentList.isEmpty
                  ? Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.amber.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.info_outline, color: Color(0xFFD97706), size: 18),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'No equipment listed under this owner account yet.',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ),
                    )
                  : Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isDark ? Colors.white10 : Colors.grey.shade300,
                        ),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _selectedEquipmentId ?? equipmentList.first.id,
                          isExpanded: true,
                          dropdownColor: isDark ? AppTheme.darkCard : Colors.white,
                          icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 22),
                          items: equipmentList.map((Equipment eq) {
                            return DropdownMenuItem<String>(
                              value: eq.id,
                              child: Row(
                                children: [
                                  const Icon(Icons.agriculture_rounded, size: 18, color: Color(0xFFD97706)),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      eq.title,
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w700,
                                        color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) {
                              setState(() => _selectedEquipmentId = val);
                              if (_tabController.index == 1) {
                                _fetchHistory();
                              }
                            }
                          },
                        ),
                      ),
                    ),
            ),

            // Tab Bar
            TabBar(
              controller: _tabController,
              labelColor: const Color(0xFFD97706),
              unselectedLabelColor: isDark ? Colors.white54 : AppTheme.textMutedGray,
              indicatorColor: const Color(0xFFD97706),
              indicatorWeight: 3,
              labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
              tabs: const [
                Tab(icon: Icon(Icons.add_task_rounded, size: 18), text: 'Log Service'),
                Tab(icon: Icon(Icons.history_rounded, size: 18), text: 'Service History'),
              ],
            ),
            const Divider(height: 1),

            // Tab Content
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildLogServiceTab(isDark, lang),
                  _buildHistoryTab(isDark, lang),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLogServiceTab(bool isDark, String lang) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_serverError != null) ...[
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.red.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline_rounded, color: Colors.red, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(_serverError!, style: const TextStyle(color: Colors.red, fontSize: 12)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
            ],

            // 1. Service Type
            Text(
              'Service Type',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
              ),
            ),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade300),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _selectedServiceType,
                  isExpanded: true,
                  dropdownColor: isDark ? AppTheme.darkCard : Colors.white,
                  items: _serviceTypes.map((type) {
                    return DropdownMenuItem<String>(
                      value: type,
                      child: Text(
                        type,
                        style: TextStyle(
                          fontSize: 14,
                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
                        ),
                      ),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedServiceType = val);
                  },
                ),
              ),
            ),
            const SizedBox(height: 14),

            // 2. Service Date & Cost in Row
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Service Date',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                        ),
                      ),
                      const SizedBox(height: 6),
                      InkWell(
                        onTap: () => _pickDate(isNextDue: false),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade300),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.calendar_today_rounded, size: 16, color: Color(0xFFD97706)),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  DateFormat('dd MMM yyyy').format(_serviceDate),
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Service Cost (₹)',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                        ),
                      ),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _costCtrl,
                        keyboardType: TextInputType.number,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        decoration: InputDecoration(
                          hintText: 'e.g. 2500',
                          hintStyle: TextStyle(
                            fontSize: 13,
                            color: isDark ? Colors.white38 : Colors.grey.shade400,
                          ),
                          prefixText: '₹ ',
                          prefixStyle: const TextStyle(fontWeight: FontWeight.bold),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                          filled: true,
                          fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade50,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: isDark ? Colors.white10 : Colors.grey.shade300),
                          ),
                        ),
                        validator: (v) {
                          if (v == null || v.trim().isEmpty) return 'Enter cost';
                          return null;
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // 3. Provider / Mechanic
            Text(
              'Provider / Mechanic Name',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
              ),
            ),
            const SizedBox(height: 6),
            TextFormField(
              controller: _providerCtrl,
              textCapitalization: TextCapitalization.words,
              decoration: InputDecoration(
                hintText: 'e.g. Authorized Mahindra Service / Sri Ram Repairs',
                hintStyle: TextStyle(
                  fontSize: 13,
                  color: isDark ? Colors.white38 : Colors.grey.shade400,
                ),
                prefixIcon: const Icon(Icons.store_mall_directory_rounded, size: 18),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                filled: true,
                fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade50,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: isDark ? Colors.white10 : Colors.grey.shade300),
                ),
              ),
              validator: (v) {
                if (v == null || v.trim().length < 2) return 'Enter provider name';
                return null;
              },
            ),
            const SizedBox(height: 14),

            // 4. Notes & Work Done
            Text(
              'Work Done & Parts Replaced',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
              ),
            ),
            const SizedBox(height: 6),
            TextFormField(
              controller: _notesCtrl,
              maxLines: 2,
              decoration: InputDecoration(
                hintText: 'Details of service, replaced oil/filters, battery condition, etc.',
                hintStyle: TextStyle(
                  fontSize: 13,
                  color: isDark ? Colors.white38 : Colors.grey.shade400,
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                filled: true,
                fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade50,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: isDark ? Colors.white10 : Colors.grey.shade300),
                ),
              ),
            ),
            const SizedBox(height: 14),

            // 5. Next Service Due Date (Optional)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Next Service Due Date',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                  ),
                ),
                if (_nextServiceDueDate != null)
                  TextButton(
                    onPressed: () => setState(() => _nextServiceDueDate = null),
                    child: const Text('Clear', style: TextStyle(fontSize: 12, color: Colors.red)),
                  ),
              ],
            ),
            const SizedBox(height: 6),
            InkWell(
              onTap: () => _pickDate(isNextDue: true),
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade300),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.alarm_on_rounded, size: 18, color: Color(0xFF16A34A)),
                    const SizedBox(width: 10),
                    Text(
                      _nextServiceDueDate != null
                          ? DateFormat('dd MMM yyyy').format(_nextServiceDueDate!)
                          : 'Set reminder for next maintenance (optional)',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: _nextServiceDueDate != null ? FontWeight.w700 : FontWeight.w400,
                        color: _nextServiceDueDate != null
                            ? (isDark ? Colors.white : AppTheme.textDarkNavy)
                            : (isDark ? Colors.white38 : Colors.grey.shade500),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 22),

            // Save Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isSaving ? null : _saveMaintenance,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  backgroundColor: const Color(0xFFD97706),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                child: _isSaving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Text(
                        'Save Maintenance Record',
                        style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHistoryTab(bool isDark, String lang) {
    if (_isLoadingHistory) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFFD97706)),
      );
    }

    if (_historyRecords.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade100,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.construction_rounded,
                  size: 40,
                  color: isDark ? Colors.white38 : Colors.grey.shade400,
                ),
              ),
              const SizedBox(height: 14),
              Text(
                'No Maintenance Records Found',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Logging routine oil changes, tyre checks, and repairs preserves your machinery and builds renter trust.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => _tabController.animateTo(0),
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Add First Record'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFD97706),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchHistory,
      color: const Color(0xFFD97706),
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _historyRecords.length,
        separatorBuilder: (context, index) => const SizedBox(height: 12),
        itemBuilder: (ctx, idx) {
          final item = _historyRecords[idx];
          final type = item['serviceType'] ?? 'Service';
          final cost = item['cost'] != null ? '₹${item['cost']}' : '₹0';
          final provider = item['providerName'] ?? 'Workshop';
          final notes = item['notes'] ?? '';
          final dateStr = item['serviceDate'] != null
              ? DateFormat('dd MMM yyyy').format(DateTime.tryParse(item['serviceDate']) ?? DateTime.now())
              : 'Unknown date';
          final nextDueStr = item['nextServiceDue'] != null
              ? DateFormat('dd MMM yyyy').format(DateTime.tryParse(item['nextServiceDue']) ?? DateTime.now())
              : null;

          return Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.grey.shade50,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isDark ? Colors.white10 : Colors.grey.shade200,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFD97706).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        type,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFFD97706),
                        ),
                      ),
                    ),
                    Text(
                      cost,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : AppTheme.textDarkNavy,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.calendar_today_rounded, size: 13, color: isDark ? Colors.white54 : Colors.grey.shade600),
                    const SizedBox(width: 4),
                    Text(
                      dateStr,
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? Colors.white70 : const Color(0xFF475569),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Icon(Icons.storefront_rounded, size: 14, color: isDark ? Colors.white54 : Colors.grey.shade600),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        provider,
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? Colors.white70 : const Color(0xFF475569),
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                if (notes.toString().isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    notes,
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? Colors.white60 : Colors.grey.shade700,
                      height: 1.3,
                    ),
                  ),
                ],
                if (nextDueStr != null) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF16A34A).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.alarm_on_rounded, size: 13, color: Color(0xFF16A34A)),
                        const SizedBox(width: 4),
                        Text(
                          'Next Due: $nextDueStr',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF16A34A),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}
