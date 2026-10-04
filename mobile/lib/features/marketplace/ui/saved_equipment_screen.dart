import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../shared/theme/app_theme.dart';
import '../providers/saved_equipment_provider.dart';
import 'widgets/equipment_card.dart';

class SavedEquipmentScreen extends ConsumerWidget {
  const SavedEquipmentScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(savedEquipmentProvider);
    final lang = ref.watch(languageProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
      appBar: AppBar(
        title: Text(
          'saved_equipment'.tr(lang),
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 20,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
        ),
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
          onPressed: () {
            if (Navigator.canPop(context)) {
              Navigator.pop(context);
            } else {
              context.go('/farmer');
            }
          },
        ),
      ),
      body: RefreshIndicator(
        color: AppTheme.primaryGreen,
        onRefresh: () => ref.read(savedEquipmentProvider.notifier).loadSavedEquipment(),
        child: _buildBody(context, ref, state, lang, isDark),
      ),
    );
  }

  Widget _buildBody(
    BuildContext context,
    WidgetRef ref,
    SavedEquipmentState state,
    String lang,
    bool isDark,
  ) {
    if (state.isLoading && state.items.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.primaryGreen),
      );
    }

    if (state.error != null && state.items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 48, color: Colors.red.shade400),
              const SizedBox(height: 12),
              Text(
                state.error!,
                style: TextStyle(
                  color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                  fontSize: 14,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => ref.read(savedEquipmentProvider.notifier).loadSavedEquipment(),
                icon: const Icon(Icons.refresh, size: 18),
                label: Text('retry'.tr(lang)),
              ),
            ],
          ),
        ),
      );
    }

    if (state.items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.darkCard : const Color(0xFFF1F5F2),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.favorite_border_rounded,
                  size: 56,
                  color: isDark ? Colors.white38 : Colors.grey.shade400,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'no_saved_equipment'.tr(lang),
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Save machinery to easily access and compare them later.',
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () {
                  if (Navigator.canPop(context)) {
                    Navigator.pop(context);
                  } else {
                    context.go('/farmer');
                  }
                },
                icon: const Icon(Icons.storefront, size: 18),
                label: Text('explore_marketplace'.tr(lang)),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: state.items.length,
      itemBuilder: (context, index) {
        final item = state.items[index];
        return EquipmentCard(
          equipment: item,
          onSaveToggled: () {
            // Already automatically handled by provider
          },
        );
      },
    );
  }
}
