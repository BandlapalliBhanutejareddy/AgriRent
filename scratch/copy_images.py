import os
import glob
import shutil

brain_dir = r"C:\Users\bhanu\.gemini\antigravity\brain\efcc14fc-773d-4f4c-92b6-a168e798c28a"
web_dest = r"d:\AgriRent_AI\web\public\equipment"
mob_dest = r"d:\AgriRent_AI\mobile\assets\equipment"

os.makedirs(web_dest, exist_ok=True)
os.makedirs(mob_dest, exist_ok=True)

patterns = {
    'tractor': 'tractor*.png',
    'rotavator': 'rotavator*.png',
    'cultivator': 'cultivator*.png',
    'sprayer': 'sprayer*.png',
    'thresher': 'thresher*.png',
    'seed-drill': 'seed_drill*.png',
    'power-tiller': 'power_tiller*.png',
    'rice-transplanter': 'rice_transplanter*.png',
    'default': 'default*.png'
}

for name, pattern in patterns.items():
    files = glob.glob(os.path.join(brain_dir, pattern))
    if files:
        # Get latest
        latest_file = max(files, key=os.path.getctime)
        print(f"Copying {latest_file} -> {name}.jpg")
        shutil.copy(latest_file, os.path.join(web_dest, f"{name}.jpg"))
        shutil.copy(latest_file, os.path.join(mob_dest, f"{name}.jpg"))
