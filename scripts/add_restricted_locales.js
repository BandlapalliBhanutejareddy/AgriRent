const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'mobile', 'lib', 'core', 'localization', 'app_localizations.dart');
let content = fs.readFileSync(targetFile, 'utf8');

const newKeys = {
  en: {
    account_restricted: 'Account Restricted',
    account_restricted_explanation: 'Your owner account has been restricted by an administrator pending policy or complaint review. You may submit an appeal or resolution request to customer support.',
    submit_resolution_request: 'Submit Resolution Request',
    catalog_image: 'Catalog Image'
  },
  te: {
    account_restricted: 'ఖాతా పరిమితం చేయబడింది',
    account_restricted_explanation: 'పాలసీ లేదా ఫిర్యాదు సమీక్ష పెండింగ్‌లో ఉన్నందున మీ ఓనర్ ఖాతా అడ్మినిస్ట్రేటర్ ద్వారా తాత్కాలికంగా పరిమితం చేయబడింది. మీరు మద్దతు బృందానికి అప్పీల్ సమర్పించవచ్చు.',
    submit_resolution_request: 'పరిష్కార అభ్యర్థన సమర్పించండి',
    catalog_image: 'కాటలాగ్ చిత్రం'
  },
  hi: {
    account_restricted: 'खाता प्रतिबंधित',
    account_restricted_explanation: 'नीति या शिकायत समीक्षा लंबित होने के कारण आपके ओनर खाते को व्यवस्थापक द्वारा प्रतिबंधित कर दिया गया है। आप ग्राहक सहायता को अपील प्रस्तुत कर सकते हैं।',
    submit_resolution_request: 'समाधान अनुरोध भेजें',
    catalog_image: 'कैटलॉग छवि'
  },
  ta: {
    account_restricted: 'கணக்கு கட்டுப்படுத்தப்பட்டுள்ளது',
    account_restricted_explanation: 'கொள்கை அல்லது புகார் மதிப்பாய்வு நிலுவையில் உள்ளதால் உங்கள் உரிமையாளர் கணக்கு நிர்வாகியால் தற்காலிகமாக கட்டுப்படுத்தப்பட்டுள்ளது.',
    submit_resolution_request: 'தீர்வு கோரிக்கையை சமர்ப்பிக்கவும்',
    catalog_image: 'பட்டியல் படம்'
  },
  kn: {
    account_restricted: 'ಖಾತೆಯನ್ನು ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ',
    account_restricted_explanation: 'ನೀತಿ ಅಥವಾ ದೂರು ಪರಿಶೀಲನೆ ಬಾಕಿ ಇರುವುದರಿಂದ ನಿಮ್ಮ ಮಾಲೀಕರ ಖಾತೆಯನ್ನು ನಿರ್ವಾಹಕರು ನಿರ್ಬಂಧಿಸಿದ್ದಾರೆ. ನೀವು ಪರಿಹಾರ ವಿನಂತಿಯನ್ನು ಸಲ್ಲಿಸಬಹುದು.',
    submit_resolution_request: 'ಪರಿಹಾರ ವಿನಂತಿ ಸಲ್ಲಿಸಿ',
    catalog_image: 'ಕ್ಯಾಟಲಾಗ್ ಚಿತ್ರ'
  }
};

for (const lang of ['te', 'hi', 'ta', 'kn']) {
  const targetPattern = `'${lang}': {`;
  const idx = content.indexOf(targetPattern);
  if (idx === -1) {
    console.error(`Could not find '${lang}': { block!`);
    continue;
  }

  const insertPos = idx + targetPattern.length;
  let addition = '\n';
  for (const [k, v] of Object.entries(newKeys[lang])) {
    addition += `      '${k}': '${v.replace(/'/g, "\\'")}',\n`;
  }

  content = content.slice(0, insertPos) + addition + content.slice(insertPos);
  console.log(`Added keys for language: ${lang}`);
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('All 5 languages updated in app_localizations.dart');
