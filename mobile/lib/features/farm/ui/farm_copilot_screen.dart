import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../shared/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../../weather/providers/weather_provider.dart';
import '../models/farm_model.dart';
import '../providers/farm_provider.dart';
import '../providers/copilot_provider.dart';

class FarmCopilotScreen extends ConsumerStatefulWidget {
  final String farmId;
  final String cropId;

  const FarmCopilotScreen({
    super.key,
    required this.farmId,
    required this.cropId,
  });

  @override
  ConsumerState<FarmCopilotScreen> createState() => _FarmCopilotScreenState();
}

class _FarmCopilotScreenState extends ConsumerState<FarmCopilotScreen> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  String _activeFarmId = '';
  String _activeCropId = '';
  String _activeCropName = '';
  String _activeCropStage = '';

  @override
  void initState() {
    super.initState();
    _activeFarmId = widget.farmId;
    _activeCropId = widget.cropId;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _resolveFarmAndInitialize();
    });
  }

  Future<void> _resolveFarmAndInitialize() async {
    final farmState = ref.read(farmProvider);
    if (farmState.farms.isEmpty) {
      await ref.read(farmProvider.notifier).fetchFarms();
    }

    final selectedFarm = ref.read(farmProvider).selectedFarm;
    if (selectedFarm != null) {
      if (_activeFarmId.isEmpty) {
        _activeFarmId = selectedFarm.id;
      }
      if (_activeCropId.isEmpty && selectedFarm.crops.isNotEmpty) {
        final crop = selectedFarm.crops.first;
        _activeCropId = crop.id;
        _activeCropName = crop.cropName;
        _activeCropStage = crop.stage;
      } else if (_activeCropId.isNotEmpty) {
        for (final c in selectedFarm.crops) {
          if (c.id == _activeCropId) {
            _activeCropName = c.cropName;
            _activeCropStage = c.stage;
            break;
          }
        }
      }
    }

    final user = ref.read(authProvider).user;
    final userName = user?.name.split(' ').first ?? 'Farmer';

    ref.read(copilotProvider.notifier).initForFarm(
      farmId: _activeFarmId,
      cropId: _activeCropId,
      cropName: _activeCropName,
      userName: userName,
    );
  }

  Future<void> _sendMessage(String text, String lang) async {
    final query = text.trim();
    if (query.isEmpty) return;

    final copilotState = ref.read(copilotProvider);
    if (copilotState.isLoading) return;

    final notifier = ref.read(copilotProvider.notifier);

    // Keep query in controller in case of failure; clear on success
    final success = await notifier.askQuestion(
      query: query,
      farmId: _activeFarmId,
      cropId: _activeCropId,
      language: lang,
    );

    if (success) {
      _controller.clear();
      _scrollToBottom();
    } else {
      _scrollToBottom();
    }
  }

  Future<void> _addStepsToPlan(List<String> steps, String lang) async {
    if (_activeFarmId.isEmpty || _activeCropId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('missing_farm_context'.tr(lang))),
      );
      return;
    }

    final success = await ref.read(copilotProvider.notifier).addToPlan(
      farmId: _activeFarmId,
      cropId: _activeCropId,
      steps: steps,
      stage: _activeCropStage.isNotEmpty ? _activeCropStage : null,
    );

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            success ? 'plan_added_success'.tr(lang) : 'plan_added_failed'.tr(lang),
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          backgroundColor: success ? AppTheme.primaryGreen : const Color(0xFFC62828),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOutCubic,
        );
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final copilotState = ref.watch(copilotProvider);
    final farmState = ref.watch(farmProvider);
    final currentFarm = farmState.selectedFarm;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_ios_new_rounded,
            size: 20,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
          onPressed: () {
            if (Navigator.of(context).canPop()) {
              Navigator.of(context).pop();
            } else if (context.canPop()) {
              context.pop();
            } else {
              context.go('/farmer');
            }
          },
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'farmer_assistant'.tr(lang),
              style: TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 18,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
            ),
            Text(
              'ai_agronomic_intelligence'.tr(lang),
              style: TextStyle(
                fontSize: 11,
                color: isDark ? Colors.grey.shade400 : AppTheme.textMutedGray,
              ),
            ),
          ],
        ),
        actions: [
          PopupMenuButton<String>(
            tooltip: 'Select Language',
            initialValue: lang,
            icon: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.primaryGreen.withValues(alpha: 0.3)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.language, size: 16, color: AppTheme.primaryGreen),
                  const SizedBox(width: 4),
                  Text(
                    lang.toUpperCase(),
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryGreen,
                    ),
                  ),
                ],
              ),
            ),
            onSelected: (newLang) {
              ref.read(languageProvider.notifier).setLanguage(newLang);
            },
            itemBuilder: (context) => const [
              PopupMenuItem(value: 'en', child: Text('English (EN)')),
              PopupMenuItem(value: 'te', child: Text('తెలుగు (TE)')),
              PopupMenuItem(value: 'hi', child: Text('हिन्दी (HI)')),
              PopupMenuItem(value: 'ta', child: Text('தமிழ் (TA)')),
              PopupMenuItem(value: 'kn', child: Text('ಕನ್ನಡ (KN)')),
            ],
          ),
          const SizedBox(width: 8),
        ],
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: isDark ? Colors.white10 : Colors.grey.shade200, height: 1),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // 1. Authoritative Farm Facts Header
            if (currentFarm != null)
              _buildAuthoritativeFarmFactsBar(currentFarm, lang, isDark)
            else
              _buildMissingFarmContextWarning(lang, isDark),

            // 2. Agronomic Safety Disclaimer
            _buildSafetyDisclaimer(lang, isDark),

            // 3. Conversation Message Stream
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                itemCount: copilotState.messages.length,
                itemBuilder: (context, index) {
                  final msg = copilotState.messages[index];
                  return _buildMessageBubble(msg, lang, isDark);
                },
              ),
            ),

            // 4. Quick Suggested Questions
            if (copilotState.messages.length <= 1 && !copilotState.isLoading)
              _buildQuickPrompts(lang, isDark),

            // 5. Thinking Indicator
            if (copilotState.isLoading)
              _buildThinkingIndicator(lang, isDark),

            // 6. Composer Input Area
            _buildInputArea(copilotState, lang, isDark),
          ],
        ),
      ),
    );
  }

  Widget _buildAuthoritativeFarmFactsBar(FarmModel farm, String lang, bool isDark) {
    final weatherState = _activeFarmId.isNotEmpty ? ref.watch(weatherProvider(_activeFarmId)) : null;
    final currentTemp = weatherState?.weatherData?.current.temperature;
    final weatherText = currentTemp != null ? '${currentTemp.round()}°C' : null;

    final cropInfo = _activeCropName.isNotEmpty
        ? '$_activeCropName${_activeCropStage.isNotEmpty ? ' • $_activeCropStage' : ''}'
        : 'No Crop Registered';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard.withValues(alpha: 0.7) : const Color(0xFFF1F8E9),
        border: Border(
          bottom: BorderSide(
            color: isDark ? Colors.white10 : const Color(0xFFDCEDC8),
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: AppTheme.primaryGreen.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.verified_outlined, color: AppTheme.primaryGreen, size: 16),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Text(
                      'authoritative_farm_facts'.tr(lang).toUpperCase(),
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                        color: AppTheme.primaryGreen,
                      ),
                    ),
                    if (weatherText != null) ...[
                      const Spacer(),
                      const Icon(Icons.cloud_outlined, size: 12, color: AppTheme.primaryGreen),
                      const SizedBox(width: 4),
                      Text(
                        weatherText,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primaryGreen,
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  '${farm.name} • $cropInfo • ${farm.area} ${farm.areaUnit}',
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w600,
                    color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMissingFarmContextWarning(String lang, bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? Colors.amber.shade900.withValues(alpha: 0.2) : const Color(0xFFFFF8E1),
        border: Border(
          bottom: BorderSide(color: Colors.amber.shade300, width: 1),
        ),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline_rounded, color: Colors.amber, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'select_farm_prompt'.tr(lang),
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: isDark ? Colors.amber.shade200 : Colors.amber.shade900,
              ),
            ),
          ),
          TextButton(
            onPressed: () => context.push('/farm-setup'),
            child: Text('add_farm'.tr(lang), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildSafetyDisclaimer(String lang, bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      color: isDark ? Colors.black26 : const Color(0xFFF8F9FA),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 1.5),
            child: Icon(Icons.shield_outlined, size: 13, color: Colors.orange),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              'agronomic_safety_disclaimer'.tr(lang),
              style: TextStyle(
                fontSize: 10,
                height: 1.35,
                color: isDark ? Colors.white60 : AppTheme.textMutedGray,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(CopilotMessage msg, String lang, bool isDark) {
    final isFarmer = msg.isFarmer;

    return Align(
      alignment: isFarmer ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6),
        padding: const EdgeInsets.all(16),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.88),
        decoration: BoxDecoration(
          color: isFarmer
              ? AppTheme.primaryGreen
              : (msg.isError
                  ? (isDark ? Colors.red.shade900.withValues(alpha: 0.3) : const Color(0xFFFFEBEE))
                  : (isDark ? AppTheme.darkCard : Colors.white)),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(20),
            topRight: const Radius.circular(20),
            bottomLeft: Radius.circular(isFarmer ? 20 : 4),
            bottomRight: Radius.circular(isFarmer ? 4 : 20),
          ),
          border: Border.all(
            color: isFarmer
                ? AppTheme.primaryGreen
                : (msg.isError
                    ? Colors.red.shade300
                    : (isDark ? Colors.white10 : Colors.grey.shade200)),
          ),
          boxShadow: isFarmer
              ? null
              : [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!isFarmer) ...[
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: msg.isError
                          ? Colors.red.withValues(alpha: 0.2)
                          : AppTheme.primaryGreen.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      msg.isError ? Icons.cloud_off_rounded : Icons.smart_toy_rounded,
                      size: 14,
                      color: msg.isError ? Colors.red : AppTheme.primaryGreen,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'farmer_assistant'.tr(lang),
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w900,
                      color: msg.isError ? Colors.red : AppTheme.primaryGreen,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
            ],

            // Message Body Text
            Text(
              msg.text,
              style: TextStyle(
                color: isFarmer
                    ? Colors.white
                    : (msg.isError
                        ? (isDark ? Colors.red.shade200 : Colors.red.shade900)
                        : (isDark ? Colors.grey.shade100 : AppTheme.textDarkNavy)),
                height: 1.45,
                fontSize: 13.5,
              ),
            ),

            // Retry Button on Failure
            if (msg.isError && msg.lastQuery != null) ...[
              const SizedBox(height: 12),
              ElevatedButton.icon(
                onPressed: () {
                  _controller.text = msg.lastQuery!;
                  _sendMessage(msg.lastQuery!, lang);
                },
                icon: const Icon(Icons.refresh_rounded, size: 16),
                label: Text('retry_query'.tr(lang)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFC62828),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ),
            ],

            // Rich Content (Actionable steps, warnings, recommended equipment)
            if (!isFarmer && !msg.isError) _buildRichContent(msg, lang, isDark),
          ],
        ),
      ),
    );
  }

  Widget _buildRichContent(CopilotMessage msg, String lang, bool isDark) {
    final steps = msg.actionableSteps;
    final warnings = msg.warnings;
    final equipment = msg.recommendedEquipment;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Actionable Steps
        if (steps.isNotEmpty) ...[
          const SizedBox(height: 14),
          Divider(color: isDark ? Colors.white10 : Colors.grey.shade200),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  'suggested_planned_tasks'.tr(lang),
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.lightGreenAccent : AppTheme.primaryGreen,
                  ),
                ),
              ),
              TextButton.icon(
                onPressed: () => _addStepsToPlan(steps, lang),
                icon: const Icon(Icons.playlist_add_check_rounded, size: 16),
                label: Text('add_all_to_plan'.tr(lang), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                style: TextButton.styleFrom(
                  foregroundColor: AppTheme.primaryGreen,
                  padding: EdgeInsets.zero,
                  visualDensity: VisualDensity.compact,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ...steps.map((s) => Padding(
            padding: const EdgeInsets.only(bottom: 6.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.only(top: 2),
                  child: Icon(Icons.check_circle_outline_rounded, size: 15, color: AppTheme.primaryGreen),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    s,
                    style: TextStyle(
                      fontSize: 12.5,
                      height: 1.4,
                      color: isDark ? Colors.grey.shade200 : Colors.grey.shade800,
                    ),
                  ),
                ),
              ],
            ),
          )),
        ],

        // Warnings / Alerts
        if (warnings.isNotEmpty) ...[
          const SizedBox(height: 14),
          Divider(color: isDark ? Colors.white10 : Colors.grey.shade200),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.warning_amber_rounded, size: 16, color: Colors.orange),
              const SizedBox(width: 6),
              Text(
                'agronomic_alerts'.tr(lang),
                style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w900, color: Colors.orange),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ...warnings.map((w) => Container(
            margin: const EdgeInsets.only(bottom: 6),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.orange.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
            ),
            child: Text(
              w,
              style: const TextStyle(fontSize: 12, color: Colors.orange, height: 1.4),
            ),
          )),
        ],

        // Recommended Machinery from Real Marketplace Records
        if (equipment.isNotEmpty) ...[
          const SizedBox(height: 14),
          Divider(color: isDark ? Colors.white10 : Colors.grey.shade200),
          const SizedBox(height: 6),
          Text(
            'recommended_machinery'.tr(lang),
            style: TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w900,
              color: isDark ? Colors.white : AppTheme.textDarkNavy,
            ),
          ),
          const SizedBox(height: 8),
          ...equipment.map((eq) {
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withValues(alpha: 0.05) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.agriculture_rounded, color: AppTheme.primaryGreen, size: 22),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          eq.equipmentName,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        if (eq.whyNeeded.isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Text(
                            eq.whyNeeded,
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark ? Colors.grey.shade400 : AppTheme.textMutedGray,
                            ),
                          ),
                        ],
                        if (eq.pricePerDay > 0) ...[
                          const SizedBox(height: 4),
                          Text(
                            '₹ ${eq.pricePerDay.toStringAsFixed(0)} / day',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.primaryGreen,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  if (eq.equipmentId.isNotEmpty)
                    IconButton(
                      icon: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                      color: AppTheme.primaryGreen,
                      onPressed: () => context.push('/equipment/${eq.equipmentId}'),
                    ),
                ],
              ),
            );
          }),
        ],

        // Farming Guides Link
        const SizedBox(height: 10),
        Align(
          alignment: Alignment.centerLeft,
          child: TextButton.icon(
            onPressed: () => context.push('/knowledge-base'),
            icon: const Icon(Icons.menu_book_rounded, size: 16),
            label: Text('view_farming_guides'.tr(lang), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            style: TextButton.styleFrom(
              foregroundColor: AppTheme.primaryGreen,
              padding: EdgeInsets.zero,
              visualDensity: VisualDensity.compact,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildThinkingIndicator(String lang, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(
                width: 14,
                height: 14,
                child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primaryGreen),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  'analyzing_farm_conditions'.tr(lang),
                  style: TextStyle(
                    color: isDark ? Colors.grey.shade400 : AppTheme.textMutedGray,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              InkWell(
                onTap: () {
                  ref.read(copilotProvider.notifier).cancel();
                },
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.close_rounded, size: 14, color: isDark ? Colors.red.shade300 : Colors.red),
                      const SizedBox(width: 2),
                      Text(
                        'Cancel',
                        style: TextStyle(
                          color: isDark ? Colors.red.shade300 : Colors.red,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickPrompts(String lang, bool isDark) {
    final prompts = [
      '🌾 Best practices for current crop stage',
      '🚜 Recommended machinery for my farm',
      '💧 Ideal irrigation and fertilizer schedule',
      '🐛 How to identify and control pests',
    ];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'suggested_questions'.tr(lang),
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: prompts.map((p) => InkWell(
              onTap: () => _sendMessage(p.replaceFirst(RegExp(r'^[^\w]+'), '').trim(), lang),
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.darkCard : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: isDark ? Colors.white12 : Colors.grey.shade300),
                ),
                child: Text(
                  p,
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                  ),
                ),
              ),
            )).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildInputArea(CopilotState state, String lang, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        border: Border(
          top: BorderSide(color: isDark ? Colors.white10 : Colors.grey.shade200),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              constraints: const BoxConstraints(maxHeight: 120),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkBackground : const Color(0xFFF4F6F5),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: isDark ? Colors.white12 : const Color(0xFFE0E0E0),
                  width: 1,
                ),
              ),
              child: TextField(
                controller: _controller,
                enabled: !state.isLoading,
                minLines: 1,
                maxLines: 4,
                textCapitalization: TextCapitalization.sentences,
                style: TextStyle(
                  fontSize: 14,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
                decoration: InputDecoration(
                  hintText: 'ask_copilot_hint'.tr(lang),
                  hintStyle: TextStyle(
                    color: isDark ? Colors.white38 : AppTheme.textMutedGray,
                    fontSize: 13,
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
                  border: InputBorder.none,
                  isDense: true,
                ),
                onSubmitted: (val) => _sendMessage(val, lang),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: state.isLoading ? null : () => _sendMessage(_controller.text, lang),
              borderRadius: BorderRadius.circular(24),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: state.isLoading
                      ? (isDark ? Colors.white10 : Colors.grey.shade300)
                      : AppTheme.primaryGreen,
                  shape: BoxShape.circle,
                ),
                child: state.isLoading
                    ? const Center(
                        child: SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.2,
                            color: Colors.white,
                          ),
                        ),
                      )
                    : const Icon(
                        Icons.send_rounded,
                        color: Colors.white,
                        size: 20,
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
