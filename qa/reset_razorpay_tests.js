const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, 'reports/android/ANDROID_COMPLETE_TEST_CASES.xlsx');

if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
}

const workbook = xlsx.readFile(filePath);

let resetCount = 0;

workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    let sheetModified = false;
    
    data.forEach(row => {
        const testId = row['Test ID'] || row['Test Case ID'] || row['ID'] || '';
        const module = row['Module'] || row['Feature'] || '';
        const title = row['Title'] || row['Test Name'] || row['Description'] || '';
        
        const isRazorpayTest = (testId && testId.toString().includes('PAY-')) || 
                               (module && module.toString().toLowerCase().includes('razorpay')) ||
                               (module && module.toString().toLowerCase().includes('payment')) ||
                               (title && title.toString().toLowerCase().includes('razorpay')) ||
                               (title && title.toString().toLowerCase().includes('payment'));
                               
        if (isRazorpayTest) {
            row['Status'] = 'NOT RUN';
            if (row['Actual Result'] !== undefined) row['Actual Result'] = 'Pending manual real execution';
            if (row['Execution Evidence'] !== undefined) row['Execution Evidence'] = 'None';
            resetCount++;
            sheetModified = true;
        }
    });
    
    if (sheetModified) {
        workbook.Sheets[sheetName] = xlsx.utils.json_to_sheet(data);
    }
});

xlsx.writeFile(workbook, filePath);
console.log(`Reset ${resetCount} Razorpay test cases to NOT RUN.`);
