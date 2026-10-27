import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../shared/theme/app_theme.dart';
import '../providers/expenses_provider.dart';
import '../providers/farm_provider.dart';
import '../models/expense_model.dart';

class AllExpensesScreen extends ConsumerStatefulWidget {
  final String? farmId;

  const AllExpensesScreen({super.key, this.farmId});

  @override
  ConsumerState<AllExpensesScreen> createState() => _AllExpensesScreenState();
}

class _AllExpensesScreenState extends ConsumerState<AllExpensesScreen> {
  String? _effectiveFarmId;
  String _selectedCategoryFilter = 'ALL';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  void _loadData() {
    final farmState = ref.read(farmProvider);
    final targetId = widget.farmId ?? (farmState.farms.isNotEmpty ? farmState.farms.first.id : null);
    _effectiveFarmId = targetId;
    if (targetId != null) {
      ref.read(expensesProvider.notifier).fetchExpenses(targetId);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final lang = ref.watch(languageProvider);
    final farmState = ref.watch(farmProvider);
    final currentFarmId = widget.farmId ?? (farmState.farms.isNotEmpty ? farmState.farms.first.id : _effectiveFarmId);
    
    final expState = ref.watch(expensesProvider);
    final expData = currentFarmId != null ? expState.farmExpenses[currentFarmId] : null;

    final allExpenses = expData?.expenses ?? [];
    final filteredExpenses = _selectedCategoryFilter == 'ALL'
        ? allExpenses
        : allExpenses.where((e) => e.category.toUpperCase() == _selectedCategoryFilter.toUpperCase()).toList();

    final totalSpent = expData?.totalSpent ?? 0.0;
    final totalBudget = expData?.totalBudget;
    final remaining = expData?.calculatedRemainingBudget;
    final utilizationPct = expData?.utilizationPercentage;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF6F8FA),
      appBar: AppBar(
        title: Text(
          'all_expenses'.tr(lang),
          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
        ),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        foregroundColor: isDark ? Colors.white : AppTheme.textDarkNavy,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh',
            onPressed: () {
              if (currentFarmId != null) {
                ref.read(expensesProvider.notifier).fetchExpenses(currentFarmId);
              }
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppTheme.primaryGreen,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_rounded),
        label: Text('add_expense'.tr(lang), style: const TextStyle(fontWeight: FontWeight.bold)),
        onPressed: () => _showAddExpenseModal(context, currentFarmId, isDark, lang),
      ),
      body: SafeArea(
        child: expState.isLoading && expData == null
            ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
            : expState.error != null && expData == null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.error_outline_rounded, size: 48, color: Colors.red.shade400),
                          const SizedBox(height: 12),
                          const Text(
                            'Unable to load expenses',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            expState.error!,
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 12, color: Colors.grey),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primaryGreen,
                              foregroundColor: Colors.white,
                            ),
                            onPressed: _loadData,
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  )
                : RefreshIndicator(
                    color: AppTheme.primaryGreen,
                    onRefresh: () async {
                      if (currentFarmId != null) {
                        await ref.read(expensesProvider.notifier).fetchExpenses(currentFarmId);
                      }
                    },
                    child: ListView(
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                      children: [
                        // 1. SUMMARY CARD (Budget, Total Expenses, Remaining & Utilization)
                        _buildSummaryCard(
                          budget: totalBudget,
                          spent: totalSpent,
                          remaining: remaining,
                          utilization: utilizationPct,
                          count: allExpenses.length,
                          isDark: isDark,
                          lang: lang,
                        ),
                        const SizedBox(height: 16),

                        // 2. UNKNOWN LABOUR & MACHINERY NOTICE CARD
                        _buildUnknownCostNotice(isDark, lang),
                        const SizedBox(height: 16),

                        // 3. CATEGORY BREAKDOWN VISUAL SUMMARY
                        if (allExpenses.isNotEmpty && expData != null) ...[
                          _buildVisualCategoryBreakdown(expData, isDark, lang),
                          const SizedBox(height: 16),
                        ],

                        // 4. CATEGORY FILTER CHIPS
                        if (allExpenses.isNotEmpty) ...[
                          _buildCategoryFilterChips(allExpenses, isDark, lang),
                          const SizedBox(height: 16),
                        ],

                        // 5. EXPENSES LIST HEADER
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '${'expense_records'.tr(lang).toUpperCase()} (${filteredExpenses.length})',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.6,
                                color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                              ),
                            ),
                            TextButton.icon(
                              onPressed: () => _showAddExpenseModal(context, currentFarmId, isDark, lang),
                              icon: const Icon(Icons.add_circle_outline, size: 16, color: AppTheme.primaryGreen),
                              label: Text(
                                'add_expense'.tr(lang),
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                  color: AppTheme.primaryGreen,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),

                        // 6. EXPENSES LIST OR EMPTY STATE
                        if (filteredExpenses.isEmpty)
                          _buildEmptyState(context, currentFarmId, isDark, lang)
                        else
                          ...filteredExpenses.map((exp) => _buildExpenseCard(exp, isDark, lang)),

                        const SizedBox(height: 80), // Fab space
                      ],
                    ),
                  ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 1. SUMMARY CARD
  // ---------------------------------------------------------------------------
  Widget _buildSummaryCard({
    required double? budget,
    required double spent,
    required double? remaining,
    required double? utilization,
    required int count,
    required bool isDark,
    required String lang,
  }) {
    final currencyFormatter = NumberFormat('#,##,###');

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'total_expenses'.tr(lang).toUpperCase(),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.5,
                      color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '₹ ${currencyFormatter.format(spent.toInt())}',
                    style: const TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.primaryGreen,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '$count ${'expense_records'.tr(lang)}',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.primaryGreen,
                  ),
                ),
              ),
            ],
          ),
          const Divider(height: 24),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('total_budget'.tr(lang), style: const TextStyle(fontSize: 11, color: Colors.grey)),
                    const SizedBox(height: 2),
                    Text(
                      budget != null
                          ? '₹ ${currencyFormatter.format(budget.toInt())}'
                          : 'not_configured'.tr(lang),
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: budget != null
                            ? (isDark ? Colors.white : AppTheme.textDarkNavy)
                            : Colors.orange.shade700,
                      ),
                    ),
                  ],
                ),
              ),
              Container(height: 28, width: 1, color: isDark ? Colors.white12 : Colors.grey.shade200),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(left: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('remaining_budget'.tr(lang), style: const TextStyle(fontSize: 11, color: Colors.grey)),
                      const SizedBox(height: 2),
                      Text(
                        remaining != null
                            ? '₹ ${currencyFormatter.format(remaining.toInt())}'
                            : 'budget_unavailable'.tr(lang),
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: remaining != null
                              ? (remaining >= 0 ? AppTheme.primaryGreen : Colors.red.shade600)
                              : Colors.grey,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          // Utilization bar (only when budget is authoritative and positive)
          if (utilization != null) ...[
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'budget_utilization'.tr(lang),
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                ),
                Text(
                  '${utilization.toStringAsFixed(1)}%',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    color: utilization > 100 ? Colors.red.shade600 : AppTheme.primaryGreen,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: (utilization / 100.0).clamp(0.0, 1.0),
                backgroundColor: isDark ? Colors.white10 : Colors.grey.shade200,
                color: utilization > 100 ? Colors.red.shade600 : AppTheme.primaryGreen,
                minHeight: 8,
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 2. UNKNOWN LABOUR & MACHINERY NOTICE
  // ---------------------------------------------------------------------------
  Widget _buildUnknownCostNotice(bool isDark, String lang) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isDark ? Colors.white12 : Colors.grey.shade300),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline_rounded, size: 18, color: Colors.blueGrey.shade600),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'unknown_cost_notice'.tr(lang),
              style: TextStyle(
                fontSize: 11.5,
                height: 1.35,
                color: isDark ? Colors.grey.shade300 : const Color(0xFF475569),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 3. VISUAL CATEGORY BREAKDOWN
  // ---------------------------------------------------------------------------
  Widget _buildVisualCategoryBreakdown(FarmExpensesData expData, bool isDark, String lang) {
    final breakdown = expData.categoryBreakdown;
    final total = expData.totalSpent;
    final currencyFormatter = NumberFormat('#,##,###');

    if (breakdown.isEmpty || total <= 0) {
      return const SizedBox.shrink();
    }

    final sortedEntries = breakdown.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'category_breakdown'.tr(lang),
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.4,
              color: isDark ? Colors.white : AppTheme.textDarkNavy,
            ),
          ),
          const SizedBox(height: 14),
          ...sortedEntries.map((entry) {
            final cat = entry.key;
            final amount = entry.value;
            final pct = total > 0 ? (amount / total) * 100 : 0.0;
            final color = _getCategoryColor(cat);
            final localizedName = _getLocalizedCategoryName(cat, lang);

            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            localizedName,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: isDark ? Colors.white : AppTheme.textDarkNavy,
                            ),
                          ),
                        ],
                      ),
                      Text(
                        '₹ ${currencyFormatter.format(amount.toInt())} (${pct.toStringAsFixed(1)}%)',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.grey.shade300 : AppTheme.textDarkNavy,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: (pct / 100.0).clamp(0.0, 1.0),
                      backgroundColor: isDark ? Colors.white10 : Colors.grey.shade200,
                      color: color,
                      minHeight: 6,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 4. CATEGORY FILTER CHIPS
  // ---------------------------------------------------------------------------
  Widget _buildCategoryFilterChips(List<FarmExpense> expenses, bool isDark, String lang) {
    final categoriesSet = <String>{'ALL'};
    for (final exp in expenses) {
      if (exp.category.trim().isNotEmpty) {
        categoriesSet.add(exp.category.trim().toUpperCase());
      }
    }

    final categoriesList = categoriesSet.toList();

    return SizedBox(
      height: 38,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: categoriesList.length,
        separatorBuilder: (context, index) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final cat = categoriesList[index];
          final isSelected = _selectedCategoryFilter == cat;
          final label = cat == 'ALL'
              ? '${'all_categories'.tr(lang)} (${expenses.length})'
              : '${_getLocalizedCategoryName(cat, lang)} (${expenses.where((e) => e.category.toUpperCase() == cat).length})';

          return ChoiceChip(
            label: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected ? Colors.white : (isDark ? Colors.grey.shade300 : Colors.grey.shade800),
              ),
            ),
            selected: isSelected,
            selectedColor: AppTheme.primaryGreen,
            backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
            side: BorderSide(
              color: isSelected
                  ? AppTheme.primaryGreen
                  : (isDark ? Colors.white12 : Colors.grey.shade300),
            ),
            onSelected: (val) {
              if (val) {
                setState(() => _selectedCategoryFilter = cat);
              }
            },
          );
        },
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 5. SINGLE EXPENSE ITEM CARD
  // ---------------------------------------------------------------------------
  Widget _buildExpenseCard(FarmExpense exp, bool isDark, String lang) {
    final dateStr = DateFormat('dd MMM yyyy').format(exp.date);
    final localizedCat = _getLocalizedCategoryName(exp.category, lang);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: _getCategoryColor(exp.category).withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              _getCategoryIcon(exp.category),
              color: _getCategoryColor(exp.category),
              size: 24,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  exp.title,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                if (exp.description.isNotEmpty &&
                    exp.description != exp.title &&
                    exp.description != exp.category &&
                    exp.description != 'General') ...[
                  const SizedBox(height: 2),
                  Text(
                    exp.description,
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? Colors.white60 : Colors.grey.shade600,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: 4),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        localizedCat,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.grey.shade300 : Colors.grey.shade700,
                        ),
                      ),
                    ),
                    Text(
                      dateStr,
                      style: const TextStyle(fontSize: 11, color: Colors.grey),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Text(
            '₹ ${NumberFormat('#,##,###').format(exp.amount.toInt())}',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w900,
              color: AppTheme.primaryGreen,
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 6. EMPTY STATE
  // ---------------------------------------------------------------------------
  Widget _buildEmptyState(BuildContext context, String? farmId, bool isDark, String lang) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.receipt_long_rounded, size: 54, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text(
            'no_expenses_yet'.tr(lang).toUpperCase(),
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, letterSpacing: 0.5),
          ),
          const SizedBox(height: 8),
          Text(
            'no_expenses_desc'.tr(lang),
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13, color: Colors.grey),
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: () => _showAddExpenseModal(context, farmId, isDark, lang),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryGreen,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            ),
            icon: const Icon(Icons.add_rounded),
            label: Text('add_expense'.tr(lang), style: const TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 7. ADD EXPENSE MODAL
  // ---------------------------------------------------------------------------
  void _showAddExpenseModal(BuildContext context, String? farmId, bool isDark, String lang) {
    if (farmId == null) return;

    final titleController = TextEditingController();
    final descriptionController = TextEditingController();
    final amountController = TextEditingController();
    String selectedCategory = 'Fertilizer';
    DateTime selectedDate = DateTime.now();
    String? selectedCropId;

    final categories = [
      'Seeds',
      'Fertilizer',
      'Pesticides',
      'Fuel',
      'Labor',
      'Equipment Rental',
      'Irrigation',
      'Maintenance',
      'Other',
    ];

    final farmState = ref.read(farmProvider);
    final activeFarm = farmState.selectedFarm?.id == farmId
        ? farmState.selectedFarm
        : farmState.farms.where((f) => f.id == farmId).firstOrNull;
    final farmCrops = activeFarm?.crops ?? [];

    showDialog(
      context: context,
      builder: (dialogCtx) {
        bool isSubmitting = false;
        return StatefulBuilder(
          builder: (ctx, setModalState) => Dialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
            insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
            child: Padding(
              padding: const EdgeInsets.all(22),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'add_expense'.tr(lang),
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: isDark ? Colors.white : AppTheme.textDarkNavy,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: isSubmitting ? null : () => Navigator.pop(dialogCtx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Label 1: Title
                    Text('expense_item_title'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: titleController,
                      enabled: !isSubmitting,
                      decoration: InputDecoration(
                        hintText: 'e.g. Organic NPK Fertilizer 50kg',
                        filled: true,
                        fillColor: isDark ? Colors.white10 : const Color(0xFFF9FBFA),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Label 2: Category
                    Text('category'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white10 : const Color(0xFFF9FBFA),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade400),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: selectedCategory,
                          isExpanded: true,
                          dropdownColor: isDark ? AppTheme.darkCard : Colors.white,
                          items: categories
                              .map((c) => DropdownMenuItem(
                                    value: c,
                                    child: Text(_getLocalizedCategoryName(c, lang)),
                                  ))
                              .toList(),
                          onChanged: isSubmitting
                              ? null
                              : (val) {
                                  if (val != null) setModalState(() => selectedCategory = val);
                                },
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Label 3: Amount
                    Text('amount_inr'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: amountController,
                      enabled: !isSubmitting,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(
                        hintText: 'e.g. 1250',
                        filled: true,
                        fillColor: isDark ? Colors.white10 : const Color(0xFFF9FBFA),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Label 4: Date Picker
                    Text('date'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                    const SizedBox(height: 6),
                    InkWell(
                      onTap: isSubmitting
                          ? null
                          : () async {
                              final picked = await showDatePicker(
                                context: context,
                                initialDate: selectedDate,
                                firstDate: DateTime(2020),
                                lastDate: DateTime.now().add(const Duration(days: 365)),
                              );
                              if (picked != null) {
                                setModalState(() => selectedDate = picked);
                              }
                            },
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white10 : const Color(0xFFF9FBFA),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey.shade400),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.calendar_today_rounded, size: 18, color: AppTheme.primaryGreen),
                            const SizedBox(width: 10),
                            Text(
                              DateFormat('dd MMM yyyy').format(selectedDate),
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: isDark ? Colors.white : AppTheme.textDarkNavy,
                              ),
                            ),
                            const Spacer(),
                            const Icon(Icons.arrow_drop_down, color: Colors.grey),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Label 5: Related Crop
                    Text('crop_relation'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white10 : const Color(0xFFF9FBFA),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade400),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String?>(
                          value: selectedCropId,
                          isExpanded: true,
                          dropdownColor: isDark ? AppTheme.darkCard : Colors.white,
                          items: [
                            DropdownMenuItem<String?>(
                              value: null,
                              child: Text('general_farm_expense'.tr(lang)),
                            ),
                            ...farmCrops.map((c) => DropdownMenuItem<String?>(
                                  value: c.id,
                                  child: Text('${c.cropName} (${c.stage})'),
                                )),
                          ],
                          onChanged: isSubmitting
                              ? null
                              : (val) {
                                  setModalState(() => selectedCropId = val);
                                },
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Label 6: Description / Notes
                    Text('description'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: descriptionController,
                      enabled: !isSubmitting,
                      maxLines: 2,
                      decoration: InputDecoration(
                        hintText: 'e.g. Purchased from local cooperative society',
                        filled: true,
                        fillColor: isDark ? Colors.white10 : const Color(0xFFF9FBFA),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                    const SizedBox(height: 22),

                    // Save Button
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryGreen,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: isSubmitting
                            ? null
                            : () async {
                                final title = titleController.text.trim();
                                final desc = descriptionController.text.trim();
                                final amt = double.tryParse(amountController.text.trim());
                                if (title.isEmpty || amt == null || amt <= 0 || amt.isNaN || amt.isInfinite) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('valid_title_and_amount'.tr(lang))),
                                  );
                                  return;
                                }

                                setModalState(() => isSubmitting = true);

                                final success = await ref.read(expensesProvider.notifier).addExpense(
                                      farmId: farmId,
                                      title: title,
                                      amount: amt,
                                      category: selectedCategory,
                                      description: desc,
                                      date: selectedDate,
                                      cropId: selectedCropId,
                                    );

                                if (!dialogCtx.mounted) return;

                                if (success) {
                                  Navigator.pop(dialogCtx);
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('expense_saved_success'.tr(lang)),
                                        backgroundColor: AppTheme.primaryGreen,
                                      ),
                                    );
                                  }
                                } else {
                                  // Preserve form contents upon failure
                                  setModalState(() => isSubmitting = false);
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('expense_save_failed'.tr(lang)),
                                        backgroundColor: Colors.red,
                                      ),
                                    );
                                  }
                                }
                              },
                        child: isSubmitting
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : Text(
                                'save_expense'.tr(lang),
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  String _getLocalizedCategoryName(String rawCategory, String lang) {
    final cat = rawCategory.toUpperCase();
    if (cat.contains('FERT')) return 'cat_fertilizer'.tr(lang);
    if (cat.contains('SEED')) return 'cat_seeds'.tr(lang);
    if (cat.contains('PEST')) return 'cat_pesticide'.tr(lang);
    if (cat.contains('LAB')) return 'cat_labour'.tr(lang);
    if (cat.contains('EQUIP') || cat.contains('RENT')) return 'cat_rental'.tr(lang);
    if (cat.contains('IRRIG')) return 'cat_irrigation'.tr(lang);
    if (cat.contains('FUEL')) return 'cat_fuel'.tr(lang);
    if (cat.contains('MAINT')) return 'cat_maintenance'.tr(lang);
    if (cat.contains('TRANS')) return 'cat_transport'.tr(lang);
    return 'cat_other'.tr(lang);
  }

  IconData _getCategoryIcon(String category) {
    final cat = category.toUpperCase();
    if (cat.contains('FERT')) return Icons.eco_rounded;
    if (cat.contains('SEED')) return Icons.grain_rounded;
    if (cat.contains('PEST')) return Icons.bug_report_rounded;
    if (cat.contains('LAB')) return Icons.people_alt_rounded;
    if (cat.contains('EQUIP') || cat.contains('RENT')) return Icons.agriculture_rounded;
    if (cat.contains('IRRIG')) return Icons.water_drop_rounded;
    if (cat.contains('FUEL')) return Icons.local_gas_station_rounded;
    if (cat.contains('MAINT')) return Icons.build_rounded;
    if (cat.contains('TRANS')) return Icons.local_shipping_rounded;
    return Icons.receipt_long_rounded;
  }

  Color _getCategoryColor(String category) {
    final cat = category.toUpperCase();
    if (cat.contains('FERT')) return Colors.teal;
    if (cat.contains('SEED')) return Colors.orange;
    if (cat.contains('PEST')) return Colors.red;
    if (cat.contains('LAB')) return Colors.purple;
    if (cat.contains('EQUIP') || cat.contains('RENT')) return AppTheme.primaryGreen;
    if (cat.contains('IRRIG')) return Colors.blue;
    if (cat.contains('FUEL')) return Colors.amber.shade800;
    if (cat.contains('MAINT')) return Colors.blueGrey;
    if (cat.contains('TRANS')) return Colors.brown;
    return Colors.indigo;
  }
}
