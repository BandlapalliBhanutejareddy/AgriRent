import re
import json

farmer_page_path = r'd:\AgriRent_AI\web\src\app\dashboard\farmer\page.tsx'
with open(farmer_page_path, 'r', encoding='utf-8') as f:
    content = f.read()

if "useTranslation" not in content:
    content = content.replace("import { useStore } from '@/store/useStore';", "import { useStore } from '@/store/useStore';\nimport { useTranslation } from 'react-i18next';")
    content = content.replace("export default function FarmerDashboard() {", "export default function FarmerDashboard() {\n  const { t } = useTranslation();")

replacements = [
    ("Farmer Suite", "{t('farmer_suite', { defaultValue: 'Farmer Suite' })}"),
    ("Good Morning,", "{t('good_morning', { defaultValue: 'Good Morning,' })}"),
    ("|| 'Farmer'", "|| t('farmer', { defaultValue: 'Farmer' })"),
    ("Browse state-of-the-art agricultural machinery, consult your AI Farm Advisor, and track scheduled rentals.", "{t('farmer_hero_desc', { defaultValue: 'Browse state-of-the-art agricultural machinery, consult your AI Farm Advisor, and track scheduled rentals.' })}"),
    ("Find Machinery", "{t('find_machinery', { defaultValue: 'Find Machinery' })}"),
    ("Weather Insight", "{t('weather_insight', { defaultValue: 'Weather Insight' })}"),
    ("Mostly Sunny", "{t('mostly_sunny', { defaultValue: 'Mostly Sunny' })}"),
    ("Excellent weather window for harvesting Kharif crops. Avoid sowing until humidity levels stabilize next week.", "{t('weather_advice', { defaultValue: 'Excellent weather window for harvesting Kharif crops. Avoid sowing until humidity levels stabilize next week.' })}"),
    ("AI Farm Advisor Recommendations", "{t('ai_recommendations_title', { defaultValue: 'AI Farm Advisor Recommendations' })}"),
    ("Ideal for rapid paddy harvesting based on local forecast.", "{t('rec_reason_1', { defaultValue: 'Ideal for rapid paddy harvesting based on local forecast.' })}"),
    ("Saves water usage up to 35% during rice transplantation.", "{t('rec_reason_2', { defaultValue: 'Saves water usage up to 35% during rice transplantation.' })}"),
    ("Locate nearby", "{t('locate_nearby', { defaultValue: 'Locate nearby' })}"),
    ("Consult Full AI Advisor", "{t('consult_full_ai', { defaultValue: 'Consult Full AI Advisor' })}"),
    ("Spending Trends (Actual)", "{t('spending_trends', { defaultValue: 'Spending Trends (Actual)' })}"),
    ("No Spending Data Yet", "{t('no_spending_data', { defaultValue: 'No Spending Data Yet' })}"),
    ("Active Rentals", "{t('active_rentals', { defaultValue: 'Active Rentals' })}"),
    ("● Deployed", "● {t('deployed', { defaultValue: 'Deployed' })}"),
    ("Pending Requests", "{t('pending_requests', { defaultValue: 'Pending Requests' })}"),
    ("● Waiting", "● {t('waiting', { defaultValue: 'Waiting' })}"),
    ("Rental History", "{t('rental_history', { defaultValue: 'Rental History' })}"),
    (">Track and manage your orders<", ">{t('track_orders', { defaultValue: 'Track and manage your orders' })}<"),
    (">Machinery<", ">{t('machinery', { defaultValue: 'Machinery' })}<"),
    (">Owner Detail<", ">{t('owner_detail', { defaultValue: 'Owner Detail' })}<"),
    (">Active Dates<", ">{t('active_dates', { defaultValue: 'Active Dates' })}<"),
    (">Pricing<", ">{t('pricing', { defaultValue: 'Pricing' })}<"),
    (">Status<", ">{t('status', { defaultValue: 'Status' })}<"),
    (">Actions<", ">{t('actions', { defaultValue: 'Actions' })}<"),
    ("No Rentals Scheduled", "{t('no_rentals', { defaultValue: 'No Rentals Scheduled' })}"),
    ("You haven't requested any machinery rentals yet. Connect with verified fleet owners to lease top-tier machinery.", "{t('no_rentals_desc', { defaultValue: 'You haven\\'t requested any machinery rentals yet. Connect with verified fleet owners to lease top-tier machinery.' })}"),
    (">Explore Marketplace<", ">{t('explore_marketplace', { defaultValue: 'Explore Marketplace' })}<"),
    (">Cancel<", ">{t('cancel', { defaultValue: 'Cancel' })}<"),
]

for old, new in replacements:
    content = content.replace(old, new)

with open(farmer_page_path, 'w', encoding='utf-8') as f:
    f.write(content)

# Now update the i18n file with ACTUAL translations
translations = {
  "en": {
    "farmer_suite": "Farmer Suite",
    "good_morning": "Good Morning,",
    "farmer": "Farmer",
    "farmer_hero_desc": "Browse state-of-the-art agricultural machinery, consult your AI Farm Advisor, and track scheduled rentals.",
    "find_machinery": "Find Machinery",
    "weather_insight": "Weather Insight",
    "mostly_sunny": "Mostly Sunny",
    "weather_advice": "Excellent weather window for harvesting Kharif crops. Avoid sowing until humidity levels stabilize next week.",
    "ai_recommendations_title": "AI Farm Advisor Recommendations",
    "rec_reason_1": "Ideal for rapid paddy harvesting based on local forecast.",
    "rec_reason_2": "Saves water usage up to 35% during rice transplantation.",
    "locate_nearby": "Locate nearby",
    "consult_full_ai": "Consult Full AI Advisor",
    "spending_trends": "Spending Trends (Actual)",
    "no_spending_data": "No Spending Data Yet",
    "active_rentals": "Active Rentals",
    "deployed": "Deployed",
    "pending_requests": "Pending Requests",
    "waiting": "Waiting",
    "rental_history": "Rental History",
    "track_orders": "Track and manage your orders",
    "machinery": "Machinery",
    "owner_detail": "Owner Detail",
    "active_dates": "Active Dates",
    "pricing": "Pricing",
    "status": "Status",
    "actions": "Actions",
    "no_rentals": "No Rentals Scheduled",
    "no_rentals_desc": "You haven't requested any machinery rentals yet. Connect with verified fleet owners to lease top-tier machinery.",
    "explore_marketplace": "Explore Marketplace",
    "cancel": "Cancel",
    "equipment_fleet": "Equipment Fleet",
    "manage_fleet_desc": "Manage listed fleet inventory, inspect deployments, and edit rates."
  },
  "te": {
    "farmer_suite": "రైతు సూట్",
    "good_morning": "శుభోదయం,",
    "farmer": "రైతు",
    "farmer_hero_desc": "అత్యాధునిక వ్యవసాయ యంత్రాలను బ్రౌజ్ చేయండి, మీ AI ఫార్మ్ అడ్వైజర్‌ను సంప్రదించండి మరియు షెడ్యూల్ చేసిన అద్దెలను ట్రాక్ చేయండి.",
    "find_machinery": "యంత్రాలను కనుగొనండి",
    "weather_insight": "వాతావరణ సమాచారం",
    "mostly_sunny": "ఎక్కువగా ఎండ",
    "weather_advice": "ఖరీఫ్ పంటల కోతకు అద్భుతమైన వాతావరణం. వచ్చే వారం తేమ స్థాయిలు స్థిరపడే వరకు విత్తడం మానుకోండి.",
    "ai_recommendations_title": "AI ఫార్మ్ అడ్వైజర్ సిఫార్సులు",
    "rec_reason_1": "స్థానిక సూచన ఆధారంగా వేగంగా వరి కోతకు అనువైనది.",
    "rec_reason_2": "వరి నాట్లు వేసేటప్పుడు 35% వరకు నీటి వినియోగాన్ని ఆదా చేస్తుంది.",
    "locate_nearby": "సమీపంలో గుర్తించండి",
    "consult_full_ai": "పూర్తి AI అడ్వైజర్‌ను సంప్రదించండి",
    "spending_trends": "ఖర్చు ట్రెండ్‌లు (వాస్తవమైనవి)",
    "no_spending_data": "ఖర్చు డేటా లేదు",
    "active_rentals": "యాక్టివ్ అద్దెలు",
    "deployed": "మోహరించబడింది",
    "pending_requests": "పెండింగ్ అభ్యర్థనలు",
    "waiting": "వేచి ఉంది",
    "rental_history": "అద్దె చరిత్ర",
    "track_orders": "మీ ఆర్డర్‌లను ట్రాక్ చేయండి",
    "machinery": "యంత్రాలు",
    "owner_detail": "యజమాని వివరాలు",
    "active_dates": "యాక్టివ్ తేదీలు",
    "pricing": "ధరలు",
    "status": "స్థితి",
    "actions": "చర్యలు",
    "no_rentals": "అద్దెలు షెడ్యూల్ చేయబడలేదు",
    "no_rentals_desc": "మీరు ఇంకా ఎలాంటి అద్దెలు అభ్యర్థించలేదు.",
    "explore_marketplace": "మార్కెట్‌ప్లేస్‌ను అన్వేషించండి",
    "cancel": "రద్దు చేయండి",
    "equipment_fleet": "పరికరాల సముదాయం",
    "manage_fleet_desc": "జాబితా చేయబడిన ఫ్లీట్ ఇన్వెంటరీని నిర్వహించండి, డిప్లాయ్‌మెంట్‌లను తనిఖీ చేయండి మరియు రేట్లను సవరించండి."
  },
  "hi": {
    "farmer_suite": "किसान सुइट",
    "good_morning": "सुप्रभात,",
    "farmer": "किसान",
    "farmer_hero_desc": "अत्याधुनिक कृषि मशीनरी ब्राउज़ करें, अपने AI फार्म सलाहकार से परामर्श लें और निर्धारित किराए को ट्रैक करें।",
    "find_machinery": "मशीनरी खोजें",
    "weather_insight": "मौसम की जानकारी",
    "mostly_sunny": "ज़्यादातर धूप",
    "weather_advice": "खरीफ फसलों की कटाई के लिए बेहतरीन मौसम। अगले सप्ताह नमी स्थिर होने तक बुवाई से बचें।",
    "ai_recommendations_title": "AI फार्म सलाहकार की सिफारिशें",
    "rec_reason_1": "स्थानीय पूर्वानुमान के आधार पर धान की तेजी से कटाई के लिए आदर्श।",
    "rec_reason_2": "चावल की रोपाई के दौरान 35% तक पानी बचाता है।",
    "locate_nearby": "आस-पास खोजें",
    "consult_full_ai": "पूर्ण AI सलाहकार से परामर्श लें",
    "spending_trends": "खर्च के रुझान",
    "no_spending_data": "अभी तक कोई खर्च डेटा नहीं",
    "active_rentals": "सक्रिय किराये",
    "deployed": "तैनात",
    "pending_requests": "लंबित अनुरोध",
    "waiting": "प्रतीक्षा में",
    "rental_history": "किराये का इतिहास",
    "track_orders": "अपने ऑर्डर ट्रैक करें",
    "machinery": "मशीनरी",
    "owner_detail": "मालिक विवरण",
    "active_dates": "सक्रिय तिथियां",
    "pricing": "मूल्य निर्धारण",
    "status": "स्थिति",
    "actions": "कार्रवाई",
    "no_rentals": "कोई किराये का कार्यक्रम नहीं",
    "no_rentals_desc": "आपने अभी तक किसी मशीनरी किराये का अनुरोध नहीं किया है।",
    "explore_marketplace": "मार्केटप्लेस देखें",
    "cancel": "रद्द करें",
    "equipment_fleet": "उपकरण बेड़ा",
    "manage_fleet_desc": "सूचीबद्ध बेड़े की सूची प्रबंधित करें, तैनाती का निरीक्षण करें और दरों को संपादित करें।"
  }
}

i18n_path = r'd:\AgriRent_AI\web\src\lib\i18n.ts'
with open(i18n_path, 'r', encoding='utf-8') as f:
    i18n_content = f.read()

import re

for lang in ["en", "te", "hi"]:
    # Find the translation object for the language
    pattern = r'(' + lang + r':\s*\{\s*translation:\s*\{)([\s\S]*?)(\}\s*\})'
    match = re.search(pattern, i18n_content)
    if match:
        existing_keys = match.group(2)
        added_str = ""
        for k, v in translations[lang].items():
            if f'"{k}"' not in existing_keys and f"'{k}'" not in existing_keys:
                added_str += f',\n      "{k}": "{v}"'
        
        # Inject the new keys
        new_translation_block = match.group(1) + existing_keys + added_str + match.group(3)
        i18n_content = i18n_content.replace(match.group(0), new_translation_block)

with open(i18n_path, 'w', encoding='utf-8') as f:
    f.write(i18n_content)

print("Translated Farmer Dashboard UI and populated real translations into dictionaries.")
