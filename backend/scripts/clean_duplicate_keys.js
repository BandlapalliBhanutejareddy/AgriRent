const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../../mobile/lib/core/localization/app_localizations.dart');
let code = fs.readFileSync(file, 'utf8');

const removals = [
  "    'te': {\n      'reply': 'సమాధానం ఇవ్వండి',\n      'equipment_needed': 'అవసరమైన పరికరాలు',\n",
  "    'hi': {\n      'reply': 'उत्तर दें',\n      'equipment_needed': 'आवश्यक उपकरण',\n",
  "    'ta': {\n      'reply': 'பதிலளிக்கவும்',\n      'equipment_needed': 'தேவையான உபகரணங்கள்',\n",
  "    'kn': {\n      'reply': 'ಪ್ರತಿಕ್ರಿಯಿಸಿ',\n      'equipment_needed': 'ಅಗತ್ಯವಿರುವ ಉಪಕರಣಗಳು',\n"
];

const replacements = [
  "    'te': {\n",
  "    'hi': {\n",
  "    'ta': {\n",
  "    'kn': {\n"
];

for (let i = 0; i < removals.length; i++) {
  code = code.replace(removals[i], replacements[i]);
}

fs.writeFileSync(file, code, 'utf8');
console.log('Cleaned duplicate keys in regional languages');
