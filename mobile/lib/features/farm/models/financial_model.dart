class FarmFinancialAnalysis {
  final FarmFinancialState financialState;
  final List<RentalCostIntelligence> rentalIntelligence;
  final BudgetForecast forecast;
  final String summaryExplanation;

  FarmFinancialAnalysis({
    required this.financialState,
    required this.rentalIntelligence,
    required this.forecast,
    required this.summaryExplanation,
  });

  factory FarmFinancialAnalysis.fromJson(dynamic rawData) {
    if (rawData is! Map<String, dynamic>) {
      return FarmFinancialAnalysis(
        financialState: FarmFinancialState(
          totalBudget: 0,
          spentAmount: 0,
          reservedAmount: 0,
          remainingBudget: 0,
          projectedTotalCost: 0,
          budgetUtilizationPercent: 0,
          budgetStatus: 'UNKNOWN',
          currency: 'INR',
        ),
        rentalIntelligence: [],
        forecast: BudgetForecast(currentStage: '', projectedOverrunAmount: 0, forecastStatus: 'UNKNOWN'),
        summaryExplanation: '',
      );
    }
    final json = (rawData['data'] is Map<String, dynamic>) ? rawData['data'] as Map<String, dynamic> : rawData;

    return FarmFinancialAnalysis(
      financialState: FarmFinancialState.fromJson((json['financialState'] is Map<String, dynamic>) ? json['financialState'] as Map<String, dynamic> : {}),
      rentalIntelligence: (json['rentalIntelligence'] as List?)
              ?.whereType<Map>()
              .map((e) => RentalCostIntelligence.fromJson(Map<String, dynamic>.from(e)))
              .toList() ??
          [],
      forecast: BudgetForecast.fromJson((json['forecast'] is Map<String, dynamic>) ? json['forecast'] as Map<String, dynamic> : {}),
      summaryExplanation: json['summaryExplanation']?.toString() ?? '',
    );
  }
}

class FarmFinancialState {
  final num totalBudget;
  final num spentAmount;
  final num reservedAmount;
  final num remainingBudget;
  final num projectedTotalCost;
  final num budgetUtilizationPercent;
  final String budgetStatus;
  final String currency;

  FarmFinancialState({
    required this.totalBudget,
    required this.spentAmount,
    required this.reservedAmount,
    required this.remainingBudget,
    required this.projectedTotalCost,
    required this.budgetUtilizationPercent,
    required this.budgetStatus,
    required this.currency,
  });

  factory FarmFinancialState.fromJson(Map<String, dynamic> json) {
    return FarmFinancialState(
      totalBudget: json['totalBudget'] ?? 0,
      spentAmount: json['spentAmount'] ?? 0,
      reservedAmount: json['reservedAmount'] ?? 0,
      remainingBudget: json['remainingBudget'] ?? 0,
      projectedTotalCost: json['projectedTotalCost'] ?? 0,
      budgetUtilizationPercent: json['budgetUtilizationPercent'] ?? 0,
      budgetStatus: json['budgetStatus'] ?? 'UNKNOWN',
      currency: json['currency'] ?? 'INR',
    );
  }
}

class RentalCostIntelligence {
  final String equipmentCategory;
  final String? selectedEquipmentTitle;
  final num pricePerDay;
  final num estimatedOperationCost;
  final num costPerAcre;
  final num potentialSavings;

  RentalCostIntelligence({
    required this.equipmentCategory,
    this.selectedEquipmentTitle,
    required this.pricePerDay,
    required this.estimatedOperationCost,
    required this.costPerAcre,
    required this.potentialSavings,
  });

  factory RentalCostIntelligence.fromJson(Map<String, dynamic> json) {
    return RentalCostIntelligence(
      equipmentCategory: json['equipmentCategory'] ?? '',
      selectedEquipmentTitle: json['selectedEquipmentTitle'],
      pricePerDay: json['pricePerDay'] ?? 0,
      estimatedOperationCost: json['estimatedOperationCost'] ?? 0,
      costPerAcre: json['costPerAcre'] ?? 0,
      potentialSavings: json['potentialSavings'] ?? 0,
    );
  }
}

class BudgetForecast {
  final String currentStage;
  final num projectedOverrunAmount;
  final String forecastStatus;

  BudgetForecast({
    required this.currentStage,
    required this.projectedOverrunAmount,
    required this.forecastStatus,
  });

  factory BudgetForecast.fromJson(Map<String, dynamic> json) {
    return BudgetForecast(
      currentStage: json['currentStage'] ?? '',
      projectedOverrunAmount: json['projectedOverrunAmount'] ?? 0,
      forecastStatus: json['forecastStatus'] ?? 'UNKNOWN',
    );
  }
}
