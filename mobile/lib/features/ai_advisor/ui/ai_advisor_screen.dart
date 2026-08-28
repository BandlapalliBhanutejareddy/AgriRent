import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../providers/ai_provider.dart';

class AiAdvisorScreen extends ConsumerStatefulWidget {
  const AiAdvisorScreen({super.key});

  @override
  ConsumerState<AiAdvisorScreen> createState() => _AiAdvisorScreenState();
}

class _AiAdvisorScreenState extends ConsumerState<AiAdvisorScreen> {
  final TextEditingController _promptController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  String _selectedLanguage = 'English';
  final List<String> _languages = ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada'];

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
        const SnackBar(content: Text('Please enter a question')),
      );
      return;
    }
    
    // Unfocus keyboard
    FocusManager.instance.primaryFocus?.unfocus();

    ref.read(aiProvider.notifier).askQuestion(prompt, language: _selectedLanguage);
  }

  @override
  Widget build(BuildContext context) {
    final aiState = ref.watch(aiProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Advisor'),
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _selectedLanguage,
                icon: const Icon(Icons.language, color: Colors.white),
                dropdownColor: Theme.of(context).primaryColor,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                onChanged: (String? newValue) {
                  if (newValue != null) {
                    setState(() {
                      _selectedLanguage = newValue;
                    });
                  }
                },
                items: _languages.map<DropdownMenuItem<String>>((String value) {
                  return DropdownMenuItem<String>(
                    value: value,
                    child: Text(value),
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
            child: Container(
              color: Colors.grey.shade50,
              padding: const EdgeInsets.all(16.0),
              child: aiState.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : aiState.error != null
                      ? Center(
                          child: Text(
                            aiState.error!,
                            style: const TextStyle(color: Colors.red, fontSize: 16),
                            textAlign: TextAlign.center,
                          ),
                        )
                      : aiState.response.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.agriculture, size: 80, color: Colors.green.shade200),
                                  const SizedBox(height: 16),
                                  Text(
                                    'How can I help you farm better today?',
                                    style: TextStyle(
                                      fontSize: 18,
                                      color: Colors.grey.shade600,
                                      fontWeight: FontWeight.w500,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ],
                              ),
                            )
                          : Scrollbar(
                              controller: _scrollController,
                              thumbVisibility: true,
                              child: SingleChildScrollView(
                                controller: _scrollController,
                                child: MarkdownBody(
                                  data: aiState.response,
                                  styleSheet: MarkdownStyleSheet(
                                    p: const TextStyle(fontSize: 16, height: 1.5),
                                    h1: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                                    h2: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                                    h3: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ),
                            ),
            ),
          ),
          
          // Input Area
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  offset: const Offset(0, -2),
                  blurRadius: 6,
                ),
              ],
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
                      decoration: InputDecoration(
                        hintText: 'Ask about crops, pests, equipment...',
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
                  const SizedBox(width: 8),
                  Container(
                    decoration: BoxDecoration(
                      color: Theme.of(context).primaryColor,
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.send, color: Colors.white),
                      onPressed: aiState.isLoading ? null : _submitQuery,
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
}
