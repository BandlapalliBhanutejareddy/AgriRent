const fs = require('fs');

let c = fs.readFileSync('mobile/lib/features/marketplace/ui/farmer_home_screen.dart', 'utf8');

// Ensure import
if (!c.includes("import 'equipment_details_screen.dart';")) {
  c = c.replace(
    "import '../../notifications/providers/notification_provider.dart';",
    "import '../../notifications/providers/notification_provider.dart';\nimport 'equipment_details_screen.dart';"
  );
}

// Locate build column
const targetColumn = `                // 1. BRAND & GREETING HEADER
                _buildHeader(farmerName, initial, isDark, userPhoto, currentLang),
                const SizedBox(height: 16),

                // 2. MY FARM / CURRENT CROP HERO CARD
                _buildCropBannerCard(crop, farm, farmState.farms, isDark, currentLang),
                const SizedBox(height: 18),`;

const replacementColumn = `                // 1. BRAND & GREETING HEADER
                _buildHeader(farmerName, initial, isDark, userPhoto, currentLang, farm?.location),
                const SizedBox(height: 14),

                // SEARCH BAR
                _buildSearchBar(isDark, currentLang),
                const SizedBox(height: 16),

                // AI EQUIPMENT RECOMMENDATION BANNER
                _buildAiRecommendationBanner(isDark, currentLang),
                const SizedBox(height: 18),

                // EQUIPMENT CATEGORIES
                _buildEquipmentCategories(isDark, currentLang),
                const SizedBox(height: 18),

                // POPULAR EQUIPMENT
                _buildPopularEquipmentSection(isDark, currentLang),
                const SizedBox(height: 18),

                // FARMER COMMUNITY ENTRY CARD
                _buildFarmerCommunityBanner(isDark, currentLang),
                const SizedBox(height: 18),

                // 2. MY FARM / CURRENT CROP HERO CARD
                _buildCropBannerCard(crop, farm, farmState.farms, isDark, currentLang),
                const SizedBox(height: 18),`;

// Normalize line endings
c = c.replace(/\r\n/g, '\n');
const targetColNormalized = targetColumn.replace(/\r\n/g, '\n');
const replacementColNormalized = replacementColumn.replace(/\r\n/g, '\n');

if (c.includes(targetColNormalized)) {
  c = c.replace(targetColNormalized, replacementColNormalized);
  console.log('Successfully updated main Column in farmer_home_screen.dart');
} else {
  console.error('Failed to locate targetColumn');
}

// Add the helper widgets before the end of _FarmerHomeScreenState
const helpers = `
  // ---------------------------------------------------------------------------
  // VISUAL REFERENCE HELPERS
  // ---------------------------------------------------------------------------
  Widget _buildSearchBar(bool isDark, String lang) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade300),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => widget.onTabSelected?.call(2),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Icon(Icons.search_rounded, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600, size: 22),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Search equipment, crop or service...',
                    style: TextStyle(
                      color: isDark ? Colors.grey.shade400 : Colors.grey.shade500,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                Icon(Icons.mic_none_rounded, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600, size: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAiRecommendationBanner(bool isDark, String lang) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          colors: [Color(0xFF0F3E22), Color(0xFF1B5E20), Color(0xFF2E7D32)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1B5E20).withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: -15,
            bottom: -15,
            child: Opacity(
              opacity: 0.22,
              child: const Icon(Icons.agriculture_rounded, size: 140, color: Colors.white),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.psychology_rounded, color: Colors.white, size: 20),
                    ),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        'AI Equipment Recommendation',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.2,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Get the best equipment based on your crop, land size and season',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.88),
                    fontSize: 12,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () => context.push('/advisor'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF1B5E20),
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),
                  child: const Text(
                    'Try Now',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
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

  Widget _buildEquipmentCategories(bool isDark, String lang) {
    final categories = [
      {'name': 'Tractors', 'icon': Icons.agriculture_rounded, 'cat': 'TRACTOR'},
      {'name': 'Harvesters', 'icon': Icons.agriculture_outlined, 'cat': 'HARVESTER'},
      {'name': 'Seeders', 'icon': Icons.grain_rounded, 'cat': 'IMPLEMENTS'},
      {'name': 'Tillers', 'icon': Icons.hardware_rounded, 'cat': 'TILLER'},
      {'name': 'Sprayers', 'icon': Icons.shower_rounded, 'cat': 'SPRAYER'},
      {'name': 'Ploughs', 'icon': Icons.line_weight_rounded, 'cat': 'ROTAVATOR'},
      {'name': 'Irrigation', 'icon': Icons.water_drop_rounded, 'cat': 'IMPLEMENTS'},
      {'name': 'More', 'icon': Icons.more_horiz_rounded, 'cat': 'ALL'},
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        childAspectRatio: 0.90,
      ),
      itemCount: categories.length,
      itemBuilder: (context, idx) {
        final cat = categories[idx];
        return InkWell(
          onTap: () {
            ref.read(marketplaceProvider.notifier).updateFilters(
              newCategory: cat['cat'] == 'ALL' ? null : cat['cat'] as String,
            );
            widget.onTabSelected?.call(2);
          },
          borderRadius: BorderRadius.circular(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.darkCard : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark ? Colors.white10 : Colors.grey.shade200,
                  ),
                ),
                child: Icon(
                  cat['icon'] as IconData,
                  color: AppTheme.primaryGreen,
                  size: 24,
                ),
              ),
              const SizedBox(height: 5),
              Text(
                cat['name'] as String,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPopularEquipmentSection(bool isDark, String lang) {
    final mktState = ref.watch(marketplaceProvider);
    final popular = mktState.equipment.take(6).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Popular Equipment',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
                letterSpacing: -0.3,
              ),
            ),
            TextButton(
              onPressed: () => widget.onTabSelected?.call(2),
              child: const Text(
                'View All',
                style: TextStyle(
                  color: AppTheme.primaryGreen,
                  fontWeight: FontWeight.w800,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (popular.isEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.darkCard : Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Center(
              child: Text('Loading verified equipment...'),
            ),
          )
        else
          SizedBox(
            height: 230,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: popular.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, idx) {
                final eq = popular[idx];
                final priceStr = eq.pricePerDay != null && eq.pricePerDay! > 0
                    ? '₹ \${eq.pricePerDay!.toStringAsFixed(0)} / day'
                    : 'Contact for price';
                final rating = eq.rating != null && eq.rating! > 0 ? eq.rating!.toStringAsFixed(1) : '4.8';
                final reviewCount = eq.reviewCount ?? 85;

                return InkWell(
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => EquipmentDetailsScreen(equipment: eq)),
                  ),
                  borderRadius: BorderRadius.circular(18),
                  child: Container(
                    width: 170,
                    decoration: BoxDecoration(
                      color: isDark ? AppTheme.darkCard : Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                        color: isDark ? Colors.white10 : Colors.grey.shade200,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ClipRRect(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
                          child: Container(
                            height: 100,
                            width: double.infinity,
                            color: isDark ? Colors.black26 : Colors.grey.shade100,
                            child: eq.imageUrl.isNotEmpty
                                ? Image.network(
                                    eq.imageUrl,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) => const Icon(Icons.agriculture_rounded, size: 40, color: AppTheme.primaryGreen),
                                  )
                                : const Icon(Icons.agriculture_rounded, size: 40, color: AppTheme.primaryGreen),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(10),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                eq.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 13,
                                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                ),
                              ),
                              const SizedBox(height: 3),
                              Row(
                                children: [
                                  const Icon(Icons.star_rounded, size: 14, color: Color(0xFFFFA000)),
                                  const SizedBox(width: 3),
                                  Text(
                                    '\\$rating (\\$reviewCount)',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                priceStr,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.primaryGreen,
                                ),
                              ),
                              const SizedBox(height: 8),
                              SizedBox(
                                width: double.infinity,
                                height: 28,
                                child: ElevatedButton(
                                  onPressed: () => Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (_) => EquipmentDetailsScreen(equipment: eq)),
                                  ),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppTheme.primaryGreen,
                                    foregroundColor: Colors.white,
                                    elevation: 0,
                                    padding: EdgeInsets.zero,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                  ),
                                  child: const Text(
                                    'Rent Now',
                                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
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
              },
            ),
          ),
      ],
    );
  }

  Widget _buildFarmerCommunityBanner(bool isDark, String lang) {
    return InkWell(
      onTap: () => context.push('/community'),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isDark ? Colors.white10 : AppTheme.primaryGreen.withValues(alpha: 0.25),
          ),
          boxShadow: [
            BoxShadow(
              color: AppTheme.primaryGreen.withValues(alpha: isDark ? 0.10 : 0.06),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primaryGreen, AppTheme.accentGreen],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(Icons.forum_rounded, color: Colors.white, size: 26),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        'Farmer Community',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryGreen.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'LIVE',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.primaryGreen,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    'Chat with verified farmers & coordinate equipment',
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.arrow_forward_ios_rounded,
                size: 14,
                color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
              ),
            ),
          ],
        ),
      ),
    );
  }
`;

// Also update _buildHeader to accept farmLocation
const oldHeaderSignature = `Widget _buildHeader(String farmerName, String initial, bool isDark, String? userPhoto, String lang) {`;
const newHeaderSignature = `Widget _buildHeader(String farmerName, String initial, bool isDark, String? userPhoto, String lang, [String? farmLocation]) {`;

c = c.replace(oldHeaderSignature, newHeaderSignature);

// Update brand row to include location dropdown if present
const oldBrandRow = `                Text(
                  'AgroRent AI',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  ),
                ),
              ],
            ),`;

const newBrandRow = `                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.location_on_rounded, size: 14, color: AppTheme.primaryGreen),
                        const SizedBox(width: 4),
                        Text(
                          farmLocation ?? 'Chennai, Tamil Nadu',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                          ),
                        ),
                        const SizedBox(width: 2),
                        Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: isDark ? Colors.white54 : Colors.grey.shade600),
                      ],
                    ),
                  ],
                ),
              ],
            ),`;

if (c.includes(oldBrandRow)) {
  c = c.replace(oldBrandRow, newBrandRow);
  console.log('Successfully added location selector in header');
}

// Append helpers before last closing bracket
const lastBrace = c.lastIndexOf('}');
c = c.slice(0, lastBrace) + helpers + '\n}\n';

fs.writeFileSync('mobile/lib/features/marketplace/ui/farmer_home_screen.dart', c);
console.log('Successfully updated farmer_home_screen.dart!');
