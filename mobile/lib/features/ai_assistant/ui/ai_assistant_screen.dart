import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../core/services/tts_service.dart';
import '../../../shared/theme/app_theme.dart';
import '../../farm/providers/farm_provider.dart';
import '../../marketplace/ui/equipment_details_screen.dart';
import '../services/ai_assistant_service.dart';
import 'voice_interaction_modal.dart';

class AiAssistantScreen extends ConsumerStatefulWidget {
  final String query;
  final AiAssistantResponse? initialResult;

  const AiAssistantScreen({
    super.key,
    required this.query,
    this.initialResult,
  });

  @override
  ConsumerState<AiAssistantScreen> createState() => _AiAssistantScreenState();
}

class _AiAssistantScreenState extends ConsumerState<AiAssistantScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _queryController = TextEditingController();
  final TtsService _ttsService = TtsService();

  AiAssistantResponse? _response;
  bool _isLoading = false;
  bool _isSpeaking = false;
  bool _isPlanAdded = false;

  @override
  void initState() {
    super.initState();
    _queryController.text = widget.query;
    _response = widget.initialResult;

    _tabController = TabController(length: 4, vsync: this);

    if (_response == null) {
      _loadAdvice(widget.query);
    }
  }

  Future<void> _loadAdvice(String q) async {
    setState(() => _isLoading = true);
    final lang = ref.read(languageProvider);
    final farmState = ref.read(farmProvider);
    final currentFarm = farmState.selectedFarm;
    final currentCrop = currentFarm?.crops.isNotEmpty == true ? currentFarm!.crops.first : null;

    try {
      final res = await AiAssistantService().askAssistant(
        query: q,
        language: lang,
        farmId: currentFarm?.id,
        cropId: currentCrop?.id,
        cropName: currentCrop?.cropName,
        stage: currentCrop?.stage,
        acreage: currentFarm?.area.toString(),
        location: currentFarm?.location,
      );
      if (mounted) {
        setState(() {
          _response = res;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _toggleListen() async {
    if (_response == null) return;
    final lang = ref.read(languageProvider);

    if (_isSpeaking) {
      await _ttsService.stop();
      setState(() => _isSpeaking = false);
    } else {
      setState(() => _isSpeaking = true);
      final textToSpeak = _response!.adviceText;
      final ok = await _ttsService.speak(textToSpeak, languageCode: lang);
      if (mounted && !ok) {
        setState(() => _isSpeaking = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Audio speech engine not available for this language.')),
        );
      }
    }
  }

  void _savePrimaryTask() async {
    if (_response == null || _response!.tasks.isEmpty) return;
    final primaryTask = _response!.tasks.first;
    final farmId = _response!.farmId;
    final cropId = _response!.cropId;

    if (farmId == null || cropId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please register a farm crop to persist tasks.')),
      );
      return;
    }

    final success = await AiAssistantService().saveSingleTask(
      farmId: farmId,
      cropId: cropId,
      taskTitle: primaryTask.title,
      stage: _response!.stage,
    );

    if (mounted) {
      if (success) {
        setState(() {
          primaryTask.isSaved = true;
        });
        ref.read(farmProvider.notifier).fetchFarms();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Task "${primaryTask.title}" saved to your Farm Tasks!'),
            backgroundColor: AppTheme.primaryGreen,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to save task. Please try again.')),
        );
      }
    }
  }

  void _addPlanToOperations() async {
    if (_response == null || _response!.tasks.isEmpty) return;
    final farmId = _response!.farmId;
    final cropId = _response!.cropId;

    if (farmId == null || cropId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please register a farm crop to add to your plan.')),
      );
      return;
    }

    final steps = _response!.tasks.map((t) => t.title).toList();
    final success = await AiAssistantService().addToPlan(
      farmId: farmId,
      cropId: cropId,
      steps: steps,
      stage: _response!.stage,
    );

    if (mounted) {
      if (success) {
        setState(() => _isPlanAdded = true);
        ref.read(farmProvider.notifier).fetchFarms();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Added ${steps.length} tasks to your Farm Plan!'),
            backgroundColor: AppTheme.primaryGreen,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to add plan to farm operations.')),
        );
      }
    }
  }

  void _showAskMoreDialog() {
    final textController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.chat_bubble_outline_rounded, color: Color(0xFF7C3AED)),
            SizedBox(width: 8),
            Text('Ask Follow-up Question', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
        content: TextField(
          controller: textController,
          maxLines: 3,
          decoration: InputDecoration(
            hintText: 'e.g., Which fertilizer ratio is best for sandy soil?',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final newQ = textController.text.trim();
              if (newQ.isNotEmpty) {
                Navigator.pop(ctx);
                _queryController.text = newQ;
                _loadAdvice(newQ);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF7C3AED),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Ask'),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    _queryController.dispose();
    _ttsService.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final lang = ref.watch(languageProvider);

    final tasksCount = _response?.tasks.length ?? 0;
    final equipCount = _response?.matchingEquipment.length ?? 0;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(130),
        child: SafeArea(
          child: Column(
            children: [
              // Search Input Row matching prototype Screen 4
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 8, 14, 4),
                child: Row(
                  children: [
                    IconButton(
                      icon: Icon(
                        Icons.arrow_back_rounded,
                        color: isDark ? Colors.white : AppTheme.textDarkNavy,
                      ),
                      onPressed: () => context.pop(),
                    ),
                    Expanded(
                      child: Container(
                        height: 48,
                        decoration: BoxDecoration(
                          color: isDark ? AppTheme.darkCard : Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            const SizedBox(width: 12),
                            const Icon(Icons.search_rounded, color: AppTheme.primaryGreen, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                '"${_queryController.text}"',
                                style: TextStyle(
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.w700,
                                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (_queryController.text.isNotEmpty)
                              IconButton(
                                icon: const Icon(Icons.close_rounded, size: 18),
                                color: Colors.grey.shade500,
                                onPressed: () {
                                  setState(() => _queryController.clear());
                                },
                              ),
                            // Microphone quick trigger button
                            GestureDetector(
                              onTap: () => VoiceInteractionModal.show(context),
                              child: Container(
                                margin: const EdgeInsets.only(right: 6),
                                width: 34,
                                height: 34,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF16A34A),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.mic_rounded, color: Colors.white, size: 18),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    IconButton(
                      icon: const Icon(Icons.forum_outlined, color: AppTheme.primaryGreen),
                      tooltip: 'farm_copilot'.tr(lang),
                      onPressed: () {
                        final farm = ref.read(farmProvider).selectedFarm;
                        final fId = farm?.id ?? '';
                        final cId = farm?.crops.isNotEmpty == true ? farm!.crops.first.id : '';
                        context.push('/farm-copilot?farmId=$fId&cropId=$cId');
                      },
                    ),
                  ],
                ),
              ),

              // 4 Tabs: AI Answer | Tasks (X) | Equipment (X) | Learning
              TabBar(
                controller: _tabController,
                isScrollable: true,
                tabAlignment: TabAlignment.start,
                labelColor: AppTheme.primaryGreen,
                unselectedLabelColor: isDark ? Colors.white54 : const Color(0xFF64748B),
                labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5),
                unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                indicatorColor: AppTheme.primaryGreen,
                indicatorWeight: 3,
                tabs: [
                  const Tab(text: 'AI Answer'),
                  Tab(text: tasksCount > 0 ? 'Tasks ($tasksCount)' : 'Tasks'),
                  Tab(text: equipCount > 0 ? 'Equipment ($equipCount)' : 'Equipment'),
                  const Tab(text: 'Learning'),
                ],
              ),
            ],
          ),
        ),
      ),
      body: _isLoading
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: AppTheme.primaryGreen),
                  SizedBox(height: 16),
                  Text('Fetching agricultural guidance...', style: TextStyle(fontWeight: FontWeight.w600)),
                ],
              ),
            )
          : TabBarView(
              controller: _tabController,
              children: [
                _buildAiAnswerTab(isDark, lang),
                _buildTasksTab(isDark, lang),
                _buildEquipmentTab(isDark, lang),
                _buildLearningTab(isDark, lang),
              ],
            ),
      bottomNavigationBar: _buildBottomActionBar(isDark, lang),
    );
  }

  // ---------------------------------------------------------------------------
  // TAB 1: AI ANSWER
  // ---------------------------------------------------------------------------
  Widget _buildAiAnswerTab(bool isDark, String lang) {
    if (_response == null) {
      return const Center(child: Text('No response available.'));
    }

    final nowStr = DateFormat('Today, h:mm a').format(DateTime.now());

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(18, 14, 18, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: AI Recommendation + Timestamp
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: const Color(0xFF7C3AED).withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.auto_awesome_rounded, color: Color(0xFF7C3AED), size: 18),
              ),
              const SizedBox(width: 8),
              Text(
                'AI Recommendation',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
              ),
              const Spacer(),
              Text(
                nowStr,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Grounded Crop Summary Card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.darkCard : Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '${_response!.crop} • ${_response!.stage}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.primaryGreen,
                        ),
                      ),
                    ),
                    if (_response!.acreage != null) ...[
                      const SizedBox(width: 8),
                      Text(
                        '${_response!.acreage} Acres',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.white60 : const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 12),

                // Render Markdown Advice Content
                MarkdownBody(
                  data: _response!.adviceText,
                  styleSheet: MarkdownStyleSheet(
                    p: TextStyle(
                      fontSize: 14.5,
                      height: 1.6,
                      color: isDark ? Colors.grey.shade200 : const Color(0xFF1E293B),
                    ),
                    h3: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                    ),
                    h4: TextStyle(
                      fontSize: 14.5,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                    ),
                    listBullet: const TextStyle(color: AppTheme.primaryGreen, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Weather consideration note card (from reference image)
          if (_response!.weatherNote != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0F2B48) : const Color(0xFFF0F9FF),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFF0284C7).withValues(alpha: 0.3)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.cloud_queue_rounded, color: Color(0xFF0284C7), size: 24),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _response!.weatherNote!,
                      style: TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w600,
                        color: isDark ? const Color(0xFFBAE6FD) : const Color(0xFF0369A1),
                        height: 1.45,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // TAB 2: TASKS
  // ---------------------------------------------------------------------------
  Widget _buildTasksTab(bool isDark, String lang) {
    if (_response == null || _response!.tasks.isEmpty) {
      return const Center(child: Text('No actionable tasks generated for this query.'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(18),
      itemCount: _response!.tasks.length,
      itemBuilder: (ctx, idx) {
        final task = _response!.tasks[idx];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: task.isSaved ? const Color(0xFF16A34A) : AppTheme.primaryGreen.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: task.isSaved
                      ? const Icon(Icons.check_rounded, color: Colors.white, size: 16)
                      : Text(
                          '${idx + 1}',
                          style: const TextStyle(fontWeight: FontWeight.w800, color: AppTheme.primaryGreen, fontSize: 13),
                        ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      task.title,
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 14.5,
                        color: isDark ? Colors.white : AppTheme.textDarkNavy,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      task.description,
                      style: TextStyle(
                        fontSize: 12.5,
                        color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: Icon(
                  task.isSaved ? Icons.bookmark_added_rounded : Icons.bookmark_add_outlined,
                  color: task.isSaved ? const Color(0xFF16A34A) : AppTheme.primaryGreen,
                ),
                onPressed: () async {
                  final fId = _response?.farmId;
                  final cId = _response?.cropId;
                  if (fId != null && cId != null) {
                    final ok = await AiAssistantService().saveSingleTask(
                      farmId: fId,
                      cropId: cId,
                      taskTitle: task.title,
                      stage: _response!.stage,
                    );
                    if (ok && mounted) {
                      setState(() => task.isSaved = true);
                      ref.read(farmProvider.notifier).fetchFarms();
                    }
                  }
                },
              ),
            ],
          ),
        );
      },
    );
  }

  // ---------------------------------------------------------------------------
  // TAB 3: EQUIPMENT
  // ---------------------------------------------------------------------------
  Widget _buildEquipmentTab(bool isDark, String lang) {
    if (_response == null || _response!.matchingEquipment.isEmpty) {
      return const Center(child: Text('No suitable equipment found in current inventory.'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(18),
      itemCount: _response!.matchingEquipment.length,
      itemBuilder: (ctx, idx) {
        final eq = _response!.matchingEquipment[idx];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  width: 64,
                  height: 64,
                  color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                  child: eq.imageUrl.isNotEmpty
                      ? Image.network(
                          eq.imageUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) => const Icon(Icons.agriculture_rounded, color: AppTheme.primaryGreen, size: 30),
                        )
                      : const Icon(Icons.agriculture_rounded, color: AppTheme.primaryGreen, size: 30),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      eq.title,
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                        color: isDark ? Colors.white : AppTheme.textDarkNavy,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${eq.category} • ${eq.location}',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '₹${eq.pricePerDay?.toInt() ?? 1200} / day',
                      style: const TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.primaryGreen,
                      ),
                    ),
                  ],
                ),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => EquipmentDetailsScreen(equipment: eq),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryGreen,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Book', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              ),
            ],
          ),
        );
      },
    );
  }

  // ---------------------------------------------------------------------------
  // TAB 4: LEARNING
  // ---------------------------------------------------------------------------
  Widget _buildLearningTab(bool isDark, String lang) {
    final guides = _response?.learningGuides ?? [];

    return ListView.builder(
      padding: const EdgeInsets.all(18),
      itemCount: guides.length,
      itemBuilder: (ctx, idx) {
        final g = guides[idx];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFF0284C7).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.menu_book_rounded, color: Color(0xFF0284C7), size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      g['title'] ?? 'Guide',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 14.5,
                        color: isDark ? Colors.white : AppTheme.textDarkNavy,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      g['subtitle'] ?? '',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Colors.grey),
            ],
          ),
        );
      },
    );
  }

  // ---------------------------------------------------------------------------
  // BOTTOM ACTION BAR (Listen | Save Task | Add to My Plan | Ask More)
  // ---------------------------------------------------------------------------
  Widget _buildBottomActionBar(bool isDark, String lang) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        border: Border(
          top: BorderSide(
            color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
          ),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            // 1. Listen (TTS)
            _buildActionButton(
              icon: _isSpeaking ? Icons.stop_rounded : Icons.play_arrow_rounded,
              color: const Color(0xFF0284C7),
              label: _isSpeaking ? 'Stop' : 'Listen',
              onTap: _toggleListen,
              isDark: isDark,
            ),

            // 2. Save Task
            _buildActionButton(
              icon: Icons.calendar_today_rounded,
              color: const Color(0xFFD97706),
              label: 'Save Task',
              onTap: _savePrimaryTask,
              isDark: isDark,
            ),

            // 3. Add to My Plan
            _buildActionButton(
              icon: _isPlanAdded ? Icons.check_circle_rounded : Icons.add_circle_rounded,
              color: const Color(0xFF16A34A),
              label: _isPlanAdded ? 'Plan Added' : 'Add to Plan',
              onTap: _addPlanToOperations,
              isDark: isDark,
            ),

            // 4. Ask More
            _buildActionButton(
              icon: Icons.chat_bubble_outline_rounded,
              color: const Color(0xFF7C3AED),
              label: 'Ask More',
              onTap: _showAskMoreDialog,
              isDark: isDark,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required Color color,
    required String label,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
