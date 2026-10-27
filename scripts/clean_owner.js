const fs = require('fs');
let content = fs.readFileSync('d:/AgriRent_AI/mobile/lib/features/profile/ui/owner_main_screen.dart', 'utf8');

content = content.replace(/import 'profile_screen\.dart';\r?\n/, '');

const targetComment = '// OWNER ANALYTICS TAB';
const idx = content.indexOf(targetComment);
if (idx !== -1) {
  // Find preceding separator comment if any
  const prevComment = '// -----------------------------------------------------------------------------';
  const lastSep = content.lastIndexOf(prevComment, idx);
  if (lastSep !== -1) {
    content = content.substring(0, lastSep).trimEnd() + '\n';
  } else {
    content = content.substring(0, idx).trimEnd() + '\n';
  }
}

fs.writeFileSync('d:/AgriRent_AI/mobile/lib/features/profile/ui/owner_main_screen.dart', content, 'utf8');
console.log('Successfully cleaned owner_main_screen.dart');
