import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../shared/theme/app_theme.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../ai_assistant/ui/voice_interaction_modal.dart';
import '../../services/search_history_service.dart';

class SearchSuggestionsOverlay extends ConsumerStatefulWidget {
  final Function(String query) onQuerySelected;

  const SearchSuggestionsOverlay({super.key, required this.onQuerySelected});

  static Future<void> show(BuildContext context, {required Function(String) onSelected}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => SearchSuggestionsOverlay(onQuerySelected: onSelected),
    );
  }

  @override
  ConsumerState<SearchSuggestionsOverlay> createState() => _SearchSuggestionsOverlayState();
}

class _SearchSuggestionsOverlayState extends ConsumerState<SearchSuggestionsOverlay> {
  final TextEditingController _searchCtrl = TextEditingController();
  List<String> _recentSearches = [];

  @override
  void initState() {
    super.initState();
    _loadRecentSearches();
  }

  Future<void> _loadRecentSearches() async {
    final user = ref.read(authProvider).user;
    if (user != null) {
      final recents = await SearchHistoryService.getRecentSearches(user.id);
      if (mounted) {
        setState(() {
          _recentSearches = recents;
        });
      }
    }
  }

  void _clearRecent() async {
    final user = ref.read(authProvider).user;
    if (user != null) {
      await SearchHistoryService.clearHistory(user.id);
      if (mounted) setState(() => _recentSearches.clear());
    }
  }

  void _selectQuery(String q) {
    final clean = q.trim();
    if (clean.isEmpty) return;
    Navigator.pop(context);
    widget.onQuerySelected(clean);
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final popularSearches = SearchHistoryService.getPopularSearches(lang);
    final voicePrompts = SearchHistoryService.getVoiceExamples(lang);

    return DraggableScrollableSheet(
      initialChildSize: 0.88,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (ctx, scrollController) => Container(
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF0F172A) : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.25),
              blurRadius: 20,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: Column(
          children: [
            // Grab handle
            const SizedBox(height: 12),
            Container(
              width: 44,
              height: 4.5,
              decoration: BoxDecoration(
                color: isDark ? Colors.white24 : Colors.grey.shade300,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
            const SizedBox(height: 16),

            // Top Search Bar inside sheet
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 18),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 48,
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
                      ),
                      child: TextField(
                        controller: _searchCtrl,
                        autofocus: true,
                        style: TextStyle(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
                        ),
                        decoration: InputDecoration(
                          hintText: 'Search crops, equipment, guidance...',
                          hintStyle: TextStyle(
                            color: isDark ? Colors.white38 : Colors.grey.shade500,
                            fontSize: 13.5,
                          ),
                          prefixIcon: const Icon(Icons.search_rounded, color: AppTheme.primaryGreen, size: 20),
                          suffixIcon: _searchCtrl.text.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.close_rounded, size: 18),
                                  onPressed: () => setState(() => _searchCtrl.clear()),
                                )
                              : null,
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        onSubmitted: _selectQuery,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  // Mic button launches Voice Modal
                  GestureDetector(
                    onTap: () {
                      Navigator.pop(context);
                      VoiceInteractionModal.show(context);
                    },
                    child: Container(
                      width: 46,
                      height: 46,
                      decoration: const BoxDecoration(
                        color: Color(0xFF16A34A),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.mic_rounded, color: Colors.white, size: 22),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 14),
            const Divider(height: 1),

            // Scrollable Content
            Expanded(
              child: ListView(
                controller: scrollController,
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 30),
                children: [
                  // 1. Two-Column Layout: Recent Searches & Popular Searches
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Left Column: Recent Searches
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  'Recent Searches',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w800,
                                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                  ),
                                ),
                                const Spacer(),
                                if (_recentSearches.isNotEmpty)
                                  GestureDetector(
                                    onTap: _clearRecent,
                                    child: Text(
                                      'Clear',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            if (_recentSearches.isEmpty)
                              Padding(
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                child: Text(
                                  'No recent searches',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: isDark ? Colors.white38 : Colors.grey.shade400,
                                    fontStyle: FontStyle.italic,
                                  ),
                                ),
                              )
                            else
                              ..._recentSearches.take(5).map((q) => _buildQueryRow(
                                    icon: Icons.history_rounded,
                                    text: q,
                                    isDark: isDark,
                                    onTap: () => _selectQuery(q),
                                  )),
                          ],
                        ),
                      ),

                      const SizedBox(width: 18),

                      // Right Column: Popular Searches
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Popular Searches',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: isDark ? Colors.white : AppTheme.textDarkNavy,
                              ),
                            ),
                            const SizedBox(height: 10),
                            ...popularSearches.take(5).map((q) => _buildQueryRow(
                                  icon: Icons.trending_up_rounded,
                                  text: q,
                                  isDark: isDark,
                                  onTap: () => _selectQuery(q),
                                )),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),
                  const Divider(height: 1),
                  const SizedBox(height: 18),

                  // 2. "Talk to AgroRent / Here are some things you can ask" (Pill Chips)
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF16A34A).withValues(alpha: 0.12),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.mic_rounded, color: Color(0xFF16A34A), size: 18),
                      ),
                      const SizedBox(width: 10),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Talk to AgroRent AI',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.white : AppTheme.textDarkNavy,
                            ),
                          ),
                          Text(
                            'Here are some things you can ask',
                            style: TextStyle(
                              fontSize: 11.5,
                              color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),

                  const SizedBox(height: 14),

                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: voicePrompts.map((prompt) {
                      return ActionChip(
                        label: Text(
                          prompt,
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w600,
                            color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                          ),
                        ),
                        backgroundColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                          side: BorderSide(color: isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
                        ),
                        onPressed: () => _selectQuery(prompt),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQueryRow({
    required IconData icon,
    required String text,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          children: [
            Icon(icon, size: 15, color: isDark ? Colors.white38 : Colors.grey.shade400),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                text,
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w500,
                  color: isDark ? Colors.white70 : const Color(0xFF334155),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
