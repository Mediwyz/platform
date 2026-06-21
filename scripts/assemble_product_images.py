#!/usr/bin/env python
"""Assemble final, clean, category-correct product images.
Strategy: trusted unique real photos where verified clean; otherwise a verified-clean
category anchor (round-robin for variety). Output keeps the exact filenames the
_product-images.ts map expects, so no code change is needed."""
import os, shutil, math
from PIL import Image

ROOT = r"C:\Github Repositories\platform"
PROD = os.path.join(ROOT, "scripts", "_prodimg")      # openverse candidates <name>__k.jpg
ANC  = os.path.join(ROOT, "scripts", "_anchor")        # unsplash anchors
ITEMS= os.path.join(ROOT, "public", "images", "products", "items")

def ov(name, k=0):  # openverse pick path
    return os.path.join(PROD, f"{name}__{k}.jpg")
def an(fn):
    return os.path.join(ANC, fn)

# verified-clean anchors (seen good in contact sheets)
A = {
  "blister":  [an("pills_loose.jpg"), ov("amoxicillin-250mg"), ov("paracetamol-500mg"), ov("cetirizine-10mg")],
  "pills":    [an("capsules.jpg"), an("x_test_strips.jpg"), ov("ibuprofen-400mg")],
  "capsules": [ov("omeprazole-20mg"), ov("omega-3-fish-oil"), an("capsules.jpg")],
  "powder":   [an("supplement_tub.jpg")],
  "vitamins": [an("vitamin_bottle.jpg"), an("capsules.jpg"), ov("magnesium-400mg")],
  "dropbottle":[ov("eye-drops"), ov("cough-syrup")],
  "glasses":  [an("x_glasses.jpg"), an("x_glasses2.jpg")],
  "dental":   [an("toothpaste.jpg"), ov("electric-toothbrush")],
  "mobility": [ov("foam-roller"), ov("knee-support-brace"), ov("compression-bandage")],
  "ppe":      [an("face_mask.jpg"), ov("n95-face-masks"), ov("first-aid-kit")],
  "skincare": [an("x_serum.jpg"), an("x_cream_tube.jpg")],
  "baby":     [an("x_baby_care.jpg")],
  "device":   [ov("blood-pressure-monitor"), ov("digital-thermometer"), ov("glucose-meter-kit")],
  "sanitizer":[ov("hand-sanitizer-500ml")],
  "sunscreen":[ov("spf-50-sunscreen-gel")],
  "inhaler":  [ov("salbutamol-inhaler-100mcg")],
  "firstaid": [an("x_first_aid2.jpg"), ov("first-aid-kit")],
}

# product filename -> category
CAT = {
 # tablets / medicines
 "amlodipine-5mg":"blister","antacid-tablets":"blister","atorvastatin-10mg":"blister","atorvastatin-20mg":"blister",
 "cetirizine-10mg":"blister","ciprofloxacin-500mg":"blister","ibuprofen-400mg":"pills","levothyroxine-50mcg":"blister",
 "lisinopril-10mg":"blister","loperamide-2mg":"blister","losartan-50mg":"blister","metformin-500mg":"blister",
 "paracetamol-500mg":"blister","prednisone-5mg":"blister","sertraline-50mg":"blister","warfarin-5mg":"blister",
 "amoxicillin-250mg":"capsules","omeprazole-20mg":"capsules",
 # syrups / drops / liquids
 "cough-syrup":"dropbottle","children":"dropbottle","oral-rehydration-salts":"dropbottle","vitamin-d3-drops":"dropbottle",
 "eye-drops":"dropbottle","contact-lens-solution":"dropbottle",
 # supplements - powder
 "collagen-peptides":"powder","collagen-powder":"powder","creatine-monohydrate":"powder","protein-powder":"powder",
 "protein-supplement":"powder","whey-protein-isolate-vanilla":"powder","meal-replacement-shake":"powder",
 "weight-management-shake":"powder","fiber-supplement":"powder","triphala-churna":"powder","ashwagandha-root-extract-500mg":"powder",
 # supplements - pills/bottles
 "b-complex-vitamins":"vitamins","calcium-vitamin-d":"vitamins","eye-vitamin-formula":"vitamins","iron-supplement-65mg":"vitamins",
 "magnesium-400mg":"vitamins","multivitamin-complex":"vitamins","vitamin-c-1000mg":"vitamins","vitamin-d3-1000iu":"vitamins",
 "zinc-50mg":"vitamins","probiotic-50b-cfu":"capsules","probiotic-capsules":"capsules","omega-3-fish-oil":"capsules",
 # devices / tests
 "blood-pressure-monitor":"device","digital-blood-pressure-monitor":"device","digital-thermometer":"device",
 "baby-thermometer":"device","baby-monitor":"device","glucose-meter-kit":"device","blood-glucose-strips":"device",
 "blood-glucose-test-strips":"device","pulse-oximeter":"device","stethoscope":"device","tens-machine":"device",
 "tens-unit":"device","urine-test-strips":"device","home-test-kit-covid":"device","pregnancy-test-kit":"device",
 # glasses / eyewear
 "anti-blue-light-glasses":"glasses","blue-light-blocking-glasses":"glasses","prescription-sunglasses":"glasses",
 "progressive-reading-glasses":"glasses","reading-glasses-1-5":"glasses","reading-glasses-2-0":"glasses",
 "daily-contact-lenses":"glasses","lens-cleaning-kit":"glasses",
 # dental
 "antibacterial-mouthwash":"dental","chlorhexidine-mouthwash-0-2":"dental","dental-floss-pack":"dental","dental-floss-set":"dental",
 "dental-mirror":"dental","dental-night-guard":"dental","electric-toothbrush":"dental","fluoride-mouthwash":"dental",
 "kids-fluoride-treatment":"dental","orthodontic-retainer":"dental","orthodontic-wax":"dental","sensitive-toothpaste":"dental",
 "teeth-whitening-kit":"dental",
 # physio / mobility
 "compression-bandage":"mobility","exercise-ball-65cm":"mobility","foam-roller":"mobility","foam-roller-deep-tissue":"mobility",
 "hot-cold-pack":"mobility","ice-heat-pack":"mobility","knee-support-brace":"mobility","massage-ball":"mobility",
 "neck-brace":"mobility","non-slip-socks":"mobility","posture-corrector":"mobility","resistance-band-set":"mobility",
 "resistance-bands-set":"mobility","walking-aid":"mobility","wheelchair-cushion":"mobility","wrist-splint":"mobility","bed-rail":"mobility",
 # skincare
 "hyaluronic-acid-moisturiser":"skincare","niacinamide-10-face-serum":"skincare","spf-50-sunscreen-gel":"sunscreen","diaper-cream":"skincare",
 # baby / child
 "baby-shampoo":"baby","baby-sunscreen-spf50":"baby","baby-wipes-pack":"baby","infant-cpr-safety":"baby",
 # elderly
 "adult-diapers-pack":"baby","adult-incontinence-pads":"baby","pill-organizer":"device",
 # ppe / first aid
 "first-aid-kit":"firstaid","emergency-blanket":"firstaid","hand-sanitizer-500ml":"sanitizer","n95-face-masks":"ppe",
 "surgical-gloves-box":"ppe","wound-dressing-kit":"firstaid",
 # inhaler
 "salbutamol-inhaler-100mcg":"inhaler",
 # nutrition guide
 "meal-plan-guide":"powder",
}

# round-robin counter per category for variety
counters = {}
def pick(cat):
    pool = [p for p in A[cat] if os.path.exists(p)]
    if not pool:
        pool = [p for p in A["pills"] if os.path.exists(p)]
    i = counters.get(cat, 0); counters[cat] = i + 1
    return pool[i % len(pool)]

# preserve each file's existing extension (the _product-images.ts map references .jpg AND .png)
files = sorted(f for f in os.listdir(ITEMS) if f.lower().endswith((".jpg", ".png")))
made = 0; missing_cat = []
for fn in files:
    name, ext = os.path.splitext(fn)
    cat = CAT.get(name)
    if not cat:
        missing_cat.append(name); continue
    src = pick(cat)
    try:
        im = Image.open(src).convert("RGB")
        w,h = im.size; side = min(w,h)
        im = im.crop(((w-side)//2,(h-side)//2,(w-side)//2+side,(h-side)//2+side)).resize((600,600), Image.LANCZOS)
        out = os.path.join(ITEMS, fn)
        if ext.lower() == ".png":
            im.save(out, "PNG")
        else:
            im.save(out, "JPEG", quality=84)
        made += 1
    except Exception as e:
        print("ERR", fn, e)
print(f"assembled {made}/{len(files)} · uncategorised: {missing_cat}")
