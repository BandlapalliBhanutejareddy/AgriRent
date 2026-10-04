import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/financial_provider.dart';

class FarmFinancialSummaryWidget extends ConsumerStatefulWidget {
  final String farmId;

  const FarmFinancialSummaryWidget({super.key, required this.farmId});

  @override
  ConsumerState<FarmFinancialSummaryWidget> createState() => _FarmFinancialSummaryWidgetState();
}

class _FarmFinancialSummaryWidgetState extends ConsumerState<FarmFinancialSummaryWidget> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final lang = ref.read(languageProvider);
      ref.read(financialProvider.notifier).fetchFinancialAnalysis(widget.farmId, lang);
    });
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final financialState = ref.watch(financialProvider);
    final analysis = financialState.analyses[widget.farmId];

    if (financialState.isLoading && analysis == null) {
      return const Center(child: Padding(
        padding: EdgeInsets.all(24.0),
        child: CircularProgressIndicator(),
      ));
    }

    if (financialState.error != null && analysis == null) {
      return _buildErrorState(lang, financialState.error!);
    }

    if (analysis == null) {
      return const SizedBox.shrink();
    }

    final state = analysis.financialState;
    final isTotalAvailable = state.totalBudget > 0;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 20, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('financial_summary'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: Color(0xFF0F172A))),
          const SizedBox(height: 16),
          _buildBudgetOverview(lang, state, isTotalAvailable),
          const SizedBox(height: 24),
          Text('spending_breakdown'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: Color(0xFF334155))),
          const SizedBox(height: 12),
          _buildBreakdownItem('equipment'.tr(lang), 'not_available'.tr(lang)),
          _buildBreakdownItem('labour'.tr(lang), 'not_available'.tr(lang)),
          _buildBreakdownItem('other'.tr(lang), 'not_available'.tr(lang)),
          const SizedBox(height: 24),
          const Divider(height: 1, color: Color(0xFFE2E8F0)),
          const SizedBox(height: 16),
          Row(
            children: [
              const Icon(Icons.lightbulb, color: Color(0xFFF59E0B), size: 20),
              const SizedBox(width: 8),
              Text('financial_intelligence'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: Color(0xFF334155))),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            analysis.summaryExplanation,
            style: const TextStyle(color: Color(0xFF475569), fontSize: 14, height: 1.5),
          ),
        ],
      ),
    );
  }

  Widget _buildBudgetOverview(String lang, dynamic state, bool isTotalAvailable) {
    return Row(
      children: [
        Expanded(
          child: _buildMetricCard(
            'total_budget'.tr(lang),
            isTotalAvailable ? '₹${state.totalBudget}' : 'not_available'.tr(lang),
            isTotalAvailable ? const Color(0xFF0F172A) : const Color(0xFF94A3B8),
            isTotalAvailable,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildMetricCard(
            'spent'.tr(lang),
            '₹${state.spentAmount}',
            AppTheme.primaryGreen,
            true,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildMetricCard(
            'remaining'.tr(lang),
            isTotalAvailable ? '₹${state.remainingBudget}' : 'not_available'.tr(lang),
            isTotalAvailable ? (state.remainingBudget < 0 ? Colors.red : const Color(0xFF0F172A)) : const Color(0xFF94A3B8),
            isTotalAvailable,
          ),
        ),
      ],
    );
  }

  Widget _buildMetricCard(String title, String value, Color valueColor, bool isKnown) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: isKnown ? 16 : 12,
              fontWeight: isKnown ? FontWeight.w800 : FontWeight.w500,
              color: valueColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBreakdownItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Color(0xFF64748B), fontSize: 14)),
          Text(value, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14, fontStyle: FontStyle.italic)),
        ],
      ),
    );
  }

  Widget _buildErrorState(String lang, String error) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        children: [
          const Icon(Icons.error_outline, color: Colors.red),
          const SizedBox(height: 8),
          Text('unable_to_load_financial_data'.tr(lang), style: const TextStyle(color: Colors.red)),
          TextButton(
            onPressed: () => ref.read(financialProvider.notifier).fetchFinancialAnalysis(widget.farmId, lang),
            child: Text('retry'.tr(lang)),
          ),
        ],
      ),
    );
  }
}
