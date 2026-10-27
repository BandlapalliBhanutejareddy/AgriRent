import 'package:shared_preferences/shared_preferences.dart';

class SearchHistoryService {
  static const String _prefix = 'recent_searches_user_';

  static Future<List<String>> getRecentSearches(String userId) async {
    if (userId.isEmpty) return [];
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = '$_prefix$userId';
      final list = prefs.getStringList(key);
      return list ?? [];
    } catch (_) {
      return [];
    }
  }

  static Future<void> addSearchQuery(String userId, String query) async {
    final trimmed = query.trim();
    if (userId.isEmpty || trimmed.isEmpty) return;

    try {
      final prefs = await SharedPreferences.getInstance();
      final key = '$_prefix$userId';
      List<String> list = prefs.getStringList(key) ?? [];

      // Remove if existing to put at top
      list.removeWhere((item) => item.toLowerCase() == trimmed.toLowerCase());
      list.insert(0, trimmed);

      // Keep maximum 10 recent searches
      if (list.length > 10) {
        list = list.sublist(0, 10);
      }

      await prefs.setStringList(key, list);
    } catch (_) {}
  }

  static Future<void> removeSearchQuery(String userId, String query) async {
    if (userId.isEmpty) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = '$_prefix$userId';
      final list = prefs.getStringList(key) ?? [];
      list.removeWhere((item) => item.toLowerCase() == query.trim().toLowerCase());
      await prefs.setStringList(key, list);
    } catch (_) {}
  }

  static Future<void> clearHistory(String userId) async {
    if (userId.isEmpty) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = '$_prefix$userId';
      await prefs.remove(key);
    } catch (_) {}
  }

  /// Popular searches based on common farmer queries from prototype
  static List<String> getPopularSearches(String lang) {
    switch (lang.toLowerCase()) {
      case 'te':
        return [
          'వరి పంట ఎలా పండించాలి?',
          'నా దగ్గర ట్రాక్టర్లు',
          'వర్షం అలర్ట్ & వాతావరణం',
          'వేరుశనగ సాగు సలహా',
          'నీటి యాజమాన్యం సూచనలు',
          'హార్వెస్టర్ అద్దె',
        ];
      case 'hi':
        return [
          'धान की खेती कैसे करें?',
          'मेरे पास ट्रैक्टर',
          'बारिश का अलर्ट व मौसम',
          'मूंगफली की खेती गाइड',
          'सिंचाई के जरूरी टिप्स',
          'कंबाइन हार्वेस्टर किराया',
        ];
      case 'ta':
        return [
          'நெல் சாகுபடி வழிகாட்டி',
          'அருகிலுள்ள டிராக்டர்',
          'மழை எச்சரிக்கை மற்றும் வானிலை',
          'நிலக்கடலை சாகுபடி',
          'பாசன மேலாண்மை குறிப்புகள்',
        ];
      case 'kn':
        return [
          'ಭತ್ತ ಬೆಳೆಯುವುದು ಹೇಗೆ?',
          'ಹತ್ತಿರದ ಟ್ರಾಕ್ಟರ್‌ಗಳು',
          'ಮಳೆ ಎಚ್ಚರಿಕೆ ಮತ್ತು ಹವಾಮಾನ',
          'ಕಡಲೆಕಾಯಿ ಬೆಳೆ ಮಾರ್ಗದರ್ಶಿ',
          'ನೀರಾವರಿ ಸಲಹೆಗಳು',
        ];
      case 'en':
      default:
        return [
          'How to grow paddy',
          'Tractor near me',
          'Rain alert & weather',
          'Groundnut farming guide',
          'Irrigation tips',
          'Harvesting equipment',
        ];
    }
  }

  /// Example queries shown in "Try saying" voice modal
  static List<String> getVoiceExamples(String lang) {
    switch (lang.toLowerCase()) {
      case 'te':
        return [
          'ఈ రోజు నా పొలంలో ఏమి చేయాలి?',
          'నా దగ్గర ఉన్న ట్రాక్టర్లు చూపించు',
          'వరి పంట సాగు సలహా ఏమిటి?',
          'నా పొలంలో వాతావరణం ఎలా ఉంది?',
          'వేరుశనగ పండించే రైతులను చూపించు',
        ];
      case 'hi':
        return [
          'आज मुझे अपने खेत में क्या करना चाहिए?',
          'मेरे आसपास के ट्रैक्टर दिखाएं',
          'धान की फसल की सलाह क्या है?',
          'मेरे खेत का मौसम कैसा है?',
          'मूंगफली उगाने वाले किसान खोजें',
        ];
      case 'ta':
        return [
          'இன்று என் பண்ணையில் என்ன செய்ய வேண்டும்?',
          'அருகிலுள்ள டிராக்டர்களைக் காட்டு',
          'நெல் பயிர் ஆலோசனை என்ன?',
          'என் பண்ணையில் வானிலை நிலவரம் என்ன?',
        ];
      case 'kn':
        return [
          'ಇಂದು ನನ್ನ ಹೊಲದಲ್ಲಿ ಏನು ಮಾಡಬೇಕು?',
          'ಹತ್ತಿರದ ಟ್ರಾಕ್ಟರ್‌ಗಳನ್ನು ತೋರಿಸಿ',
          'ಭತ್ತದ ಬೆಳೆ ಸಲಹೆ ಏನು?',
          'ನನ್ನ ಹೊಲದ ಹವಾಮಾನ ಹೇಗಿದೆ?',
        ];
      case 'en':
      default:
        return [
          'What should I do today?',
          'Show nearby tractors',
          'How to grow paddy?',
          'Check weather in my farm',
          'Find farmers growing groundnut',
        ];
    }
  }
}
