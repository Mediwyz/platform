#!/usr/bin/env python
"""Source realistic, commercially-licensed product photos from Openverse (CC/PD).
Downloads up to 3 candidates per product into staging/_new/<name>__<k>.jpg.
Pick the best later; replace files in public/images/products/items keeping names."""
import os, json, time, urllib.parse, urllib.request, io
from PIL import Image

OUT = r"C:\Github Repositories\platform\scripts\_prodimg"
os.makedirs(OUT, exist_ok=True)
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"

# filename (no ext) -> Openverse query (precise per product)
Q = {
  "adult-diapers-pack": "adult diaper", "adult-incontinence-pads": "incontinence pads",
  "amlodipine-5mg": "medicine tablets blister", "amoxicillin-250mg": "amoxicillin capsules",
  "antacid-tablets": "antacid tablets", "antibacterial-mouthwash": "mouthwash bottle",
  "anti-blue-light-glasses": "blue light glasses", "ashwagandha-root-extract-500mg": "ashwagandha supplement",
  "atorvastatin-10mg": "pills tablets bottle", "atorvastatin-20mg": "medicine pills",
  "baby-monitor": "baby monitor", "baby-shampoo": "baby shampoo",
  "baby-sunscreen-spf50": "baby sunscreen", "baby-thermometer": "baby thermometer",
  "baby-wipes-pack": "baby wipes", "b-complex-vitamins": "vitamin b complex supplement",
  "bed-rail": "hospital bed rail", "blood-glucose-strips": "blood glucose test strips",
  "blood-glucose-test-strips": "glucose test strips", "blood-pressure-monitor": "blood pressure monitor",
  "blue-light-blocking-glasses": "computer glasses", "calcium-vitamin-d": "calcium tablets",
  "cetirizine-10mg": "antihistamine tablets blister", "children": "children medicine syrup",
  "chlorhexidine-mouthwash-0-2": "mouthwash", "ciprofloxacin-500mg": "antibiotic tablets",
  "collagen-peptides": "protein powder scoop", "collagen-powder": "protein powder",
  "compression-bandage": "compression bandage", "contact-lens-solution": "contact lens solution",
  "cough-syrup": "cough syrup bottle", "creatine-monohydrate": "creatine supplement",
  "daily-contact-lenses": "contact lenses box", "dental-floss-pack": "dental floss",
  "dental-floss-set": "dental floss container", "dental-mirror": "dental tools",
  "dental-night-guard": "dental night guard", "diaper-cream": "skin cream tube",
  "digital-blood-pressure-monitor": "digital blood pressure monitor", "digital-thermometer": "digital thermometer",
  "electric-toothbrush": "electric toothbrush", "emergency-blanket": "emergency foil blanket",
  "exercise-ball-65cm": "exercise ball", "eye-drops": "eye drops bottle",
  "eye-vitamin-formula": "eye health supplement", "fiber-supplement": "dietary supplement powder",
  "first-aid-kit": "first aid kit", "fluoride-mouthwash": "mouthwash bottle",
  "foam-roller": "foam roller", "foam-roller-deep-tissue": "foam roller exercise",
  "glucose-meter-kit": "glucose meter", "hand-sanitizer-500ml": "hand sanitizer bottle",
  "home-test-kit-covid": "covid rapid test kit", "hot-cold-pack": "hot cold gel pack",
  "hyaluronic-acid-moisturiser": "face cream jar", "ibuprofen-400mg": "ibuprofen tablets",
  "ice-heat-pack": "gel pack", "infant-cpr-safety": "infant cpr training",
  "iron-supplement-65mg": "iron supplement tablets", "kids-fluoride-treatment": "toothpaste",
  "knee-support-brace": "knee brace support", "lens-cleaning-kit": "eyeglasses cleaning",
  "levothyroxine-50mcg": "thyroid tablets", "lisinopril-10mg": "medicine tablets",
  "loperamide-2mg": "pills capsules", "losartan-50mg": "medicine pills bottle",
  "magnesium-400mg": "magnesium supplement", "massage-ball": "massage ball therapy",
  "meal-plan-guide": "healthy meal plan", "meal-replacement-shake": "protein shake",
  "metformin-500mg": "white tablets pills", "multivitamin-complex": "multivitamin bottle",
  "n95-face-masks": "n95 respirator masks", "neck-brace": "neck brace",
  "niacinamide-10-face-serum": "serum dropper bottle", "non-slip-socks": "socks",
  "omega-3-fish-oil": "fish oil omega 3 capsules", "omeprazole-20mg": "omeprazole capsules",
  "oral-rehydration-salts": "electrolyte sachet", "orthodontic-retainer": "orthodontic retainer",
  "orthodontic-wax": "dental wax", "paracetamol-500mg": "paracetamol tablets",
  "pill-organizer": "pill box organizer", "posture-corrector": "back brace",
  "prednisone-5mg": "steroid tablets", "pregnancy-test-kit": "pregnancy test kit",
  "prescription-sunglasses": "sunglasses", "probiotic-50b-cfu": "probiotic supplement capsules",
  "probiotic-capsules": "supplement capsules", "progressive-reading-glasses": "reading glasses",
  "protein-powder": "protein powder", "protein-supplement": "whey protein supplement",
  "pulse-oximeter": "pulse oximeter", "reading-glasses-1-5": "reading glasses",
  "reading-glasses-2-0": "reading eyeglasses", "resistance-band-set": "resistance bands",
  "resistance-bands-set": "exercise resistance bands", "salbutamol-inhaler-100mcg": "asthma inhaler",
  "sensitive-toothpaste": "toothpaste tube", "sertraline-50mg": "antidepressant tablets",
  "spf-50-sunscreen-gel": "sunscreen bottle", "stethoscope": "stethoscope",
  "surgical-gloves-box": "disposable gloves box", "teeth-whitening-kit": "teeth whitening kit",
  "tens-machine": "physiotherapy device", "tens-unit": "electrotherapy device",
  "triphala-churna": "herbal powder", "urine-test-strips": "test strips",
  "vitamin-c-1000mg": "vitamin c tablets", "vitamin-d3-1000iu": "vitamin d supplement",
  "vitamin-d3-drops": "vitamin d drops", "walking-aid": "walking frame zimmer",
  "warfarin-5mg": "medicine tablets", "weight-management-shake": "diet shake powder",
  "wheelchair-cushion": "wheelchair cushion", "whey-protein-isolate-vanilla": "whey protein tub",
  "wound-dressing-kit": "wound dressing bandage", "wrist-splint": "wrist brace splint",
  "zinc-50mg": "vitamin tablets",
}

def fetch_urls(query, n=8):
    url = "https://api.openverse.org/v1/images/?" + urllib.parse.urlencode(
        {"q": query, "license_type": "commercial", "page_size": n})
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            data = json.load(r)
        return [x.get("url") for x in data.get("results", []) if x.get("url")]
    except Exception as e:
        return []

def dl_image(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=30) as r:
            buf = r.read()
        im = Image.open(io.BytesIO(buf)).convert("RGB")
        w, h = im.size
        if w < 240 or h < 200:  # skip tiny
            return None
        ar = w / h
        if ar < 0.35 or ar > 3.0:  # skip extreme aspect (banners/strips)
            return None
        return im
    except Exception:
        return None

names = sorted(Q.keys())
print(f"sourcing {len(names)} products...")
done = 0
for i, name in enumerate(names):
    # skip if we already have 2 candidates (resume support)
    have = [f for f in os.listdir(OUT) if f.startswith(name + "__")]
    if len(have) >= 2:
        done += 1; continue
    urls = fetch_urls(Q[name])
    saved = 0
    for u in urls:
        im = dl_image(u)
        if im is None:
            continue
        im.thumbnail((900, 900), Image.LANCZOS)
        im.save(os.path.join(OUT, f"{name}__{saved}.jpg"), quality=82)
        saved += 1
        if saved >= 3:
            break
    if saved:
        done += 1
    print(f"[{i+1}/{len(names)}] {name}: {saved} candidates")
    time.sleep(0.3)
print(f"DONE · {done}/{len(names)} products have candidates")
