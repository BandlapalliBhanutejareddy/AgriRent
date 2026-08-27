const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function generateFlutterExcelReport() {
  const reportsDir = path.join(__dirname, 'reports', 'android');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Test Cases');

  sheet.columns = [
    { header: 'Test ID', key: 'id', width: 15 },
    { header: 'Module', key: 'module', width: 20 },
    { header: 'Feature', key: 'feature', width: 25 },
    { header: 'Role', key: 'role', width: 15 },
    { header: 'Test Type', key: 'type', width: 15 },
    { header: 'Expected Result', key: 'expected', width: 40 },
    { header: 'Actual Result', key: 'actual', width: 40 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Priority', key: 'priority', width: 10 },
    { header: 'Device', key: 'device', width: 15 },
    { header: 'Remarks', key: 'remarks', width: 50 }
  ];

  const features = [
    { id: 'TC-A-001', module: 'Auth', feature: 'Login', role: 'Farmer' },
    { id: 'TC-A-002', module: 'Farmer', feature: 'Marketplace Navigation', role: 'Farmer' },
    { id: 'TC-A-003', module: 'Farmer', feature: 'Create Booking', role: 'Farmer' },
    { id: 'TC-A-004', module: 'Owner', feature: 'Accept Booking', role: 'Owner' },
    { id: 'TC-A-005', module: 'Payments', feature: 'Razorpay Checkout', role: 'Farmer' },
    { id: 'TC-A-006', module: 'AI', feature: 'Gemini Chat', role: 'All' },
    { id: 'TC-A-007', module: 'System', feature: 'Offline Network Guard', role: 'System' }
  ];

  features.forEach(f => {
    sheet.addRow({
      id: f.id,
      module: f.module,
      feature: f.feature,
      role: f.role,
      type: 'Appium UI',
      expected: 'UI renders successfully and action is completed',
      actual: 'Execution failed due to missing Android SDK/Emulator tools (adb not recognized)',
      status: 'BLOCKED',
      priority: 'High',
      device: 'Emulator API 33',
      remarks: 'Requires local Android SDK & Emulator installation'
    });
  });

  const outputPath = path.join(reportsDir, 'FLUTTER_FINAL_REPORT.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log(`Excel report generated at: ${outputPath}`);
}

generateFlutterExcelReport().catch(console.error);
