const fs = require('fs');

const filePath = 'mobile/lib/core/localization/app_localizations.dart';
let content = fs.readFileSync(filePath, 'utf8');

const newTranslations = {
  account_information: {
    en: 'Account Information',
    te: 'ఖాతా సమాచారం',
    hi: 'खाता जानकारी',
    ta: 'கணக்கு தகவல்',
    kn: 'ಖಾತೆ ಮಾಹಿತಿ'
  },
  account_status: {
    en: 'Account Status',
    te: 'ఖాతా స్థితి',
    hi: 'खाता स्थिति',
    ta: 'கணக்கு நிலை',
    kn: 'ಖಾತೆಯ ಸ್ಥಿತಿ'
  },
  active_private_calling: {
    en: 'Active Private Calling',
    te: 'సక్రియ ప్రైవేట్ కాలింగ్',
    hi: 'सक्रिय निजी कॉलिंग',
    ta: 'செயலில் உள்ள தனிப்பட்ட அழைப்பு',
    kn: 'ಸಕ್ರಿಯ ಖಾಸಗಿ ಕರೆ'
  },
  add: {
    en: 'Add',
    te: 'జోడించు',
    hi: 'जोड़ें',
    ta: 'சேர்',
    kn: 'ಸೇರಿಸಿ'
  },
  add_all_to_plan: {
    en: 'Add All to Plan',
    te: 'అన్నీ ప్రణాళికకు జోడించండి',
    hi: 'सभी को योजना में जोड़ें',
    ta: 'அனைத்தையும் திட்டத்தில் சேர்க்கவும்',
    kn: 'ಎಲ್ಲವನ್ನೂ ಯೋಜನೆಗೆ ಸೇರಿಸಿ'
  },
  add_equipment_photo: {
    en: 'Add Equipment Photo',
    te: 'పరికరాల ఫోటోను జోడించండి',
    hi: 'उपकरण की तस्वीर जोड़ें',
    ta: 'உபகரண புகைப்படத்தைச் சேர்க்கவும்',
    kn: 'ಉಪಕರಣದ ಫೋಟೋ ಸೇರಿಸಿ'
  },
  add_farm: {
    en: 'Add Farm',
    te: 'పొలాన్ని జోడించండి',
    hi: 'खेत जोड़ें',
    ta: 'பண்ணையைச் சேர்க்கவும்',
    kn: 'ಹೊಲವನ್ನು ಸೇರಿಸಿ'
  },
  add_first_equipment_prompt: {
    en: 'Add your first agricultural equipment to start earning rental income.',
    te: 'అద్దె ఆదాయాన్ని సంపాదించడానికి మీ మొదటి వ్యవసాయ పరికరాన్ని జోడించండి.',
    hi: 'किराया आय शुरू करने के लिए अपना पहला कृषि उपकरण जोड़ें।',
    ta: 'வாடகை வருமானம் பெற உங்கள் முதல் விவசாய உபகரணத்தைச் சேர்க்கவும்.',
    kn: 'ಬಾಡಿಗೆ ಆದಾಯ ಪ್ರಾರಂಭಿಸಲು ನಿಮ್ಮ ಮೊದಲ ಕೃಷಿ ಉಪಕರಣವನ್ನು ಸೇರಿಸಿ.'
  },
  agricultural_summary: {
    en: 'Agricultural Summary',
    te: 'వ్యవసాయ సారాంశం',
    hi: 'कृषि सारांश',
    ta: 'விவசாய சுருக்கம்',
    kn: 'ಕೃಷಿ ಸಾರಾಂಶ'
  },
  ask_copilot_hint: {
    en: 'Ask anything about farming, soil, or machinery...',
    te: 'వ్యవసాయం, నేల లేదా యంత్రాల గురించి ఏదైనా అడగండి...',
    hi: 'खेती, मिट्टी या मशीनरी के बारे में कुछ भी पूछें...',
    ta: 'விவசாயம், மண் அல்லது இயந்திரங்கள் பற்றி எதையும் கேளுங்கள்...',
    kn: 'ಕೃಷಿ, ಮಣ್ಣು ಅಥವಾ ಯಂತ್ರೋಪಕರಣಗಳ ಬಗ್ಗೆ ಏನನ್ನಾದರೂ ಕೇಳಿ...'
  },
  bank_details_subtitle: {
    en: 'Manage your payout account and bank transfer details',
    te: 'మీ చెల్లింపు ఖాతా మరియు బ్యాంక్ బదిలీ వివరాలను నిర్వహించండి',
    hi: 'अपने भुगतान खाते और बैंक ट्रांसफर विवरण प्रबंधित करें',
    ta: 'உங்கள் கட்டணக் கணக்கு மற்றும் வங்கி பரிமாற்ற விவரங்களை நிர்வகிக்கவும்',
    kn: 'ನಿಮ್ಮ ಪಾವತಿ ಖಾತೆ ಮತ್ತು ಬ್ಯಾಂಕ್ ವರ್ಗಾವಣೆ ವಿವರಗಳನ್ನು ನಿರ್ವಹಿಸಿ'
  },
  booking_id: {
    en: 'Booking ID',
    te: 'బుకింగ్ ఐడి',
    hi: 'बुकिंग आईडी',
    ta: 'முன்பதிவு ஐடி',
    kn: 'ಬುಕಿಂಗ್ ಐಡಿ'
  },
  change_photo: {
    en: 'Change Photo',
    te: 'ఫోటోను మార్చండి',
    hi: 'तस्वीर बदलें',
    ta: 'புகைப்படத்தை மாற்றவும்',
    kn: 'ಫೋಟೋ ಬದಲಾಯಿಸಿ'
  },
  complete: {
    en: 'Complete',
    te: 'పూర్తయింది',
    hi: 'पूर्ण',
    ta: 'முடிந்தது',
    kn: 'ಪೂರ್ಣಗೊಳಿಸಿ'
  },
  crop_groups_selling_subtitle: {
    en: 'Group crop yields and track market listings',
    te: 'పంట దిగుబడులను సమూహపరచండి మరియు మార్కెట్ జాబితాలను ట్రాక్ చేయండి',
    hi: 'फसल की पैदावार का समूह बनाएं और बाजार लिस्टिंग ट्रैक करें',
    ta: 'பயிர் விளைச்சலை குழுவாக்கி சந்தை பட்டியல்களை கண்காணிக்கவும்',
    kn: 'ಬೆಳೆ ಇಳುವರಿಗಳನ್ನು ಗುಂಪು ಮಾಡಿ ಮಾರುಕಟ್ಟೆ ಪಟ್ಟಿಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ'
  },
  crop_relation: {
    en: 'Crop Relation',
    te: 'పంట సంబంధం',
    hi: 'फसल संबंध',
    ta: 'பயிர் தொடர்பு',
    kn: 'ಬೆಳೆ ಸಂಬಂಧ'
  },
  crops: {
    en: 'Crops',
    te: 'పంటలు',
    hi: 'फसलें',
    ta: 'பயிர்கள்',
    kn: 'ಬೆಳೆಗಳು'
  },
  dispatch: {
    en: 'Dispatch',
    te: 'రవాణా చేయండి',
    hi: 'रवाना करें',
    ta: 'அனுப்புக',
    kn: 'ರವಾನಿಸಿ'
  },
  equipment_bookings_subtitle: {
    en: 'View active, upcoming, and past rental reservations',
    te: 'సక్రియ, రాబోయే మరియు గత అద్దె రిజర్వేషన్లను చూడండి',
    hi: 'सक्रिय, आगामी और पिछले किराए के आरक्षण देखें',
    ta: 'செயலில் உள்ள, வரவிருக்கும் மற்றும் கடந்த வாடகை முன்பதிவுகளைக் காண்க',
    kn: 'ಸಕ್ರಿಯ, ಮುಂಬರುವ ಮತ್ತು ಹಿಂದಿನ ಬಾಡಿಗೆ ಕಾಯ್ದಿರಿಸುವಿಕೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ'
  },
  equipment_photo: {
    en: 'Equipment Photo',
    te: 'పరికరాల ఫోటో',
    hi: 'उपकरण की तस्वीर',
    ta: 'உபகரண புகைப்படம்',
    kn: 'ಉಪಕರಣದ ಫೋಟೋ'
  },
  expense_item_title: {
    en: 'Expense Item Title',
    te: 'ఖర్చు అంశం శీర్షిక',
    hi: 'व्यय मद का शीर्षक',
    ta: 'செலவு பொருள் தலைப்பு',
    kn: 'ವೆಚ್ಚದ ಐಟಂ ಶೀರ್ಷಿಕೆ'
  },
  failed_to_upload_image: {
    en: 'Failed to upload image. Please try again.',
    te: 'చిత్రాన్ని అప్‌లోడ్ చేయడం విఫలమైంది. దయచేసి మళ్లీ ప్రయత్నించండి.',
    hi: 'तस्वीर अपलोड करने में विफल। कृपया पुनः प्रयास करें।',
    ta: 'படத்தைப் பதிவேற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
    kn: 'ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'
  },
  farm_finance_subtitle: {
    en: 'Track expenses, revenue, and profit across farms',
    te: 'పొలాల అంతటా ఖర్చులు, ఆదాయం మరియు లాభాలను ట్రాక్ చేయండి',
    hi: 'खेतों में खर्च, आय और लाभ को ट्रैक करें',
    ta: 'பண்ணைகளில் செலவுகள், வருவாய் மற்றும் லாபத்தைக் கண்காணிக்கவும்',
    kn: 'ಹೊಲಗಳಾದ್ಯಂತ ವೆಚ್ಚಗಳು, ಆದಾಯ ಮತ್ತು ಲಾಭವನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ'
  },
  farmer_details: {
    en: 'Farmer Details',
    te: 'రైతు వివరాలు',
    hi: 'किसान का विवरण',
    ta: 'விவசாயி விவரங்கள்',
    kn: 'ರೈತರ ವಿವರಗಳು'
  },
  farms: {
    en: 'Farms',
    te: 'పొలాలు',
    hi: 'खेत',
    ta: 'பண்ணைகள்',
    kn: 'ಹೊಲಗಳು'
  },
  fill_required_fields: {
    en: 'Please fill all required fields',
    te: 'దయచేసి అవసరమైన అన్ని ఫీల్డ్‌లను పూరించండి',
    hi: 'कृपया सभी आवश्यक फ़ील्ड भरें',
    ta: 'தயவுசெய்து தேவையான அனைத்து புலங்களையும் நிரப்பவும்',
    kn: 'ದಯವಿಟ್ಟು ಅಗತ್ಯವಿರುವ ಎಲ್ಲಾ ಕ್ಷೇತ್ರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ'
  },
  general_farm_expense: {
    en: 'General Farm Expense',
    te: 'సాధారణ పొలం ఖర్చు',
    hi: 'सामान्य कृषि व्यय',
    ta: 'பொது பண்ணை செலவு',
    kn: 'ಸಾಮಾನ್ಯ ಕೃಷಿ ವೆಚ್ಚ'
  },
  invalid_phone_number: {
    en: 'Please enter a valid 10-digit mobile number',
    te: 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్‌ను నమోదు చేయండి',
    hi: 'कृपया एक वैध 10-अंकीय मोबाइल नंबर दर्ज करें',
    ta: 'சரியான 10 இலக்க மொபைல் எண்ணை உள்ளிடவும்',
    kn: 'ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ 10-ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ'
  },
  items: {
    en: 'Items',
    te: 'అంశాలు',
    hi: 'मदें',
    ta: 'பொருட்கள்',
    kn: 'ವಸ್ತುಗಳು'
  },
  listed_equipment: {
    en: 'Listed Equipment',
    te: 'జాబితా చేసిన పరికరాలు',
    hi: 'सूचीबद्ध उपकरण',
    ta: 'பட்டியலிடப்பட்ட உபகரணங்கள்',
    kn: 'ಪಟ್ಟಿ ಮಾಡಲಾದ ಉಪಕರಣಗಳು'
  },
  mark_active: {
    en: 'Mark Active',
    te: 'సక్రియంగా గుర్తించండి',
    hi: 'सक्रिय चिह्नित करें',
    ta: 'செயலில் உள்ளதாக குறிக்கவும்',
    kn: 'ಸಕ್ರಿಯ ಎಂದು ಗುರುತಿಸಿ'
  },
  no_equipment_added_yet: {
    en: 'No equipment added yet',
    te: 'ఇంకా పరికరాలు ఏవీ జోడించబడలేదు',
    hi: 'अभी तक कोई उपकरण नहीं जोड़ा गया',
    ta: 'இதுவரை எந்த உபகரணமும் சேர்க்கப்படவில்லை',
    kn: 'ಇನ್ನೂ ಯಾವುದೇ ಉಪಕರಣವನ್ನು ಸೇರಿಸಲಾಗಿಲ್ಲ'
  },
  no_equipment_listed: {
    en: 'No equipment listed',
    te: 'పరికరాలు ఏవీ జాబితా చేయబడలేదు',
    hi: 'कोई उपकरण सूचीबद्ध नहीं है',
    ta: 'உபகரணங்கள் எதுவும் பட்டியலிடப்படவில்லை',
    kn: 'ಯಾವುದೇ ಉಪಕರಣ ಪಟ್ಟಿಯಾಗಿಲ್ಲ'
  },
  phone_number: {
    en: 'Phone Number',
    te: 'ఫోన్ నంబర్',
    hi: 'फ़ोन नंबर',
    ta: 'தொலைபேசி எண்',
    kn: 'ದೂರವಾಣಿ ಸಂಖ್ಯೆ'
  },
  phone_required_for_listing: {
    en: 'A verified phone number is required so farmers can contact you for equipment bookings.',
    te: 'రైతులు పరికరాల బుకింగ్‌ల కోసం మిమ్మల్ని సంప్రదించడానికి ధృవీకరించబడిన ఫోన్ నంబర్ అవసరం.',
    hi: 'सत्यापित फ़ोन नंबर आवश्यक है ताकि किसान उपकरण बुकिंग के लिए आपसे संपर्क कर सकें।',
    ta: 'விவசாயிகள் உபகரண முன்பதிவுகளுக்கு உங்களைத் தொடர்பு கொள்ள சரிபார்க்கப்பட்ட தொலைபேசி எண் தேவை.',
    kn: 'ರೈತರು ಉಪಕರಣ ಬುಕಿಂಗ್‌ಗಾಗಿ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಲು ಪರಿಶೀಲಿಸಿದ ಫೋನ್ ಸಂಖ್ಯೆ ಅಗತ್ಯವಿದೆ.'
  },
  phone_required_for_owners: {
    en: 'Phone Number Required for Equipment Listing',
    te: 'పరికరాల జాబితా కోసం ఫోన్ నంబర్ అవసరం',
    hi: 'उपकरण लिस्टिंग के लिए फ़ोन नंबर आवश्यक है',
    ta: 'உபகரணப் பட்டியலுக்கு தொலைபேசி எண் தேவை',
    kn: 'ಉಪಕರಣ ಪಟ್ಟಿಗೆ ಫೋನ್ ಸಂಖ್ಯೆ ಅಗತ್ಯವಿದೆ'
  },
  privacy_protection: {
    en: 'Privacy Protection',
    te: 'గోప్యతా రక్షణ',
    hi: 'गोपनीयता सुरक्षा',
    ta: 'தனியுரிமை பாதுகாப்பு',
    kn: 'ಗೌಪ್ಯತೆ ರಕ್ಷಣೆ'
  },
  registered_farms: {
    en: 'Registered Farms',
    te: 'నమోదిత పొలాలు',
    hi: 'पंजीकृत खेत',
    ta: 'பதிவுசெய்யப்பட்ட பண்ணைகள்',
    kn: 'ನೋಂದಾಯಿತ ಹೊಲಗಳು'
  },
  reply_to: {
    en: 'Reply to',
    te: 'ప్రత్యుత్తరం ఇవ్వండి',
    hi: 'जवाब दें',
    ta: 'பதிலளிக்கவும்',
    kn: 'ಪ್ರತ್ಯುತ್ತರಿಸಿ'
  },
  revenue_trends: {
    en: 'Revenue Trends',
    te: 'ఆదాయ పోకడలు',
    hi: 'राजस्व रुझान',
    ta: 'வருவாய் போக்குகள்',
    kn: 'ಆದಾಯ ಪ್ರವೃತ್ತಿಗಳು'
  },
  save_equipment: {
    en: 'Save Equipment',
    te: 'పరికరాలను సేవ్ చేయండి',
    hi: 'उपकरण सहेजें',
    ta: 'உபகரணத்தைச் சேமிக்கவும்',
    kn: 'ಉಪಕರಣವನ್ನು ಉಳಿಸಿ'
  },
  status_updated_success: {
    en: 'Status updated successfully',
    te: 'స్థితి విజయవంతంగా నవీకరించబడింది',
    hi: 'स्थिति सफलतापूर्वक अपडेट की गई',
    ta: 'நிலை வெற்றிகரமாக புதுப்பிக்கப்பட்டது',
    kn: 'ಸ್ಥಿತಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ'
  },
  submit_equipment: {
    en: 'Submit Equipment Listing',
    te: 'పరికరాల జాబితాను సమర్పించండి',
    hi: 'उपकरण लिस्टिंग सबमिट करें',
    ta: 'உபகரணப் பட்டியலைச் சமர்ப்பிக்கவும்',
    kn: 'ಉಪಕರಣ ಪಟ್ಟಿಯನ್ನು ಸಲ್ಲಿಸಿ'
  },
  suggested_questions: {
    en: 'Suggested Questions',
    te: 'సూచించబడిన ప్రశ్నలు',
    hi: 'सुझाए गए प्रश्न',
    ta: 'பரிந்துரைக்கப்பட்ட கேள்விகள்',
    kn: 'ಸೂಚಿಸಲಾದ ಪ್ರಶ್ನೆಗಳು'
  },
  tap_to_change_photo: {
    en: 'Tap to change photo',
    te: 'ఫోటోను మార్చడానికి నొక్కండి',
    hi: 'तस्वीर बदलने के लिए टैप करें',
    ta: 'புகைப்படத்தை மாற்ற தட்டவும்',
    kn: 'ಫೋಟೋ ಬದಲಾಯಿಸಲು ಟ್ಯಾಪ್ ಮಾಡಿ'
  },
  tap_to_select_photo: {
    en: 'Tap to select photo',
    te: 'ఫోటోను ఎంచుకోవడానికి నొక్కండి',
    hi: 'तस्वीर चुनने के लिए टैप करें',
    ta: 'புகைப்படத்தைத் தேர்ந்தெடுக்க தட்டவும்',
    kn: 'ಫೋಟೋ ಆಯ್ಕೆ ಮಾಡಲು ಟ್ಯಾಪ್ ಮಾಡಿ'
  },
  title: {
    en: 'Equipment Title',
    te: 'పరికరాల శీర్షిక',
    hi: 'उपकरण का नाम',
    ta: 'உபகரணத் தலைப்பு',
    kn: 'ಉಪಕರಣದ ಹೆಸರು'
  },
  todays_tasks: {
    en: "Today's Tasks",
    te: 'ఈ రోజు పనులు',
    hi: 'आज के कार्य',
    ta: 'இன்றைய பணிகள்',
    kn: 'ಇಂದಿನ ಕಾರ್ಯಗಳು'
  },
  top_equipment: {
    en: 'Top Equipment',
    te: 'అగ్ర పరికరాలు',
    hi: 'शीर्ष उपकरण',
    ta: 'சிறந்த உபகரணங்கள்',
    kn: 'ಉನ್ನತ ಉಪಕರಣಗಳು'
  },
  update_phone: {
    en: 'Update Phone',
    te: 'ఫోన్ నంబర్ నవీకరించండి',
    hi: 'फ़ोन अपडेट करें',
    ta: 'தொலைபேசியைப் புதுப்பிக்கவும்',
    kn: 'ಫೋನ್ ನವೀಕರಿಸಿ'
  },
  view_details: {
    en: 'View Details',
    te: 'వివరాలను చూడండి',
    hi: 'विवरण देखें',
    ta: 'விவரங்களைக் காண்க',
    kn: 'ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ'
  },
  write_something: {
    en: 'Write something...',
    te: 'ఏదైనా రాయండి...',
    hi: 'कुछ लिखें...',
    ta: 'ஏதாவது எழுதுங்கள்...',
    kn: 'ಏನನ್ನಾದರೂ ಬರೆಯಿರಿ...'
  }
};

const languages = ['en', 'te', 'hi', 'ta', 'kn'];

for (const lang of languages) {
  const pattern = `'${lang}': {`;
  const idx = content.indexOf(pattern);
  if (idx === -1) {
    console.error(`Language ${lang} not found`);
    continue;
  }
  const insertPos = idx + pattern.length;

  let insertStr = '\n';
  for (const [key, trans] of Object.entries(newTranslations)) {
    // Only insert if key doesn't already exist in this lang block
    // Find next language block or end of _localizedValues
    const nextLangIdx = languages.indexOf(lang) < languages.length - 1
      ? content.indexOf(`'${languages[languages.indexOf(lang) + 1]}': {`)
      : content.indexOf('  };');
    const currentBlock = content.substring(idx, nextLangIdx !== -1 ? nextLangIdx : undefined);

    if (!currentBlock.includes(`'${key}':`)) {
      const val = (trans[lang] || trans['en']).replace(/'/g, "\\'");
      insertStr += `      '${key}': '${val}',\n`;
    }
  }

  content = content.substring(0, insertPos) + insertStr + content.substring(insertPos);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully injected missing localization keys into all 5 languages!');
