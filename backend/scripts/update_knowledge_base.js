const fs = require('fs');
let c = fs.readFileSync('mobile/lib/features/marketplace/ui/knowledge_base_screen.dart', 'utf8').replace(/\r\n/g, '\n');

// 1. Add filter chip state to _KnowledgeBaseScreenState
const oldStateStart = `class _KnowledgeBaseScreenState extends ConsumerState<KnowledgeBaseScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';`;

const newStateStart = `class _KnowledgeBaseScreenState extends ConsumerState<KnowledgeBaseScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _activeFilter = 'ALL'; // ALL, SEASON, ACTIVITY

  IconData _getCropIcon(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('rice') || lower.contains('paddy')) return Icons.grass_rounded;
    if (lower.contains('wheat')) return Icons.grain_rounded;
    if (lower.contains('cotton')) return Icons.cloud_outlined;
    if (lower.contains('sugarcane')) return Icons.forest_rounded;
    if (lower.contains('maize') || lower.contains('corn')) return Icons.agriculture_rounded;
    if (lower.contains('tomato')) return Icons.eco_rounded;
    if (lower.contains('onion') || lower.contains('groundnut')) return Icons.spa_rounded;
    return Icons.eco_rounded;
  }`;

c = c.replace(oldStateStart, newStateStart);

// 2. Add filter chips bar under search field
const oldSearchPadding = `              ),
            ),
            Expanded(`;

const newFilterBar = `              ),
            ),

            // Visual Reference Filter Chips: By Crop, By Season, By Activity
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _buildFilterChip('All Articles', 'ALL'),
                  const SizedBox(width: 8),
                  _buildFilterChip('By Crop', 'CROP'),
                  const SizedBox(width: 8),
                  _buildFilterChip('By Season', 'SEASON'),
                  const SizedBox(width: 8),
                  _buildFilterChip('By Activity', 'ACTIVITY'),
                ],
              ),
            ),
            const SizedBox(height: 10),

            Expanded(`;

c = c.replace(oldSearchPadding, newFilterBar);

// 3. Add _buildFilterChip helper before _buildGrid
const filterChipHelper = `
  Widget _buildFilterChip(String label, String value) {
    final isSelected = _activeFilter == value;
    return ChoiceChip(
      label: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
          color: isSelected ? Colors.white : Colors.grey.shade700,
        ),
      ),
      selected: isSelected,
      selectedColor: AppTheme.primaryGreen,
      backgroundColor: Colors.white,
      side: BorderSide(
        color: isSelected ? AppTheme.primaryGreen : Colors.grey.shade300,
      ),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      onSelected: (_) {
        setState(() {
          _activeFilter = value;
        });
      },
    );
  }
`;

c = c.replace('  Widget _buildGrid(', filterChipHelper + '\n  Widget _buildGrid(');

// 4. Update the icon inside _buildGrid to use _getCropIcon
c = c.replace(
  'isCrop ? Icons.grass : Icons.science,',
  'isCrop ? _getCropIcon(title) : Icons.science_rounded,'
);

fs.writeFileSync('mobile/lib/features/marketplace/ui/knowledge_base_screen.dart', c);
console.log('Successfully updated knowledge_base_screen.dart with Visual Reference filters & icons!');
