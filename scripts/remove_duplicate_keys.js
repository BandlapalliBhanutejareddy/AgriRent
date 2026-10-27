const fs = require('fs');
const file = 'mobile/lib/core/localization/app_localizations.dart';
let s = fs.readFileSync(file, 'utf8');

// The 5 language inserted blocks:
const enTarget = `      'reply': 'Reply',\r\n`;
const enTarget2 = `      'reply': 'Reply',\n`;
const enTargetClear = `      'clear_search': 'Clear search',\r\n`;
const enTargetClear2 = `      'clear_search': 'Clear search',\n`;
const enTargetEquip = `      'equipment_needed': 'Equipment Needed',\r\n`;
const enTargetEquip2 = `      'equipment_needed': 'Equipment Needed',\n`;

const teTarget = `      'reply': 'సమాధానం',\r\n`;
const teTarget2 = `      'reply': 'సమాధానం',\n`;
const teTargetClear = `      'clear_search': 'శోధనను క్లియర్ చేయండి',\r\n`;
const teTargetClear2 = `      'clear_search': 'శోధనను క్లియర్ చేయండి',\n`;
const teTargetEquip = `      'equipment_needed': 'అవసరమైన పరికరం',\r\n`;
const teTargetEquip2 = `      'equipment_needed': 'అవసరమైన పరికరం',\n`;

const hiTarget = `      'reply': 'जवाब दें',\r\n`;
const hiTarget2 = `      'reply': 'जवाब दें',\n`;
const hiTargetClear = `      'clear_search': 'खोज साफ़ करें',\r\n`;
const hiTargetClear2 = `      'clear_search': 'खोज साफ़ करें',\n`;
const hiTargetEquip = `      'equipment_needed': 'उपकरण की आवश्यकता',\r\n`;
const hiTargetEquip2 = `      'equipment_needed': 'उपकरण की आवश्यकता',\n`;

const taTarget = `      'reply': 'பதிலளி',\r\n`;
const taTarget2 = `      'reply': 'பதிலளி',\n`;
const taTargetClear = `      'clear_search': 'தேடலை அழிக்கவும்',\r\n`;
const taTargetClear2 = `      'clear_search': 'தேடலை அழிக்கவும்',\n`;
const taTargetEquip = `      'equipment_needed': 'தேவையான உபகரணம்',\r\n`;
const taTargetEquip2 = `      'equipment_needed': 'தேவையான உபகரணம்',\n`;

const knTarget = `      'reply': 'ಉತ್ತರಿಸಿ',\r\n`;
const knTarget2 = `      'reply': 'ಉತ್ತರಿಸಿ',\n`;
const knTargetClear = `      'clear_search': 'ಹುಡುಕಾಟವನ್ನು ತೆರವುಗೊಳಿಸಿ',\r\n`;
const knTargetClear2 = `      'clear_search': 'ಹುಡುಕಾಟವನ್ನು ತೆರವುಗೊಳಿಸಿ',\n`;
const knTargetEquip = `      'equipment_needed': 'ಅಗತ್ಯವಿರುವ ಉಪಕರಣ',\r\n`;
const knTargetEquip2 = `      'equipment_needed': 'ಅಗತ್ಯವಿರುವ ಉಪಕರಣ',\n`;

function removeOnce(target) {
  const idx = s.indexOf(target);
  if (idx !== -1) {
    s = s.substring(0, idx) + s.substring(idx + target.length);
    console.log('Removed match for target');
  }
}

removeOnce(enTarget);
removeOnce(enTarget2);
removeOnce(enTargetClear);
removeOnce(enTargetClear2);
removeOnce(enTargetEquip);
removeOnce(enTargetEquip2);

removeOnce(teTarget);
removeOnce(teTarget2);
removeOnce(teTargetClear);
removeOnce(teTargetClear2);
removeOnce(teTargetEquip);
removeOnce(teTargetEquip2);

removeOnce(hiTarget);
removeOnce(hiTarget2);
removeOnce(hiTargetClear);
removeOnce(hiTargetClear2);
removeOnce(hiTargetEquip);
removeOnce(hiTargetEquip2);

removeOnce(taTarget);
removeOnce(taTarget2);
removeOnce(taTargetClear);
removeOnce(taTargetClear2);
removeOnce(taTargetEquip);
removeOnce(taTargetEquip2);

removeOnce(knTarget);
removeOnce(knTarget2);
removeOnce(knTargetClear);
removeOnce(knTargetClear2);
removeOnce(knTargetEquip);
removeOnce(knTargetEquip2);

fs.writeFileSync(file, s, 'utf8');
console.log('Finished removing duplicate keys!');
