import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/api/api_client.dart';
import '../../../core/localization/app_localizations.dart';
import '../../farm/providers/farm_provider.dart';
import '../../notifications/providers/notification_provider.dart';
import 'package:intl/intl.dart';

const List<String> stages = ['SOWING', 'GERMINATION', 'SEEDLING', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'MATURITY', 'HARVEST'];

class FarmerDashboardScreen extends ConsumerStatefulWidget {
  const FarmerDashboardScreen({super.key});

  @override
  ConsumerState<FarmerDashboardScreen> createState() => _FarmerDashboardScreenState();
}

class _FarmerDashboardScreenState extends ConsumerState<FarmerDashboardScreen> {
  Map<String, dynamic>? _analytics;

  String? _overview;
  bool _isLoadingOverview = false;

  List<dynamic> _operations = [];
  bool _isLoadingOps = false;

  Map<String, dynamic>? _scheduleData;
  bool _isLoadingSchedule = false;

  Map<String, dynamic>? _budgetData;
  bool _isLoadingBudget = false;

  String? _currentFarmId;
  String? _currentCropId;
  String? _currentLang;



  bool _completingOp = false;

  @override
  void initState() {
    super.initState();
    _fetchAnalytics();
  }

  Future<void> _fetchAnalytics() async {
    try {
      final response = await ApiClient().dio.get('/analytics/farmer');
      if (mounted) {
        final dynamic raw = response.data;
        setState(() {
          if (raw is Map<String, dynamic>) {
            _analytics = raw['data'] is Map<String, dynamic> ? raw['data'] : raw;
          } else {
            _analytics = null;
          }
        });
      }
    } catch (e) {
      // Ignored
    }
  }

  void _loadDashboardData(String farmId, String cropId, String lang) {
    if (_currentFarmId == farmId && _currentCropId == cropId && _currentLang == lang) return;
    _currentFarmId = farmId;
    _currentCropId = cropId;
    _currentLang = lang;

    setState(() {
      _isLoadingOverview = true;
      _isLoadingOps = true;
      _isLoadingSchedule = true;
      _isLoadingBudget = true;
    });

    final api = ApiClient().dio;

    api.get('/farms/$farmId/crops/$cropId/overview?lang=$lang').then((res) {
      if (mounted) {
        final dynamic raw = res.data;
        String? ovText;
        if (raw is Map) {
          ovText = raw['overview']?.toString() ?? (raw['data'] is Map ? raw['data']['overview']?.toString() : null);
        }
        setState(() {
          _overview = ovText;
          _isLoadingOverview = false;
        });
      }
    }).catchError((_) {
      if (mounted) {
        setState(() => _isLoadingOverview = false);
      }
    });

    api.get('/farms/$farmId/crops/$cropId/operations').then((res) {
      if (mounted) {
        final dynamic raw = res.data;
        final List<dynamic> ops = raw is List
            ? raw
            : (raw is Map && raw['data'] is List
                ? raw['data']
                : (raw is Map && raw['operations'] is List ? raw['operations'] : []));
        setState(() {
          _operations = ops;
          _isLoadingOps = false;
        });
      }
    }).catchError((_) {
      if (mounted) {
        setState(() => _isLoadingOps = false);
      }
    });

    api.get('/farms/$farmId/schedule?lang=$lang').then((res) {
      if (mounted) {
        final dynamic raw = res.data;
        setState(() {
          _scheduleData = (raw is Map<String, dynamic> && raw['data'] is Map<String, dynamic>)
              ? raw['data'] as Map<String, dynamic>
              : (raw is Map<String, dynamic> ? raw : null);
          _isLoadingSchedule = false;
        });
      }
    }).catchError((_) {
      if (mounted) {
        setState(() => _isLoadingSchedule = false);
      }
    });

    api.get('/farms/$farmId/financials?lang=$lang').then((res) {
      if (mounted) {
        final dynamic raw = res.data;
        setState(() {
          _budgetData = (raw is Map<String, dynamic> && raw['data'] is Map<String, dynamic>)
              ? raw['data'] as Map<String, dynamic>
              : (raw is Map<String, dynamic> ? raw : null);
          _isLoadingBudget = false;
        });
      }
    }).catchError((_) {
      if (mounted) {
        setState(() => _isLoadingBudget = false);
      }
    });
  }

  Future<void> _markCompleted(String opId, String feedbackType, String notes, String lang) async {
    setState(() => _completingOp = true);
    try {
      await ApiClient().dio.post('/farms/$_currentFarmId/crops/$_currentCropId/operations/$opId/complete', data: {
        'feedback': feedbackType,
        'notes': notes
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('yes_completed'.tr(lang))));

      _currentFarmId = null;
      _loadDashboardData(ref.read(farmProvider).farms.first.id, ref.read(farmProvider).farms.first.crops.first.id, ref.read(languageProvider));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed')));
    } finally {
      if (mounted) setState(() => _completingOp = false);
    }
  }

  void _showFeedbackModal(String opId, String lang) {
    String feedbackType = 'wentWell';
    String notes = '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('confirm_completion'.tr(lang), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text('did_you_complete'.tr(lang), style: const TextStyle(color: Colors.grey)),
                    const SizedBox(height: 24),
                    Text('how_did_work_go'.tr(lang), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
                    const SizedBox(height: 12),
                    Row(
                      children: ['wentWell', 'normal', 'problem'].map((opt) {
                        final isSelected = feedbackType == opt;
                        return Expanded(
                          child: GestureDetector(
                            onTap: () => setModalState(() => feedbackType = opt),
                            child: Container(
                              margin: const EdgeInsets.symmetric(horizontal: 4),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: isSelected ? Colors.green.shade50 : Colors.transparent,
                                border: Border.all(color: isSelected ? Colors.green : Colors.grey.shade300),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              alignment: Alignment.center,
                              child: Text(opt, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: isSelected ? Colors.green.shade700 : Colors.grey.shade600)),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      onChanged: (v) => notes = v,
                      decoration: InputDecoration(
                        hintText: 'what_happened'.tr(lang),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        filled: true,
                        fillColor: Colors.grey.shade50,
                      ),
                      maxLines: 3,
                    ),
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        Expanded(
                          child: TextButton(
                            onPressed: () => Navigator.pop(context),
                            child: Text('not_yet'.tr(lang), style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                          ),
                        ),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _completingOp ? null : () {
                              Navigator.pop(context);
                              _markCompleted(opId, feedbackType, notes, lang);
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: _completingOp
                                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                : Text('yes_completed'.tr(lang), style: const TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          }
        );
      }
    );
  }



  void _launchURL(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final lang = ref.watch(languageProvider);
    final farmState = ref.watch(farmProvider);

    if (!farmState.isLoading && farmState.farms.isNotEmpty) {
      final farm = farmState.farms.first;
      if (farm.crops.isNotEmpty) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            _loadDashboardData(farm.id, farm.crops.first.id, lang);
          }
        });
      }
    }

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 120.0,
            floating: false,
            pinned: true,
            elevation: 0,
            backgroundColor: AppTheme.primaryGreen,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF2E7D32), Color(0xFF1B5E20)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'good_morning'.tr(lang),
                              style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 13, fontWeight: FontWeight.w500, letterSpacing: 0.5),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              user?.name ?? 'Farmer',
                              style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold, letterSpacing: -0.5),
                            ),
                          ],
                        ),
                        Consumer(
                          builder: (context, ref, child) {
                            final unread = ref.watch(unreadNotificationsCountProvider);
                            return IconButton(
                              icon: Stack(
                                children: [
                                  const Icon(Icons.notifications, color: Colors.white, size: 28),
                                  if (unread > 0)
                                    Positioned(
                                      right: 0,
                                      top: 0,
                                      child: Container(
                                        padding: const EdgeInsets.all(2),
                                        decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(10)),
                                        constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                                        child: Text('$unread', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
                                      ),
                                    )
                                ],
                              ),
                              onPressed: () => context.push('/notifications'),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildFarmSection(context, farmState, lang),
                  const SizedBox(height: 24),
                  if (farmState.farms.isNotEmpty && farmState.farms.first.crops.isNotEmpty) ...[
                    _buildOverviewSection(lang),
                    const SizedBox(height: 24),
                    _buildCompleteJourneySection(farmState.farms.first.crops.first.stage, lang),
                    const SizedBox(height: 24),
                    _buildTodayWorkSection(lang),
                    const SizedBox(height: 24),
                    _buildNextWorkSection(lang),
                    const SizedBox(height: 24),
                    _buildJourneyTimeline(lang),
                    const SizedBox(height: 24),
                    _buildSpendingSection(lang),
                    const SizedBox(height: 24),
                    _buildBudgetSection(lang),
                    const SizedBox(height: 24),
                    _buildLearningSection(farmState.farms.first.crops.first.cropName, farmState.farms.first.crops.first.stage, lang),
                    const SizedBox(height: 24),
                    _buildCopilotSection(lang),
                    const SizedBox(height: 40),
                  ]
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFarmSection(BuildContext context, FarmState state, String lang) {
    if (state.isLoading) return const SizedBox(height: 150, child: Center(child: CircularProgressIndicator()));
    if (state.farms.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24)),
        child: Column(
          children: [
            const Icon(Icons.eco, size: 48, color: AppTheme.primaryGreen),
            const SizedBox(height: 24),
            Text('no_farm_data_yet'.tr(lang), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.push('/farm-setup'),
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen, foregroundColor: Colors.white),
              child: Text('set_up_my_farm'.tr(lang)),
            )
          ],
        ),
      );
    }

    final farm = state.farms.first;
    final primaryCrop = farm.crops.isNotEmpty ? farm.crops.first : null;

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color ?? Colors.white,
        borderRadius: BorderRadius.circular(AppTheme.cardRadius),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4))
        ]
      ),
      padding: const EdgeInsets.all(AppTheme.pagePadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('My Farm', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textMutedGray)),
          const SizedBox(height: 12),
          Text(farm.location, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppTheme.textDarkNavy)),
          const SizedBox(height: 8),
          Text('${primaryCrop?.cropName ?? 'not_available'.tr(lang)} Ã¢â‚¬Â¢ ${farm.area} ${farm.areaUnit}', style: const TextStyle(color: AppTheme.primaryGreen, fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 16),
          Row(
            children: [
              const Icon(Icons.circle, size: 12, color: AppTheme.accentGreen),
              const SizedBox(width: 8),
              Text(primaryCrop?.stage ?? 'not_available'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
            ],
          ),
          const SizedBox(height: 16),
          Divider(color: Colors.grey.shade200),
          TextButton(
            onPressed: () => context.push('/farm-plan'),
            style: TextButton.styleFrom(padding: EdgeInsets.zero, alignment: Alignment.centerLeft),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('View Farm Plan', style: TextStyle(color: AppTheme.primaryGreen, fontWeight: FontWeight.w800)),
                SizedBox(width: 4),
                Icon(Icons.arrow_forward, size: 16, color: AppTheme.primaryGreen),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildOverviewSection(String lang) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('how_to_farm'.tr(lang), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.green, letterSpacing: 1.5)),
          const SizedBox(height: 16),
          if (_isLoadingOverview)
            const Center(child: CircularProgressIndicator())
          else if (_overview != null)
            Text(_overview!, style: TextStyle(color: Colors.grey.shade800, height: 1.5))
          else
            Text('not_available'.tr(lang), style: const TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildCompleteJourneySection(String? currentStage, String lang) {
    if (currentStage == null) return const SizedBox();
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('complete_journey'.tr(lang), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.5)),
          const SizedBox(height: 16),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: stages.map((s) {
                final isPast = stages.indexOf(currentStage) > stages.indexOf(s);
                final isCurrent = currentStage == s;
                return Padding(
                  padding: const EdgeInsets.only(right: 16.0),
                  child: Column(
                    children: [
                      Container(
                        width: 40, height: 40,
                        decoration: BoxDecoration(
                          color: isPast ? Colors.green : (isCurrent ? Colors.indigo : Colors.grey.shade200),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          isPast ? Icons.check : (isCurrent ? Icons.trending_up : Icons.schedule),
                          color: isPast || isCurrent ? Colors.white : Colors.grey.shade400,
                          size: 20,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(s, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: isCurrent ? Colors.indigo : (isPast ? Colors.green : Colors.grey))),
                      if (isCurrent) Text('you_are_here'.tr(lang), style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.indigoAccent)),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTodayWorkSection(String lang) {
    final timelineOps = _scheduleData?['operations'] as List<dynamic>? ?? [];
    final currentSchedOp = timelineOps.firstWhere((o) => o['status'] != 'COMPLETED', orElse: () => null);
    final actualCurrentOp = _operations.firstWhere((o) => o['status'] != 'COMPLETED', orElse: () => null);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border(
          top: BorderSide(color: Colors.green.withValues(alpha: 0.3)),
          right: BorderSide(color: Colors.green.withValues(alpha: 0.3)),
          bottom: BorderSide(color: Colors.green.withValues(alpha: 0.3)),
          left: const BorderSide(color: Colors.green, width: 4),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('todays_work'.tr(lang), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.green, letterSpacing: 1.5)),
          const SizedBox(height: 16),
          if (_isLoadingOps || _isLoadingSchedule)
            const CircularProgressIndicator()
          else if (actualCurrentOp != null || currentSchedOp != null) ...[
            Text((actualCurrentOp?['name'] ?? currentSchedOp['name']).toString().toUpperCase(), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(12)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('why_do_this'.tr(lang), style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.green.shade800)),
                  const SizedBox(height: 4),
                  Text(currentSchedOp?['reason'] ?? 'not_available'.tr(lang), style: TextStyle(color: Colors.grey.shade800)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () => _showFeedbackModal(actualCurrentOp?['id'] ?? currentSchedOp['operationId'], lang),
              icon: const Icon(Icons.check_circle_outline),
              label: Text('mark_completed'.tr(lang)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 50),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            if (currentSchedOp?['equipment'] != null) ...[
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 8),
              Text('equipment_needed'.tr(lang), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
              const SizedBox(height: 8),
              Text(currentSchedOp!['equipment']['name'] ?? 'not_available'.tr(lang), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => context.push('/marketplace?equipmentId=${currentSchedOp!['equipment']['id']}'),
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.indigo, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                      child: Text('book_machine'.tr(lang)),
                    ),
                  ),
                ],
              )
            ]
          ] else
            Text('no_scheduled_work'.tr(lang), style: const TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildNextWorkSection(String lang) {
    final timelineOps = _scheduleData?['operations'] as List<dynamic>? ?? [];
    final currentSchedOp = timelineOps.firstWhere((o) => o['status'] != 'COMPLETED', orElse: () => null);
    final nextSchedOp = timelineOps.firstWhere((o) => o['operationId'] != currentSchedOp?['operationId'] && o['status'] != 'COMPLETED', orElse: () => null);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border(
          top: BorderSide(color: Colors.indigo.withValues(alpha: 0.2)),
          right: BorderSide(color: Colors.indigo.withValues(alpha: 0.2)),
          bottom: BorderSide(color: Colors.indigo.withValues(alpha: 0.2)),
          left: const BorderSide(color: Colors.indigoAccent, width: 4),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('next_work'.tr(lang), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.indigo, letterSpacing: 1.5)),
          const SizedBox(height: 16),
          if (_isLoadingSchedule)
            const CircularProgressIndicator()
          else if (nextSchedOp != null) ...[
            Text(nextSchedOp['name']?.toString().toUpperCase() ?? 'not_available'.tr(lang), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
            const SizedBox(height: 8),
            Text(nextSchedOp['reason'] ?? 'not_available'.tr(lang), style: TextStyle(color: Colors.grey.shade700, fontSize: 13)),
          ] else
            Text('no_upcoming_work'.tr(lang), style: const TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildJourneyTimeline(String lang) {
    final completedOps = _operations.where((o) => o['status'] == 'COMPLETED').toList();
    if (completedOps.isEmpty) return const SizedBox();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('journey'.tr(lang), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.5)),
          const SizedBox(height: 16),
          ...completedOps.map((op) => Padding(
            padding: const EdgeInsets.only(bottom: 12.0),
            child: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.green, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(op['name']?.toString().toUpperCase() ?? '', style: const TextStyle(fontWeight: FontWeight.bold, decoration: TextDecoration.lineThrough, color: Colors.grey)),
                      Text('${'yes_completed'.tr(lang)}: ${DateFormat.yMd().format(DateTime.parse(op['completedAt']))}', style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildSpendingSection(String lang) {
    final total = _analytics?['totalSpent'];
    final active = _analytics?['activeRentals'];
    final pending = _analytics?['pendingBookings'];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('my_farm_spending'.tr(lang), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.5)),
          const SizedBox(height: 16),
          Row(
            children: [
              _buildSpendMetric('total'.tr(lang), total != null ? 'Ã¢â€šÂ¹$total' : 'not_available'.tr(lang), Colors.green),
              const SizedBox(width: 12),
              _buildSpendMetric('active'.tr(lang), active != null ? '$active' : 'not_available'.tr(lang), Colors.indigo),
              const SizedBox(width: 12),
              _buildSpendMetric('pending'.tr(lang), pending != null ? '$pending' : 'not_available'.tr(lang), Colors.orange),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSpendMetric(String title, String val, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade200)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey.shade500)),
            const SizedBox(height: 4),
            Text(val, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
          ],
        ),
      ),
    );
  }

  Widget _buildBudgetSection(String lang) {
    final bState = _budgetData?['financialState'];
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('budget_tracker'.tr(lang), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.5)),
          const SizedBox(height: 16),
          if (_isLoadingBudget)
            const CircularProgressIndicator()
          else if (bState != null) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('budget'.tr(lang), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                    Text(bState['totalBudget'] != null ? 'Ã¢â€šÂ¹${bState['totalBudget']}' : 'not_available'.tr(lang), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('planned'.tr(lang), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                    Text(bState['projectedTotalCost'] != null ? 'Ã¢â€šÂ¹${bState['projectedTotalCost']}' : 'not_available'.tr(lang), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.orange)),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('remaining'.tr(lang), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                    Text(bState['remainingBudget'] != null ? 'Ã¢â€šÂ¹${bState['remainingBudget']}' : 'not_available'.tr(lang), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.green)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 8),
            Text(bState['budgetStatus']?.toString().toUpperCase() ?? 'not_available'.tr(lang), style: const TextStyle(fontWeight: FontWeight.bold)),
          ] else
            Text('not_available'.tr(lang), style: const TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildLearningSection(String crop, String stage, String lang) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('learning'.tr(lang), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.5)),
          const SizedBox(height: 16),
          ...['Sowing', 'Vegetative care', 'Flowering care'].map((topic) {
            final query = Uri.encodeComponent('$crop $topic $lang');
            return Padding(
              padding: const EdgeInsets.only(bottom: 8.0),
              child: ListTile(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade200)),
                tileColor: Colors.grey.shade50,
                title: Text('${'watch_videos'.tr(lang)} $topic', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                trailing: const Icon(Icons.play_circle_fill, color: Colors.red),
                onTap: () => _launchURL('https://www.youtube.com/results?search_query=$query'),
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildCopilotSection(String lang) {
    return InkWell(
      onTap: () {
        if (_currentFarmId != null && _currentCropId != null) {
          context.push('/farm-copilot?farmId=$_currentFarmId&cropId=$_currentCropId');
        }
      },
      borderRadius: BorderRadius.circular(24),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: [Colors.green.shade50, Colors.indigo.shade50]),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.green.shade200),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
              child: const Icon(Icons.smart_toy, color: Colors.green),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('ask_farm_copilot'.tr(lang), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.green)),
                  const SizedBox(height: 4),
                  Text('ask_anything'.tr(lang), style: TextStyle(fontSize: 12, color: Colors.grey.shade700)),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios, color: Colors.green, size: 16),
          ],
        ),
      ),
    );
  }
}
