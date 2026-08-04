const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');

const project = new Project();

// Add all TSX files
const filePatterns = [
  'd:/AgriRent_AI/web/src/app/**/*.tsx',
  'd:/AgriRent_AI/web/src/components/**/*.tsx',
  'd:/AgriRent_AI/mobile/app/**/*.tsx',
  'd:/AgriRent_AI/mobile/src/components/**/*.tsx'
];

project.addSourceFilesAtPaths(filePatterns);

const dicts = { en: {} };

// Generate unique key
function generateKey(text) {
  return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').substring(0, 40).replace(/^_|_$/g, '');
}

async function processProject() {
  const sourceFiles = project.getSourceFiles();
  console.log(`Processing ${sourceFiles.length} files...`);

  let newKeysCount = 0;

  for (const file of sourceFiles) {
    let modified = false;
    
    // Check if useTranslation is needed
    const jsxTexts = file.getDescendantsOfKind(SyntaxKind.JsxText);
    const jsxAttributes = file.getDescendantsOfKind(SyntaxKind.JsxAttribute);
    
    for (const textNode of jsxTexts) {
      const text = textNode.getText().trim();
      if (text && /[a-zA-Z]/.test(text) && text.length > 1 && !text.includes('{') && !text.includes('}')) {
        const key = generateKey(text);
        if (!dicts.en[key]) dicts.en[key] = text;
        
        textNode.replaceWithText(`{t('${key}')}`);
        modified = true;
        newKeysCount++;
      }
    }

    for (const attr of jsxAttributes) {
      if (attr.getKind() !== SyntaxKind.JsxAttribute) continue;
      
      const nameNode = attr.getNameNode();
      if (!nameNode) continue;
      const name = nameNode.getText();

      if (name === 'placeholder' || name === 'title' || name === 'description' || name === 'label') {
        const init = attr.getInitializer();
        if (init && init.getKind() === SyntaxKind.StringLiteral) {
          const text = init.getLiteralValue().trim();
          if (text && /[a-zA-Z]/.test(text) && !text.includes('{') && !text.includes('}')) {
            const key = generateKey(text);
            if (!dicts.en[key]) dicts.en[key] = text;
            
            // For attributes, we inject JS expression {t('...')}
            attr.setInitializer(`{t('${key}')}`);
            modified = true;
            newKeysCount++;
          }
        }
      }
    }

    if (modified) {
      // Add useTranslation import if not present
      const imports = file.getImportDeclarations();
      const hasI18n = imports.some(i => i.getModuleSpecifierValue() === 'react-i18next');
      if (!hasI18n) {
        file.addImportDeclaration({
          namedImports: ['useTranslation'],
          moduleSpecifier: 'react-i18next'
        });
      }

      // Add const { t } = useTranslation(); to default export function
      const defaultExport = file.getExportedDeclarations().get('default');
      if (defaultExport && defaultExport.length > 0) {
        const comp = defaultExport[0];
        if (comp.getKind() === SyntaxKind.FunctionDeclaration) {
          const func = comp;
          const body = func.getBody();
          if (body && body.getKind() === SyntaxKind.Block) {
            const bodyText = body.getText();
            if (!bodyText.includes('useTranslation()') && !bodyText.includes('useTranslation (')) {
               func.insertStatements(0, 'const { t } = useTranslation();');
            }
          }
        }
      }
    }
  }

  project.saveSync();
  console.log(`Updated files. Extracted ${newKeysCount} strings.`);
  fs.writeFileSync('extracted_keys.json', JSON.stringify(dicts.en, null, 2));
}

processProject().catch(console.error);
