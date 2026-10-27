import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../shared/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/community_models.dart';
import '../providers/community_provider.dart';
import 'farmer_public_profile_screen.dart';
import 'register_crop_sheet.dart';
import 'crop_trends_screen.dart';

class CommunityScreen extends ConsumerStatefulWidget {
  final bool isTab;
  final VoidCallback? onBack;

  const CommunityScreen({
    super.key,
    this.isTab = false,
    this.onBack,
  });

  @override
  ConsumerState<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends ConsumerState<CommunityScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  Timer? _debounceTimer;
  String _selectedCategory = 'All';
  String _searchQuery = '';

  static const List<String> _categories = [
    'All',
    'Discussions',
    'Crops & Farming',
    'Equipment Demand',
    'Farming Advice',
  ];

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 250), () {
      if (mounted) {
        setState(() {
          _searchQuery = _searchController.text.trim().toLowerCase();
        });
      }
    });
  }

  String _getCategoryLabel(String category, String lang) {
    switch (category) {
      case 'All':
        return 'category_all'.tr(lang);
      case 'Discussions':
        return 'category_discussion'.tr(lang);
      case 'Crops & Farming':
        return 'category_crops'.tr(lang);
      case 'Equipment Demand':
        return 'category_equipment_demand'.tr(lang);
      case 'Farming Advice':
        return 'category_advice'.tr(lang);
      default:
        return category;
    }
  }

  List<CommunityMessage> _filterMessages(List<CommunityMessage> messages) {
    var filtered = messages;

    // Filter by category
    if (_selectedCategory != 'All') {
      filtered = filtered.where((m) => m.category == _selectedCategory).toList();
    }

    // Filter by search query
    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((m) {
        final textMatch = m.text.toLowerCase().contains(_searchQuery);
        final authorMatch = m.sender?.name.toLowerCase().contains(_searchQuery) ?? false;
        final categoryMatch = m.category.toLowerCase().contains(_searchQuery);
        return textMatch || authorMatch || categoryMatch;
      }).toList();
    }

    // Feed ordered chronologically with latest first
    return filtered.reversed.toList();
  }

  int _countReplies(String messageId, List<CommunityMessage> allMessages, String authorName) {
    return allMessages.where((m) {
      if (m.replyToAuthor != null && m.replyToAuthor!.toLowerCase() == authorName.toLowerCase()) {
        return true;
      }
      return m.text.contains('[Reply to @$authorName]');
    }).length;
  }

  @override
  Widget build(BuildContext context) {
    final communityState = ref.watch(communityProvider);
    final authState = ref.watch(authProvider);
    final currentUserId = authState.user?.id;
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final feedMessages = _filterMessages(communityState.messages);

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        titleSpacing: 0,
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        elevation: 0.5,
        automaticallyImplyLeading: false,
        leading: widget.isTab
            ? (widget.onBack != null
                ? IconButton(
                    tooltip: 'Back',
                    icon: Icon(Icons.arrow_back_ios_new_rounded,
                        color: isDark ? Colors.white : AppTheme.textDarkNavy, size: 20),
                    onPressed: widget.onBack,
                  )
                : null)
            : IconButton(
                tooltip: 'Back',
                icon: Icon(Icons.arrow_back_ios_new_rounded,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy, size: 20),
                onPressed: () {
                  if (widget.onBack != null) {
                    widget.onBack!();
                  } else if (Navigator.of(context).canPop()) {
                    Navigator.of(context).pop();
                  } else {
                    context.go('/farmer');
                  }
                },
              ),
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primaryGreen, AppTheme.accentGreen],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.groups_rounded, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'farmer_community'.tr(lang),
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                      letterSpacing: -0.2,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    communityState.info != null && communityState.info!.memberCount > 0
                        ? '${communityState.info!.memberCount} ${'farmers_online'.tr(lang)}'
                        : 'community_subtitle'.tr(lang),
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: isDark ? Colors.white70 : AppTheme.primaryGreen,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'crop_trends_insights'.tr(lang),
            icon: const Icon(Icons.trending_up_rounded, color: AppTheme.primaryGreen),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (ctx) => const CropTrendsScreen()),
              );
            },
          ),
          IconButton(
            tooltip: 'register_my_crops'.tr(lang),
            icon: const Icon(Icons.spa_outlined, color: AppTheme.primaryGreen),
            onPressed: () async {
              await showModalBottomSheet<bool>(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (ctx) => const RegisterCropSheet(),
              );
            },
          ),
          IconButton(
            tooltip: 'refresh'.tr(lang),
            icon: Icon(Icons.refresh_rounded,
                color: isDark ? Colors.white70 : AppTheme.textDarkNavy),
            onPressed: () {
              ref.read(communityProvider.notifier).loadCommunity();
              ref.read(communityProvider.notifier).loadMembers();
            },
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            await ref.read(communityProvider.notifier).loadCommunity();
            await ref.read(communityProvider.notifier).loadMembers();
          },
          color: AppTheme.primaryGreen,
          child: Column(
            children: [
              // 1. Title & Subtitle banner (clean, uncluttered)
              _buildHeaderBanner(context, isDark, lang),

              // 2. Compact Search Bar
              _buildSearchBar(context, isDark, lang),

              // 3. Horizontally Scrollable Category Chips
              _buildCategoryChips(context, isDark, lang),

              // 4. One Prominent Create Post Button
              _buildCreatePostCard(context, isDark, lang, communityState.isSending),

              // 5. Vertically Scrolling Post Feed
              Expanded(
                child: _buildFeedView(
                  context,
                  communityState,
                  feedMessages,
                  currentUserId,
                  isDark,
                  lang,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeaderBanner(BuildContext context, bool isDark, String lang) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: isDark ? AppTheme.darkCard.withValues(alpha: 0.5) : Colors.white,
      child: Row(
        children: [
          const Icon(Icons.verified_rounded, color: AppTheme.accentGreen, size: 16),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              'community_subtitle'.tr(lang),
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: isDark ? Colors.white70 : const Color(0xFF475569),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar(BuildContext context, bool isDark, String lang) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      child: Container(
        height: 44,
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
            width: 1,
          ),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Row(
          children: [
            Icon(
              Icons.search_rounded,
              size: 20,
              color: isDark ? Colors.white54 : const Color(0xFF94A3B8),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: _searchController,
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
                decoration: InputDecoration(
                  hintText: 'search_community_hint'.tr(lang),
                  hintStyle: TextStyle(
                    fontSize: 13,
                    color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
                  ),
                  border: InputBorder.none,
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(vertical: 10),
                ),
              ),
            ),
            if (_searchController.text.isNotEmpty)
              IconButton(
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 24, minHeight: 24),
                icon: Icon(
                  Icons.close_rounded,
                  size: 16,
                  color: isDark ? Colors.white54 : const Color(0xFF94A3B8),
                ),
                onPressed: () {
                  _searchController.clear();
                  setState(() {
                    _searchQuery = '';
                  });
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryChips(BuildContext context, bool isDark, String lang) {
    return Container(
      height: 46,
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        itemCount: _categories.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final category = _categories[index];
          final isSelected = _selectedCategory == category;
          final label = _getCategoryLabel(category, lang);

          IconData chipIcon;
          switch (category) {
            case 'Equipment Demand':
              chipIcon = Icons.agriculture_rounded;
              break;
            case 'Crops & Farming':
              chipIcon = Icons.eco_rounded;
              break;
            case 'Farming Advice':
              chipIcon = Icons.lightbulb_outline_rounded;
              break;
            case 'Discussions':
              chipIcon = Icons.forum_outlined;
              break;
            default:
              chipIcon = Icons.grid_view_rounded;
          }

          return InkWell(
            borderRadius: BorderRadius.circular(20),
            onTap: () {
              setState(() {
                _selectedCategory = category;
              });
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: isSelected
                    ? AppTheme.primaryGreen
                    : (isDark ? AppTheme.darkCard : Colors.white),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isSelected
                      ? AppTheme.accentGreen
                      : (isDark ? Colors.white12 : const Color(0xFFCBD5E1)),
                  width: isSelected ? 1.5 : 1,
                ),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: AppTheme.primaryGreen.withValues(alpha: 0.25), blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ]
                    : null,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    chipIcon,
                    size: 14,
                    color: isSelected
                        ? Colors.white
                        : (isDark ? Colors.white70 : const Color(0xFF64748B)),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                      color: isSelected
                          ? Colors.white
                          : (isDark ? Colors.white : AppTheme.textDarkNavy),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildCreatePostCard(BuildContext context, bool isDark, String lang, bool isSending) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 4, 16, 8),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () => _openCreatePostModal(context, isDark, lang),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 16,
                  backgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.12),
                  child: const Icon(
                    Icons.edit_note_rounded,
                    color: AppTheme.primaryGreen,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'write_something'.tr(lang),
                    style: TextStyle(
                      fontSize: 13,
                      color: isDark ? Colors.white54 : const Color(0xFF94A3B8),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryGreen,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.add_rounded, color: Colors.white, size: 16),
                      const SizedBox(width: 4),
                      Text(
                        'create_post'.tr(lang),
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFeedView(
    BuildContext context,
    CommunityState state,
    List<CommunityMessage> messages,
    String? currentUserId,
    bool isDark,
    String lang,
  ) {
    if (state.isLoading && state.messages.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.primaryGreen),
      );
    }

    if (state.error != null && state.messages.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded, size: 48, color: Colors.redAccent),
              const SizedBox(height: 12),
              Text(
                state.error!,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: isDark ? Colors.white70 : Colors.black87,
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => ref.read(communityProvider.notifier).loadCommunity(),
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: Text('retry'.tr(lang)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryGreen,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (messages.isEmpty) {
      return Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.primaryGreen.withValues(alpha: 0.08), shape: BoxShape.circle,
                ),
                child: const Icon(Icons.forum_outlined, size: 44, color: AppTheme.primaryGreen),
              ),
              const SizedBox(height: 16),
              Text(
                _searchQuery.isNotEmpty
                    ? 'no_posts_found'.tr(lang)
                    : 'welcome_community'.tr(lang),
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                _searchQuery.isNotEmpty
                    ? '${'clear_search'.tr(lang)} or try another category.'
                    : 'no_posts_subtitle'.tr(lang),
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 16),
              if (_searchQuery.isNotEmpty)
                OutlinedButton.icon(
                  onPressed: () {
                    _searchController.clear();
                    setState(() {
                      _searchQuery = '';
                      _selectedCategory = 'All';
                    });
                  },
                  icon: const Icon(Icons.clear_all_rounded, size: 18),
                  label: Text('clear_search'.tr(lang)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.primaryGreen,
                    side: const BorderSide(color: AppTheme.primaryGreen),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                )
              else
                ElevatedButton.icon(
                  onPressed: () => _openCreatePostModal(context, isDark, lang),
                  icon: const Icon(Icons.edit_note_rounded, size: 18),
                  label: Text('create_post'.tr(lang)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryGreen,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      physics: const AlwaysScrollableScrollPhysics(),
      itemCount: messages.length,
      itemBuilder: (context, index) {
        final msg = messages[index];
        final isLiked = state.likedMessageIds.contains(msg.id);
        final extraLikeCount = state.extraLikes[msg.id] ?? 0;
        final baseLikeCount = (msg.id.hashCode.abs() % 4);
        final totalLikes = baseLikeCount + extraLikeCount;
        final replyCount = _countReplies(msg.id, state.messages, msg.sender?.name ?? 'Farmer');

        return _buildPostCard(
          context,
          msg,
          isLiked,
          totalLikes,
          replyCount,
          currentUserId,
          isDark,
          lang,
        );
      },
    );
  }

  Widget _buildPostCard(
    BuildContext context,
    CommunityMessage msg,
    bool isLiked,
    int totalLikes,
    int replyCount,
    String? currentUserId,
    bool isDark,
    String lang,
  ) {
    final senderName = msg.sender?.name ?? 'Farmer';
    final initials = senderName.trim().isNotEmpty
        ? senderName.trim().split(' ').map((e) => e.isNotEmpty ? e[0] : '').take(2).join().toUpperCase()
        : 'F';
    final timeStr = DateFormat('dd MMM, hh:mm a').format(msg.createdAt);
    final isEquipmentDemand = msg.category == 'Equipment Demand';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isEquipmentDemand
              ? AppTheme.accentGreen.withValues(alpha: 0.4)
              : (isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
          width: isEquipmentDemand ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Avatar, Name, Time, Category Chip
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
            child: Row(
              children: [
                GestureDetector(
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (ctx) => FarmerPublicProfileScreen(memberId: msg.senderId),
                      ),
                    );
                  },
                  child: CircleAvatar(
                    radius: 20,
                    backgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.12),
                    backgroundImage: msg.sender?.profileImage != null &&
                            msg.sender!.profileImage!.isNotEmpty
                        ? NetworkImage(msg.sender!.profileImage!)
                        : null,
                    child: msg.sender?.profileImage == null ||
                            msg.sender!.profileImage!.isEmpty
                        ? Text(
                            initials,
                            style: const TextStyle(
                              color: AppTheme.primaryGreen,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          )
                        : null,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: GestureDetector(
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (ctx) => FarmerPublicProfileScreen(memberId: msg.senderId),
                        ),
                      );
                    },
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                senderName,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Icon(
                              Icons.verified_rounded,
                              size: 14,
                              color: AppTheme.accentGreen,
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          timeStr,
                          style: TextStyle(
                            fontSize: 11,
                            color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: isEquipmentDemand
                        ? const Color(0xFFFEF3C7)
                        : (isDark
                            ? AppTheme.primaryGreen.withValues(alpha: 0.2) : const Color(0xFFECFDF5)),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isEquipmentDemand
                          ? const Color(0xFFF59E0B)
                          : AppTheme.accentGreen.withValues(alpha: 0.4),
                      width: 0.8,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isEquipmentDemand
                            ? Icons.agriculture_rounded
                            : Icons.eco_rounded,
                        size: 11,
                        color: isEquipmentDemand
                            ? const Color(0xFFB45309)
                            : AppTheme.primaryGreen,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _getCategoryLabel(msg.category, lang),
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: isEquipmentDemand
                              ? const Color(0xFF92400E)
                              : AppTheme.primaryGreen,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Replying indicator (if this post is a reply)
          if (msg.replyToAuthor != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.reply_rounded, size: 12, color: AppTheme.primaryGreen),
                    const SizedBox(width: 4),
                    Text(
                      '${'replying_to'.tr(lang)} @${msg.replyToAuthor}',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.primaryGreen,
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Post Body Text
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            child: Text(
              msg.cleanText,
              style: TextStyle(
                fontSize: 14,
                height: 1.4,
                color: isDark ? Colors.white : const Color(0xFF1E293B),
              ),
            ),
          ),

          // Optional Real Post Image
          if (msg.imageUrl != null && msg.imageUrl!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(
                  msg.imageUrl!,
                  height: 180,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => const SizedBox.shrink(),
                ),
              ),
            ),

          // Action Bar (Minimal, Like, Comment, Reply)
          const Divider(height: 1, thickness: 0.5),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
            child: Row(
              children: [
                // 1. Like Action
                InkWell(
                  borderRadius: BorderRadius.circular(8),
                  onTap: () {
                    ref.read(communityProvider.notifier).toggleLike(msg.id);
                  },
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          isLiked ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                          size: 18,
                          color: isLiked
                              ? const Color(0xFFE11D48)
                              : (isDark ? Colors.white60 : const Color(0xFF64748B)),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          totalLikes > 0 ? '$totalLikes' : 'like'.tr(lang),
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: isLiked ? FontWeight.w700 : FontWeight.w500,
                            color: isLiked
                                ? const Color(0xFFE11D48)
                                : (isDark ? Colors.white70 : const Color(0xFF64748B)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(width: 6),

                // 2. Comment / Reply Action
                InkWell(
                  borderRadius: BorderRadius.circular(8),
                  onTap: () {
                    _openRepliesSheet(context, msg, isDark, lang);
                  },
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.chat_bubble_outline_rounded,
                          size: 18,
                          color: isDark ? Colors.white60 : const Color(0xFF64748B),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          replyCount > 0 ? '$replyCount' : 'comment'.tr(lang),
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: isDark ? Colors.white70 : const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const Spacer(),

                // 3. Quick Action Button (Reply / Equipment Offer)
                TextButton.icon(
                  onPressed: () {
                    _openRepliesSheet(context, msg, isDark, lang);
                  },
                  icon: Icon(
                    isEquipmentDemand ? Icons.handshake_outlined : Icons.reply_rounded,
                    size: 16,
                    color: AppTheme.primaryGreen,
                  ),
                  label: Text(
                    isEquipmentDemand
                        ? 'reply'.tr(lang)
                        : 'reply'.tr(lang),
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.primaryGreen,
                    ),
                  ),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ),
                const SizedBox(width: 4),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _openCreatePostModal(BuildContext context, bool isDark, String lang) {
    final textController = TextEditingController();
    String activeCategory = 'Discussions';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            final isSending = ref.watch(communityProvider).isSending;

            return Container(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(ctx).viewInsets.bottom,
              ),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkCard : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: SafeArea(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Handle bar
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white24 : const Color(0xFFCBD5E1),
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Title
                      Row(
                        children: [
                          const Icon(Icons.edit_note_rounded, color: AppTheme.primaryGreen),
                          const SizedBox(width: 8),
                          Text(
                            'create_post'.tr(lang),
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.white : AppTheme.textDarkNavy,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      // Category Selector
                      Text(
                        'select_category'.tr(lang),
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.white70 : const Color(0xFF64748B),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          'Discussions',
                          'Crops & Farming',
                          'Equipment Demand',
                          'Farming Advice',
                        ].map((cat) {
                          final selected = activeCategory == cat;
                          return ChoiceChip(
                            label: Text(_getCategoryLabel(cat, lang)),
                            selected: selected,
                            onSelected: (val) {
                              if (val) {
                                setModalState(() {
                                  activeCategory = cat;
                                });
                              }
                            },
                            selectedColor: AppTheme.primaryGreen,
                            backgroundColor: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
                            labelStyle: TextStyle(
                              fontSize: 12,
                              fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                              color: selected
                                  ? Colors.white
                                  : (isDark ? Colors.white : AppTheme.textDarkNavy),
                            ),
                            side: BorderSide(
                              color: selected
                                  ? AppTheme.accentGreen
                                  : (isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 14),

                      // Text Field
                      Container(
                        decoration: BoxDecoration(
                          color: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
                          ),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                        child: TextField(
                          controller: textController,
                          maxLines: 5,
                          minLines: 3,
                          maxLength: 1000,
                          enabled: !isSending,
                          style: TextStyle(
                            fontSize: 14,
                            color: isDark ? Colors.white : AppTheme.textDarkNavy,
                          ),
                          decoration: InputDecoration(
                            hintText: 'write_something'.tr(lang),
                            hintStyle: TextStyle(
                              fontSize: 13,
                              color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
                            ),
                            border: InputBorder.none,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Action Buttons
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: isSending ? null : () => Navigator.of(ctx).pop(),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                              child: Text('cancel'.tr(lang)),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            flex: 2,
                            child: ElevatedButton(
                              onPressed: isSending
                                  ? null
                                  : () async {
                                      final text = textController.text.trim();
                                      if (text.isEmpty) return;

                                      final success = await ref
                                          .read(communityProvider.notifier)
                                          .createPost(text: text, category: activeCategory);

                                      if (success && ctx.mounted) {
                                        Navigator.of(ctx).pop();
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(
                                            content: Text('post_published'.tr(lang)),
                                            backgroundColor: AppTheme.primaryGreen,
                                            behavior: SnackBarBehavior.floating,
                                          ),
                                        );
                                      }
                                    },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primaryGreen,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                              child: isSending
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                        color: Colors.white,
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : Text(
                                      'create_post'.tr(lang),
                                      style: const TextStyle(fontWeight: FontWeight.w700),
                                    ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _openRepliesSheet(
    BuildContext context,
    CommunityMessage parentMsg,
    bool isDark,
    String lang,
  ) {
    final replyController = TextEditingController();
    final parentAuthor = parentMsg.sender?.name ?? 'Farmer';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return Consumer(
          builder: (ctx, refWatch, _) {
            final communityState = refWatch.watch(communityProvider);
            final isSending = communityState.isSending;

            final replies = communityState.messages.where((m) {
              return m.replyToAuthor?.toLowerCase() == parentAuthor.toLowerCase() ||
                  m.text.contains('[Reply to @$parentAuthor]');
            }).toList();

            return Container(
              height: MediaQuery.of(ctx).size.height * 0.75,
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(ctx).viewInsets.bottom,
              ),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkCard : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: SafeArea(
                child: Column(
                  children: [
                    // Handle Bar & Header
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                      child: Row(
                        children: [
                          const Icon(Icons.forum_outlined, color: AppTheme.primaryGreen, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'comments'.tr(lang),
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.white : AppTheme.textDarkNavy,
                            ),
                          ),
                          const Spacer(),
                          IconButton(
                            icon: const Icon(Icons.close_rounded),
                            onPressed: () => Navigator.of(ctx).pop(),
                          ),
                        ],
                      ),
                    ),
                    const Divider(height: 1),

                    // Parent Post Summary
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      color: isDark
                          ? AppTheme.primaryGreen.withValues(alpha: 0.12)
                          : const Color(0xFFF1F5F9),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                parentAuthor,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 13,
                                  color: AppTheme.primaryGreen,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                DateFormat('hh:mm a').format(parentMsg.createdAt),
                                style: TextStyle(
                                  fontSize: 11,
                                  color: isDark ? Colors.white38 : Colors.grey.shade600,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            parentMsg.cleanText,
                            style: TextStyle(
                              fontSize: 13,
                              color: isDark ? Colors.white70 : const Color(0xFF334155),
                            ),
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),

                    // Replies List
                    Expanded(
                      child: replies.isEmpty
                          ? Center(
                              child: Text(
                                'first_to_post'.tr(lang),
                                style: TextStyle(
                                  fontSize: 13,
                                  color: isDark ? Colors.white38 : Colors.grey.shade500,
                                ),
                              ),
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.all(14),
                              itemCount: replies.length,
                              itemBuilder: (ctx, i) {
                                final r = replies[i];
                                final rAuthor = r.sender?.name ?? 'Farmer';
                                final rInitials = rAuthor.isNotEmpty ? rAuthor[0] : 'F';
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      CircleAvatar(
                                        radius: 14,
                                        backgroundColor:
                                            AppTheme.primaryGreen.withValues(alpha: 0.12),
                                        child: Text(
                                          rInitials,
                                          style: const TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color: AppTheme.primaryGreen,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Container(
                                          padding: const EdgeInsets.all(10),
                                          decoration: BoxDecoration(
                                            color: isDark
                                                ? AppTheme.darkBackground
                                                : const Color(0xFFF8FAFC),
                                            borderRadius: BorderRadius.circular(10),
                                            border: Border.all(
                                              color: isDark
                                                  ? Colors.white12
                                                  : const Color(0xFFE2E8F0),
                                            ),
                                          ),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                mainAxisAlignment:
                                                    MainAxisAlignment.spaceBetween,
                                                children: [
                                                  Text(
                                                    rAuthor,
                                                    style: TextStyle(
                                                      fontWeight: FontWeight.w700,
                                                      fontSize: 12,
                                                      color: isDark
                                                          ? Colors.white
                                                          : AppTheme.textDarkNavy,
                                                    ),
                                                  ),
                                                  Text(
                                                    DateFormat('hh:mm a').format(r.createdAt),
                                                    style: TextStyle(
                                                      fontSize: 10,
                                                      color: isDark
                                                          ? Colors.white38
                                                          : Colors.grey.shade500,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                r.cleanText,
                                                style: TextStyle(
                                                  fontSize: 13,
                                                  color: isDark
                                                      ? Colors.white70
                                                      : const Color(0xFF1E293B),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                    ),

                    // Reply Composer
                    Container(
                      padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
                      decoration: BoxDecoration(
                        color: isDark ? AppTheme.darkCard : Colors.white,
                        border: Border(
                          top: BorderSide(
                            color: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
                          ),
                        ),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Container(
                              decoration: BoxDecoration(
                                color: isDark
                                    ? AppTheme.darkBackground
                                    : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              padding: const EdgeInsets.symmetric(horizontal: 14),
                              child: TextField(
                                controller: replyController,
                                enabled: !isSending,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                ),
                                decoration: InputDecoration(
                                  hintText: '${'reply_to'.tr(lang)} @$parentAuthor...',
                                  hintStyle: TextStyle(
                                    fontSize: 13,
                                    color: isDark ? Colors.white38 : Colors.grey.shade500,
                                  ),
                                  border: InputBorder.none,
                                  isDense: true,
                                  contentPadding:
                                      const EdgeInsets.symmetric(vertical: 10),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          CircleAvatar(
                            radius: 18,
                            backgroundColor: AppTheme.primaryGreen,
                            child: isSending
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 2,
                                    ),
                                  )
                                : IconButton(
                                    padding: EdgeInsets.zero,
                                    icon: const Icon(
                                      Icons.send_rounded,
                                      color: Colors.white,
                                      size: 18,
                                    ),
                                    onPressed: () async {
                                      final text = replyController.text.trim();
                                      if (text.isEmpty) return;

                                      final success = await ref
                                          .read(communityProvider.notifier)
                                          .sendReply(
                                            parentMessageId: parentMsg.id,
                                            authorName: parentAuthor,
                                            replyText: text,
                                          );

                                      if (success) {
                                        replyController.clear();
                                      }
                                    },
                                  ),
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
      },
    );
  }
}
