import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
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
    final farmState = ref.watch(farmProvider);
    final currentFarmId = widget.farmId ?? (farmState.farms.isNotEmpty ? farmState.farms.first.id : _effectiveFarmId);
    
    final expState = ref.watch(expensesProvider);
    final expData = currentFarmId != null ? expState.farmExpenses[currentFarmId] : null;

    final expenses = expData?.expenses ?? [];
    final totalSpent = expData?.totalSpent ?? 0.0;
    final totalBudget = expData?.totalBudget ?? 50000.0;
    final remaining = expData?.remainingBudget ?? (totalBudget - totalSpent);

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF6F8FA),
      appBar: AppBar(
        title: const Text(
          'All Expenses',
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
        ),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
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
        label: const Text('Add Expense', style: TextStyle(fontWeight: FontWeight.bold)),
        onPressed: () => _showAddExpenseModal(context, currentFarmId, isDark),
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
                        // 1. SUMMARY CARD (Budget, Total Expenses, Remaining)
                        _buildSummaryCard(totalBudget, totalSpent, remaining, expenses.length, isDark),
                        const SizedBox(height: 20),

                        // 2. EXPENSES LIST HEADER
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'EXPENSE RECORDS (${expenses.length})',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.6,
                                color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                              ),
                            ),
                            TextButton.icon(
                              onPressed: () => _showAddExpenseModal(context, currentFarmId, isDark),
                              icon: const Icon(Icons.add_circle_outline, size: 16, color: AppTheme.primaryGreen),
                              label: const Text(
                                'Add New',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                  color: AppTheme.primaryGreen,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),

                        // 3. EXPENSES LIST OR EMPTY STATE
                        if (expenses.isEmpty)
                          _buildEmptyState(context, currentFarmId, isDark)
                        else
                          ...expenses.map((exp) => _buildExpenseCard(exp, isDark)),

                        const SizedBox(height: 80), // Fab space
                      ],
                    ),
                  ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // SUMMARY CARD
  // ---------------------------------------------------------------------------
  Widget _buildSummaryCard(double budget, double spent, double remaining, int count, bool isDark) {
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
                    'TOTAL EXPENSES',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.5,
                      color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '₹ ${NumberFormat('#,##,###').format(spent.toInt())}',
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
                  '$count Records',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.primaryGreen,
                  ),
                ),
              ),
            ],
          ),
          const Divider(height: 28),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Total Budget', style: TextStyle(fontSize: 11, color: Colors.grey)),
                    const SizedBox(height: 2),
                    Text(
                      '₹ ${NumberFormat('#,##,###').format(budget.toInt())}',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : AppTheme.textDarkNavy,
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
                      const Text('Remaining Budget', style: TextStyle(fontSize: 11, color: Colors.grey)),
                      const SizedBox(height: 2),
                      Text(
                        '₹ ${NumberFormat('#,##,###').format(remaining.toInt())}',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.primaryGreen,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // SINGLE EXPENSE ITEM CARD
  // ---------------------------------------------------------------------------
  Widget _buildExpenseCard(FarmExpense exp, bool isDark) {
    final dateStr = DateFormat('dd MMM yyyy').format(exp.date);

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
                        exp.category,
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
  // EMPTY STATE
  // ---------------------------------------------------------------------------
  Widget _buildEmptyState(BuildContext context, String? farmId, bool isDark) {
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
          const Text(
            'NO EXPENSES YET',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, letterSpacing: 0.5),
          ),
          const SizedBox(height: 8),
          const Text(
            'You can add your first farm expense to start tracking spending.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: Colors.grey),
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: () => _showAddExpenseModal(context, farmId, isDark),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryGreen,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            ),
            icon: const Icon(Icons.add_rounded),
            label: const Text('Add Expense', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // ADD EXPENSE MODAL (Explicit Labels + Categorization + Validation)
  // ---------------------------------------------------------------------------
  void _showAddExpenseModal(BuildContext context, String? farmId, bool isDark) {
    if (farmId == null) return;

    final titleController = TextEditingController();
    final amountController = TextEditingController();
    String selectedCategory = 'Fertilizer';
    final categories = ['Fertilizer', 'Seeds', 'Pesticide', 'Labour', 'Equipment Rental', 'Irrigation', 'Transport', 'Other'];

    showDialog(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
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
                        'Add Farm Expense',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(dialogCtx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Explicit Label 1: Description
                  const Text('Expense Description', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: titleController,
                    decoration: InputDecoration(
                      hintText: 'e.g. Organic Fertilizer 50kg',
                      filled: true,
                      fillColor: isDark ? Colors.white10 : const Color(0xFFF9FBFA),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Explicit Label 2: Category
                  const Text('Category', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
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
                            .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                            .toList(),
                        onChanged: (val) {
                          if (val != null) setModalState(() => selectedCategory = val);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Explicit Label 3: Amount
                  const Text('Amount (₹)', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: amountController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      hintText: 'e.g. 1250',
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
                      onPressed: () async {
                        final title = titleController.text.trim();
                        final amt = double.tryParse(amountController.text.trim());
                        if (title.isEmpty || amt == null || amt <= 0) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Please provide a valid description and amount.')),
                          );
                          return;
                        }

                        Navigator.pop(dialogCtx);

                        final success = await ref.read(expensesProvider.notifier).addExpense(
                              farmId: farmId,
                              title: title,
                              amount: amt,
                              category: selectedCategory,
                            );

                        if (context.mounted) {
                          if (success) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Expense recorded successfully ✓'),
                                backgroundColor: AppTheme.primaryGreen,
                              ),
                            );
                          } else {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Failed to record expense. Please try again.'),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                        }
                      },
                      child: const Text('Save Expense', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  IconData _getCategoryIcon(String category) {
    final cat = category.toUpperCase();
    if (cat.contains('FERT')) return Icons.eco_rounded;
    if (cat.contains('SEED')) return Icons.grain_rounded;
    if (cat.contains('PEST')) return Icons.bug_report_rounded;
    if (cat.contains('LAB')) return Icons.people_alt_rounded;
    if (cat.contains('EQUIP') || cat.contains('RENT')) return Icons.agriculture_rounded;
    if (cat.contains('IRRIG')) return Icons.water_drop_rounded;
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
    if (cat.contains('TRANS')) return Colors.brown;
    return Colors.indigo;
  }
}
