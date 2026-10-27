const fs = require('fs');

// 1. receipt_screen.dart
let receipt = fs.readFileSync('mobile/lib/features/marketplace/ui/receipt_screen.dart', 'utf8');
receipt = receipt.replace(/equipment\.category\.toUpperCase\(\)/g, 'AppLocalizations.localizedEquipmentCategory(equipment.category, lang)');
receipt = receipt.replace(/booking\.paymentStatus/g, 'AppLocalizations.localizedPaymentStatus(booking.paymentStatus, lang)');
receipt = receipt.replace(/Text\(\s*status\.toUpperCase\(\),/g, 'Text(AppLocalizations.localizedBookingStatus(status, lang),');
fs.writeFileSync('mobile/lib/features/marketplace/ui/receipt_screen.dart', receipt, 'utf8');
console.log('Fixed receipt_screen.dart');

// 2. equipment_details_screen.dart
let eqDetails = fs.readFileSync('mobile/lib/features/marketplace/ui/equipment_details_screen.dart', 'utf8');
eqDetails = eqDetails.replace(/eq\.category\.toUpperCase\(\)/g, 'AppLocalizations.localizedEquipmentCategory(eq.category, lang)');
eqDetails = eqDetails.replace(/widget\.equipment\.category\.toUpperCase\(\)/g, 'AppLocalizations.localizedEquipmentCategory(widget.equipment.category, lang)');
fs.writeFileSync('mobile/lib/features/marketplace/ui/equipment_details_screen.dart', eqDetails, 'utf8');
console.log('Fixed equipment_details_screen.dart');

// 3. farmer_marketplace_screen.dart
let fMarket = fs.readFileSync('mobile/lib/features/marketplace/ui/farmer_marketplace_screen.dart', 'utf8');
fMarket = fMarket.replace(/eq\.category\.toUpperCase\(\)/g, 'AppLocalizations.localizedEquipmentCategory(eq.category, lang)');
fs.writeFileSync('mobile/lib/features/marketplace/ui/farmer_marketplace_screen.dart', fMarket, 'utf8');
console.log('Fixed farmer_marketplace_screen.dart');

// 4. farmer_home_screen.dart
let fHome = fs.readFileSync('mobile/lib/features/marketplace/ui/farmer_home_screen.dart', 'utf8');
fHome = fHome.replace(/eq\.category\.toUpperCase\(\)/g, 'AppLocalizations.localizedEquipmentCategory(eq.category, lang)');
fHome = fHome.replace(/c\.stage/g, 'AppLocalizations.localizedCropStage(c.stage, lang)');
fHome = fHome.replace(/crop\.currentStage/g, 'AppLocalizations.localizedCropStage(crop.currentStage, lang)');
fs.writeFileSync('mobile/lib/features/marketplace/ui/farmer_home_screen.dart', fHome, 'utf8');
console.log('Fixed farmer_home_screen.dart');

// 5. crop_lifecycle_screen.dart
let cLife = fs.readFileSync('mobile/lib/features/farm/ui/crop_lifecycle_screen.dart', 'utf8');
cLife = cLife.replace(/stage\.toUpperCase\(\)/g, 'AppLocalizations.localizedCropStage(stage, lang)');
cLife = cLife.replace(/currentStage\.toUpperCase\(\)/g, 'AppLocalizations.localizedCropStage(currentStage, lang)');
fs.writeFileSync('mobile/lib/features/farm/ui/crop_lifecycle_screen.dart', cLife, 'utf8');
console.log('Fixed crop_lifecycle_screen.dart');

// 6. stage_operations_screen.dart
let sOps = fs.readFileSync('mobile/lib/features/farm/ui/stage_operations_screen.dart', 'utf8');
sOps = sOps.replace(/widget\.stage\.toUpperCase\(\)/g, 'AppLocalizations.localizedCropStage(widget.stage, lang)');
fs.writeFileSync('mobile/lib/features/farm/ui/stage_operations_screen.dart', sOps, 'utf8');
console.log('Fixed stage_operations_screen.dart');
