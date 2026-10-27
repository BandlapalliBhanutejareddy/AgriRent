const fs = require('fs');

// 1. crop_lifecycle_screen.dart
let cLife = fs.readFileSync('mobile/lib/features/farm/ui/crop_lifecycle_screen.dart', 'utf8');
cLife = cLife.replace(/void _showUpdateStageSheet\(String farmId, String cropId, String cropName, String currentStage, String lang\) \{/g,
  "void _showUpdateStageSheet(String farmId, String cropId, String cropName, String currentStage) {\n    final lang = ref.read(languageProvider);");
cLife = cLife.replace(/void _showUpdateStageSheet\(String farmId, String cropId, String cropName, String currentStage\) \{/g,
  "void _showUpdateStageSheet(String farmId, String cropId, String cropName, String currentStage) {\n    final lang = ref.read(languageProvider);");
cLife = cLife.replace(/_showUpdateStageSheet\(farm\.id, crop\.id, crop\.cropName, crop\.currentStage, lang\)/g,
  "_showUpdateStageSheet(farm.id, crop.id, crop.cropName, crop.currentStage)");

cLife = cLife.replace(/void _showMarkStageCompleteDialog\(String farmId, String cropId, String currentStage\) \{/g,
  "void _showMarkStageCompleteDialog(String farmId, String cropId, String currentStage) {\n    final lang = ref.read(languageProvider);");

cLife = cLife.replace(/kCanonicalStages\.contains\(AppLocalizations\.localizedCropStage\(currentStage, lang\)\)\s*\?\s*kCanonicalStages\.indexOf\(AppLocalizations\.localizedCropStage\(currentStage, lang\)\)/g,
  "kCanonicalStages.contains(currentStage.toUpperCase()) ? kCanonicalStages.indexOf(currentStage.toUpperCase())");

fs.writeFileSync('mobile/lib/features/farm/ui/crop_lifecycle_screen.dart', cLife, 'utf8');
console.log('Fixed crop_lifecycle_screen.dart');

// 2. farmer_home_screen.dart
let fHome = fs.readFileSync('mobile/lib/features/marketplace/ui/farmer_home_screen.dart', 'utf8');
if (!fHome.includes("import '../../../core/localization/app_localizations.dart';")) {
  fHome = "import '../../../core/localization/app_localizations.dart';\n" + fHome;
}
fHome = fHome.replace(/void _showCropSelectorSheet\(BuildContext context\) \{[\s\S]*?final farms =/g,
  "void _showCropSelectorSheet(BuildContext context) {\n    final lang = ref.read(languageProvider);\n    final farms =");
fs.writeFileSync('mobile/lib/features/marketplace/ui/farmer_home_screen.dart', fHome, 'utf8');
console.log('Fixed farmer_home_screen.dart');
