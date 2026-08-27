const xlsx = require('xlsx');

const workbook = xlsx.readFile('reports/android/ANDROID_COMPLETE_TEST_CASES.xlsx');
let allTests = [];

workbook.SheetNames.forEach(sheetName => {
  if (sheetName === 'Summary' || sheetName === 'Regression' || sheetName === 'Defects' || sheetName === 'Evidence') return;
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);
  allTests = allTests.concat(data);
});

console.log(`Total tests found: ${allTests.length}`);
allTests.forEach(test => {
  console.log(`${test['Test ID']} - ${test['Status']} - ${test['Evidence Source']} - ${test['Remarks']}`);
});
