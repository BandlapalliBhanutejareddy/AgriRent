import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/localization/app_localizations.dart';

final guidesProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final client = ApiClient();
  final guidesRes = await client.dio.get('/guides');
  final techniquesRes = await client.dio.get('/guides/techniques');
  return {
    'crops': guidesRes.data,
    'techniques': techniquesRes.data,
  };
});

class KnowledgeBaseScreen extends ConsumerStatefulWidget {
  const KnowledgeBaseScreen({super.key});

  @override
  ConsumerState<KnowledgeBaseScreen> createState() => _KnowledgeBaseScreenState();
}

class _KnowledgeBaseScreenState extends ConsumerState<KnowledgeBaseScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final kbAsync = ref.watch(guidesProvider);

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        backgroundColor: AppTheme.background,
        appBar: AppBar(
          title: Text('knowledge_base'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 22)),
          centerTitle: false,
          backgroundColor: Colors.transparent,
          elevation: 0,
          bottom: TabBar(
            isScrollable: true,
            labelColor: AppTheme.primaryGreen,
            unselectedLabelColor: Colors.grey,
            indicatorColor: AppTheme.primaryGreen,
            indicatorWeight: 3,
            labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            tabs: [
              Tab(text: 'crop_guides'.tr(lang)),
              Tab(text: 'modern_techniques'.tr(lang)),
            ],
          ),
        ),
        body: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'search_articles'.tr(lang),
                  hintStyle: const TextStyle(color: Colors.grey, fontSize: 14),
                  prefixIcon: const Icon(Icons.search, color: Colors.grey),
                  suffixIcon: _searchQuery.isNotEmpty ? IconButton(
                    icon: const Icon(Icons.clear, color: Colors.grey),
                    onPressed: () {
                      _searchController.clear();
                      setState(() { _searchQuery = ''; });
                    },
                  ) : null,
                  filled: true,
                  fillColor: Colors.white,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                ),
                onChanged: (value) => setState(() { _searchQuery = value.toLowerCase(); }),
              ),
            ),
            Expanded(
              child: kbAsync.when(
                loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen)),
                error: (err, stack) => Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, color: Colors.red, size: 48),
                      const SizedBox(height: 16),
                      Text('${'failed_to_load'.tr(lang)}: $err', textAlign: TextAlign.center, style: const TextStyle(color: AppTheme.textDark)),
                      TextButton(onPressed: () => ref.refresh(guidesProvider), child: Text('retry'.tr(lang), style: const TextStyle(color: AppTheme.primaryGreen))),
                    ],
                  ),
                ),
                data: (data) {
                  final crops = data['crops'] as Map<String, dynamic>;
                  final techniques = data['techniques'] as List<dynamic>;

                  final filteredCrops = crops.keys.where((k) => k.toLowerCase().contains(_searchQuery)).toList();
                  final filteredTechniques = techniques.where((t) => (t['title'] as String).toLowerCase().contains(_searchQuery)).map((t) => t['title'] as String).toList();

                  return TabBarView(
                    children: [
                      _buildGrid(context, filteredCrops, isCrop: true, rawData: crops, lang: lang),
                      _buildGrid(context, filteredTechniques, isCrop: false, rawData: techniques, lang: lang),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGrid(BuildContext context, List<String> items, {required bool isCrop, required dynamic rawData, required String lang}) {
    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.menu_book, size: 64, color: Colors.grey.shade300),
            const SizedBox(height: 16),
            Text('no_articles_found'.tr(lang), style: const TextStyle(color: Colors.grey, fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
      );
    }
    return GridView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.85,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final title = items[index];
        return Card(
          color: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: BorderSide(color: Colors.grey.shade200),
          ),
          child: InkWell(
            onTap: () => _showDetailSheet(context, title, isCrop, rawData, lang),
            borderRadius: BorderRadius.circular(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppTheme.primaryGreen.withValues(alpha: 0.05),
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                    ),
                    child: Center(
                      child: Icon(
                        isCrop ? Icons.grass : Icons.science,
                        size: 48,
                        color: AppTheme.primaryGreen.withValues(alpha: 0.5),
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                     crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isCrop ? 'crop_guide'.tr(lang).toUpperCase() : 'technique'.tr(lang).toUpperCase(),
                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        title,
                        style: const TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textDark, fontSize: 16, height: 1.2),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showDetailSheet(BuildContext context, String title, bool isCrop, dynamic rawData, String lang) {
    List<Widget> contentWidgets = [];

    if (isCrop) {
      final steps = rawData[title] as List;
      for (var i = 0; i < steps.length; i++) {
        final step = steps[i];

        final imageUrl = step['imageUrl'] as String?;
        final smartTip = step['smartTip'] as String?;
        final equipment = step['recommendedEquipment'] as String?;

        contentWidgets.add(
          Padding(
            padding: const EdgeInsets.only(bottom: 24.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: const BoxDecoration(
                    color: AppTheme.primaryGreen,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text('${step['stepOrder'] ?? i + 1}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(step['stepTitle'] ?? 'no_information_available'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: AppTheme.textDark)),
                      const SizedBox(height: 8),
                      Text(step['description'] ?? 'no_information_available'.tr(lang), style: const TextStyle(color: AppTheme.textLight, fontSize: 14, height: 1.5)),

                      if (imageUrl != null && imageUrl.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 12.0),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.network(
                              imageUrl,
                              width: double.infinity,
                              height: 160,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) => Container(color: Colors.grey.shade100, height: 160, child: const Icon(Icons.image_not_supported, color: Colors.grey)),
                            ),
                          ),
                        ),

                      if (smartTip != null && smartTip.isNotEmpty)
                        Container(
                          margin: const EdgeInsets.only(top: 12),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFFDE68A)),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.lightbulb, color: Color(0xFFD97706), size: 18),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('smart_tip'.tr(lang), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFF92400E))),
                                    const SizedBox(height: 4),
                                    Text(smartTip, style: const TextStyle(fontSize: 13, color: Color(0xFF92400E), height: 1.4)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),

                      if (equipment != null && equipment.isNotEmpty)
                        Container(
                          margin: const EdgeInsets.only(top: 12),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF0FDF4),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFBBF7D0)),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.agriculture, color: Color(0xFF16A34A), size: 18),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('recommended_equipment'.tr(lang), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFF166534))),
                                    const SizedBox(height: 4),
                                    Text(equipment, style: const TextStyle(fontSize: 13, color: Color(0xFF166534), height: 1.4)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                )
              ],
            ),
          )
        );
      }
    } else {
      final tech = rawData.firstWhere((t) => t['title'] == title);
      contentWidgets.add(
        Text(tech['description'] ?? 'no_information_available'.tr(lang), style: const TextStyle(color: AppTheme.textLight, fontSize: 15, height: 1.6))
      );
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 12, bottom: 24),
                width: 48,
                height: 6,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: AppTheme.primaryGreen.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(16)),
                    child: Icon(isCrop ? Icons.grass : Icons.science, color: AppTheme.primaryGreen, size: 28),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(isCrop ? 'crop_guide'.tr(lang).toUpperCase() : 'technique'.tr(lang).toUpperCase(), style: const TextStyle(color: AppTheme.primaryGreen, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1)),
                        Text(title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppTheme.textDark)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16.0),
              child: Divider(color: Colors.black12, height: 1),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
                children: contentWidgets,
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.background,
                    foregroundColor: AppTheme.textDark,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: Text('close_article'.tr(lang), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
            )
          ],
        ),
      ),
    );
  }
}
