const fs = require('fs');
let content = fs.readFileSync('mobile/lib/routing/router.dart', 'utf8');

const targetStr = "final userRole = (authState.user?.role ?? '').toUpperCase().trim();";
const addition = `final userRole = (authState.user?.role ?? '').toUpperCase().trim();

      // Role Isolation Route Guards
      if (state.matchedLocation.startsWith('/admin') && userRole != 'ADMIN') {
        return (userRole == 'OWNER') ? '/owner' : '/farmer';
      }
      if (state.matchedLocation.startsWith('/owner') && userRole != 'OWNER' && userRole != 'BOTH' && userRole != 'ADMIN') {
        return '/farmer';
      }
      if (state.matchedLocation.startsWith('/farmer') && userRole == 'OWNER') {
        return '/owner';
      }`;

if (!content.includes('// Role Isolation Route Guards')) {
  content = content.replace(targetStr, addition);
  fs.writeFileSync('mobile/lib/routing/router.dart', content, 'utf8');
  console.log('Successfully updated router.dart with role isolation guards');
} else {
  console.log('router.dart already has role isolation guards');
}
