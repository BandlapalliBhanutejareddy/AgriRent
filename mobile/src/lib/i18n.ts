import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "login_title": "Welcome to AgroRent AI",
      "login_subtitle": "Smart equipment rental for farmers",
      "email_placeholder": "Enter your email",
      "send_otp": "Send OTP",
      "verify_otp": "Verify OTP",
      "marketplace": "Marketplace",
      "bookings": "Bookings",
      "profile": "Profile",
      "home": "Home",
      "advisor": "Advisor",
      "guides": "Guides",
      "welcome_back": "Welcome back,",
      "active_booking": "Active Booking",
      "continue_learning": "Continue Learning",
      "nearby_equipment": "Nearby Equipment",
      "view_all": "VIEW ALL",
      "browse": "BROWSE",
      "explore_all": "Explore All",
      "status": "Status",
      "search_placeholder": "Search for equipment...",
      "ai_advisor_title": "AI Farm Advisor",
      "ai_advisor_subtitle": "Get smart equipment recommendations tailored to your crop cycle.",
      "get_ai_advice": "Get AI Recommendations",
      "crop_planting": "WHAT CROP ARE YOU PLANTING?",
      "soil_type": "SOIL TYPE",
      "acreage": "ACREAGE",
      "recommended_tools": "Recommended Tools",
      "search_marketplace": "Search Marketplace",
      "farming_guides": "Farming Guides",
      "step": "Step",
      "next": "Next",
      "previous": "Previous",
      "finish": "Finish",
      "owner_dashboard": "Owner Dashboard",
      "my_equipment": "My Equipment",
      "earnings": "Earnings",
      "pending_requests": "Pending Requests",
      "active_rentals": "Active Rentals",
      "select_language": "Select Language",
      "email_label": "Email Address",
      "otp_label": "One-Time Password",
      "otp_placeholder": "Enter 6-digit code",
      "join_as": "Join as a:",
      "farmer": "Farmer",
      "owner": "Owner",
      "confirm_login": "Confirm & Login",
      "send_verification": "Send Verification Code",
      "categories": {
        "all": "All",
        "tractors": "Tractors",
        "harvesters": "Harvesters",
        "implements": "Implements"
      }
    }
  },
  ta: {
    translation: {
      "login_title": "AgroRent AI க்கு நல்வரவு",
      "login_subtitle": "விவசாயிகளுக்கான உபகரண வாடகை",
      "email_placeholder": "உங்கள் மின்னஞ்சலை உள்ளிடவும்",
      "marketplace": "சந்தை",
      "bookings": "முன்பதிவுகள்",
      "profile": "சுயவிவரம்",
      "home": "முகப்பு",
      "advisor": "ஆலோசகர்",
      "guides": "வழிகாட்டிகள்",
      "welcome_back": "மீண்டும் வருக,",
      "active_booking": "செயலில் உள்ள முன்பதிவு",
      "continue_learning": "தொடர்ந்து கற்க",
      "nearby_equipment": "அருகிலுள்ள உபகரணங்கள்",
      "view_all": "அனைத்தையும் காண்க",
      "browse": "உலாவுக",
      "explore_all": "அனைத்தையும் ஆராயுங்கள்",
      "status": "நிலை",
      "search_placeholder": "உபகரணங்களைத் தேடுங்கள்...",
      "ai_advisor_title": "AI பண்ணை ஆலோசகர்",
      "get_ai_advice": "AI பரிந்துரைகளைப் பெறுங்கள்",
      "crop_planting": "நீங்கள் என்ன பயிர் நடுகிறீர்கள்?",
      "recommended_tools": "பரிந்துரைக்கப்பட்ட கருவிகள்",
      "email_label": "மின்னஞ்சல் முகவரி",
      "otp_label": "ஒரு முறை கடவுச்சொல் (OTP)",
      "otp_placeholder": "6 இலக்க குறியீட்டை உள்ளிடவும்",
      "join_as": "இதில் சேரவும்:",
      "farmer": "விவசாயி",
      "owner": "உரிமையாளர்",
      "confirm_login": "உறுதிப்படுத்தி உள்நுழைக",
      "send_verification": "சரிபார்ப்புக் குறியீட்டை அனுப்பவும்",
      "categories": {
        "all": "அனைத்தும்",
        "tractors": "டிராக்டர்கள்",
        "harvesters": "அறுவடை இயந்திரங்கள்",
        "implements": "கருவிகள்"
      }
    }
  },
  hi: {
    translation: {
      "login_title": "AgroRent AI में स्वागत है",
      "login_subtitle": "किसानों के लिए स्मार्ट उपकरण किराया",
      "email_placeholder": "अपना ईमेल दर्ज करें",
      "marketplace": "मार्केटप्लेस",
      "bookings": "बुकिंग",
      "profile": "प्रोफ़ाइल",
      "home": "होम",
      "advisor": "सलाहकार",
      "guides": "गाइड",
      "welcome_back": "वापसी पर स्वागत है,",
      "active_booking": "सक्रिय बुकिंग",
      "continue_learning": "सीखना जारी रखें",
      "nearby_equipment": "आस-पास के उपकरण",
      "view_all": "सभी देखें",
      "browse": "ब्राउज़ करें",
      "explore_all": "सभी देखें",
      "status": "स्थिति",
      "search_placeholder": "उपकरणों की खोज करें...",
      "ai_advisor_title": "AI कृषि सलाहकार",
      "get_ai_advice": "AI अनुशंसाएँ प्राप्त करें",
      "crop_planting": "आप कौन सी फसल लगा रहे हैं?",
      "recommended_tools": "अनुशंसित उपकरण",
      "email_label": "ईमेल पता",
      "otp_label": "वन-टाइम पासवर्ड (OTP)",
      "otp_placeholder": "6-अंकों का कोड दर्ज करें",
      "join_as": "इस रूप में जुड़ें:",
      "farmer": "किसान",
      "owner": "मालिक",
      "confirm_login": "पुष्टि करें और लॉगिन करें",
      "send_verification": "सत्यापन कोड भेजें",
      "categories": {
        "all": "सब",
        "tractors": "ट्रैक्टर",
        "harvesters": "हार्वेस्टर",
        "implements": "उपकरण"
      }
    }
  },
  te: {
    translation: {
      "login_title": "AgroRent AI కి స్వాగతం",
      "login_subtitle": "రైతుల కోసం స్మార్ట్ పరికరాల అద్దె",
      "email_placeholder": "మీ ఈమెయిల్ నమోదు చేయండి",
      "marketplace": "మార్కెట్ ప్లేస్",
      "bookings": "బుకింగ్‌లు",
      "profile": "ప్రొఫైల్",
      "home": "హోమ్",
      "advisor": "అడ్వైజర్",
      "guides": "గైడ్లు",
      "welcome_back": "తిరిగి స్వాగతం,",
      "active_booking": "సక్రియ బుకింగ్",
      "nearby_equipment": "దగ్గరలోని పరికరాలు",
      "view_all": "అన్నీ చూడండి",
      "explore_all": "అన్నీ అన్వేషించండి",
      "search_placeholder": "పరికరాల కోసం వెతకండి...",
      "ai_advisor_title": "AI ఫార్మ్ అడ్వైజర్",
      "get_ai_advice": "AI సిఫార్సులను పొందండి",
      "crop_planting": "మీరు ఏ పంట వేస్తున్నారు?",
      "select_language": "భాషను ఎంచుకోండి",
      "email_label": "ఈమెయిల్ చిరునామా",
      "otp_label": "వన్-టైమ్ పాస్‌వర్డ్ (OTP)",
      "otp_placeholder": "6 అంకెల కోడ్‌ను నమోదు చేయండి",
      "join_as": "ఇలా చేరండి:",
      "farmer": "రైతు",
      "owner": "యజమాని",
      "confirm_login": "ధృవీకరించి లాగిన్ అవ్వండి",
      "send_verification": "ధృవీకరణ కోడ్ పంపండి",
      "categories": {
        "all": "అన్నీ",
        "tractors": "ట్రాక్టర్లు",
        "harvesters": "హార్వెస్టర్లు",
        "implements": "పరికరం"
      }
    }
  },
  kn: {
    translation: {
      "login_title": "AgroRent AI ಗೆ ಸ್ವಾಗತ",
      "login_subtitle": "ರೈತರಿಗಾಗಿ ಸ್ಮಾರ್ಟ್ ಉಪಕರಣಗಳ ಬಾಡಿಗೆ",
      "email_placeholder": "ನಿಮ್ಮ ಇಮೇಲ್ ನಮೂದಿಸಿ",
      "marketplace": "ಮಾರುಕಟ್ಟೆ",
      "bookings": "ಬುಕಿಂಗ್‌ಗಳು",
      "profile": "ಪ್ರೊಫೈಲ್",
      "home": "ಹೋಮ್",
      "advisor": "ಸಲಹೆಗಾರ",
      "guides": "ಮಾರ್ಗದರ್ಶಿಗಳು",
      "welcome_back": "ಮರಳಿ ಸ್ವಾಗತ,",
      "active_booking": "ಸಕ್ರಿಯ ಬುಕಿಂಗ್",
      "nearby_equipment": "ಹತ್ತಿರದ ಉಪಕರಣಗಳು",
      "view_all": "ಎಲ್ಲವನ್ನೂ ನೋಡಿ",
      "explore_all": "ಎಲ್ಲವನ್ನೂ ಅನ್ವೇಷಿಸಿ",
      "search_placeholder": "ಉಪಕರಣಗಳಿಗಾಗಿ ಹುಡುಕಿ...",
      "ai_advisor_title": "AI ಕೃಷಿ ಸಲಹೆಗಾರ",
      "get_ai_advice": "AI ಶಿಫಾರಸುಗಳನ್ನು ಪಡೆಯಿರಿ",
      "crop_planting": "ನೀವು ಯಾವ ಬೆಳೆ ನಾಟಿ ಮಾಡುತ್ತಿದ್ದೀರಿ?",
      "select_language": "ಭಾಷೆಯನ್ನು ಆರಿಸಿ",
      "email_label": "ಇಮೇಲ್ ವಿಳಾಸ",
      "otp_label": "ಒನ್-ಟೈಮ್ ಪಾಸ್‌ವರ್ಡ್ (OTP)",
      "otp_placeholder": "6 ಅಂಕಿಯ ಕೋಡ್ ನಮೂದಿಸಿ",
      "join_as": "ಹೀಗೆ ಸೇರಿಕೊಳ್ಳಿ:",
      "farmer": "ರೈತ",
      "owner": "ಮಾಲೀಕ",
      "confirm_login": "ದೃಢೀಕರಿಸಿ ಮತ್ತು ಲಾಗಿನ್ ಮಾಡಿ",
      "send_verification": "ಪರಿಶೀಲನಾ ಕೋಡ್ ಕಳುಹಿಸಿ",
      "categories": {
        "all": "ಎಲ್ಲಾ",
        "tractors": "ಟ್ರಾಕ್ಟರ್‌ಗಳು",
        "harvesters": "ಹಾರ್ವೆಸ್ಟರ್‌ಗಳು",
        "implements": "ಉಪಕರಣಗಳು"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
