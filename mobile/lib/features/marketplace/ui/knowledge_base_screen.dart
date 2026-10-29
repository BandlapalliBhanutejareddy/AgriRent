import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../core/localization/app_localizations.dart';

final guidesProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final client = ApiClient();
  final guidesRes = await client.dio.get('/guides');
  final techniquesRes = await client.dio.get('/guides/techniques');

  final rawGuides = (guidesRes.data is Map && guidesRes.data['data'] != null)
      ? guidesRes.data['data']
      : guidesRes.data;
  final rawTechniques = (techniquesRes.data is Map && techniquesRes.data['data'] != null)
      ? techniquesRes.data['data']
      : techniquesRes.data;

  Map<String, dynamic> cropsMap = {};
  if (rawGuides is Map<String, dynamic>) {
    cropsMap = rawGuides;
  } else if (rawGuides is Map) {
    cropsMap = Map<String, dynamic>.from(rawGuides);
  }

  List<dynamic> techniquesList = [];
  if (rawTechniques is List) {
    techniquesList = rawTechniques;
  }

  return {
    'crops': cropsMap,
    'techniques': techniquesList,
  };
});

class KnowledgeBaseScreen extends ConsumerStatefulWidget {
  final String? initialCrop;

  const KnowledgeBaseScreen({super.key, this.initialCrop});

  @override
  ConsumerState<KnowledgeBaseScreen> createState() => _KnowledgeBaseScreenState();
}

class _KnowledgeBaseScreenState extends ConsumerState<KnowledgeBaseScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _selectedCropFilter = 'ALL';

  static const Color brandPrimary = Color(0xFF163A2D);
  static const Color brandAccent = Color(0xFF84CC16);

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    if (widget.initialCrop != null && widget.initialCrop!.isNotEmpty) {
      final cropInit = widget.initialCrop!.trim();
      _selectedCropFilter = cropInit;
      _searchController.text = cropInit;
      _searchQuery = cropInit.toLowerCase();
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  IconData _getCropIcon(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('rice') || lower.contains('paddy')) return Icons.grass_rounded;
    if (lower.contains('wheat')) return Icons.grain_rounded;
    if (lower.contains('cotton')) return Icons.cloud_outlined;
    if (lower.contains('sugarcane')) return Icons.forest_rounded;
    if (lower.contains('corn') || lower.contains('maize')) return Icons.agriculture_rounded;
    if (lower.contains('potato')) return Icons.spa_rounded;
    if (lower.contains('tomato')) return Icons.eco_rounded;
    return Icons.eco_rounded;
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final kbAsync = ref.watch(guidesProvider);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF121B15) : const Color(0xFFF9FBF9),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF1A261F) : Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_rounded, color: isDark ? Colors.white : brandPrimary),
          onPressed: () {
            if (Navigator.canPop(context)) {
              Navigator.pop(context);
            } else {
              context.go('/home');
            }
          },
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'learning'.tr(lang),
              style: TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 20,
                color: isDark ? Colors.white : brandPrimary,
              ),
            ),
            Text(
              'knowledge_base'.tr(lang),
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: isDark ? Colors.white70 : Colors.grey.shade600,
              ),
            ),
          ],
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: brandAccent,
          unselectedLabelColor: isDark ? Colors.white60 : Colors.grey.shade600,
          indicatorColor: brandAccent,
          indicatorWeight: 3,
          indicatorSize: TabBarIndicatorSize.tab,
          labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          tabs: [
            Tab(
              icon: const Icon(Icons.menu_book_rounded, size: 20),
              text: 'crop_guides'.tr(lang),
            ),
            Tab(
              icon: const Icon(Icons.biotech_rounded, size: 20),
              text: 'modern_techniques'.tr(lang),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Search & Filter Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: isDark ? const Color(0xFF1A261F) : Colors.white,
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  style: TextStyle(color: isDark ? Colors.white : AppTheme.textDark, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'search_articles'.tr(lang),
                    hintStyle: TextStyle(color: isDark ? Colors.white38 : Colors.grey.shade500, fontSize: 13),
                    prefixIcon: const Icon(Icons.search_rounded, color: brandPrimary, size: 20),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear_rounded, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              setState(() {
                                _searchQuery = '';
                                _selectedCropFilter = 'ALL';
                              });
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: isDark ? const Color(0xFF223128) : const Color(0xFFF1F5F2),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  onChanged: (val) {
                    setState(() {
                      _searchQuery = val.trim().toLowerCase();
                      if (_searchQuery.isNotEmpty &&
                          _selectedCropFilter != 'ALL' &&
                          !_selectedCropFilter.toLowerCase().contains(_searchQuery)) {
                        _selectedCropFilter = 'ALL';
                      }
                    });
                  },
                ),
              ],
            ),
          ),

          // Main Content
          Expanded(
            child: kbAsync.when(
              loading: () => const Center(
                child: CircularProgressIndicator(color: brandPrimary, strokeWidth: 3),
              ),
              error: (err, stack) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.cloud_off_rounded, color: Colors.redAccent, size: 56),
                      const SizedBox(height: 16),
                      Text(
                        'failed_to_load'.tr(lang),
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white : AppTheme.textDark,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        err.toString(),
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: () => ref.refresh(guidesProvider),
                        icon: const Icon(Icons.refresh_rounded, size: 18),
                        label: Text('retry'.tr(lang), style: const TextStyle(fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: brandPrimary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              data: (data) {
                final crops = data['crops'] as Map<String, dynamic>;
                final techniques = data['techniques'] as List<dynamic>;

                final cropNames = crops.keys.toList()..sort();
                final filteredCropNames = cropNames.where((c) {
                  final cLower = c.toLowerCase();
                  if (_searchQuery.isNotEmpty) {
                    final matchesSearch = cLower.contains(_searchQuery);
                    final matchesFilter = _selectedCropFilter == 'ALL' || cLower == _selectedCropFilter.toLowerCase();
                    return matchesSearch || matchesFilter;
                  }
                  return _selectedCropFilter == 'ALL' || cLower == _selectedCropFilter.toLowerCase();
                }).toList();

                final filteredTechniques = techniques.where((t) {
                  final title = (t['title'] ?? '').toString().toLowerCase();
                  final crop = (t['relatedCrop'] ?? '').toString().toLowerCase();
                  return _searchQuery.isEmpty || title.contains(_searchQuery) || crop.contains(_searchQuery);
                }).toList();

                return TabBarView(
                  controller: _tabController,
                  children: [
                    // Tab 1: Crop Guides
                    Column(
                      children: [
                        // Quick Horizontal Filter Chips
                        Container(
                          height: 48,
                          padding: const EdgeInsets.symmetric(vertical: 6),
                          child: ListView(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            children: [
                              _buildCropFilterChip('ALL', 'all'.tr(lang), isDark),
                              ...cropNames.map((c) => _buildCropFilterChip(c, c, isDark)),
                            ],
                          ),
                        ),
                        Expanded(
                          child: filteredCropNames.isEmpty
                              ? _buildEmptyState(lang, isDark)
                              : ListView.builder(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  itemCount: filteredCropNames.length,
                                  itemBuilder: (ctx, idx) {
                                    final crop = filteredCropNames[idx];
                                    final steps = (crops[crop] as List<dynamic>?) ?? [];
                                    return _buildCropGuideCard(ctx, crop, steps, lang, isDark);
                                  },
                                ),
                        ),
                      ],
                    ),

                    // Tab 2: Modern Techniques
                    filteredTechniques.isEmpty
                        ? _buildEmptyState(lang, isDark)
                        : ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            itemCount: filteredTechniques.length,
                            itemBuilder: (ctx, idx) {
                              final tech = filteredTechniques[idx] as Map<String, dynamic>;
                              return _buildTechniqueCard(ctx, tech, lang, isDark);
                            },
                          ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCropFilterChip(String value, String label, bool isDark) {
    final isSelected = _selectedCropFilter == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        selected: isSelected,
        label: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
            color: isSelected
                ? brandPrimary
                : (isDark ? Colors.white70 : const Color(0xFF334155)),
          ),
        ),
        selectedColor: brandAccent.withValues(alpha: 0.35),
        backgroundColor: isDark ? const Color(0xFF223128) : Colors.white,
        checkmarkColor: brandPrimary,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: isSelected ? brandAccent : (isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
          ),
        ),
        onSelected: (_) {
          setState(() {
            _selectedCropFilter = value;
            if (value != 'ALL') {
              _searchController.clear();
              _searchQuery = '';
            }
          });
        },
      ),
    );
  }

  Widget _buildEmptyState(String lang, bool isDark) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off_rounded, size: 56, color: Colors.grey.shade400),
          const SizedBox(height: 12),
          Text(
            'no_articles_found'.tr(lang),
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white70 : AppTheme.textDark,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCropGuideCard(
    BuildContext context,
    String cropName,
    List<dynamic> steps,
    String lang,
    bool isDark,
  ) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      color: isDark ? const Color(0xFF1E2B22) : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () => _openGuideDetails(context, cropName, steps, isCrop: true, lang: lang, isDark: isDark),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              // Crop Icon Container
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: brandPrimary.withValues(alpha: isDark ? 0.4 : 0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: brandAccent.withValues(alpha: 0.4)),
                ),
                child: Center(
                  child: Icon(
                    _getCropIcon(cropName),
                    color: brandAccent,
                    size: 28,
                  ),
                ),
              ),
              const SizedBox(width: 14),

              // Title and Step Count
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'crop_guide'.tr(lang).toUpperCase(),
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.8,
                            color: brandAccent,
                          ),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: brandPrimary.withValues(alpha: isDark ? 0.3 : 0.08),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '${steps.length} Steps',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: isDark ? brandAccent : brandPrimary,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      cropName,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: isDark ? Colors.white : AppTheme.textDark,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      steps.isNotEmpty && steps[0]['stepTitle'] != null
                          ? 'Starts with: ${steps[0]['stepTitle']}'
                          : 'Comprehensive agronomic guide',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? Colors.white60 : Colors.grey.shade600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Icon(Icons.arrow_forward_ios_rounded, size: 16, color: Colors.grey.shade400),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTechniqueCard(
    BuildContext context,
    Map<String, dynamic> tech,
    String lang,
    bool isDark,
  ) {
    final title = tech['title'] ?? 'technique'.tr(lang);
    final description = tech['description'] ?? '';
    final relatedCrop = tech['relatedCrop'] ?? '';
    final equipment = tech['equipmentSuggestion'] ?? '';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      color: isDark ? const Color(0xFF1E2B22) : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () => _openGuideDetails(context, title, [tech], isCrop: false, lang: lang, isDark: isDark),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Row: Icon + Badge + Arrow
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(7),
                    decoration: BoxDecoration(
                      color: brandAccent.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.biotech_rounded, color: brandAccent, size: 18),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'technique'.tr(lang).toUpperCase(),
                    style: const TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w800,
                      color: brandAccent,
                      letterSpacing: 0.8,
                    ),
                  ),
                  const Spacer(),
                  Icon(
                    Icons.arrow_forward_ios_rounded,
                    size: 14,
                    color: isDark ? Colors.white38 : Colors.grey.shade400,
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Title: Full horizontal width available
              Text(
                title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : AppTheme.textDark,
                  height: 1.25,
                ),
              ),

              // Tags: Wrap onto subsequent lines cleanly
              if (relatedCrop.isNotEmpty) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 5,
                  children: relatedCrop.split(',').map((item) {
                    final tag = item.trim();
                    if (tag.isEmpty) return const SizedBox.shrink();
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                      decoration: BoxDecoration(
                        color: brandPrimary.withValues(alpha: isDark ? 0.35 : 0.08),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: Text(
                        tag,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white70 : const Color(0xFF334155),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
              const SizedBox(height: 10),

              // Description
              Text(
                description,
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? Colors.white70 : const Color(0xFF475569),
                  height: 1.4,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              if (equipment.isNotEmpty) ...[
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Icon(Icons.agriculture_rounded, size: 16, color: Color(0xFF16A34A)),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        equipment,
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF16A34A)),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _openGuideDetails(
    BuildContext context,
    String title,
    List<dynamic> items, {
    required bool isCrop,
    required String lang,
    required bool isDark,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _GuideDetailSheet(
        title: title,
        items: items,
        isCrop: isCrop,
        lang: lang,
        isDark: isDark,
      ),
    );
  }
}

class _GuideDetailSheet extends StatefulWidget {
  final String title;
  final List<dynamic> items;
  final bool isCrop;
  final String lang;
  final bool isDark;

  const _GuideDetailSheet({
    required this.title,
    required this.items,
    required this.isCrop,
    required this.lang,
    required this.isDark,
  });

  @override
  State<_GuideDetailSheet> createState() => _GuideDetailSheetState();
}

class _GuideDetailSheetState extends State<_GuideDetailSheet> {
  final TextEditingController _questionController = TextEditingController();
  bool _isSubmittingQuestion = false;
  String? _aiAnswer;
  String? _aiError;

  static const Color brandPrimary = Color(0xFF163A2D);
  static const Color brandAccent = Color(0xFF84CC16);

  @override
  void dispose() {
    _questionController.dispose();
    super.dispose();
  }

  Future<void> _askFarmingAI() async {
    final query = _questionController.text.trim();
    if (query.isEmpty) return;

    FocusScope.of(context).unfocus();
    setState(() {
      _isSubmittingQuestion = true;
      _aiAnswer = null;
      _aiError = null;
    });

    try {
      final response = await ApiClient().dio.post(
        '/ai/advisor',
        data: {
          'crop': widget.title,
          'question': query,
          'language': _getLanguageFull(widget.lang),
        },
      );

      final data = response.data['data'] ?? response.data;
      final reply = data['reply']?.toString() ?? 'Advice received successfully.';

      if (mounted) {
        setState(() {
          _aiAnswer = reply;
          _isSubmittingQuestion = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _aiError = 'Farmer Assistant reasoning service is currently unavailable. Please verify connection and try again.';
          _isSubmittingQuestion = false;
        });
      }
    }
  }

  String _getLanguageFull(String code) {
    switch (code) {
      case 'te': return 'Telugu';
      case 'hi': return 'Hindi';
      case 'ta': return 'Tamil';
      case 'kn': return 'Kannada';
      default: return 'English';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;
    final lang = widget.lang;

    return Container(
      height: MediaQuery.of(context).size.height * 0.90,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF142017) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SafeArea(
        child: Column(
          children: [
            // Drag Handle
            Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? Colors.white24 : Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),

            // Header Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: brandPrimary.withValues(alpha: isDark ? 0.4 : 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      widget.isCrop ? Icons.grass_rounded : Icons.science_rounded,
                      color: brandAccent,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          (widget.isCrop ? 'crop_guide'.tr(lang) : 'technique'.tr(lang)).toUpperCase(),
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: brandAccent, letterSpacing: 0.8),
                        ),
                        Text(
                          widget.title,
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: isDark ? Colors.white : AppTheme.textDark,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.close_rounded, color: isDark ? Colors.white60 : Colors.grey.shade600),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),

            // Scrollable Guide Steps & AI Q&A
            Expanded(
              child: ListView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                children: [
                  // Step Progression Section
                  if (widget.isCrop) ...[
                    ...widget.items.asMap().entries.map((entry) {
                      final idx = entry.key;
                      final step = entry.value;
                      return _buildStepItem(idx, step, widget.items.length, lang, isDark);
                    }),
                  ] else ...[
                    // Technique single detailed view
                    ...widget.items.map((tech) => _buildTechniqueDetail(tech, lang, isDark)),
                  ],

                  const SizedBox(height: 24),

                  // Ask Farming AI Section
                  _buildAskFarmingAiSection(lang, isDark),

                  const SizedBox(height: 24),

                  // Close Button
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: isDark ? Colors.white24 : Colors.grey.shade300),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: Text(
                        'close_article'.tr(lang),
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white70 : AppTheme.textDark,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepItem(int index, dynamic step, int totalSteps, String lang, bool isDark) {
    final stepOrder = step['stepOrder'] ?? (index + 1);
    final stepTitle = step['stepTitle'] ?? 'Step $stepOrder';
    final description = step['description'] ?? '';
    final imageUrl = step['imageUrl'] as String?;
    final smartTip = step['smartTip'] as String?;
    final equipment = step['recommendedEquipment'] as String?;

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1B2A1E) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Step Badge & Order
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: const BoxDecoration(
                  color: brandPrimary,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    '$stepOrder',
                    style: const TextStyle(color: brandAccent, fontWeight: FontWeight.w900, fontSize: 13),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                '${'step_progress'.tr(lang)} $stepOrder ${'of_steps'.tr(lang)} $totalSteps',
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: brandAccent),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Title
          Text(
            stepTitle,
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w900,
              color: isDark ? Colors.white : AppTheme.textDark,
            ),
          ),
          const SizedBox(height: 6),

          // Description
          Text(
            description,
            style: TextStyle(
              fontSize: 13,
              color: isDark ? Colors.grey.shade300 : const Color(0xFF334155),
              height: 1.45,
            ),
          ),

          // Step Image with resilient fallback banner
          if (imageUrl != null && imageUrl.isNotEmpty) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: Image.network(
                imageUrl,
                width: double.infinity,
                height: 150,
                fit: BoxFit.cover,
                loadingBuilder: (ctx, child, progress) {
                  if (progress == null) return child;
                  return Container(
                    height: 150,
                    color: isDark ? Colors.white10 : Colors.grey.shade200,
                    child: const Center(
                      child: CircularProgressIndicator(strokeWidth: 2, color: brandPrimary),
                    ),
                  );
                },
                errorBuilder: (ctx, error, stack) {
                  return Container(
                    height: 120,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: isDark
                            ? [const Color(0xFF1E2F23), const Color(0xFF16251B)]
                            : [const Color(0xFFE2EEDF), const Color(0xFFF0FDF4)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: brandAccent.withValues(alpha: 0.3)),
                    ),
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        Icon(Icons.grass_rounded, size: 36, color: brandAccent.withValues(alpha: 0.8)),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                stepTitle,
                                style: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 13,
                                  color: isDark ? Colors.white : brandPrimary,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Recommended agronomic practice',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: isDark ? Colors.white60 : Colors.grey.shade600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],

          // Smart Tip Box
          if (smartTip != null && smartTip.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.lightbulb_rounded, color: Color(0xFFD97706), size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'smart_tip'.tr(lang),
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF92400E)),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          smartTip,
                          style: const TextStyle(fontSize: 12, color: Color(0xFF92400E), height: 1.35),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Recommended Equipment Box
          if (equipment != null && equipment.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.agriculture_rounded, color: Color(0xFF16A34A), size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'recommended_equipment_guide'.tr(lang),
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF166534)),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          equipment,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF15803D)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTechniqueDetail(dynamic tech, String lang, bool isDark) {
    final title = tech['title'] ?? '';
    final description = tech['description'] ?? '';
    final relatedCrop = tech['relatedCrop'] ?? '';
    final equipment = tech['equipmentSuggestion'] ?? '';
    final imageUrl = tech['imageUrl'] as String?;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1B2A1E) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: brandAccent.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.biotech_rounded, color: brandAccent, size: 22),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : AppTheme.textDark,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            description,
            style: TextStyle(
              fontSize: 14,
              color: isDark ? Colors.grey.shade300 : const Color(0xFF334155),
              height: 1.5,
            ),
          ),
          if (relatedCrop.isNotEmpty) ...[
            const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.grass_rounded, size: 16, color: brandAccent),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    'Best applied to: $relatedCrop',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: brandAccent),
                  ),
                ),
              ],
            ),
          ],
          if (equipment.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.agriculture_rounded, color: Color(0xFF16A34A), size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'recommended_equipment_guide'.tr(lang),
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF166534)),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          equipment,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF15803D)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (imageUrl != null && imageUrl.isNotEmpty) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: Image.network(
                imageUrl,
                width: double.infinity,
                height: 160,
                fit: BoxFit.cover,
                errorBuilder: (ctx, err, stack) => const SizedBox.shrink(),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAskFarmingAiSection(String lang, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1F2F24) : const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: brandAccent.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: const BoxDecoration(
                  color: brandPrimary,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.smart_toy_rounded, color: brandAccent, size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'ask_farming_ai'.tr(lang),
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : brandPrimary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Ask our agronomic AI assistant for verified guidance regarding ${widget.title}.',
            style: TextStyle(
              fontSize: 12,
              color: isDark ? Colors.white70 : const Color(0xFF475569),
            ),
          ),
          const SizedBox(height: 12),

          // Question Input
          TextField(
            controller: _questionController,
            style: TextStyle(fontSize: 13, color: isDark ? Colors.white : AppTheme.textDark),
            maxLines: 2,
            decoration: InputDecoration(
              hintText: 'ask_question_hint'.tr(lang),
              hintStyle: TextStyle(fontSize: 12, color: isDark ? Colors.white38 : Colors.grey.shade500),
              filled: true,
              fillColor: isDark ? const Color(0xFF16251B) : Colors.white,
              contentPadding: const EdgeInsets.all(12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: isDark ? Colors.white12 : const Color(0xFFCBD5E1)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: isDark ? Colors.white12 : const Color(0xFFCBD5E1)),
              ),
            ),
          ),
          const SizedBox(height: 10),

          // Submit Button
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton.icon(
              onPressed: _isSubmittingQuestion ? null : _askFarmingAI,
              icon: _isSubmittingQuestion
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.send_rounded, size: 16),
              label: Text(
                _isSubmittingQuestion ? 'asking_ai'.tr(lang) : 'ask_ai_btn'.tr(lang),
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: brandPrimary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),

          // AI Answer Display
          if (_aiAnswer != null) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF16251B) : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: brandAccent.withValues(alpha: 0.5)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.auto_awesome, color: brandAccent, size: 16),
                      const SizedBox(width: 6),
                      Text(
                        'ai_response_title'.tr(lang),
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: brandAccent,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _aiAnswer!,
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? Colors.grey.shade200 : const Color(0xFF1E293B),
                      height: 1.45,
                    ),
                  ),
                ],
              ),
            ),
          ],

          // AI Error Display
          if (_aiError != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFFFEBEE),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFFCDD2)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline_rounded, color: Color(0xFFD32F2F), size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _aiError!,
                      style: const TextStyle(fontSize: 11, color: Color(0xFFB71C1C), height: 1.3),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
