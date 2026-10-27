const fs = require('fs');
const path = require('path');

const homePath = path.join(__dirname, '../../mobile/lib/features/marketplace/ui/farmer_home_screen.dart');
let content = fs.readFileSync(homePath, 'utf8').replace(/\r\n/g, '\n');

// Find start of _showStageDetailsDialog and end of _showStageRelatedEquipmentDialog
const startIndex = content.indexOf('  // 2. STAGE DETAILS SCREEN / DIALOG');
const endIndex = content.indexOf('  // 4. RENTALS & SPENDING DETAILS SCREEN / DIALOG');

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + content.substring(endIndex);
  fs.writeFileSync(homePath, content, 'utf8');
  console.log('Removed obsolete stage dialog methods from farmer_home_screen.dart');
} else {
  console.log('Could not find markers: startIndex=', startIndex, 'endIndex=', endIndex);
}
