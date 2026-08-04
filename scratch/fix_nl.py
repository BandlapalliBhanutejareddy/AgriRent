import re

def fix_newlines(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We must not remove newlines outside of quotes!
    # A simple way: find all `"..."` and replace newlines inside them with space
    def repl(m):
        return m.group(0).replace('\n', ' ').replace('\r', '')
        
    content = re.sub(r'"([^"\\]|\\.)*"', repl, content)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
        
fix_newlines('d:/AgriRent_AI/web/src/lib/i18n.ts')
fix_newlines('d:/AgriRent_AI/mobile/src/lib/i18n.ts')
