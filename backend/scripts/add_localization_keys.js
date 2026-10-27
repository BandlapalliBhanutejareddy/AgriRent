const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../../mobile/lib/core/localization/app_localizations.dart');
let code = fs.readFileSync(file, 'utf8');

const additions = {
  en: "      'reply': 'Reply',\n      'equipment_needed': 'Equipment Needed',\n",
  te: "      'reply': 'సమాధానం ఇవ్వండి',\n      'equipment_needed': 'అవసరమైన పరికరాలు',\n",
  hi: "      'reply': 'उत्तर दें',\n      'equipment_needed': 'आवश्यक उपकरण',\n",
  ta: "      'reply': 'பதிலளிக்கவும்',\n      'equipment_needed': 'தேவையான உபகரணங்கள்',\n",
  kn: "      'reply': 'ಪ್ರತಿಕ್ರಿಯಿಸಿ',\n      'equipment_needed': 'ಅಗತ್ಯವಿರುವ ಉಪಕರಣಗಳು',\n",
};

for (const [lang, add] of Object.entries(additions)) {
  const pattern = new RegExp("('" + lang + "':\\s*\\{)");
  code = code.replace(pattern, "$1\n" + add);
}

fs.writeFileSync(file, code, 'utf8');
console.log('Successfully updated app_localizations.dart');
