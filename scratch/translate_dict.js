const fs = require('fs');
const { translate } = require('@vitalets/google-translate-api');

const keysDict = JSON.parse(fs.readFileSync('extracted_keys.json', 'utf8'));
const targetLangs = ['te', 'hi', 'ta', 'kn'];

async function translateBatch(texts, to) {
    // Join with a unique delimiter that Google Translate usually respects
    const separator = ' \n###\n ';
    const textToTranslate = texts.join(separator);
    try {
        const res = await translate(textToTranslate, { to });
        return res.text.split(separator).map(s => s.trim());
    } catch (e) {
        console.error(`Translation failed for ${to}`, e.message);
        // Fallback: translate individually if batch fails
        const results = [];
        for (let t of texts) {
            try {
                const r = await translate(t, { to });
                results.push(r.text);
                await new Promise(resolve => setTimeout(resolve, 300));
            } catch (err) {
                console.error(`Individual fail: ${t}`, err.message);
                results.push(t); // fallback to English
            }
        }
        return results;
    }
}

async function run() {
    const entries = Object.entries(keysDict);
    const texts = entries.map(e => e[1]);
    const keys = entries.map(e => e[0]);
    
    // Batch in sizes of 50
    const batchSize = 50;
    
    const finalDicts = {
        en: keysDict,
        te: {}, hi: {}, ta: {}, kn: {}
    };

    console.log(`Starting translation of ${texts.length} strings to 4 languages...`);

    for (let lang of targetLangs) {
        console.log(`Translating to ${lang}...`);
        for (let i = 0; i < texts.length; i += batchSize) {
            const batchTexts = texts.slice(i, i + batchSize);
            const batchKeys = keys.slice(i, i + batchSize);
            
            const translated = await translateBatch(batchTexts, lang);
            
            for (let j = 0; j < batchKeys.length; j++) {
                finalDicts[lang][batchKeys[j]] = translated[j] || batchTexts[j];
            }
            console.log(`  Done ${Math.min(i + batchSize, texts.length)}/${texts.length}`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // anti-rate limit pause
        }
    }

    fs.writeFileSync('final_translations.json', JSON.stringify(finalDicts, null, 2));
    console.log('Translations saved to final_translations.json');
}

run().catch(console.error);
