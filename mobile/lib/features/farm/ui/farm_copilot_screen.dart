import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/localization/app_localizations.dart';
import '../../auth/providers/auth_provider.dart';

class CopilotMessage {
  final String role; // 'farmer' or 'ai'
  final String text;
  final Map<String, dynamic>? rawResponse;
  final bool isError;
  final String? lastQuery;
  
  CopilotMessage({
    required this.role,
    required this.text,
    this.rawResponse,
    this.isError = false,
    this.lastQuery,
  });
}

class FarmCopilotScreen extends ConsumerStatefulWidget {
  final String farmId;
  final String cropId;

  const FarmCopilotScreen({super.key, required this.farmId, required this.cropId});

  @override
  ConsumerState<FarmCopilotScreen> createState() => _FarmCopilotScreenState();
}

class _FarmCopilotScreenState extends ConsumerState<FarmCopilotScreen> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<CopilotMessage> _messages = [];
  bool _isLoading = false;
  String _activeFarmId = '';
  String _activeCropId = '';
  String _activeCropName = '';

  @override
  void initState() {
    super.initState();
    _activeFarmId = widget.farmId;
    _activeCropId = widget.cropId;
    _resolveFarmAndInitialize();
  }

  Future<void> _resolveFarmAndInitialize() async {
    if (_activeFarmId.isNotEmpty && _activeCropId.isNotEmpty) {
      _addWelcomeMessage();
      return;
    }

    try {
      final res = await ApiClient().dio.get('farms');
      final data = res.data;
      final List<dynamic> farmsList = data is List ? data : (data['data'] is List ? data['data'] : []);
      if (farmsList.isNotEmpty) {
        final farm = farmsList[0];
        _activeFarmId = farm['id'] ?? '';
        final crops = farm['crops'] as List? ?? [];
        if (crops.isNotEmpty) {
          _activeCropId = crops[0]['id'] ?? '';
          _activeCropName = crops[0]['cropName'] ?? '';
        }
      }
    } catch (_) {
      // Fallback
    }

    if (mounted) {
      _addWelcomeMessage();
    }
  }

  void _addWelcomeMessage() {
    final user = ref.read(authProvider).user;
    final userName = user?.name.split(' ').first ?? 'Farmer';
    final cropInfo = _activeCropName.isNotEmpty ? ' for $_activeCropName' : '';

    _messages.add(CopilotMessage(
      role: 'ai',
      text: 'Hello $userName! 🌾 I am your AI Farm Copilot$cropInfo. Ask me anything about crop care, field operations, soil health, or equipment recommendations.',
    ));
  }

  Future<void> _sendMessage(String text, String lang) async {
    final query = text.trim();
    if (query.isEmpty || _isLoading) return;

    setState(() {
      _messages.add(CopilotMessage(role: 'farmer', text: query));
      _isLoading = true;
    });

    _controller.clear();
    _scrollToBottom();

    try {
      if (_activeFarmId.isNotEmpty && _activeCropId.isNotEmpty) {
        final res = await ApiClient().dio.post('ai/farm-copilot', data: {
          'farmId': _activeFarmId,
          'cropId': _activeCropId,
          'question': query,
          'language': lang,
        });

        final dynamic raw = res.data;
        final Map<String, dynamic> data = (raw is Map && raw['data'] is Map)
            ? Map<String, dynamic>.from(raw['data'])
            : (raw is Map ? Map<String, dynamic>.from(raw) : <String, dynamic>{});
        final explanation = (data['explanation'] ?? data['reply'] ?? data['summary'] ?? 'Here is what I recommend for your field.').toString();

        if (mounted) {
          setState(() {
            _messages.add(CopilotMessage(
              role: 'ai',
              text: explanation,
              rawResponse: data,
            ));
            _isLoading = false;
          });
          _scrollToBottom();
        }
      } else {
        // Fallback to general AI Advisor if no farm context is configured yet
        final res = await ApiClient().dio.post('ai/advisor', data: {
          'question': query,
          'language': lang,
        });

        final dynamic raw = res.data;
        final Map<String, dynamic> data = (raw is Map && raw['data'] is Map)
            ? Map<String, dynamic>.from(raw['data'])
            : (raw is Map ? Map<String, dynamic>.from(raw) : <String, dynamic>{});
        final reply = (data['reply'] ?? data['explanation'] ?? 'Here is agronomic advice for your request.').toString();

        if (mounted) {
          setState(() {
            _messages.add(CopilotMessage(
              role: 'ai',
              text: reply,
            ));
            _isLoading = false;
          });
          _scrollToBottom();
        }
      }
    } catch (e) {
      if (mounted) {
        String errorMsg = 'Unable to connect to AI engine. Please check network connection and try again.';
        if (e.toString().contains('403') || e.toString().contains('Forbidden')) {
          errorMsg = 'Farm context authorization expired. Please re-open your Farm screen.';
        }
        setState(() {
          _messages.add(CopilotMessage(
            role: 'ai',
            text: errorMsg,
            isError: true,
            lastQuery: query,
          ));
          _isLoading = false;
        });
        _scrollToBottom();
      }
    }
  }

  Future<void> _addStepsToPlan(List<dynamic> steps, String lang) async {
    if (_activeFarmId.isEmpty || _activeCropId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please configure a farm first.')),
      );
      return;
    }

    try {
      final res = await ApiClient().dio.post('ai/farm-copilot/add-to-plan', data: {
        'farmId': _activeFarmId,
        'cropId': _activeCropId,
        'actionableSteps': steps.map((s) => s.toString()).toList(),
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res.data?['message'] ?? 'Steps added to Farm Operations successfully!'),
            backgroundColor: AppTheme.primaryGreen,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to add steps to Farm Operations.'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (Navigator.of(context).canPop()) {
              Navigator.of(context).pop();
            } else if (context.canPop()) {
              context.pop();
            } else {
              context.go('/farmer');
            }
          },
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Farm Copilot', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
            Text('AI Agronomic Intelligence', style: TextStyle(fontSize: 11, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600)),
          ],
        ),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        foregroundColor: isDark ? Colors.white : AppTheme.textDarkNavy,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: isDark ? Colors.white10 : Colors.grey.shade200, height: 1),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                final isFarmer = msg.role == 'farmer';
                return _buildMessageBubble(msg, isFarmer, lang, isDark);
              },
            ),
          ),
          if (_messages.length == 1 && !_isLoading) _buildQuickPrompts(lang, isDark),
          if (_isLoading) _buildThinkingIndicator(isDark),
          _buildInputArea(lang, isDark),
        ],
      ),
    );
  }

  Widget _buildQuickPrompts(String lang, bool isDark) {
    final prompts = [
      '🌾 Best practices for current crop stage',
      '🚜 Recommended machinery for my farm',
      '💧 Ideal irrigation and fertilizer schedule',
      '🐛 How to identify and control pests',
    ];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Suggested questions:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: prompts.map((p) => InkWell(
              onTap: () => _sendMessage(p.replaceFirst(RegExp(r'^[^\w]+'), '').trim(), lang),
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.darkCard : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: isDark ? Colors.white12 : Colors.grey.shade300),
                ),
                child: Text(p, style: TextStyle(fontSize: 12, color: isDark ? Colors.white70 : AppTheme.textDarkNavy)),
              ),
            )).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildThinkingIndicator(bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primaryGreen)),
              SizedBox(width: 10),
              Text('Analyzing farm conditions...', style: TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.w500)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMessageBubble(CopilotMessage msg, bool isFarmer, String lang, bool isDark) {
    return Align(
      alignment: isFarmer ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6),
        padding: const EdgeInsets.all(16),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.88),
        decoration: BoxDecoration(
          color: isFarmer
              ? AppTheme.primaryGreen
              : (msg.isError
                  ? (isDark ? Colors.red.shade900.withValues(alpha: 0.3) : Colors.red.shade50)
                  : (isDark ? AppTheme.darkCard : Colors.white)),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(20),
            topRight: const Radius.circular(20),
            bottomLeft: Radius.circular(isFarmer ? 20 : 4),
            bottomRight: Radius.circular(isFarmer ? 4 : 20),
          ),
          border: Border.all(
            color: isFarmer
                ? AppTheme.primaryGreen
                : (msg.isError
                    ? Colors.red.shade300
                    : (isDark ? Colors.white10 : Colors.grey.shade200)),
          ),
          boxShadow: isFarmer
              ? null
              : [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!isFarmer) ...[
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: msg.isError ? Colors.red.withValues(alpha: 0.2) : AppTheme.primaryGreen.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      msg.isError ? Icons.error_outline : Icons.smart_toy_rounded,
                      size: 14,
                      color: msg.isError ? Colors.red : AppTheme.primaryGreen,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Farm Copilot',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      color: msg.isError ? Colors.red : AppTheme.primaryGreen,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
            ],
            Text(
              msg.text,
              style: TextStyle(
                color: isFarmer
                    ? Colors.white
                    : (msg.isError
                        ? (isDark ? Colors.red.shade200 : Colors.red.shade900)
                        : (isDark ? Colors.grey.shade100 : AppTheme.textDarkNavy)),
                height: 1.5,
                fontSize: 14,
              ),
            ),
            if (msg.isError && msg.lastQuery != null) ...[
              const SizedBox(height: 12),
              ElevatedButton.icon(
                onPressed: () => _sendMessage(msg.lastQuery!, lang),
                icon: const Icon(Icons.refresh, size: 16),
                label: const Text('Retry'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red.shade600,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ),
            ],
            if (!isFarmer && msg.rawResponse != null) _buildRichContent(msg.rawResponse!, lang, isDark),
          ],
        ),
      ),
    );
  }

  Widget _buildRichContent(Map<String, dynamic> data, String lang, bool isDark) {
    final steps = data['actionableSteps'] as List?;
    final warnings = data['warnings'] as List?;
    final eq = data['translatedEquipment'] as List?;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (steps != null && steps.isNotEmpty) ...[
          const SizedBox(height: 16),
          Divider(color: isDark ? Colors.white10 : Colors.grey.shade200),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Actionable Steps',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.lightGreenAccent : AppTheme.primaryGreen,
                ),
              ),
              TextButton.icon(
                onPressed: () => _addStepsToPlan(steps, lang),
                icon: const Icon(Icons.playlist_add_check, size: 16),
                label: const Text('Add to Plan', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                style: TextButton.styleFrom(
                  foregroundColor: AppTheme.primaryGreen,
                  padding: EdgeInsets.zero,
                  visualDensity: VisualDensity.compact,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...steps.map((s) => Padding(
            padding: const EdgeInsets.only(bottom: 6.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.only(top: 2),
                  child: Icon(Icons.check_circle_outline, size: 16, color: AppTheme.primaryGreen),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    s.toString(),
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.4,
                      color: isDark ? Colors.grey.shade200 : Colors.grey.shade800,
                    ),
                  ),
                ),
              ],
            ),
          )),
        ],
        if (warnings != null && warnings.isNotEmpty) ...[
          const SizedBox(height: 16),
          Divider(color: isDark ? Colors.white10 : Colors.grey.shade200),
          const SizedBox(height: 8),
          const Row(
            children: [
              Icon(Icons.warning_amber_rounded, size: 16, color: Colors.orange),
              SizedBox(width: 6),
              Text(
                'Agronomic Alerts',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Colors.orange),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...warnings.map((w) => Container(
            margin: const EdgeInsets.only(bottom: 6),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.orange.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
            ),
            child: Text(
              w.toString(),
              style: const TextStyle(fontSize: 12, color: Colors.orange, height: 1.4),
            ),
          )),
        ],
        if (eq != null && eq.isNotEmpty) ...[
          const SizedBox(height: 16),
          Divider(color: isDark ? Colors.white10 : Colors.grey.shade200),
          const SizedBox(height: 8),
          Text(
            'Recommended Machinery',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w900,
              color: isDark ? Colors.white : AppTheme.textDarkNavy,
            ),
          ),
          const SizedBox(height: 10),
          ...eq.map((e) {
            final name = e['equipmentName'] ?? 'Farming Tool';
            final why = e['whyNeeded'] ?? e['whatItDoes'] ?? '';
            final price = e['pricePerDay'];
            final eqId = e['equipmentId'];

            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withValues(alpha: 0.05) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.agriculture_rounded, color: AppTheme.primaryGreen, size: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        if (why.isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Text(why, style: TextStyle(fontSize: 11, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600)),
                        ],
                        if (price != null) ...[
                          const SizedBox(height: 4),
                          Text('₹$price / day', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primaryGreen)),
                        ],
                      ],
                    ),
                  ),
                  if (eqId != null && eqId.toString().isNotEmpty)
                    IconButton(
                      icon: const Icon(Icons.arrow_forward_ios, size: 14),
                      color: AppTheme.primaryGreen,
                      onPressed: () => context.push('/equipment/$eqId'),
                    ),
                ],
              ),
            );
          }),
        ]
      ],
    );
  }

  Widget _buildInputArea(String lang, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        border: Border(
          top: BorderSide(color: isDark ? Colors.white10 : Colors.grey.shade200),
        ),
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _controller,
                enabled: !_isLoading,
                style: TextStyle(fontSize: 14, color: isDark ? Colors.white : AppTheme.textDarkNavy),
                decoration: InputDecoration(
                  hintText: 'Ask about crop care, tools, or schedule...',
                  hintStyle: TextStyle(color: isDark ? Colors.grey.shade500 : Colors.grey.shade400, fontSize: 13),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(28),
                    borderSide: BorderSide(color: isDark ? Colors.white12 : Colors.grey.shade300),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(28),
                    borderSide: BorderSide(color: isDark ? Colors.white12 : Colors.grey.shade300),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(28),
                    borderSide: const BorderSide(color: AppTheme.primaryGreen, width: 1.5),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  filled: true,
                  fillColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
                ),
                onSubmitted: (val) => _sendMessage(val, lang),
              ),
            ),
            const SizedBox(width: 10),
            Container(
              decoration: const BoxDecoration(
                color: AppTheme.primaryGreen,
                shape: BoxShape.circle,
              ),
              child: IconButton(
                icon: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                onPressed: _isLoading ? null : () => _sendMessage(_controller.text, lang),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
