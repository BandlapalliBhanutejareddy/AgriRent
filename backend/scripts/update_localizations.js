const fs = require('fs');
const path = require('path');

const locPath = path.join(__dirname, '../../mobile/lib/core/localization/app_localizations.dart');
let content = fs.readFileSync(locPath, 'utf8');

// Keys to add per language
const additions = {
  en: `      'payment_history': 'Payment History',
      'payments_received': 'Payments Received',
      'view_past_payments_receipts': 'View past payments & receipts',
      'view_received_payments': 'View received payments & receipts',
      'paid': 'Paid',`,
  te: `      'payment_history': 'చెల్లింపుల చరిత్ర',
      'payments_received': 'స్వీకరించిన చెల్లింపులు',
      'view_past_payments_receipts': 'గత చెల్లింపులు & రసీదులను చూడండి',
      'view_received_payments': 'స్వీకరించిన చెల్లింపులు & రసీదులను చూడండి',
      'paid': 'చెల్లించబడింది',`,
  hi: `      'payment_history': 'भुगतान इतिहास',
      'payments_received': 'प्राप्त भुगतान',
      'view_past_payments_receipts': 'पिछले भुगतान और रसीदें देखें',
      'view_received_payments': 'प्राप्त भुगतान और रसीदें देखें',
      'paid': 'भुगतान किया गया',`,
  ta: `      'payment_history': 'கட்டண வரலாறு',
      'payments_received': 'பெறப்பட்ட கட்டணங்கள்',
      'view_past_payments_receipts': 'கடந்த கட்டணங்கள் மற்றும் ரசீதுகளைக் காண்க',
      'view_received_payments': 'பெறப்பட்ட கட்டணங்கள் மற்றும் ரசீதுகளைக் காண்க',
      'paid': 'செலுத்தப்பட்டது',`,
  kn: `      'payment_history': 'ಪಾವತಿ ಇತಿಹಾಸ',
      'payments_received': 'ಸ್ವೀಕರಿಸಿದ ಪಾವತಿಗಳು',
      'view_past_payments_receipts': 'ಹಿಂದಿನ ಪಾವತಿಗಳು ಮತ್ತು ರಶೀದಿಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
      'view_received_payments': 'ಸ್ವೀಕರಿಸಿದ ಪಾವತಿಗಳು ಮತ್ತು ರಶೀದಿಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
      'paid': 'ಪಾವತಿಸಲಾಗಿದೆ',`
};

for (const [lang, block] of Object.entries(additions)) {
  const searchPattern = new RegExp(`('${lang}':\\s*\\{[\\s\\S]*?'amount_paid':\\s*'[^']+',)`);
  if (content.match(searchPattern)) {
    content = content.replace(searchPattern, `$1\n${block}`);
    console.log(`Added payment localization for [${lang}]`);
  } else {
    console.log(`Could not find anchor for [${lang}]`);
  }
}

fs.writeFileSync(locPath, content, 'utf8');
console.log('app_localizations.dart updated with payment keys successfully');
