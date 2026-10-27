const fs = require('fs');

let cLife = fs.readFileSync('mobile/lib/features/farm/ui/crop_lifecycle_screen.dart', 'utf8');

cLife = cLife.replace(/final stageName = '\$\{stage\[0\]\}\$\{stage\.substring\(1\)\.toLowerCase\(\)\}';/g,
  'final stageName = AppLocalizations.localizedCropStage(stage, lang);');

cLife = cLife.replace(/const Text\(\s*'Active',/g,
  "Text('active'.tr(lang),");

cLife = cLife.replace(/_buildTimelineItem\(\{/g,
  '_buildTimelineItem({\n    required String lang,');

cLife = cLife.replace(/return _buildTimelineItem\(/g,
  'return _buildTimelineItem(\n                    lang: lang,');

fs.writeFileSync('mobile/lib/features/farm/ui/crop_lifecycle_screen.dart', cLife, 'utf8');
console.log('Updated crop_lifecycle_screen.dart with complete localization');
