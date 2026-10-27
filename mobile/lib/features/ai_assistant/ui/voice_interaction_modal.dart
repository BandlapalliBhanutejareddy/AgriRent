import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../core/services/voice_service.dart';
import '../../../shared/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../../farm/providers/farm_provider.dart';
import '../../marketplace/services/search_history_service.dart';
import '../services/ai_assistant_service.dart';

class VoiceInteractionModal extends ConsumerStatefulWidget {
  final Function(String query)? onQuerySubmitted;

  const VoiceInteractionModal({super.key, this.onQuerySubmitted});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const VoiceInteractionModal(),
    );
  }

  @override
  ConsumerState<VoiceInteractionModal> createState() => _VoiceInteractionModalState();
}

class _VoiceInteractionModalState extends ConsumerState<VoiceInteractionModal>
    with SingleTickerProviderStateMixin {
  final VoiceService _voiceService = VoiceService();
  VoiceInteractionState _state = VoiceInteractionState.idle;
  String _recognizedText = '';
  String? _errorMessage;

  StreamSubscription<VoiceInteractionState>? _stateSub;
  StreamSubscription<VoiceRecognitionResult>? _resultSub;
  StreamSubscription<String>? _errorSub;

  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  // Processing checklist animation step
  int _processingStep = 0;
  Timer? _processingTimer;

  @override
  void initState() {
    super.initState();

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.95, end: 1.15).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _stateSub = _voiceService.stateStream.listen((state) {
      if (mounted) setState(() => _state = state);
    });

    _resultSub = _voiceService.resultStream.listen((res) {
      if (mounted) {
        setState(() {
          _recognizedText = res.text;
        });
        if (res.isFinal && res.text.trim().isNotEmpty) {
          _submitQuery(res.text.trim());
        }
      }
    });

    _errorSub = _voiceService.errorStream.listen((err) {
      if (mounted) {
        setState(() {
          _errorMessage = err;
        });
      }
    });

    // Automatically start listening after modal opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startVoiceInput();
    });
  }

  Future<void> _startVoiceInput() async {
    final lang = ref.read(languageProvider);
    final started = await _voiceService.startListening(languageCode: lang);
    if (!started && mounted) {
      setState(() {
        _errorMessage ??= 'Could not start microphone.';
      });
    }
  }

  void _submitQuery(String query) async {
    final cleanQuery = query.trim();
    if (cleanQuery.isEmpty) return;

    await _voiceService.stopListening();
    if (!mounted) return;

    setState(() {
      _state = VoiceInteractionState.processing;
      _recognizedText = cleanQuery;
      _processingStep = 0;
    });

    // Start animated checklist
    _processingTimer?.cancel();
    _processingTimer = Timer.periodic(const Duration(milliseconds: 600), (timer) {
      if (mounted && _processingStep < 4) {
        setState(() => _processingStep++);
      } else {
        timer.cancel();
      }
    });

    final user = ref.read(authProvider).user;
    if (user != null) {
      await SearchHistoryService.addSearchQuery(user.id, cleanQuery);
    }

    try {
      final farmState = ref.read(farmProvider);
      final currentFarm = farmState.farms.isNotEmpty ? farmState.farms.first : null;
      final currentCrop = currentFarm?.crops.isNotEmpty == true ? currentFarm!.crops.first : null;
      final lang = ref.read(languageProvider);

      final result = await AiAssistantService().askAssistant(
        query: cleanQuery,
        language: lang,
        farmId: currentFarm?.id,
        cropId: currentCrop?.id,
        cropName: currentCrop?.cropName,
        stage: currentCrop?.stage,
        acreage: currentFarm?.area.toString(),
        location: currentFarm?.location,
      );

      _processingTimer?.cancel();

      if (mounted) {
        Navigator.pop(context); // Close voice sheet
        // Deep-link to AiAssistantScreen with the response
        context.push('/ai-assistant', extra: {
          'query': cleanQuery,
          'result': result,
        });
      }
    } catch (e) {
      _processingTimer?.cancel();
      if (mounted) {
        setState(() {
          _state = VoiceInteractionState.error;
          _errorMessage = e.toString();
        });
      }
    }
  }

  @override
  void dispose() {
    _stateSub?.cancel();
    _resultSub?.cancel();
    _errorSub?.cancel();
    _processingTimer?.cancel();
    _pulseController.dispose();
    _voiceService.cancelSession();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.25),
            blurRadius: 24,
            offset: const Offset(0, -6),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Grab Handle
              Container(
                width: 44,
                height: 5,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
              const SizedBox(height: 24),

              if (_state == VoiceInteractionState.processing) ...[
                _buildProcessingView(isDark, lang),
              ] else if (_state == VoiceInteractionState.error) ...[
                _buildErrorView(isDark, lang),
              ] else ...[
                _buildListeningView(isDark, lang),
              ],
            ],
          ),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // SCREEN 2: LISTENING & TRANSCRIBING STATE
  // ---------------------------------------------------------------------------
  Widget _buildListeningView(bool isDark, String lang) {
    final examples = SearchHistoryService.getVoiceExamples(lang);
    final isTranscribing = _recognizedText.isNotEmpty;

    String langHint;
    switch (lang.toLowerCase()) {
      case 'te':
        langHint = 'తెలుగు లేదా ఇంగ్లీషులో సహజంగా మాట్లాడండి';
        break;
      case 'hi':
        langHint = 'हिंदी या अंग्रेजी में स्वाभाविक रूप से बोलें';
        break;
      case 'ta':
        langHint = 'தமிழ் அல்லது ஆங்கிலத்தில் இயல்பாகப் பேசுங்கள்';
        break;
      case 'kn':
        langHint = 'ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಮಾತನಾಡಿ';
        break;
      default:
        langHint = 'Speak naturally in English or regional language';
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          isTranscribing ? 'Transcribing...' : 'Listening...',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
            letterSpacing: -0.4,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          langHint,
          style: TextStyle(
            fontSize: 13,
            color: isDark ? Colors.white60 : AppTheme.textMutedGray,
            fontWeight: FontWeight.w500,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 28),

        // Pulsating Microphone Button with Wave Rings
        ScaleTransition(
          scale: _pulseAnimation,
          child: Container(
            width: 90,
            height: 90,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                colors: [Color(0xFF22C55E), Color(0xFF16A34A)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF22C55E).withValues(alpha: 0.45),
                  blurRadius: 26,
                  spreadRadius: 6,
                ),
              ],
            ),
            child: const Icon(
              Icons.mic_rounded,
              color: Colors.white,
              size: 46,
            ),
          ),
        ),

        const SizedBox(height: 20),

        // Live Audio Waveform Simulation Bar
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(12, (index) {
            final h = (12 + (index % 4) * 8).toDouble();
            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 2.5),
              width: 3.5,
              height: h,
              decoration: BoxDecoration(
                color: const Color(0xFF22C55E).withValues(alpha: 0.8),
                borderRadius: BorderRadius.circular(2),
              ),
            );
          }),
        ),

        const SizedBox(height: 20),

        // Recognized Live Text Box (if user has spoken words)
        if (isTranscribing)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF22C55E).withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.format_quote_rounded, color: Color(0xFF16A34A), size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _recognizedText,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.arrow_forward_rounded, color: Color(0xFF16A34A)),
                  onPressed: () => _submitQuery(_recognizedText),
                ),
              ],
            ),
          ),

        // Try Saying (Examples) Card
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Try saying (examples)',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                ),
              ),
              const SizedBox(height: 10),
              ...examples.map((ex) => InkWell(
                    onTap: () => _submitQuery(ex),
                    borderRadius: BorderRadius.circular(10),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 7, horizontal: 4),
                      child: Row(
                        children: [
                          Icon(
                            Icons.auto_awesome_rounded,
                            size: 15,
                            color: const Color(0xFF16A34A).withValues(alpha: 0.8),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              ex,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                              ),
                            ),
                          ),
                          Icon(
                            Icons.chevron_right_rounded,
                            size: 16,
                            color: isDark ? Colors.white30 : Colors.grey.shade400,
                          ),
                        ],
                      ),
                    ),
                  )),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // Cancel Button
        SizedBox(
          width: double.infinity,
          height: 48,
          child: OutlinedButton(
            onPressed: () async {
              await _voiceService.cancelSession();
              if (mounted) Navigator.pop(context);
            },
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: isDark ? Colors.white24 : Colors.grey.shade300),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            child: Text(
              '✕  Cancel',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // SCREEN 3: PROCESSING STATE (WITH DYNAMIC ANIMATED CHECKLIST)
  // ---------------------------------------------------------------------------
  Widget _buildProcessingView(bool isDark, String lang) {
    final checklist = [
      'Understanding your question',
      'Checking your farm details',
      'Analyzing crop stage',
      'Fetching weather information',
      'Generating personalized advice',
    ];

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          'Processing your request...',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
            letterSpacing: -0.4,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          '"$_recognizedText"',
          style: TextStyle(
            fontSize: 13,
            color: isDark ? Colors.white60 : AppTheme.textMutedGray,
            fontStyle: FontStyle.italic,
          ),
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 24),

        // Animated circular radar / waveform
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: const Color(0xFF16A34A).withValues(alpha: 0.15),
            border: Border.all(color: const Color(0xFF22C55E), width: 2),
          ),
          child: const Center(
            child: SizedBox(
              width: 36,
              height: 36,
              child: CircularProgressIndicator(
                color: Color(0xFF22C55E),
                strokeWidth: 3,
              ),
            ),
          ),
        ),
        const SizedBox(height: 28),

        // Five Checklist Items
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
          ),
          child: Column(
            children: List.generate(checklist.length, (idx) {
              final isDone = idx <= _processingStep;
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  children: [
                    Container(
                      width: 22,
                      height: 22,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isDone ? const Color(0xFF16A34A) : Colors.transparent,
                        border: Border.all(
                          color: isDone
                              ? const Color(0xFF16A34A)
                              : (isDark ? Colors.white24 : Colors.grey.shade400),
                          width: 1.5,
                        ),
                      ),
                      child: isDone
                          ? const Icon(Icons.check_rounded, color: Colors.white, size: 14)
                          : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        checklist[idx],
                        style: TextStyle(
                          fontSize: 13.5,
                          fontWeight: isDone ? FontWeight.w700 : FontWeight.w500,
                          color: isDone
                              ? (isDark ? Colors.white : AppTheme.textDarkNavy)
                              : (isDark ? Colors.white38 : Colors.grey.shade500),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ),
        ),

        const SizedBox(height: 18),

        Text(
          'Please wait a moment...',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: isDark ? Colors.white54 : AppTheme.textMutedGray,
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // ERROR VIEW
  // ---------------------------------------------------------------------------
  Widget _buildErrorView(bool isDark, String lang) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.mic_off_rounded, size: 54, color: Colors.amber.shade700),
        const SizedBox(height: 14),
        Text(
          'Voice Input Unavailable',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          _errorMessage ?? 'Please allow microphone access in device settings or type your query.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 13,
            color: isDark ? Colors.white60 : AppTheme.textMutedGray,
          ),
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                style: OutlinedButton.styleFrom(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: const Text('Close'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: () {
                  setState(() {
                    _errorMessage = null;
                    _state = VoiceInteractionState.idle;
                  });
                  _startVoiceInput();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryGreen,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: const Text('Try Again'),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
