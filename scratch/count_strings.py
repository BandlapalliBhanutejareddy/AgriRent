import os
import re

directories = ['d:/AgriRent_AI/web/src', 'd:/AgriRent_AI/mobile/src', 'd:/AgriRent_AI/mobile/app']

pattern_jsx_text = re.compile(r'>\s*([A-Za-z][^<{}]+?)\s*<')
pattern_placeholder = re.compile(r'placeholder="([^"]+)"')
pattern_title = re.compile(r'title="([^"]+)"')
pattern_toast = re.compile(r'showToast\([\'"]([^\'"]+)[\'"]')

total_strings = 0
files_with_strings = 0

for d in directories:
    for root, dirs, files in os.walk(d):
        for f in files:
            if f.endswith(('.tsx', '.ts', '.jsx', '.js')):
                path = os.path.join(root, f)
                with open(path, 'r', encoding='utf-8') as file:
                    content = file.read()
                    
                    matches = []
                    matches.extend(pattern_jsx_text.findall(content))
                    matches.extend(pattern_placeholder.findall(content))
                    matches.extend(pattern_title.findall(content))
                    matches.extend(pattern_toast.findall(content))
                    
                    # Filter out matches that are just whitespace or symbols
                    valid_matches = [m for m in matches if any(c.isalpha() for c in m)]
                    
                    if valid_matches:
                        total_strings += len(valid_matches)
                        files_with_strings += 1

print(f"Found approximately {total_strings} hardcoded strings in {files_with_strings} files.")
