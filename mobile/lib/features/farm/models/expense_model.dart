class FarmExpense {
  final String id;
  final String title;
  final String description;
  final String category;
  final double amount;
  final DateTime date;

  FarmExpense({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.amount,
    required this.date,
  });

  factory FarmExpense.fromJson(Map<String, dynamic> json) {
    return FarmExpense(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Farm Expense',
      description: json['description']?.toString() ?? '',
      category: json['category']?.toString() ?? 'General',
      amount: (json['amount'] is num)
          ? (json['amount'] as num).toDouble()
          : (double.tryParse(json['amount']?.toString() ?? '0') ?? 0.0),
      date: json['date'] != null
          ? DateTime.tryParse(json['date'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

class FarmExpensesData {
  final double totalBudget;
  final double totalSpent;
  final double remainingBudget;
  final String currency;
  final List<FarmExpense> expenses;

  FarmExpensesData({
    this.totalBudget = 0.0,
    this.totalSpent = 0.0,
    this.remainingBudget = 0.0,
    this.currency = 'INR',
    this.expenses = const [],
  });

  factory FarmExpensesData.fromJson(Map<String, dynamic> json) {
    final rawList = json['expenses'] as List<dynamic>? ?? [];
    final expenses = rawList
        .map((e) => FarmExpense.fromJson(e as Map<String, dynamic>))
        .toList();

    final listSum = expenses.fold<double>(0.0, (sum, item) => sum + item.amount);
    final totalSpent = (json['totalSpent'] is num)
        ? (json['totalSpent'] as num).toDouble()
        : listSum;
    final totalBudget = (json['totalBudget'] is num)
        ? (json['totalBudget'] as num).toDouble()
        : 50000.0;
    final remaining = (json['remainingBudget'] is num)
        ? (json['remainingBudget'] as num).toDouble()
        : (totalBudget - totalSpent);

    return FarmExpensesData(
      totalBudget: totalBudget,
      totalSpent: totalSpent > 0 ? totalSpent : listSum,
      remainingBudget: remaining >= 0 ? remaining : 0.0,
      currency: json['currency']?.toString() ?? 'INR',
      expenses: expenses,
    );
  }
}
