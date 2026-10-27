const fs = require('fs');

// 1. farmer_marketplace_screen.dart
let fMarket = fs.readFileSync('mobile/lib/features/marketplace/ui/farmer_marketplace_screen.dart', 'utf8');
fMarket = fMarket.replace("title: const Text('Marketplace', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20))",
  "title: Text('marketplace'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20))");

fMarket = fMarket.replace("hintText: 'Search equipment...'",
  "hintText: 'search_articles'.tr(lang)");

fMarket = fMarket.replace("cat[0] + cat.substring(1).toLowerCase()",
  "cat == 'ALL' ? 'all'.tr(lang) : AppLocalizations.localizedEquipmentCategory(cat, lang)");

fMarket = fMarket.replace("Text('No equipment found',",
  "Text('no_information_available'.tr(lang),");

fMarket = fMarket.replace("child: const Text('Retry', style: TextStyle(color: Colors.white)),",
  "child: Text('retry'.tr(lang), style: const TextStyle(color: Colors.white)),");

fs.writeFileSync('mobile/lib/features/marketplace/ui/farmer_marketplace_screen.dart', fMarket, 'utf8');
console.log('Fixed farmer_marketplace_screen.dart');

// 2. equipment_card.dart
let eqCard = fs.readFileSync('mobile/lib/features/marketplace/ui/widgets/equipment_card.dart', 'utf8');
eqCard = eqCard.replace(/equipment\.category\.toUpperCase\(\)/g,
  'AppLocalizations.localizedEquipmentCategory(equipment.category, lang)');

eqCard = eqCard.replace(/final priceString = hasPrice[\s\S]*?: 'not_available'\.tr\(lang\);/g,
  'final priceString = AppFormatters.currency(equipment.pricePerDay, lang: lang);');

fs.writeFileSync('mobile/lib/features/marketplace/ui/widgets/equipment_card.dart', eqCard, 'utf8');
console.log('Fixed equipment_card.dart');
