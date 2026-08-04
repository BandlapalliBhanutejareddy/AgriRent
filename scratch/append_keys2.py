import re

i18n_path = '../web/src/lib/i18n.ts'
with open(i18n_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_keys = {
  'tractor': 'Tractor',
  'harvester': 'Harvester',
  'cultivator': 'Cultivator',
  'rotavator': 'Rotavator',
  'sprayer': 'Sprayer',
  'thresher': 'Thresher',
  'seed drill': 'Seed Drill',
  'power tiller': 'Power Tiller',
  'rice transplanter': 'Rice Transplanter',
  'implement': 'Implement',
  'seeder': 'Seeder',
  'irrigation': 'Irrigation',
  'available': 'AVAILABLE',
  'booked': 'BOOKED',
  'per_day': 'per day',
  'reviews': 'Reviews',
  'km_away': 'km away',
  'inspect_specs': 'INSPECT SPECIFICATIONS & REVIEWS'
}

match = re.search(r'en: \{\s*translation: \{([\s\S]*?)\}\s*\}', content)
if match:
    en_content = match.group(1)
    for k, v in new_keys.items():
        if f'"{k}"' not in en_content and f"'{k}'" not in en_content:
            en_content += f',\n      "{k}": "{v}"'
    content = content[:match.start(1)] + en_content + content[match.end(1):]
    with open(i18n_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Appended')
