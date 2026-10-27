class FarmExpense {
  final String id;
  final String title;
  final String description;
  final String category;
  final double amount;
  final DateTime date;
  final bool isRental;
  final String? bookingId;
  final String? cropId;

  FarmExpense({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.amount,
    required this.date,
    this.isRental = false,
    this.bookingId,
    this.cropId,
  });

  factory FarmExpense.fromJson(Map<String, dynamic> json) {
    return FarmExpense(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Farm Expense',
      description: json['description']?.toString() ?? '',
      category: json['category']?.toString() ?? 'General Expense',
      amount: (json['amount'] is num)
          ? (json['amount'] as num).toDouble()
          : (double.tryParse(json['amount']?.toString() ?? '0') ?? 0.0),
      date: json['date'] != null
          ? DateTime.tryParse(json['date'].toString()) ?? DateTime.now()
          : DateTime.now(),
      isRental: json['isRental'] == true,
      bookingId: json['bookingId']?.toString(),
      cropId: json['cropId']?.toString(),
    );
  }
}

class FarmExpensesData {
  /// Authoritative total budget configured for this farm.
  /// Null if no budget has been set on the backend.
  final double? totalBudget;

  /// Authoritative total spent (distinct verified records).
  final double totalSpent;

  /// Authoritative remaining budget (totalBudget - totalSpent).
  /// Null if totalBudget is not configured.
  final double? remainingBudget;

  final double rentalSpending;
  final double otherExpenses;
  final String currency;
  final List<FarmExpense> expenses;

  FarmExpensesData({
    this.totalBudget,
    this.totalSpent = 0.0,
    this.remainingBudget,
    this.rentalSpending = 0.0,
    this.otherExpenses = 0.0,
    this.currency = 'INR',
    this.expenses = const [],
  });

  factory FarmExpensesData.fromJson(Map<String, dynamic> json) {
    final rawList = json['expenses'] as List<dynamic>? ?? [];
    final seenIds = <String>{};
    final List<FarmExpense> expenses = [];

    // Deduplicate records by unique id to prevent double-counting
    for (final raw in rawList) {
      if (raw is Map) {
        final exp = FarmExpense.fromJson(Map<String, dynamic>.from(raw));
        if (exp.id.isNotEmpty) {
          if (seenIds.add(exp.id)) {
            expenses.add(exp);
          }
        } else {
          expenses.add(exp);
        }
      }
    }

    final double distinctSum = expenses.fold<double>(
      0.0,
      (sum, item) => sum + (item.amount.isFinite && item.amount > 0 ? item.amount : 0.0),
    );

    final double totalSpent = (json['totalSpent'] is num)
        ? (json['totalSpent'] as num).toDouble()
        : distinctSum;

    // Distinguish missing budget from ₹0 budget: null means not configured
    final double? totalBudget = (json['totalBudget'] is num)
        ? (json['totalBudget'] as num).toDouble()
        : (json['totalBudget'] != null ? double.tryParse(json['totalBudget'].toString()) : null);

    final double? remaining = (json['remainingBudget'] is num)
        ? (json['remainingBudget'] as num).toDouble()
        : (totalBudget != null ? (totalBudget - totalSpent) : null);

    final double rentalSpending = (json['rentalSpending'] is num)
        ? (json['rentalSpending'] as num).toDouble()
        : expenses
            .where((e) => e.isRental)
            .fold<double>(0.0, (s, e) => s + (e.amount.isFinite && e.amount > 0 ? e.amount : 0.0));

    final double otherExpenses = (json['otherExpenses'] is num)
        ? (json['otherExpenses'] as num).toDouble()
        : expenses
            .where((e) => !e.isRental)
            .fold<double>(0.0, (s, e) => s + (e.amount.isFinite && e.amount > 0 ? e.amount : 0.0));

    return FarmExpensesData(
      totalBudget: totalBudget,
      totalSpent: totalSpent >= 0 ? totalSpent : distinctSum,
      remainingBudget: remaining,
      rentalSpending: rentalSpending,
      otherExpenses: otherExpenses,
      currency: json['currency']?.toString() ?? 'INR',
      expenses: expenses,
    );
  }

  /// Whether a budget is configured (can be 0 or positive).
  bool get hasConfiguredBudget => totalBudget != null;

  /// Whether the budget is explicitly ₹0.
  bool get isBudgetZero => totalBudget != null && totalBudget == 0.0;

  /// Budget utilization percentage (0 - 1000%).
  /// Returns null if totalBudget is missing or non-positive (prevents division by zero).
  double? get utilizationPercentage {
    if (totalBudget == null || totalBudget! <= 0 || totalBudget!.isNaN || totalBudget!.isInfinite) {
      return null;
    }
    final pct = (totalSpent / totalBudget!) * 100.0;
    return pct.clamp(0.0, 1000.0);
  }

  /// Authoritative remaining budget.
  /// Returns null if totalBudget is missing.
  double? get calculatedRemainingBudget {
    if (totalBudget == null) return null;
    return totalBudget! - totalSpent;
  }

  /// Visual category breakdown calculated strictly from authoritative distinct records.
  Map<String, double> get categoryBreakdown {
    final Map<String, double> map = {};
    for (final exp in expenses) {
      if (exp.amount.isFinite && exp.amount > 0) {
        final cat = exp.category.trim().isEmpty ? 'Other' : exp.category.trim();
        map[cat] = (map[cat] ?? 0.0) + exp.amount;
      }
    }
    return map;
  }

  /// Sum derived directly from distinct records.
  double get totalFromDistinctRecords {
    return expenses.fold<double>(
      0.0,
      (sum, e) => sum + (e.amount.isFinite && e.amount > 0 ? e.amount : 0.0),
    );
  }
}
