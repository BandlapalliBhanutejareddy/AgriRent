import 'package:flutter/foundation.dart';
import 'package:flutter_tts/flutter_tts.dart';

class TtsService {
  static final TtsService _instance = TtsService._internal();
  factory TtsService() => _instance;
  TtsService._internal();

  final FlutterTts _tts = FlutterTts();
  bool _isPlaying = false;
  bool _isInitialized = false;

  bool get isPlaying => _isPlaying;

  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      await _tts.setSpeechRate(0.5);
      await _tts.setVolume(1.0);
      await _tts.setPitch(1.0);

      _tts.setStartHandler(() {
        _isPlaying = true;
      });

      _tts.setCompletionHandler(() {
        _isPlaying = false;
      });

      _tts.setCancelHandler(() {
        _isPlaying = false;
      });

      _tts.setErrorHandler((msg) {
        debugPrint('[TtsService] TTS error: $msg');
        _isPlaying = false;
      });

      _isInitialized = true;
    } catch (e) {
      debugPrint('[TtsService] Initialization failed: $e');
    }
  }

  String _mapLanguageCode(String lang) {
    switch (lang.toLowerCase()) {
      case 'te':
        return 'te-IN';
      case 'hi':
        return 'hi-IN';
      case 'ta':
        return 'ta-IN';
      case 'kn':
        return 'kn-IN';
      case 'en':
      default:
        return 'en-IN';
    }
  }

  /// Strip markdown characters before speech synthesis for smooth natural listening
  static String cleanTextForSpeech(String markdown) {
    return markdown
        .replaceAll(RegExp(r'#+\s*'), '')
        .replaceAll(RegExp(r'^\s*[*+-]\s+', multiLine: true), '')
        .replaceAll(RegExp(r'>\s*'), '')
        .replaceAll(RegExp(r'\[([^\]]+)\]\([^)]+\)'), r'$1')
        .replaceAll(RegExp(r'[`~_*]'), '')
        .trim();
  }

  Future<bool> speak(String text, {required String languageCode}) async {
    await initialize();

    final cleanText = cleanTextForSpeech(text);
    if (cleanText.isEmpty) return false;

    try {
      final ttsLang = _mapLanguageCode(languageCode);
      await _tts.setLanguage(ttsLang);

      if (_isPlaying) {
        await stop();
      }

      final result = await _tts.speak(cleanText);
      _isPlaying = (result == 1);
      return _isPlaying;
    } catch (e) {
      debugPrint('[TtsService] Speak error: $e');
      _isPlaying = false;
      return false;
    }
  }

  Future<void> stop() async {
    try {
      await _tts.stop();
      _isPlaying = false;
    } catch (e) {
      debugPrint('[TtsService] Stop error: $e');
    }
  }
}
