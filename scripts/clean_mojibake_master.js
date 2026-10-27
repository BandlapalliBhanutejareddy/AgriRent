const fs = require('fs');
const path = require('path');

// 1. Clean web files
const webReplacements = [
  // Symbols and currency
  { from: /Ã¢â€šÂ¹/g, to: '₹' },
  { from: /Ã¢â‚¬Â¢/g, to: '•' },
  { from: /Ã¢â‚¬â€”/g, to: '—' },
  { from: /Ã¢Å“â€œ/g, to: '✓' },
  { from: /Ã¢Ëœâ€¦/g, to: '★' },
  { from: /Ã¢Â Â³/g, to: '⏳' },
  { from: /Ã°Å¸Å¡Å“/g, to: '🚜' },
  { from: /Ã°Å¸Å’Â¾/g, to: '🌾' },
  { from: /Ã°Å¸Å’Â½/g, to: '🌽' },
  { from: /Ã°Å¸Â¥â€\s*/g, to: '🥔' },
  { from: /Ã°Å¸Å’Â±/g, to: '🌱' },
  { from: /Ã°Å¸â€œÂ¡/g, to: '📡' },
  // Language switcher native names
  { from: /Ã Â°Â¤Ã Â±â€ Ã Â°Â²Ã Â±Â Ã Â°â€”Ã Â±Â /g, to: 'తెలుగు' },
  { from: /Ã Â¤Â¹Ã Â¤Â¿Ã Â¤Â¨Ã Â¥Â Ã Â¤Â¦Ã Â¥â‚¬/g, to: 'हिन्दी' },
  { from: /Ã Â®Â¤Ã Â®Â®Ã Â®Â¿Ã Â®Â´Ã Â¯Â /g, to: 'தமிழ்' },
  { from: /Ã Â²â€¢Ã Â²Â¨Ã Â³Â Ã Â²Â¨Ã Â²Â¡/g, to: 'ಕನ್ನಡ' },
];

const webFiles = [
  'D:/AgriRent_AI/web/src/components/LanguageSwitcher.tsx',
  'D:/AgriRent_AI/web/src/lib/api.ts',
  'D:/AgriRent_AI/web/src/app/login/page.tsx',
  'D:/AgriRent_AI/web/src/app/dashboard/rentals/page.tsx',
  'D:/AgriRent_AI/web/src/app/dashboard/page.tsx',
  'D:/AgriRent_AI/web/src/app/dashboard/marketplace/page.tsx',
  'D:/AgriRent_AI/web/src/app/dashboard/guides/page.tsx',
  'D:/AgriRent_AI/web/src/app/dashboard/farmer/page.tsx',
  'D:/AgriRent_AI/web/src/app/dashboard/equipment/page.tsx',
  'D:/AgriRent_AI/web/src/app/dashboard/bookings/page.tsx',
  'D:/AgriRent_AI/web/src/app/dashboard/analytics/page.tsx',
  'D:/AgriRent_AI/web/src/app/dashboard/admin/page.tsx'
];

webFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    webReplacements.forEach(r => {
      content = content.replace(r.from, r.to);
    });
    // normalize LF line endings
    content = content.replace(/\r\n/g, '\n');
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Cleaned mojibake in: ${path.basename(file)}`);
    } else {
      console.log(`No changes needed in: ${path.basename(file)}`);
    }
  }
});

// 2. Clean backend equipment dictionary
const backendEquipmentFile = 'D:/AgriRent_AI/backend/src/routes/equipment.ts';
if (fs.existsSync(backendEquipmentFile)) {
  let content = fs.readFileSync(backendEquipmentFile, 'utf8');
  const cleanDictionary = `      const dictionary: Record<string, string> = {
        // Telugu
        'ట్రాక్టర్': 'tractor', 'హార్వెస్టర్': 'harvester', 'కల్టివేటర్': 'cultivator', 'రోటవేటర్': 'rotavator',
        'స్ప్రేయర్': 'sprayer', 'థ్రెషర్': 'thresher', 'సీడ్ డ్రిల్': 'seed drill', 'పవర్ టిల్లర్': 'power tiller', 'రైస్ ట్రాన్స్‌ప్లాంటర్': 'rice transplanter',
        // Hindi
        'ट्रैक्टर': 'tractor', 'हार्वेस्टर': 'harvester', 'कल्तीवेटर': 'cultivator', 'रोटावेटर': 'rotavator',
        'स्प्रेयर': 'sprayer', 'थ्रेशर': 'thresher', 'सीड ड्रिल': 'seed drill', 'पावर टिलर': 'power tiller', 'राइस ट्रांसप्लांटर': 'rice transplanter',
        // Tamil
        'டிராக்டர்': 'tractor', 'அறுவடை இயந்திரம்': 'harvester', 'சாகுபடியாளர்': 'cultivator', 'ரோட்டாவேட்டர்': 'rotavator',
        'தெளிப்பான்': 'sprayer', 'கதிர் அடிப்பான்': 'thresher', 'விதை துரப்பணம்': 'seed drill', 'பவர் டில்லர்': 'power tiller', 'நெல் நாற்று நடும் இயந்திரம்': 'rice transplanter',
        // Kannada
        'ಟ್ರಾಕ್ಟರ್': 'tractor', 'ಹಾರ್ವೆಸ್ಟರ್': 'harvester', 'ಕಲ್ಟಿವೇಟರ್': 'cultivator', 'ರೊಟಾವೇಟರ್': 'rotavator',
        'ಸಿಂಪಡಿಸುವವನು': 'sprayer', 'ಥ್ರೆಷರ್': 'thresher', 'ಬೀಜ ಡ್ರಿಲ್': 'seed drill', 'ಪವರ್ ಟಿಲ್ಲರ್': 'power tiller', 'ಭತ್ತದ ನಾಟಿ ಯಂತ್ರ': 'rice transplanter',
        // English canonical
        'tractor': 'tractor', 'harvester': 'harvester', 'cultivator': 'cultivator', 'rotavator': 'rotavator',
        'sprayer': 'sprayer', 'thresher': 'thresher', 'seed drill': 'seed drill', 'power tiller': 'power tiller', 'rice transplanter': 'rice transplanter'
      };`;

  // Replace from 'const dictionary: Record<string, string> = {' up to '};'
  const dictRegex = /const dictionary: Record<string, string> = \{[\s\S]*?\n\s*\};/;
  if (dictRegex.test(content)) {
    content = content.replace(dictRegex, cleanDictionary.trim());
    content = content.replace(/\r\n/g, '\n');
    fs.writeFileSync(backendEquipmentFile, content, 'utf8');
    console.log(`Cleaned regional keywords dictionary in: ${path.basename(backendEquipmentFile)}`);
  } else {
    console.log(`Could not find dictionary block in ${backendEquipmentFile}`);
  }
}
