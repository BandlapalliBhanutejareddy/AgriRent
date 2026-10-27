const fs = require('fs');
let c = fs.readFileSync('mobile/lib/features/marketplace/ui/crop_advisor_screen.dart', 'utf8').replace(/\r\n/g, '\n');

const helperCode = `
  Widget _buildProgressionStepper(String lang) {
    int currentStep = 1;
    if (_plan != null) {
      currentStep = 4;
    } else if (_season.isNotEmpty && _acreage.isNotEmpty && _crop.isNotEmpty) {
      currentStep = 3;
    } else if (_crop.isNotEmpty) {
      currentStep = 2;
    }

    final steps = [
      {'title': 'Crop', 'icon': Icons.eco_rounded, 'step': 1},
      {'title': 'Land Size', 'icon': Icons.square_foot_rounded, 'step': 2},
      {'title': 'Season', 'icon': Icons.wb_sunny_rounded, 'step': 3},
      {'title': 'Recommendation', 'icon': Icons.auto_awesome_rounded, 'step': 4},
    ];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          for (int i = 0; i < steps.length; i++) ...[
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: (steps[i]['step'] as int) <= currentStep
                          ? AppTheme.primaryGreen
                          : Colors.grey.shade100,
                      border: Border.all(
                        color: (steps[i]['step'] as int) <= currentStep
                            ? AppTheme.primaryGreen
                            : Colors.grey.shade300,
                        width: 1.5,
                      ),
                    ),
                    child: Icon(
                      steps[i]['icon'] as IconData,
                      size: 16,
                      color: (steps[i]['step'] as int) <= currentStep
                          ? Colors.white
                          : Colors.grey.shade500,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    steps[i]['title'] as String,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: (steps[i]['step'] as int) <= currentStep
                          ? FontWeight.w800
                          : FontWeight.w600,
                      color: (steps[i]['step'] as int) <= currentStep
                          ? AppTheme.primaryGreen
                          : Colors.grey.shade600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            if (i < steps.length - 1)
              Container(
                width: 14,
                height: 2,
                margin: const EdgeInsets.only(bottom: 18),
                color: (steps[i]['step'] as int) < currentStep
                    ? AppTheme.primaryGreen
                    : Colors.grey.shade300,
              ),
          ],
        ],
      ),
    );
  }
`;

c = c.replace('  @override\n  Widget build(BuildContext context) {', helperCode + '\n  @override\n  Widget build(BuildContext context) {');

const targetHeaderEnd = `                    Text('smart_farming_desc'.tr(lang), textAlign: TextAlign.center, style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.5)),
                  ],
                ),
              ),
              const SizedBox(height: 24),`;

const replacementHeaderEnd = `                    Text('smart_farming_desc'.tr(lang), textAlign: TextAlign.center, style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.5)),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Visual Reference Stepper: Crop -> Land Size -> Season -> Recommendation
              _buildProgressionStepper(lang),
              const SizedBox(height: 16),`;

c = c.replace(targetHeaderEnd, replacementHeaderEnd);

fs.writeFileSync('mobile/lib/features/marketplace/ui/crop_advisor_screen.dart', c);
console.log('Successfully updated crop_advisor_screen.dart');
