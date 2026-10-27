const fs = require('fs');

// 1. app_localizations.dart - add localizedPaymentStatus
let appLoc = fs.readFileSync('mobile/lib/core/localization/app_localizations.dart', 'utf8');
if (!appLoc.includes('localizedPaymentStatus')) {
  const method = `
  static String localizedPaymentStatus(String? status, String lang) {
    if (status == null || status.isEmpty) return 'not_available'.tr(lang);
    final norm = status.toUpperCase().replaceAll(' ', '_');
    switch (norm) {
      case 'PENDING':
        return get('pending', lang);
      case 'PAID':
      case 'COMPLETED':
      case 'SUCCESS':
        return get('completed', lang);
      case 'FAILED':
        return get('error', lang);
      case 'REFUNDED':
        return get('returned', lang);
      default:
        return status;
    }
  }
`;
  appLoc = appLoc.replace('static String localizedRole', method + '\n  static String localizedRole');
  fs.writeFileSync('mobile/lib/core/localization/app_localizations.dart', appLoc, 'utf8');
  console.log('Added localizedPaymentStatus to app_localizations.dart');
}

// 2. crop_lifecycle_screen.dart
let cLife = fs.readFileSync('mobile/lib/features/farm/ui/crop_lifecycle_screen.dart', 'utf8');
if (!cLife.includes('app_localizations.dart')) {
  cLife = "import '../../../core/localization/app_localizations.dart';\n" + cLife;
}
cLife = cLife.replace(/void _showUpdateStageSheet\(String farmId, String cropId, String cropName, String currentStage\) \{/g,
  "void _showUpdateStageSheet(String farmId, String cropId, String cropName, String currentStage, String lang) {");
cLife = cLife.replace(/_showUpdateStageSheet\(farm\.id, crop\.id, crop\.cropName, crop\.currentStage\)/g,
  "_showUpdateStageSheet(farm.id, crop.id, crop.cropName, crop.currentStage, lang)");
cLife = cLife.replace(/Widget build\(BuildContext context\) \{/g,
  "Widget build(BuildContext context) {\n    final lang = ref.watch(languageProvider);");

fs.writeFileSync('mobile/lib/features/farm/ui/crop_lifecycle_screen.dart', cLife, 'utf8');
console.log('Fixed crop_lifecycle_screen.dart');

// 3. farmer_home_screen.dart
let fHome = fs.readFileSync('mobile/lib/features/marketplace/ui/farmer_home_screen.dart', 'utf8');
fHome = fHome.replace(/void _showCropSelectorSheet\(BuildContext context\) \{/g,
  "void _showCropSelectorSheet(BuildContext context) {\n    final lang = ref.read(languageProvider);");
fs.writeFileSync('mobile/lib/features/marketplace/ui/farmer_home_screen.dart', fHome, 'utf8');
console.log('Fixed farmer_home_screen.dart');
