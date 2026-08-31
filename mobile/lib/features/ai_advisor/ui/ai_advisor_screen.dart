import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../providers/ai_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/localization/app_localizations.dart';

class AiAdvisorScreen extends ConsumerStatefulWidget {
  const AiAdvisorScreen({super.key});

  @override
  ConsumerState<AiAdvisorScreen> createState() => _AiAdvisorScreenState();
}

class _AiAdvisorScreenState extends ConsumerState<AiAdvisorScreen> {
  final TextEditingController _promptController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  
  final Map<String, String> _languages = {
    'en': 'English',
    'hi': 'Hindi',
    'te': 'Telugu',
    'ta': 'Tamil',
    'kn': 'Kannada'
  };
  
  // Track history locally for UI
  final List<Map<String, String>> _chatHistory = [];

  @override
  void dispose() {
    _promptController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _submitQuery() {
    final prompt = _promptController.text.trim();
    if (prompt.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a question', style: TextStyle(color: Colors.white)), backgroundColor: Colors.red),
      );
      return;
    }
    
    setState(() {
      _chatHistory.add({'role': 'user', 'content': prompt});
      _promptController.clear();
    });
    
    // Scroll to bottom
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
    
    FocusManager.instance.primaryFocus?.unfocus();

    final currentLangCode = ref.read(languageProvider);
    final languageName = _languages[currentLangCode] ?? 'English';
    ref.read(aiProvider.notifier).askQuestion(prompt, language: languageName);
  }

  @override
  Widget build(BuildContext context) {
    final aiState = ref.watch(aiProvider);
    final currentLangCode = ref.watch(languageProvider);
    
    // Add AI response to history when it finishes loading and is not empty
    if (!aiState.isLoading && aiState.response.isNotEmpty && aiState.error == null) {
      // Check if we already added this response (simplified check)
      bool alreadyAdded = false;
      if (_chatHistory.isNotEmpty && _chatHistory.last['role'] == 'ai' && _chatHistory.last['content'] == aiState.response) {
        alreadyAdded = true;
      }
      
      if (!alreadyAdded) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            setState(() {
              if (_chatHistory.isNotEmpty && _chatHistory.last['role'] == 'ai') {
                 _chatHistory.last['content'] = aiState.response;
              } else {
                 _chatHistory.add({'role': 'ai', 'content': aiState.response});
              }
            });
            Future.delayed(const Duration(milliseconds: 100), () {
              if (_scrollController.hasClients) {
                _scrollController.animateTo(
                  _scrollController.position.maxScrollExtent,
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeOut,
                );
              }
            });
          }
        });
      }
    } else if (aiState.error != null) {
       WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
             setState(() {
               if (_chatHistory.isNotEmpty && _chatHistory.last['role'] == 'ai' && _chatHistory.last['isError'] == 'true') {
                 // already have error
               } else {
                  _chatHistory.add({'role': 'ai', 'content': aiState.error!, 'isError': 'true'});
               }
             });
          }
       });
    }

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text('ai_advisor'.tr(currentLangCode), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20)),
        centerTitle: false,
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        actions: [
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8),
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: AppTheme.primaryGreen.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: currentLangCode,
                icon: const Icon(Icons.language, color: AppTheme.primaryGreen, size: 16),
                dropdownColor: Colors.white,
                style: const TextStyle(color: AppTheme.primaryGreen, fontWeight: FontWeight.bold, fontSize: 12),
                onChanged: (String? newCode) {
                  if (newCode != null) {
                    ref.read(languageProvider.notifier).setLanguage(newCode);
                  }
                },
                items: _languages.entries.map<DropdownMenuItem<String>>((entry) {
                  return DropdownMenuItem<String>(
                    value: entry.key,
                    child: Text(entry.value),
                  );
                }).toList(),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Chat / Response Area
          Expanded(
            child: _chatHistory.isEmpty && !aiState.isLoading
                ? _buildEmptyState()
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16.0),
                    itemCount: _chatHistory.length + (aiState.isLoading ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == _chatHistory.length && aiState.isLoading) {
                        return _buildLoadingBubble();
                      }
                      
                      final message = _chatHistory[index];
                      final isUser = message['role'] == 'user';
                      final isError = message['isError'] == 'true';
                      
                      return _buildChatBubble(message['content']!, isUser, isError);
                    },
                  ),
          ),
          
          // Input Area
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), offset: const Offset(0, -4), blurRadius: 16)],
            ),
            child: SafeArea(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    child: TextField(
                      controller: _promptController,
                      minLines: 1,
                      maxLines: 4,
                      style: const TextStyle(fontSize: 14),
                      decoration: InputDecoration(
                        hintText: 'Ask about crops, pests, equipment...',
                        hintStyle: const TextStyle(color: Colors.grey, fontSize: 14),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24.0),
                          borderSide: BorderSide.none,
                        ),
                        filled: true,
                        fillColor: Colors.grey.shade100,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      ),
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _submitQuery(),
                    ),
                  ),
                  const SizedBox(width: 12),
                  InkWell(
                    onTap: aiState.isLoading ? null : _submitQuery,
                    borderRadius: BorderRadius.circular(24),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: aiState.isLoading ? Colors.grey : AppTheme.primaryGreen,
                        shape: BoxShape.circle,
                        boxShadow: aiState.isLoading ? [] : [BoxShadow(color: AppTheme.primaryGreen.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 4))],
                      ),
                      child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChatBubble(String text, bool isUser, bool isError) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            CircleAvatar(
              radius: 16,
              backgroundColor: isError ? Colors.red.shade100 : AppTheme.primaryGreen.withValues(alpha: 0.1),
              child: Icon(isError ? Icons.error : Icons.auto_awesome, size: 16, color: isError ? Colors.red : AppTheme.primaryGreen),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isUser 
                    ? AppTheme.primaryGreen 
                    : isError ? Colors.red.shade50 : Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(20),
                  topRight: const Radius.circular(20),
                  bottomLeft: Radius.circular(isUser ? 20 : 0),
                  bottomRight: Radius.circular(isUser ? 0 : 20),
                ),
                border: isUser ? null : Border.all(color: isError ? Colors.red.shade200 : Colors.grey.shade200),
                boxShadow: isUser ? [BoxShadow(color: AppTheme.primaryGreen.withValues(alpha: 0.2), blurRadius: 8, offset: const Offset(0, 4))] : [],
              ),
              child: isUser
                  ? Text(text, style: const TextStyle(color: Colors.white, fontSize: 14, height: 1.4))
                  : MarkdownBody(
                      data: text,
                      styleSheet: MarkdownStyleSheet(
                        p: TextStyle(fontSize: 14, height: 1.5, color: isError ? Colors.red.shade900 : AppTheme.textDark),
                        h1: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                        h2: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                        h3: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                        listBullet: const TextStyle(color: AppTheme.primaryGreen),
                      ),
                    ),
            ),
          ),
          if (isUser) const SizedBox(width: 32),
        ],
      ),
    );
  }

  Widget _buildLoadingBubble() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.1),
            child: const Icon(Icons.auto_awesome, size: 16, color: AppTheme.primaryGreen),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(20),
                topRight: Radius.circular(20),
                bottomLeft: Radius.circular(0),
                bottomRight: Radius.circular(20),
              ),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primaryGreen),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: SingleChildScrollView(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppTheme.primaryGreen.withValues(alpha: 0.05),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.psychology, size: 64, color: AppTheme.primaryGreen),
            ),
            const SizedBox(height: 24),
            const Text(
              'Your Personal Agronomist',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppTheme.textDark),
            ),
            const SizedBox(height: 8),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 32.0),
              child: Text(
                'Ask any questions about crop diseases, fertilizers, weather impacts, or machinery selection.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: AppTheme.textLight, height: 1.5),
              ),
            ),
            const SizedBox(height: 32),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              alignment: WrapAlignment.center,
              children: [
                _buildSuggestionChip('Best fertilizer for wheat?'),
                _buildSuggestionChip('How to treat yellow leaves?'),
                _buildSuggestionChip('Tractor maintenance tips'),
              ],
            )
          ],
        ),
      ),
    );
  }

  Widget _buildSuggestionChip(String text) {
    return ActionChip(
      label: Text(text, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.primaryGreen)),
      backgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.05),
      side: BorderSide(color: AppTheme.primaryGreen.withValues(alpha: 0.2)),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      onPressed: () {
        _promptController.text = text;
        _submitQuery();
      },
    );
  }
}

