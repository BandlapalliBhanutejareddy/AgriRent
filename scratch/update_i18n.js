const fs = require('fs');

const finalDicts = JSON.parse(fs.readFileSync('final_translations.json', 'utf8'));

function updateI18nFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // We need to carefully merge the keys into the existing file
    for (let lang of ['en', 'te', 'hi', 'ta', 'kn']) {
        const regexStr = '("' + lang + '"\\s*:\\s*\\{\\s*"translation"\\s*:\\s*\\{)([\\s\\S]*?)(\\}\\s*\\})';
        let match = content.match(new RegExp(regexStr));
        
        if (!match) {
            // try without quotes on lang and translation
            const regexStr2 = '(' + lang + '\\s*:\\s*\\{\\s*translation\\s*:\\s*\\{)([\\s\\S]*?)(\\}\\s*\\})';
            match = content.match(new RegExp(regexStr2));
        }

        if (match) {
            let existingKeys = match[2];
            let addedStr = "";
            for (let [k, v] of Object.entries(finalDicts[lang])) {
                // escape quotes in v
                const safeV = v.replace(/"/g, '\\"');
                if (!existingKeys.includes(`"${k}"`) && !existingKeys.includes(`'${k}'`)) {
                    addedStr += `,\n      "${k}": "${safeV}"`;
                }
            }
            const newBlock = match[1] + existingKeys + addedStr + match[3];
            content = content.replace(match[0], newBlock);
        }
    }
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
}

updateI18nFile('d:/AgriRent_AI/web/src/lib/i18n.ts');
updateI18nFile('d:/AgriRent_AI/mobile/src/lib/i18n.ts');
