import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:speech_to_text/speech_recognition_error.dart';

enum VoiceInteractionState {
  idle,
  listening,
  transcribing,
  processing,
  answer,
  error,
  cancelled,
}

class VoiceRecognitionResult {
  final String text;
  final bool isFinal;

  VoiceRecognitionResult({required this.text, required this.isFinal});
}

class VoiceService {
  static final VoiceService _instance = VoiceService._internal();
  factory VoiceService() => _instance;
  VoiceService._internal();

  final stt.SpeechToText _speech = stt.SpeechToText();
  bool _isInitialized = false;
  VoiceInteractionState _state = VoiceInteractionState.idle;

  final _stateController = StreamController<VoiceInteractionState>.broadcast();
  final _resultController = StreamController<VoiceRecognitionResult>.broadcast();
  final _errorController = StreamController<String>.broadcast();

  Stream<VoiceInteractionState> get stateStream => _stateController.stream;
  Stream<VoiceRecognitionResult> get resultStream => _resultController.stream;
  Stream<String> get errorStream => _errorController.stream;

  VoiceInteractionState get state => _state;
  bool get isListening => _speech.isListening;
  bool get isAvailable => _isInitialized;

  void _setState(VoiceInteractionState newState) {
    _state = newState;
    if (!_stateController.isClosed) {
      _stateController.add(newState);
    }
  }

  /// Initialize speech engine with error handling
  Future<bool> initialize() async {
    if (_isInitialized) return true;

    try {
      _isInitialized = await _speech.initialize(
        onError: _handleError,
        onStatus: _handleStatus,
        debugLogging: kDebugMode,
      );
      return _isInitialized;
    } catch (e) {
      debugPrint('[VoiceService] Speech-to-text initialization error: $e');
      _isInitialized = false;
      return false;
    }
  }

  /// Map 2-letter app language code to speech locale
  String getLocaleForLanguage(String langCode) {
    switch (langCode.toLowerCase()) {
      case 'te':
        return 'te_IN';
      case 'hi':
        return 'hi_IN';
      case 'ta':
        return 'ta_IN';
      case 'kn':
        return 'kn_IN';
      case 'en':
      default:
        return 'en_IN';
    }
  }

  /// Start listening with current app language
  Future<bool> startListening({
    required String languageCode,
    Duration listenFor = const Duration(seconds: 30),
    Duration pauseFor = const Duration(seconds: 4),
  }) async {
    // Prevent duplicate triggers
    if (_state == VoiceInteractionState.listening || _state == VoiceInteractionState.transcribing) {
      return true;
    }

    final ready = await initialize();
    if (!ready) {
      _setState(VoiceInteractionState.error);
      _errorController.add('Microphone access or speech engine not available.');
      return false;
    }

    final targetLocale = getLocaleForLanguage(languageCode);
    _setState(VoiceInteractionState.listening);

    try {
      // Check if target locale is installed on device speech engine
      final availableLocales = await _speech.locales();
      final hasTargetLocale = availableLocales.any((l) =>
          l.localeId.toLowerCase().replaceAll('-', '_') == targetLocale.toLowerCase().replaceAll('-', '_') ||
          l.localeId.toLowerCase().startsWith(languageCode.toLowerCase()));

      final selectedLocale = hasTargetLocale ? targetLocale : 'en_IN';

      await _speech.listen(
        onResult: (result) {
          final words = result.recognizedWords.trim();
          if (words.isNotEmpty) {
            _setState(VoiceInteractionState.transcribing);
            if (!_resultController.isClosed) {
              _resultController.add(VoiceRecognitionResult(
                text: words,
                isFinal: result.finalResult,
              ));
            }
          }
        },
        // ignore: deprecated_member_use
        listenFor: listenFor,
        // ignore: deprecated_member_use
        pauseFor: pauseFor,
        // ignore: deprecated_member_use
        localeId: selectedLocale,
        // ignore: deprecated_member_use
        cancelOnError: true,
        // ignore: deprecated_member_use
        partialResults: true,
      );
      return true;
    } catch (e) {
      debugPrint('[VoiceService] Start listening failed: $e');
      _setState(VoiceInteractionState.error);
      _errorController.add(e.toString());
      return false;
    }
  }

  /// Transition to processing state
  void setProcessing() {
    _setState(VoiceInteractionState.processing);
  }

  /// Stop listening normally
  Future<void> stopListening() async {
    if (_speech.isListening) {
      await _speech.stop();
    }
    if (_state == VoiceInteractionState.listening || _state == VoiceInteractionState.transcribing) {
      _setState(VoiceInteractionState.idle);
    }
  }

  /// Cancel current session
  Future<void> cancelSession() async {
    if (_speech.isListening) {
      await _speech.cancel();
    }
    _setState(VoiceInteractionState.cancelled);
    // Reset to idle after short moment
    Future.delayed(const Duration(milliseconds: 300), () {
      if (_state == VoiceInteractionState.cancelled) {
        _setState(VoiceInteractionState.idle);
      }
    });
  }

  void _handleError(SpeechRecognitionError error) {
    debugPrint('[VoiceService] Speech recognition error: ${error.errorMsg} (permanent: ${error.permanent})');
    _setState(VoiceInteractionState.error);
    if (!_errorController.isClosed) {
      _errorController.add(error.errorMsg);
    }
  }

  void _handleStatus(String status) {
    debugPrint('[VoiceService] Status update: $status');
    if (status == 'done' || status == 'notListening') {
      if (_state == VoiceInteractionState.listening || _state == VoiceInteractionState.transcribing) {
        // Will be moved to processing by UI when submitting query
      }
    }
  }

  void dispose() {
    _speech.stop();
    _stateController.close();
    _resultController.close();
    _errorController.close();
  }
}
