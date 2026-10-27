const fs = require('fs');

// 1. farmer_home_screen.dart
let fHome = fs.readFileSync('mobile/lib/features/marketplace/ui/farmer_home_screen.dart', 'utf8');
fHome = fHome.replace('void _showCropSelectionModal(BuildContext context, List<FarmModel> farms, bool isDark) {',
  'void _showCropSelectionModal(BuildContext context, List<FarmModel> farms, bool isDark) {\n    final lang = ref.read(languageProvider);');
fs.writeFileSync('mobile/lib/features/marketplace/ui/farmer_home_screen.dart', fHome, 'utf8');
console.log('Fixed farmer_home_screen.dart');

// 2. crop_lifecycle_screen.dart
let cLife = fs.readFileSync('mobile/lib/features/farm/ui/crop_lifecycle_screen.dart', 'utf8');
// remove duplicate lang in methods
cLife = cLife.replace(/void _showUpdateStageSheet\([\s\S]*?\{\s*final lang = ref\.read\(languageProvider\);/g,
  'void _showUpdateStageSheet(String farmId, String cropId, String cropName, String currentStage) {');
cLife = cLife.replace(/void _showMarkStageCompleteDialog\([\s\S]*?\{\s*final lang = ref\.read\(languageProvider\);/g,
  'void _showMarkStageCompleteDialog(String farmId, String cropId, String currentStage) {');

fs.writeFileSync('mobile/lib/features/farm/ui/crop_lifecycle_screen.dart', cLife, 'utf8');
console.log('Fixed crop_lifecycle_screen.dart');
