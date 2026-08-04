const fs = require('fs');

function alignI18n(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract resources object
  const match = content.match(/const resources = ({[\s\S]+?});\s+i18n/);
  if (!match) {
    const match2 = content.match(/const resources = ({[\s\S]+?});\s+const getLocales/);
    if(!match2) {
      console.log('Failed to parse resources in', filePath);
      return;
    }
    var jsonStr = match2[1];
    var suffix = '\n\nconst getLocales';
  } else {
    var jsonStr = match[1];
    var suffix = '\n\ni18n';
  }

  // Convert to JSON
  // Since it's a JS object without strict quotes on keys sometimes, we need to carefully eval it.
  // Actually, in the file, keys are mostly double-quoted string literals. 
  let jsObj;
  try {
    eval('jsObj = ' + jsonStr);
  } catch(e) {
    console.error('Eval failed', e);
    return;
  }

  const enKeys = jsObj.en.translation;
  
  function deepMergeMissing(target, source) {
    for (let key in source) {
      if (typeof source[key] === 'object' && source[key] !== null) {
        if (!target[key]) target[key] = {};
        deepMergeMissing(target[key], source[key]);
      } else {
        if (!target[key]) {
          target[key] = source[key];
        }
      }
    }
  }

  for (let lang of ['hi', 'te', 'ta', 'kn']) {
    if (!jsObj[lang]) jsObj[lang] = { translation: {} };
    deepMergeMissing(jsObj[lang].translation, enKeys);
  }

  const newJsonStr = JSON.stringify(jsObj, null, 2)
    .replace(/"([^"]+)":/g, '"$1":') // ensure quotes are kept
    
  content = content.replace(/const resources = {[\s\S]+?};\s+(const getLocales|i18n)/, `const resources = ${newJsonStr};${suffix.startsWith('\\n\\nconst') ? '\\n\\n$1' : '\\n\\ni18n'}`);
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Successfully aligned', filePath);
}

alignI18n('d:/AgriRent_AI/web/src/lib/i18n.ts');
alignI18n('d:/AgriRent_AI/mobile/src/lib/i18n.ts');
