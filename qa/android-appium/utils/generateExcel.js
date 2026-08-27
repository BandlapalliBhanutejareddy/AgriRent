const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function generateAndroidExcelReport() {
  const reportsDir = path.join(__dirname, '../../reports/android');
  const mochawesomePath = path.join(reportsDir, 'execution-report.json');
  
  if (!fs.existsSync(mochawesomePath)) {
    console.error('Mochawesome JSON report not found. Run tests first.');
    return;
  }

  const rawData = fs.readFileSync(mochawesomePath, 'utf8');
  const reportData = JSON.parse(rawData);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Android Test Results');

  sheet.columns = [
    { header: 'Test ID', key: 'id', width: 40 },
    { header: 'Suite', key: 'suite', width: 30 },
    { header: 'Title', key: 'title', width: 50 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Duration (ms)', key: 'duration', width: 15 },
    { header: 'Error Message', key: 'error', width: 50 }
  ];

  const suites = reportData.results[0].suites;
  
  const extractTests = (suite) => {
    suite.tests.forEach(test => {
      const status = test.pass ? 'PASS' : (test.pending ? 'SKIP' : 'FAIL');
      sheet.addRow({
        id: test.uuid,
        suite: suite.title,
        title: test.title,
        status: status,
        duration: test.duration,
        error: test.err ? test.err.message : ''
      });
    });
    suite.suites.forEach(extractTests);
  };

  suites.forEach(extractTests);

  const outputPath = path.join(reportsDir, 'Android_Appium_Test_Report.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log(`Excel report generated at: ${outputPath}`);
}

if (require.main === module) {
  generateAndroidExcelReport().catch(console.error);
}

module.exports = { generateAndroidExcelReport };
