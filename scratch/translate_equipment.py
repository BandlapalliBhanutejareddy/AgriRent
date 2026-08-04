import re

path = r'd:\AgriRent_AI\web\src\app\dashboard\equipment\page.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

if "useTranslation" not in content:
    content = content.replace("import { useToast } from '@/components/ToastProvider';", "import { useToast } from '@/components/ToastProvider';\nimport { useTranslation } from 'react-i18next';")
    content = content.replace("export default function EquipmentManagement() {", "export default function EquipmentManagement() {\n  const { t } = useTranslation();")

replacements = {
    'Equipment Fleet': "{t('equipment_fleet', { defaultValue: 'Equipment Fleet' })}",
    'Manage listed fleet inventory, inspect deployments, and edit rates.': "{t('manage_fleet_desc', { defaultValue: 'Manage listed fleet inventory, inspect deployments, and edit rates.' })}",
    'Add Machinery': "{t('add_machinery', { defaultValue: 'Add Machinery' })}",
    '"Search fleet inventory..."': "{t('search_fleet_placeholder', { defaultValue: 'Search fleet inventory...' })}",
    'All Categories': "{t('all_categories', { defaultValue: 'All Categories' })}",
    '>Tractor<': ">{t('tractor', { defaultValue: 'Tractor' })}<",
    '>Harvester<': ">{t('harvester', { defaultValue: 'Harvester' })}<",
    '>Implement<': ">{t('implement', { defaultValue: 'Implement' })}<",
    'Per Day': "{t('per_day', { defaultValue: 'Per Day' })}",
    'Live': "{t('live', { defaultValue: 'Live' })}",
    'Hidden': "{t('hidden', { defaultValue: 'Hidden' })}",
    'Edit Fleet': "{t('edit_fleet', { defaultValue: 'Edit Fleet' })}",
    'Remove': "{t('remove', { defaultValue: 'Remove' })}"
}

for k, v in replacements.items():
    if k in content and v not in content:
        content = content.replace(k, v)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated equipment/page.tsx")
