import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/localization/app_localizations.dart';

class OwnerHomePlaceholderScreen extends ConsumerWidget {
  const OwnerHomePlaceholderScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text('owner_dashboard'.tr(lang), style: const TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.dashboard_outlined, size: 80, color: Colors.grey),
            const SizedBox(height: 16),
            Text('owner_dashboard'.tr(lang), style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.grey)),
            const SizedBox(height: 8),
            const Text('Owner Dashboard coming in a future phase', style: TextStyle(color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}
