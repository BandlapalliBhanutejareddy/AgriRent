const fs = require('fs');
const path = require('path');

const bookingEn = {
  paymentSummary: "Payment Summary",
  confirmDetails: "Confirm your booking details below.",
  equipmentLabel: "Equipment:",
  ownerLabel: "Owner:",
  datesLabel: "Dates:",
  totalAmountLabel: "Total Amount:",
  agroRentDirect: "AgroRent Direct Confirmation",
  confirmAndBook: "Confirm & Book",
  confirming: "Confirming...",
  cancel: "Cancel",
  bookingSubmitted: "Booking Request Submitted ✓",
  requestPending: "Your request has been submitted and is pending owner approval. Payment status is recorded as PAID.",
  callOwner: "Call Owner",
  chatWithOwner: "Chat With Owner",
  viewRentals: "View My Rentals",
  close: "Close"
};

const bookingTe = {
  paymentSummary: "చెల్లింపు సారాంశం",
  confirmDetails: "మీ బుకింగ్ వివరాలను దిగువ నిర్ధారించండి.",
  equipmentLabel: "యంత్రం:",
  ownerLabel: "యజమాని:",
  datesLabel: "తేదీలు:",
  totalAmountLabel: "మొత్తం ధర:",
  agroRentDirect: "ఆగ్రోరెంట్ డైరెక్ట్ కన్ఫర్మేషన్",
  confirmAndBook: "నిర్ధారించి బుక్ చేయండి",
  confirming: "నిర్ధారిస్తోంది...",
  cancel: "రద్దు చేయండి",
  bookingSubmitted: "బుకింగ్ అభ్యర్థన సమర్పించబడింది ✓",
  requestPending: "మీ అభ్యర్థన సమర్పించబడింది మరియు యజమాని ఆమోదం కోసం వేచి ఉంది. చెల్లింపు పూర్తయింది.",
  callOwner: "యజమానికి కాల్ చేయండి",
  chatWithOwner: "యజమానితో చాట్ చేయండి",
  viewRentals: "నా అద్దెలను చూడండి",
  close: "మూసివేయి"
};

const bookingHi = {
  paymentSummary: "भुगतान सारांश",
  confirmDetails: "नीचे अपने बुकिंग विवरण की पुष्टि करें।",
  equipmentLabel: "उपकरण:",
  ownerLabel: "मालिक:",
  datesLabel: "तिथियां:",
  totalAmountLabel: "कुल राशि:",
  agroRentDirect: "एग्रोरेंट डायरेक्ट कन्फर्मेशन",
  confirmAndBook: "पुष्टि करें और बुक करें",
  confirming: "पुष्टि कर रहा है...",
  cancel: "रद्द करें",
  bookingSubmitted: "बुकिंग अनुरोध प्रस्तुत किया गया ✓",
  requestPending: "आपका अनुरोध सबमिट कर दिया गया है और मालिक की मंजूरी के लिए लंबित है। भुगतान की स्थिति PAID के रूप में दर्ज की गई है।",
  callOwner: "मालिक को कॉल करें",
  chatWithOwner: "मालिक के साथ चैट करें",
  viewRentals: "मेरा किराया देखें",
  close: "बंद करें"
};

const bookingTa = {
  paymentSummary: "கட்டண சுருக்கம்",
  confirmDetails: "கீழே உங்கள் முன்பதிவு விவரங்களை உறுதிப்படுத்தவும்.",
  equipmentLabel: "உபகரணங்கள்:",
  ownerLabel: "உரிமையாளர்:",
  datesLabel: "தேதிகள்:",
  totalAmountLabel: "மொத்த தொகை:",
  agroRentDirect: "AgroRent நேரடி உறுதிப்படுத்தல்",
  confirmAndBook: "உறுதிப்படுத்தி முன்பதிவு செய்",
  confirming: "உறுதிப்படுத்துகிறது...",
  cancel: "ரத்துசெய்",
  bookingSubmitted: "முன்பதிவு கோரிக்கை சமர்ப்பிக்கப்பட்டது ✓",
  requestPending: "உங்கள் கோரிக்கை சமர்ப்பிக்கப்பட்டது மற்றும் உரிமையாளர் ஒப்புதலுக்காக காத்திருக்கிறது. கட்டணம் செலுத்தப்பட்டது.",
  callOwner: "உரிமையாளரை அழை",
  chatWithOwner: "உரிமையாளருடன் அரட்டையடி",
  viewRentals: "எனது வாடகைகளைப் பார்",
  close: "மூடு"
};

const bookingKn = {
  paymentSummary: "ಪಾವತಿ ಸಾರಾಂಶ",
  confirmDetails: "ಕೆಳಗೆ ನಿಮ್ಮ ಬುಕಿಂಗ್ ವಿವರಗಳನ್ನು ಖಚಿತಪಡಿಸಿ.",
  equipmentLabel: "ಉಪಕರಣ:",
  ownerLabel: "ಮಾಲೀಕ:",
  datesLabel: "ದಿನಾಂಕಗಳು:",
  totalAmountLabel: "ಒಟ್ಟು ಮೊತ್ತ:",
  agroRentDirect: "AgroRent ನೇರ ದೃಢೀಕರಣ",
  confirmAndBook: "ಖಚಿತಪಡಿಸಿ ಮತ್ತು ಕಾಯ್ದಿರಿಸಿ",
  confirming: "ಖಚಿತಪಡಿಸಲಾಗುತ್ತಿದೆ...",
  cancel: "ರದ್ದುಮಾಡಿ",
  bookingSubmitted: "ಬುಕಿಂಗ್ ವಿನಂತಿ ಸಲ್ಲಿಸಲಾಗಿದೆ ✓",
  requestPending: "ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಸಲ್ಲಿಸಲಾಗಿದೆ ಮತ್ತು ಮಾಲೀಕರ ಅನುಮೋದನೆಗಾಗಿ ಬಾಕಿಯಿದೆ. ಪಾವತಿ ಸ್ಥಿತಿಯನ್ನು PAID ಎಂದು ದಾಖಲಿಸಲಾಗಿದೆ.",
  callOwner: "ಮಾಲೀಕರಿಗೆ ಕರೆ ಮಾಡಿ",
  chatWithOwner: "ಮಾಲೀಕರೊಂದಿಗೆ ಚಾಟ್ ಮಾಡಿ",
  viewRentals: "ನನ್ನ ಬಾಡಿಗೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
  close: "ಮುಚ್ಚಿ"
};

const enPath = path.join(__dirname, '../../web/src/locales/en.json');
const tePath = path.join(__dirname, '../../web/src/locales/te.json');
const hiPath = path.join(__dirname, '../../web/src/locales/hi.json');
const taPath = path.join(__dirname, '../../web/src/locales/ta.json');
const knPath = path.join(__dirname, '../../web/src/locales/kn.json');

const updateLocale = (p, bookingData) => {
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  data.booking = bookingData;
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
};

updateLocale(enPath, bookingEn);
updateLocale(tePath, bookingTe);
updateLocale(hiPath, bookingHi);
updateLocale(taPath, bookingTa);
updateLocale(knPath, bookingKn);

console.log('Booking translations added.');
