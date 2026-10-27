const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'mobile', 'lib', 'core', 'localization', 'app_localizations.dart');
let content = fs.readFileSync(targetFile, 'utf8');

const newTranslations = {
  en: {
    fields: 'Fields',
    total_acres: 'Total Acres',
    current_crop: 'Current Crop',
    expected_harvest: 'Expected Harvest',
    my_farm_fields: 'My Farm & Fields',
    view_manage_fields: 'View and manage your fields',
    farm_plan_tasks: 'Farm Plan & Tasks',
    upcoming_activities_schedule: 'Upcoming activities and schedule',
    farm_finance: 'Farm Finance',
    expenses_income_reports: 'Expenses, income and reports',
    equipment_bookings: 'Equipment Bookings',
    my_rentals_booking_history: 'My rentals and booking history',
    crop_groups_selling: 'Crop Groups & Selling',
    my_groups_posts: 'My groups and posts',
    preferences: 'Preferences',
    notifications_language_privacy: 'Notifications, language, privacy',
    equipments: 'Equipments',
    this_month: 'This Month',
    rating: 'Rating',
    name_contact_address: 'Name, contact, address',
    name_contact_language_address: 'Name, contact, language, address',
    add_edit_manage_equipment: 'Add, edit and manage equipment',
    bookings_requests: 'Bookings & Requests',
    upcoming_past_bookings: 'Upcoming and past bookings',
    earnings_payouts: 'Earnings & Payouts',
    income_payouts_reports: 'Income, payouts and reports',
    service_maintenance: 'Service & Maintenance',
    service_logs_schedules: 'Service logs and schedules',
    reviews_ratings: 'Reviews & Ratings',
    customer_feedback: 'Customer feedback',
    bank_details: 'Bank Details',
    manage_payout_details: 'Manage payout details',
    crop_groups: 'Crop Groups',
    user_management: 'User Management',
    farmers_owners_admins: 'Farmers, owners and admins',
    equipment_management: 'Equipment Management',
    approve_monitor_equipment: 'Approve and monitor equipment',
    crop_groups_monitoring: 'Crop Groups Monitoring',
    manage_crop_groups_posts: 'Manage crop groups and posts',
    reports_analytics: 'Reports & Analytics',
    users_bookings_revenue_activity: 'Users, bookings, revenue, activity',
    content_management: 'Content Management',
    farming_knowledge_ai_content: 'Farming knowledge and AI teacher content',
    system_settings: 'System Settings',
    app_config_preferences: 'App configuration and preferences',
    security_access: 'Security & Access',
    roles_permissions_audit_logs: 'Roles, permissions and activity logs',
    talk: 'Talk',
    confirm_logout: 'Are you sure you want to log out of AgroRent AI?',
    logout_btn: 'Logout',
    verified: 'Verified',
    unverified: 'Unverified'
  },
  te: {
    fields: 'పొలాలు',
    total_acres: 'మొత్తం ఎకరాలు',
    current_crop: 'ప్రస్తుత పంట',
    expected_harvest: 'ఆశించిన కోత',
    my_farm_fields: 'నా వ్యవసాయం & పొలాలు',
    view_manage_fields: 'మీ పొలాలను వీక్షించండి మరియు నిర్వహించండి',
    farm_plan_tasks: 'వ్యవసాయ ప్రణాళిక & పనులు',
    upcoming_activities_schedule: 'రాబోయే కార్యకలాపాలు మరియు షెడ్యూల్',
    farm_finance: 'వ్యవసాయ ఆర్థిక వ్యవహారాలు',
    expenses_income_reports: 'ఖర్చులు, ఆదాయం మరియు నివేదికలు',
    equipment_bookings: 'యంత్రాల బుకింగ్‌లు',
    my_rentals_booking_history: 'నా అద్దెలు మరియు బుకింగ్ చరిత్ర',
    crop_groups_selling: 'పంట సమూహాలు & అమ్మకాలు',
    my_groups_posts: 'నా సమూహాలు మరియు పోస్ట్‌లు',
    preferences: 'ప్రాధాన్యతలు',
    notifications_language_privacy: 'నోటిఫికేషన్‌లు, భాష, గోప్యత',
    equipments: 'యంత్రాలు',
    this_month: 'ఈ నెల',
    rating: 'రేటింగ్',
    name_contact_address: 'పేరు, సంప్రదింపులు, చిరునామా',
    name_contact_language_address: 'పేరు, సంప్రదింపులు, భాష, చిరునామా',
    add_edit_manage_equipment: 'యంత్రాలను జోడించండి, సవరించండి & నిర్వహించండి',
    bookings_requests: 'బుకింగ్‌లు & అభ్యర్థనలు',
    upcoming_past_bookings: 'రాబోయే మరియు గత బుకింగ్‌లు',
    earnings_payouts: 'ఆదాయం & చెల్లింపులు',
    income_payouts_reports: 'ఆదాయం, చెల్లింపులు మరియు నివేదికలు',
    service_maintenance: 'సర్వీస్ & నిర్వహణ',
    service_logs_schedules: 'సర్వీస్ లాగ్‌లు మరియు షెడ్యూల్‌లు',
    reviews_ratings: 'సమీక్షలు & రేటింగ్‌లు',
    customer_feedback: 'వినియోగదారుల అభిప్రాయం',
    bank_details: 'బ్యాంకు వివరాలు',
    manage_payout_details: 'చెల్లింపు వివరాలను నిర్వహించండి',
    crop_groups: 'పంట సమూహాలు',
    user_management: 'వినియోగదారుల నిర్వహణ',
    farmers_owners_admins: 'రైతులు, యజమానులు మరియు నిర్వాహకులు',
    equipment_management: 'యంత్రాల నిర్వహణ',
    approve_monitor_equipment: 'యంత్రాలను ఆమోదించండి & పర్యవేక్షించండి',
    crop_groups_monitoring: 'పంట సమూహాల పర్యవేక్షణ',
    manage_crop_groups_posts: 'పంట సమూహాలు మరియు పోస్ట్‌లను నిర్వహించండి',
    reports_analytics: 'నివేదికలు & విశ్లేషణలు',
    users_bookings_revenue_activity: 'వినియోగదారులు, బుకింగ్‌లు, ఆదాయం, కార్యాచరణ',
    content_management: 'కంటెంట్ నిర్వహణ',
    farming_knowledge_ai_content: 'వ్యవసాయ జ్ఞానం మరియు AI ఉపాధ్యాయ విషయాలు',
    system_settings: 'సిస్టమ్ సెట్టింగ్‌లు',
    app_config_preferences: 'యాప్ కాన్ఫిగరేషన్ మరియు ప్రాధాన్యతలు',
    security_access: 'భద్రత & యాక్సెస్',
    roles_permissions_audit_logs: 'పాత్రలు, అనుమతులు మరియు కార్యాచరణ లాగ్‌లు',
    talk: 'టాక్',
    confirm_logout: 'మీరు ఖచ్చితంగా AgroRent AI నుండి లాగౌట్ చేయాలనుకుంటున్నారా?',
    logout_btn: 'లాగౌట్',
    verified: 'ధృవీకరించబడింది',
    unverified: 'ధృవీకరించబడలేదు'
  },
  hi: {
    fields: 'खेत',
    total_acres: 'कुल एकड़',
    current_crop: 'वर्तमान फसल',
    expected_harvest: 'अपेक्षित कटाई',
    my_farm_fields: 'मेरा खेत और क्षेत्र',
    view_manage_fields: 'अपने खेतों को देखें और प्रबंधित करें',
    farm_plan_tasks: 'फार्म योजना और कार्य',
    upcoming_activities_schedule: 'आगामी गतिविधियाँ और अनुसूची',
    farm_finance: 'कृषि वित्त',
    expenses_income_reports: 'खर्च, आय और रिपोर्ट',
    equipment_bookings: 'उपकरण बुकिंग',
    my_rentals_booking_history: 'मेरी बुकिंग और किराये का इतिहास',
    crop_groups_selling: 'फसल समूह और बिक्री',
    my_groups_posts: 'मेरे समूह और पोस्ट',
    preferences: 'प्राथमिकताएं',
    notifications_language_privacy: 'सूचनाएं, भाषा, गोपनीयता',
    equipments: 'उपकरण',
    this_month: 'इस महीने',
    rating: 'रेटिंग',
    name_contact_address: 'नाम, संपर्क, पता',
    name_contact_language_address: 'नाम, संपर्क, भाषा, पता',
    add_edit_manage_equipment: 'उपकरण जोड़ें, संपादित करें और प्रबंधित करें',
    bookings_requests: 'बुकिंग और अनुरोध',
    upcoming_past_bookings: 'आगामी और पिछली बुकिंग',
    earnings_payouts: 'कमाई और भुगतान',
    income_payouts_reports: 'आय, भुगतान और रिपोर्ट',
    service_maintenance: 'सेवा और रखरखाव',
    service_logs_schedules: 'सर्विस लॉग और शेड्यूल',
    reviews_ratings: 'समीक्षा और रेटिंग',
    customer_feedback: 'ग्राहक प्रतिक्रिया',
    bank_details: 'बैंक विवरण',
    manage_payout_details: 'भुगतान विवरण प्रबंधित करें',
    crop_groups: 'फसल समूह',
    user_management: 'उपयोगकर्ता प्रबंधन',
    farmers_owners_admins: 'किसान, मालिक और व्यवस्थापक',
    equipment_management: 'उपकरण प्रबंधन',
    approve_monitor_equipment: 'उपकरणों को स्वीकृत और मॉनिटर करें',
    crop_groups_monitoring: 'फसल समूह निगरानी',
    manage_crop_groups_posts: 'फसल समूहों और पोस्ट को प्रबंधित करें',
    reports_analytics: 'रिपोर्ट और विश्लेषण',
    users_bookings_revenue_activity: 'उपयोगकर्ता, बुकिंग, राजस्व, गतिविधि',
    content_management: 'सामग्री प्रबंधन',
    farming_knowledge_ai_content: 'कृषि ज्ञान और AI शिक्षक सामग्री',
    system_settings: 'सिस्टम सेटिंग्स',
    app_config_preferences: 'ऐप कॉन्फ़िगरेशन और प्राथमिकताएं',
    security_access: 'सुरक्षा और पहुंच',
    roles_permissions_audit_logs: 'भूमिकाएं, अनुमतियां और गतिविधि लॉग',
    talk: 'बात करें',
    confirm_logout: 'क्या आप वाकई AgroRent AI से लॉग आउट करना चाहते हैं?',
    logout_btn: 'लॉग आउट',
    verified: 'सत्यापित',
    unverified: 'असत्यापित'
  },
  ta: {
    fields: 'வயல்கள்',
    total_acres: 'மொத்த ஏக்கர்',
    current_crop: 'தற்போதைய பயிர்',
    expected_harvest: 'எதிர்பார்க்கப்படும் அறுவடை',
    my_farm_fields: 'என் பண்ணை & வயல்கள்',
    view_manage_fields: 'உங்கள் வயல்களைப் பார்த்து நிர்வகிக்கவும்',
    farm_plan_tasks: 'பண்ணைத் திட்டம் & பணிகள்',
    upcoming_activities_schedule: 'வரவிருக்கும் செயல்பாடுகள் & அட்டவணை',
    farm_finance: 'பண்ணை நிதி',
    expenses_income_reports: 'செலவுகள், வருமானம் மற்றும் அறிக்கைகள்',
    equipment_bookings: 'உபகரண முன்பதிவுகள்',
    my_rentals_booking_history: 'என் வாடகை மற்றும் முன்பதிவு வரலாறு',
    crop_groups_selling: 'பயிர் குழுக்கள் & விற்பனை',
    my_groups_posts: 'என் குழுக்கள் மற்றும் இடுகைகள்',
    preferences: 'விருப்பத்தேர்வுகள்',
    notifications_language_privacy: 'அறிவிப்புகள், மொழி, தனியுரிமை',
    equipments: 'உபகரணங்கள்',
    this_month: 'இந்த மாதம்',
    rating: 'மதிப்பீடு',
    name_contact_address: 'பெயர், தொடர்பு, முகவரி',
    name_contact_language_address: 'பெயர், தொடர்பு, மொழி, முகவரி',
    add_edit_manage_equipment: 'உபகரணங்களைச் சேர்க்கவும், திருத்தவும் & நிர்வகிக்கவும்',
    bookings_requests: 'முன்பதிவுகள் & கோரிக்கைகள்',
    upcoming_past_bookings: 'வரவிருக்கும் மற்றும் கடந்தகால முன்பதிவுகள்',
    earnings_payouts: 'வருமானம் & கொடுப்பனவுகள்',
    income_payouts_reports: 'வருமானம், கொடுப்பனவுகள் மற்றும் அறிக்கைகள்',
    service_maintenance: 'சேவை & பராமரிப்பு',
    service_logs_schedules: 'சேவை பதிவுகள் மற்றும் அட்டவணைகள்',
    reviews_ratings: 'மதிப்புரைகள் & மதிப்பீடுகள்',
    customer_feedback: 'வாடிக்கையாளர் கருத்து',
    bank_details: 'வங்கி விவரங்கள்',
    manage_payout_details: 'கொடுப்பனவு விவரங்களை நிர்வகிக்கவும்',
    crop_groups: 'பயிர் குழுக்கள்',
    user_management: 'பயனர் மேலாண்மை',
    farmers_owners_admins: 'விவசாயிகள், உரிமையாளர்கள் மற்றும் நிர்வாகிகள்',
    equipment_management: 'உபகரண மேலாண்மை',
    approve_monitor_equipment: 'உபகரணங்களை அங்கீகரித்து கண்காணிக்கவும்',
    crop_groups_monitoring: 'பயிர் குழுக்கள் கண்காணிப்பு',
    manage_crop_groups_posts: 'பயிர் குழுக்கள் மற்றும் இடுகைகளை நிர்வகிக்கவும்',
    reports_analytics: 'அறிக்கைகள் & பகுப்பாய்வு',
    users_bookings_revenue_activity: 'பயனர்கள், முன்பதிவுகள், வருவாய், செயல்பாடு',
    content_management: 'உள்ளடக்க மேலாண்மை',
    farming_knowledge_ai_content: 'விவசாய அறிவு மற்றும் AI ஆசிரியர் உள்ளடக்கம்',
    system_settings: 'கணினி அமைப்புகள்',
    app_config_preferences: 'பயன்பாட்டு கட்டமைப்பு மற்றும் விருப்பத்தேர்வுகள்',
    security_access: 'பாதுகாப்பு & அணுகல்',
    roles_permissions_audit_logs: 'பாத்திரங்கள், அனுமதிகள் மற்றும் செயல்பாட்டு பதிவுகள்',
    talk: 'பேசுங்கள்',
    confirm_logout: 'AgroRent AI இலிருந்து நிச்சயமாக வெளியேற விரும்புகிறீர்களா?',
    logout_btn: 'வெளியேறு',
    verified: 'சரிபார்க்கப்பட்டது',
    unverified: 'சரிபார்க்கப்படவில்லை'
  },
  kn: {
    fields: 'ಹೊಲಗಳು',
    total_acres: 'ಒಟ್ಟು ಎಕರೆ',
    current_crop: 'ಪ್ರಸ್ತುತ ಬೆಳೆ',
    expected_harvest: 'ನಿರೀಕ್ಷಿತ ಕೊಯ್ಲು',
    my_farm_fields: 'ನನ್ನ ಕೃಷಿ & ಹೊಲಗಳು',
    view_manage_fields: 'ನಿಮ್ಮ ಹೊಲಗಳನ್ನು ನೋಡಿ ಮತ್ತು ನಿರ್ವಹಿಸಿ',
    farm_plan_tasks: 'ಕೃಷಿ ಯೋಜನೆ & ಕಾರ್ಯಗಳು',
    upcoming_activities_schedule: 'ಮುಂಬರುವ ಚಟುವಟಿಕೆಗಳು & ವೇಳಾಪಟ್ಟಿ',
    farm_finance: 'ಕೃಷಿ ಹಣಕಾಸು',
    expenses_income_reports: 'ವೆಚ್ಚಗಳು, ಆದಾಯ ಮತ್ತು ವರದಿಗಳು',
    equipment_bookings: 'ಉಪಕರಣ ಬುಕಿಂಗ್‌ಗಳು',
    my_rentals_booking_history: 'ನನ್ನ ಬಾಡಿಗೆ ಮತ್ತು ಬುಕಿಂಗ್ ಇತಿಹಾಸ',
    crop_groups_selling: 'ಬೆಳೆ ಗುಂಪುಗಳು & ಮಾರಾಟ',
    my_groups_posts: 'ನನ್ನ ಗುಂಪುಗಳು ಮತ್ತು ಪೋಸ್ಟ್‌ಗಳು',
    preferences: 'ಆದ್ಯತೆಗಳು',
    notifications_language_privacy: 'ಅಧಿಸೂಚನೆಗಳು, ಭಾಷೆ, ಗೌಪ್ಯತೆ',
    equipments: 'ಉಪಕರಣಗಳು',
    this_month: 'ಈ ತಿಂಗಳು',
    rating: 'ರೇಟಿಂಗ್',
    name_contact_address: 'ಹೆಸರು, ಸಂಪರ್ಕ, ವಿಳಾಸ',
    name_contact_language_address: 'ಹೆಸರು, ಸಂಪರ್ಕ, ಭಾಷೆ, ವಿಳಾಸ',
    add_edit_manage_equipment: 'ಉಪಕರಣಗಳನ್ನು ಸೇರಿಸಿ, ಸಂಪಾದಿಸಿ ಮತ್ತು ನಿರ್ವಹಿಸಿ',
    bookings_requests: 'ಬುಕಿಂಗ್‌ಗಳು & ವಿನಂತಿಗಳು',
    upcoming_past_bookings: 'ಮುಂಬರುವ ಮತ್ತು ಹಿಂದಿನ ಬುಕಿಂಗ್‌ಗಳು',
    earnings_payouts: 'ಗಳಿಕೆ & ಪಾವತಿಗಳು',
    income_payouts_reports: 'ಆದಾಯ, ಪಾವತಿಗಳು ಮತ್ತು ವರದಿಗಳು',
    service_maintenance: 'ಸೇವೆ & ನಿರ್ವಹಣೆ',
    service_logs_schedules: 'ಸೇವಾ ಲಾಗ್‌ಗಳು ಮತ್ತು ವೇಳಾಪಟ್ಟಿಗಳು',
    reviews_ratings: 'ವಿಮರ್ಶೆಗಳು & ರೇಟಿಂಗ್‌ಗಳು',
    customer_feedback: 'ಗ್ರಾಹಕರ ಪ್ರತಿಕ್ರಿಯೆ',
    bank_details: 'ಬ್ಯಾಂಕ್ ವಿವರಗಳು',
    manage_payout_details: 'ಪಾವತಿ ವಿವರಗಳನ್ನು ನಿರ್ವಹಿಸಿ',
    crop_groups: 'ಬೆಳೆ ಗುಂಪುಗಳು',
    user_management: 'ಬಳಕೆದಾರರ ನಿರ್ವಹಣೆ',
    farmers_owners_admins: 'ರೈತರು, ಮಾಲೀಕರು ಮತ್ತು ನಿರ್ವಾಹಕರು',
    equipment_management: 'ಉಪಕರಣ ನಿರ್ವಹಣೆ',
    approve_monitor_equipment: 'ಉಪಕರಣಗಳನ್ನು ಅನುಮೋದಿಸಿ ಮತ್ತು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿ',
    crop_groups_monitoring: 'ಬೆಳೆ ಗುಂಪುಗಳ ಮೇಲ್ವಿಚಾರಣೆ',
    manage_crop_groups_posts: 'ಬೆಳೆ ಗುಂಪುಗಳು ಮತ್ತು ಪೋಸ್ಟ್‌ಗಳನ್ನು ನಿರ್ವಹಿಸಿ',
    reports_analytics: 'ವರದಿಗಳು & ವಿಶ್ಲೇಷಣೆ',
    users_bookings_revenue_activity: 'ಬಳಕೆದಾರರು, ಬುಕಿಂಗ್‌ಗಳು, ಆದಾಯ, ಚಟುವಟಿಕೆ',
    content_management: 'ವಿಷಯ ನಿರ್ವಹಣೆ',
    farming_knowledge_ai_content: 'ಕೃಷಿ ಜ್ಞಾನ ಮತ್ತು AI ಶಿಕ್ಷಕರ ವಿಷಯ',
    system_settings: 'ಸಿಸ್ಟಮ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    app_config_preferences: 'ಅಪ್ಲಿಕೇಶನ್ ಕಾನ್ಫಿಗರೇಶನ್ ಮತ್ತು ಆದ್ಯತೆಗಳು',
    security_access: 'ಭದ್ರತೆ & ಪ್ರವೇಶ',
    roles_permissions_audit_logs: 'ಪಾತ್ರಗಳು, ಅನುಮತಿಗಳು ಮತ್ತು ಚಟುವಟಿಕೆ ಲಾಗ್‌ಗಳು',
    talk: 'ಮಾತನಾಡಿ',
    confirm_logout: 'ನೀವು ನಿಜವಾಗಿಯೂ AgroRent AI ನಿಂದ ಲಾಗ್ ಔಟ್ ಮಾಡಲು ಬಯಸುವಿರಾ?',
    logout_btn: 'ಲಾಗ್ ಔಟ್',
    verified: 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
    unverified: 'ಪರಿಶೀಲಿಸಿಲ್ಲ'
  }
};

// Parse existing _localizedValues map
const regex = /'([a-z]{2})':\s*\{([\s\S]*?)\n\s*\},/g;
let match;
const parsed = {};

while ((match = regex.exec(content)) !== null) {
  const lang = match[1];
  const block = match[2];
  const entries = {};
  
  const lineRegex = /^\s*'([^']+)'\s*:\s*'((?:\\'|[^'])*)',?\s*$/gm;
  let lineMatch;
  while ((lineMatch = lineRegex.exec(block)) !== null) {
    const k = lineMatch[1];
    const v = lineMatch[2];
    entries[k] = v; // Last one wins, inherently deduplicating!
  }

  // Add new entries
  if (newTranslations[lang]) {
    for (const [k, v] of Object.entries(newTranslations[lang])) {
      entries[k] = v.replace(/'/g, "\\'");
    }
  }

  parsed[lang] = entries;
}

// Rebuild the _localizedValues map string cleanly
let newMapStr = "  static final Map<String, Map<String, String>> _localizedValues = {\n";
for (const lang of ['en', 'te', 'hi', 'ta', 'kn']) {
  if (!parsed[lang]) continue;
  newMapStr += `    '${lang}': {\n`;
  for (const [k, v] of Object.entries(parsed[lang])) {
    newMapStr += `      '${k}': '${v}',\n`;
  }
  newMapStr += `    },\n`;
}
newMapStr += "  };";

// Replace in content
const mapStartIdx = content.indexOf("  static final Map<String, Map<String, String>> _localizedValues = {");
const mapEndIdx = content.indexOf("  static String tr(String key, String langCode) {");

if (mapStartIdx !== -1 && mapEndIdx !== -1) {
  content = content.substring(0, mapStartIdx) + newMapStr + "\n\n" + content.substring(mapEndIdx);
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('Successfully deduplicated and updated app_localizations.dart!');
} else {
  console.error('Failed to locate _localizedValues bounds in app_localizations.dart', { mapStartIdx, mapEndIdx });
  process.exit(1);
}
