import re

i18n_path = '../web/src/lib/i18n.ts'
with open(i18n_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_keys = {
  'marketplace_desc': 'Browse listed agricultural inventory, inspect owner testimonials, map security deposits, and request rental bookings.',
  'specifications_reviews': 'Specifications & Reviews',
  'security_deposit': 'Security Deposit',
  'distance_label': 'Distance',
  'rating_yield': 'Rating Yield',
  'verified_partner': 'Verified AgroRent Partner',
  'contact_button': 'Contact',
  'machine_description': 'Machine Description'
}

match = re.search(r'en: \{\s*translation: \{([\s\S]*?)\}\s*\}', content)
if match:
    en_content = match.group(1)
    for k, v in new_keys.items():
        if f'"{k}"' not in en_content:
            en_content += f',\n      "{k}": "{v}"'
    content = content[:match.start(1)] + en_content + content[match.end(1):]
    with open(i18n_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Appended')
