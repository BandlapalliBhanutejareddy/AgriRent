import os
import re

FILES = [
    'd:/AgriRent_AI/web/src/app/dashboard/profile/page.tsx',
    'd:/AgriRent_AI/web/src/app/dashboard/marketplace/page.tsx',
    'd:/AgriRent_AI/web/src/app/login/page.tsx',
    'd:/AgriRent_AI/web/src/app/dashboard/equipment/page.tsx',
    'd:/AgriRent_AI/web/src/app/dashboard/notifications/page.tsx'
]

def add_translation_import(content):
    if "useTranslation" not in content:
        content = re.sub(r"(import .*?;)", r"\1\nimport { useTranslation } from 'react-i18next';", content, count=1)
    if "const { t } = useTranslation();" not in content:
        # Find the main component function
        content = re.sub(r"(export default function \w+\(.*?\)\s*\{)", r"\1\n  const { t } = useTranslation();", content, count=1)
    return content

REPLACEMENTS = {
    # Profile
    ">Account Overview<": ">{t('account_overview', { defaultValue: 'Account Overview' })}<",
    ">REGISTERED AS<": ">{t('registered_as', { defaultValue: 'REGISTERED AS' })}<",
    ">PHONE NUMBER<": ">{t('phone_number_label', { defaultValue: 'PHONE NUMBER' })}<",
    ">LOCATION REFERENCE<": ">{t('location_reference', { defaultValue: 'LOCATION REFERENCE' })}<",
    ">Verified Account<": ">{t('verified_account', { defaultValue: 'Verified Account' })}<",
    "Your account details have been successfully synchronized with the backend system directory.": "{t('account_synced_desc', { defaultValue: 'Your account details have been successfully synchronized with the backend system directory.' })}",
    "● Active Status": "● {t('active_status', { defaultValue: 'Active Status' })}",
    ">Personal Information<": ">{t('personal_information', { defaultValue: 'Personal Information' })}<",
    ">Full Name<": ">{t('full_name', { defaultValue: 'Full Name' })}<",
    "placeholder=\"Enter your full name\"": "placeholder={t('enter_full_name', { defaultValue: 'Enter your full name' })}",
    ">Linked Email Address<": ">{t('linked_email', { defaultValue: 'Linked Email Address' })}<",
    "placeholder=\"Enter email address\"": "placeholder={t('enter_email', { defaultValue: 'Enter email address' })}",
    ">Farming Region / Base<": ">{t('farming_region', { defaultValue: 'Farming Region / Base' })}<",
    "placeholder=\"District, State\"": "placeholder={t('district_state', { defaultValue: 'District, State' })}",
    ">Farmer Specific Details<": ">{t('farmer_specific_details', { defaultValue: 'Farmer Specific Details' })}<",
    ">Primary Cultivation Focus<": ">{t('primary_cultivation_focus', { defaultValue: 'Primary Cultivation Focus' })}<",
    ">Fleet Logistics Details<": ">{t('fleet_logistics_details', { defaultValue: 'Fleet Logistics Details' })}<",
    ">Current Target Fleet Size<": ">{t('target_fleet_size', { defaultValue: 'Current Target Fleet Size' })}<",
    ">Administrative Cleared Parameters<": ">{t('admin_cleared_params', { defaultValue: 'Administrative Cleared Parameters' })}<",
    ">MFA Encryption Protected<": ">{t('mfa_protected', { defaultValue: 'MFA Encryption Protected' })}<",
    ">Auto logging auditing is fully verified.<": ">{t('mfa_desc', { defaultValue: 'Auto logging auditing is fully verified.' })}<",
    ">Cleared Level 1<": ">{t('cleared_level_1', { defaultValue: 'Cleared Level 1' })}<",
    ">Notifications & Theme Settings<": ">{t('notifications_theme_settings', { defaultValue: 'Notifications & Theme Settings' })}<",
    ">SMS Booking Alerts<": ">{t('sms_booking_alerts', { defaultValue: 'SMS Booking Alerts' })}<",
    ">Send real-time sms alerts.<": ">{t('sms_desc', { defaultValue: 'Send real-time sms alerts.' })}<",
    ">Global Dark Theme<": ">{t('global_dark_theme', { defaultValue: 'Global Dark Theme' })}<",
    ">Activate full dark mode.<": ">{t('dark_mode_desc', { defaultValue: 'Activate full dark mode.' })}<",
    "> Save Settings<": "> {t('save_settings', { defaultValue: 'Save Settings' })}<",
    
    # Marketplace
    "placeholder=\"Find tractors, harvesters...\"": "placeholder={t('search_equipment_placeholder', { defaultValue: 'Find tractors, harvesters...' })}",
    "title=\"Voice Search\"": "title={t('voice_search', { defaultValue: 'Voice Search' })}",
    ">No Equipment Matches<": ">{t('no_equipment_matches', { defaultValue: 'No Equipment Matches' })}<",
    ">Try broadening your keyword queries, resetting tractor categories, or adjusting crop preferences.<": ">{t('try_broadening_search', { defaultValue: 'Try broadening your keyword queries, resetting tractor categories, or adjusting crop preferences.' })}<",
    ">Reset Filters<": ">{t('reset_filters', { defaultValue: 'Reset Filters' })}<",
    ">Available<": ">{t('available', { defaultValue: 'Available' })}<",
    ">Booked<": ">{t('booked', { defaultValue: 'Booked' })}<",
    " Reviews)<": " {t('reviews', { defaultValue: 'Reviews' })})<",
    " km away<": " {t('km_away', { defaultValue: 'km away' })}<",
    ">No description listed by the owner.<": ">{t('no_description', { defaultValue: 'No description listed by the owner.' })}<",
    " per day<": " {t('per_day', { defaultValue: 'per day' })}<",
    ">Inspect Specifications & Reviews<": ">{t('inspect_specs', { defaultValue: 'Inspect Specifications & Reviews' })}<",
    
    # Login
    ">Verify Your Account<": ">{t('verify_your_account', { defaultValue: 'Verify Your Account' })}<",
    ">Recover Password<": ">{t('recover_password', { defaultValue: 'Recover Password' })}<",
    ">Password Reset Successful!<": ">{t('password_reset_successful', { defaultValue: 'Password Reset Successful!' })}<",
    "Loading AgroRent AI...": "{t('loading_agrorent', { defaultValue: 'Loading AgroRent AI...' })}"
}

def run():
    for filepath in FILES:
        if not os.path.exists(filepath):
            continue
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original_content = content
        
        # Add translation imports if we're replacing something
        for k, v in REPLACEMENTS.items():
            if k in content:
                content = content.replace(k, v)
                
        if content != original_content:
            content = add_translation_import(content)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Translated: {filepath}")

run()
