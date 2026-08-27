const xlsx = require('xlsx');

const workbook = xlsx.readFile('reports/android/ANDROID_COMPLETE_TEST_CASES.xlsx');
workbook.SheetNames.forEach(sheetName => {
  console.log(`\n--- Sheet: ${sheetName} ---`);
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);
  console.log(JSON.stringify(data.slice(0, 5), null, 2)); // Print first 5 for brevity
  if (data.length > 5) {
    console.log(`... and ${data.length - 5} more rows`);
  }
});
