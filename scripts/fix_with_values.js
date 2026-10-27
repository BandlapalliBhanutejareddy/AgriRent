const fs = require('fs');
const file = 'mobile/lib/features/community/ui/community_screen.dart';
let s = fs.readFileSync(file, 'utf8');

// Fix withValues(alpha: )
s = s.replace(/withValues\(alpha:\s*\)/g, 'withValues(alpha: 0.12)');
// Specific replacements
s = s.replace(/AppTheme\.darkCard\.withValues\(alpha: 0\.12\)/g, 'AppTheme.darkCard.withValues(alpha: 0.5)');
s = s.replace(/AppTheme\.primaryGreen\.withValues\(alpha: 0\.12\)\s*,\s*blurRadius:\s*6/g, 'AppTheme.primaryGreen.withValues(alpha: 0.25), blurRadius: 6');
s = s.replace(/BoxShadow\(\s*color:\s*Colors\.black\.withValues\(alpha: 0\.12\)/g, 'BoxShadow(color: Colors.black.withValues(alpha: 0.03)');
s = s.replace(/AppTheme\.primaryGreen\.withValues\(alpha: 0\.12\)\s*,\s*shape:\s*BoxShape\.circle/g, 'AppTheme.primaryGreen.withValues(alpha: 0.08), shape: BoxShape.circle');
s = s.replace(/AppTheme\.primaryGreen\.withValues\(alpha: 0\.12\)\s*:\s*const\s*Color\(0xFFECFDF5\)/g, 'AppTheme.primaryGreen.withValues(alpha: 0.2) : const Color(0xFFECFDF5)');
s = s.replace(/AppTheme\.accentGreen\.withValues\(alpha: 0\.12\)/g, 'AppTheme.accentGreen.withValues(alpha: 0.4)');

// Fix invalid null-aware operator at line 423
s = s.replace(/boxShadow:\s*isSelected\s*\?\[/g, 'boxShadow: isSelected ? [');

fs.writeFileSync(file, s, 'utf8');
console.log('Successfully fixed community_screen withValues!');
