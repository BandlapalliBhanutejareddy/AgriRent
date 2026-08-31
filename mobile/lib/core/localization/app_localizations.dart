import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final languageProvider = StateNotifierProvider<LanguageNotifier, String>((ref) {
  return LanguageNotifier();
});

class LanguageNotifier extends StateNotifier<String> {
  final _storage = const FlutterSecureStorage();
  static const _langKey = 'app_language';

  LanguageNotifier() : super('en') {
    _loadLanguage();
  }

  Future<void> _loadLanguage() async {
    final savedLang = await _storage.read(key: _langKey);
    if (savedLang != null) {
      state = savedLang;
    }
  }

  Future<void> setLanguage(String code) async {
    state = code;
    await _storage.write(key: _langKey, value: code);
  }
}

class AppLocalizations {
  static final Map<String, Map<String, String>> _localizedValues = {
    'en': {
      'login': 'Login',
      'dashboard': 'Dashboard',
      'marketplace': 'Marketplace',
      'equipment_details': 'Equipment Details',
      'bookings': 'Bookings',
      'my_rentals': 'My Rentals',
      'crop_advisor': 'Crop Advisor',
      'ai_advisor': 'AI Advisor',
      'knowledge_base': 'Knowledge Base',
      'saved_equipment': 'Saved Equipment',
      'profile': 'Profile',
      'edit_profile': 'Edit Profile',
      'change_password': 'Change Password',
      'owner_dashboard': 'Owner Dashboard',
      'add_equipment': 'Add Equipment',
      'edit_equipment': 'Edit Equipment',
      'admin_dashboard': 'Admin Dashboard',
      'home': 'Home',
      'search': 'Search equipment...',
    },
    'te': {
      'login': 'లాగిన్',
      'dashboard': 'డాష్‌బోర్డ్',
      'marketplace': 'మార్కెట్ ప్లేస్',
      'equipment_details': 'పరికరాల వివరాలు',
      'bookings': 'బుకింగ్స్',
      'my_rentals': 'నా అద్దెలు',
      'crop_advisor': 'పంట సలహాదారు',
      'ai_advisor': 'AI సలహాదారు',
      'knowledge_base': 'జ్ఞాన కేంద్రం',
      'saved_equipment': 'సేవ్ చేసినవి',
      'profile': 'ప్రొఫైల్',
      'edit_profile': 'ప్రొఫైల్ సవరించండి',
      'change_password': 'పాస్‌వర్డ్ మార్చండి',
      'owner_dashboard': 'యజమాని డాష్‌బోర్డ్',
      'add_equipment': 'పరికరాన్ని జోడించండి',
      'edit_equipment': 'పరికరాన్ని సవరించండి',
      'admin_dashboard': 'అడ్మిన్ డాష్‌బోర్డ్',
      'home': 'హోమ్',
      'search': 'పరికరాల కోసం వెతకండి...',
    },
    'hi': {
      'login': 'लॉग इन',
      'dashboard': 'डैशबोर्ड',
      'marketplace': 'बाज़ार',
      'equipment_details': 'उपकरण विवरण',
      'bookings': 'बुकिंग',
      'my_rentals': 'मेरा किराया',
      'crop_advisor': 'फसल सलाहकार',
      'ai_advisor': 'AI सलाहकार',
      'knowledge_base': 'ज्ञान आधार',
      'saved_equipment': 'सहेजे गए उपकरण',
      'profile': 'प्रोफ़ाइल',
      'edit_profile': 'प्रोफ़ाइल संपादित करें',
      'change_password': 'पासवर्ड बदलें',
      'owner_dashboard': 'मालिक डैशबोर्ड',
      'add_equipment': 'उपकरण जोड़ें',
      'edit_equipment': 'उपकरण संपादित करें',
      'admin_dashboard': 'व्यवस्थापक डैशबोर्ड',
      'home': 'होम',
      'search': 'उपकरण खोजें...',
    },
    'ta': {
      'login': 'உள்நுழை',
      'dashboard': 'முகப்பு',
      'marketplace': 'சந்தை',
      'equipment_details': 'உபகரணங்கள் விவரங்கள்',
      'bookings': 'முன்பதிவுகள்',
      'my_rentals': 'என் வாடகைகள்',
      'crop_advisor': 'பயிர் ஆலோசகர்',
      'ai_advisor': 'AI ஆலோசகர்',
      'knowledge_base': 'அறிவு தளம்',
      'saved_equipment': 'சேமிக்கப்பட்ட உபகரணங்கள்',
      'profile': 'சுயவிவரம்',
      'edit_profile': 'சுயவிவரத்தை திருத்து',
      'change_password': 'கடவுச்சொல்லை மாற்று',
      'owner_dashboard': 'உரிமையாளர் முகப்பு',
      'add_equipment': 'உபகரணங்கள் சேர்',
      'edit_equipment': 'உபகரணங்கள் திருத்து',
      'admin_dashboard': 'நிர்வாகி முகப்பு',
      'home': 'வீடு',
      'search': 'உபகரணங்களை தேடு...',
    },
    'kn': {
      'login': 'ಲಾಗಿನ್',
      'dashboard': 'ಡ್ಯಾಶ್ಬೋರ್ಡ್',
      'marketplace': 'ಮಾರುಕಟ್ಟೆ',
      'equipment_details': 'ಉಪಕರಣ ವಿವರಗಳು',
      'bookings': 'ಬುಕಿಂಗ್',
      'my_rentals': 'ನನ್ನ ಬಾಡಿಗೆಗಳು',
      'crop_advisor': 'ಬೆಳೆ ಸಲಹೆಗಾರ',
      'ai_advisor': 'AI ಸಲಹೆಗಾರ',
      'knowledge_base': 'ಜ್ಞಾನದ ಮೂಲ',
      'saved_equipment': 'ಉಳಿಸಿದ ಉಪಕರಣಗಳು',
      'profile': 'ಪ್ರೊಫೈಲ್',
      'edit_profile': 'ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ',
      'change_password': 'ಪಾಸ್ವರ್ಡ್ ಬದಲಾಯಿಸಿ',
      'owner_dashboard': 'ಮಾಲೀಕ ಡ್ಯಾಶ್ಬೋರ್ಡ್',
      'add_equipment': 'ಉಪಕರಣ ಸೇರಿಸಿ',
      'edit_equipment': 'ಉಪಕರಣ ಸಂಪಾದಿಸಿ',
      'admin_dashboard': 'ನಿರ್ವಾಹಕ ಡ್ಯಾಶ್ಬೋರ್ಡ್',
      'home': 'ಮನೆ',
      'search': 'ಉಪಕರಣ ಹುಡುಕಿ...',
    }
  };

  static String tr(String key, String langCode) {
    return _localizedValues[langCode]?[key] ?? _localizedValues['en']?[key] ?? key;
  }
}

extension StringExtension on String {
  String tr(String langCode) {
    return AppLocalizations.tr(this, langCode);
  }
}
