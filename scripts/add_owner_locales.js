const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../mobile/lib/core/localization/app_localizations.dart');
let content = fs.readFileSync(filePath, 'utf8');

const additions = {
  en: {
    'my_equipment_subtitle': 'Manage your equipment listings and availability',
    'bookings_and_requests': 'Bookings & Requests',
    'bookings_requests_subtitle': 'Track incoming and active rental requests',
    'earnings_and_payouts': 'Earnings & Payouts',
    'earnings_payouts_subtitle': 'View rental income and payment breakdown',
    'service_maintenance_subtitle': 'Equipment maintenance and service logs',
    'reviews_ratings_subtitle': 'Farmer reviews and feedback for your machinery',
    'preferences_subtitle': 'Theme, notifications, and language settings',
  },
  te: {
    'my_equipment_subtitle': 'మీ పరికరాల జాబితా మరియు లభ్యతను నిర్వహించండి',
    'bookings_and_requests': 'బుకింగ్‌లు & అభ్యర్థనలు',
    'bookings_requests_subtitle': 'రాబోయే మరియు యాక్టివ్ అద్దె అభ్యర్థనలను ట్రాక్ చేయండి',
    'earnings_and_payouts': 'ఆదాయం & చెల్లింపులు',
    'earnings_payouts_subtitle': 'అద్దె ఆదాయం మరియు చెల్లింపుల వివరాలను చూడండి',
    'service_maintenance_subtitle': 'పరికరాల నిర్వహణ మరియు సర్వీస్ రికార్డులు',
    'reviews_ratings_subtitle': 'మీ పరికరాలపై రైతుల సమీక్షలు మరియు ఫీడ్‌బ్యాక్',
    'preferences_subtitle': 'థీమ్, నోటిఫికేషన్‌లు మరియు భాష సెట్టింగ్‌లు',
  },
  hi: {
    'my_equipment_subtitle': 'अपने उपकरण सूची और उपलब्धता का प्रबंधन करें',
    'bookings_and_requests': 'बुकिंग और अनुरोध',
    'bookings_requests_subtitle': 'आगामी और सक्रिय किराये के अनुरोधों को ट्रैक करें',
    'earnings_and_payouts': 'कमाई और भुगतान',
    'earnings_payouts_subtitle': 'किराये की आय और भुगतान विवरण देखें',
    'service_maintenance_subtitle': 'उपकरण रखरखाव और सेवा लॉग',
    'reviews_ratings_subtitle': 'आपकी मशीनरी के लिए किसानों की समीक्षाएं',
    'preferences_subtitle': 'थीम, सूचनाएं और भाषा सेटिंग्स',
  },
  ta: {
    'my_equipment_subtitle': 'உங்கள் உபகரண பட்டியல் மற்றும் கிடைக்கும் தன்மையை நிர்வகிக்கவும்',
    'bookings_and_requests': 'முன்பதிவுகள் & கோரிக்கைகள்',
    'bookings_requests_subtitle': 'உள்வரும் மற்றும் செயலில் உள்ள வாடகை கோரிக்கைகளைக் கண்காணிக்கவும்',
    'earnings_and_payouts': 'வருவாய் & கொடுப்பனவுகள்',
    'earnings_payouts_subtitle': 'வாடகை வருமானம் மற்றும் கட்டண விவரங்களைக் காண்க',
    'service_maintenance_subtitle': 'உபகரண பராமரிப்பு மற்றும் சேவை பதிவுகள்',
    'reviews_ratings_subtitle': 'உங்கள் இயந்திரங்களுக்கான விவசாயிகள் மதிப்பாய்வு',
    'preferences_subtitle': 'தீம், அறிவிப்புகள் மற்றும் மொழி அமைப்புகள்',
  },
  kn: {
    'my_equipment_subtitle': 'ನಿಮ್ಮ ಉಪಕರಣ ಪಟ್ಟಿ ಮತ್ತು ಲಭ್ಯತೆಯನ್ನು ನಿರ್ವಹಿಸಿ',
    'bookings_and_requests': 'ಬುಕಿಂಗ್‌ಗಳು & ವಿನಂತಿಗಳು',
    'bookings_requests_subtitle': 'ಒಳಬರುವ ಮತ್ತು ಸಕ್ರಿಯ ಬಾಡಿಗೆ ವಿನಂತಿಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    'earnings_and_payouts': 'ಗಳಿಕೆ & ಪಾವತಿಗಳು',
    'earnings_payouts_subtitle': 'ಬಾಡಿಗೆ ಆದಾಯ ಮತ್ತು ಪಾವತಿ ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
    'service_maintenance_subtitle': 'ಉಪಕರಣ ನಿರ್ವಹಣೆ ಮತ್ತು ಸೇವಾ ಲಾಗ್‌ಗಳು',
    'reviews_ratings_subtitle': 'ನಿಮ್ಮ ಯಂತ್ರೋಪಕರಣಗಳಿಗೆ ರೈತರ ವಿಮರ್ಶೆಗಳು',
    'preferences_subtitle': 'ಥೀಮ್, ಅಧಿಸೂಚನೆಗಳು ಮತ್ತು ಭಾಷಾ ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
  }
};

for (const lang of ['en', 'te', 'hi', 'ta', 'kn']) {
  const marker = "'" + lang + "': {";
  const index = content.indexOf(marker);
  if (index !== -1) {
    const insertPos = index + marker.length;
    const block = '\n' + Object.entries(additions[lang])
      .map(([k, v]) => `      '${k}': '${v.replace(/'/g, "\\'")}',`)
      .join('\n');
    content = content.slice(0, insertPos) + block + content.slice(insertPos);
    console.log(`Added keys for ${lang}`);
  } else {
    console.warn(`Marker not found for ${lang}`);
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done!');
