const fs = require('fs');
let content = fs.readFileSync('mobile/lib/features/auth/ui/login_screen.dart', 'utf8');

// 1. Remove preset text in controllers
content = content.replace(
  /final _emailController = TextEditingController\(text: 'farmer\.live@agrorent\.ai'\);[\r\n]+  final _passwordController = TextEditingController\(text: 'Password123!'\);/,
  "final _emailController = TextEditingController();\r\n  final _passwordController = TextEditingController();"
);

// 2. Locate role toggle segment and replace with 3-tab segment
const startIdx = content.indexOf('// Role Toggle Segment (Farmer / Owner)');
const endIdx = content.indexOf('// Email Field');

if (startIdx !== -1 && endIdx !== -1) {
  const newToggle = `// Role Toggle Segment (Farmer / Owner / Admin)
              Container(
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.darkCard : const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade300),
                ),
                padding: const EdgeInsets.all(4),
                child: Row(
                  children: [
                    _buildRoleTab('Farmer', 'FARMER', isDark),
                    _buildRoleTab('Owner', 'OWNER', isDark),
                    _buildRoleTab('Admin', 'ADMIN', isDark),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              if (authState.error != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Colors.red, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          authState.error!,
                          style: const TextStyle(color: Colors.red, fontSize: 13, fontWeight: FontWeight.w500),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              `;

  content = content.substring(0, startIdx) + newToggle + content.substring(endIdx);
}

// 3. Add _buildRoleTab method
const lastBrace = content.lastIndexOf('}');
if (lastBrace !== -1) {
  const methodCode = `
  Widget _buildRoleTab(String label, String roleValue, bool isDark) {
    final isSelected = _selectedRole == roleValue;
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () {
          ref.read(authProvider.notifier).clearError();
          setState(() {
            _selectedRole = roleValue;
          });
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? AppTheme.primaryGreen : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: AppTheme.primaryGreen.withValues(alpha: 0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : [],
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isSelected ? Colors.white : (isDark ? Colors.grey.shade300 : Colors.grey.shade700),
              fontWeight: FontWeight.w800,
              fontSize: 14,
            ),
          ),
        ),
      ),
    );
  }
}
`;
  content = content.substring(0, lastBrace) + methodCode;
}

fs.writeFileSync('mobile/lib/features/auth/ui/login_screen.dart', content, 'utf8');
console.log('Successfully updated login_screen.dart');
