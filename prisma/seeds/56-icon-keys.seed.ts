/**
 * Seed 56 - Icon keys for ProviderRole + PlatformService
 *
 * Strategy:
 *   - ProviderRole  → iconKey (healthicons library, confirmed working)
 *   - PlatformService → emoji ONLY (iconKey = null)
 *     Emojis render everywhere with zero CDN dependency - critical for investor demos.
 *
 * Re-runnable: safe to run multiple times (upsert-style updates).
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Provider role icon keys - all verified against @iconify-json/healthicons ──
// Validation: node -e "const d=require('@iconify-json/healthicons/icons.json'); console.log(Boolean(d.icons['KEY']))"
const ROLE_ICONS: Record<string, string> = {
  DOCTOR:            'healthicons:doctor',
  NURSE:             'healthicons:nurse',
  NANNY:             'healthicons:child-care',
  PHARMACIST:        'healthicons:pharmacy',
  LAB_TECHNICIAN:    'healthicons:biochemistry-laboratory',
  EMERGENCY_WORKER:  'healthicons:ambulance',
  CAREGIVER:         'healthicons:community-healthworker',
  PHYSIOTHERAPIST:   'healthicons:physical-therapy',
  DENTIST:           'healthicons:tooth',
  OPTOMETRIST:       'healthicons:eye',
  NUTRITIONIST:      'healthicons:nutrition',
  INSURANCE_REP:     'healthicons:stethoscope',
  CORPORATE_ADMIN:   'healthicons:city-worker',
  REGIONAL_ADMIN:    'healthicons:world-care',
  MEMBER:            'healthicons:outpatient',
};

// ─── Service emoji resolver ───────────────────────────────────────────────────
// Returns only an emoji (iconKey is intentionally null for all services).
// Emoji renders on every device/browser without a CDN call - critical for demos.
function resolveServiceEmoji(name: string, category: string, providerType: string): string {
  const t = `${name} ${category}`.toLowerCase();

  // ── Emergency (highest priority) ─────────────────────────────────────────
  if (/emergency|ambulance|urgent.care|trauma|rescue|resuscit|cpr|first.aid|cardiac.arrest|life.support/.test(t)) return '🚑';

  // ── Surgery / Procedures ─────────────────────────────────────────────────
  if (/surgery|operat|incision|laparoscop|endoscop|colposcop|procedure|theater/.test(t)) return '⚕️';
  if (/biopsy|excision|debridement/.test(t)) return '⚕️';

  // ── Imaging / Radiology ──────────────────────────────────────────────────
  if (/x.?ray|mri|ct.scan|imaging|radiolog|radiosco|echograph|sonograph|scan/.test(t)) return '🩻';
  if (/ultrasound|echocard/.test(t)) return '🩻';

  // ── Dental ───────────────────────────────────────────────────────────────
  if (/dental|teeth|tooth|oral|gum|cavity|caries|braces|orthodon|root.canal|extraction|scaling|crown|veneer|filling|implant|denture|periodont|endodont/.test(t)) return '🦷';
  if (/dental.x.?ray|dental.scan|jaw/.test(t)) return '🦷';

  // ── Eye & Vision ─────────────────────────────────────────────────────────
  if (/glasses|spectacl|contact.len|frame|eyewear/.test(t)) return '👓';
  if (/eye.exam|vision.test|ophth|retina|glaucom|cataract|optom|refraction|fundus|cornea|laser.eye|lasik|macular/.test(t)) return '👁️';
  if (/eye|vision|ocular|optic.nerve/.test(t)) return '👁️';

  // ── Cardiology / Heart ───────────────────────────────────────────────────
  if (/ecg|ekg|electrocard|holter|stress.test/.test(t)) return '🫀';
  if (/cardiac|cardio|arrhythm|heart.disease|heart.fail|cardiovas|palpitat|angina|tachycard/.test(t)) return '🫀';
  if (/blood.pressure|hypertens|bp.check|bp.monitor|hypo.tension/.test(t)) return '❤️';
  if (/cholesterol|lipid|triglycer|statin/.test(t)) return '🫀';

  // ── Respiratory / Lungs ──────────────────────────────────────────────────
  if (/lung|pulmon|respir|asthma|copd|bronch|chest.infect|spirometr|inhaler|oxygen.therapy|sleep.apnea|ventilat/.test(t)) return '🫁';

  // ── Neurology / Brain ────────────────────────────────────────────────────
  if (/neuro|brain|stroke|epilep|cereb|alzheim|parkins|dementia|migraine|vertigo|sclerosis/.test(t)) return '🧠';

  // ── Mental Health ────────────────────────────────────────────────────────
  if (/mental.health|psycholog|psychiatr|counsel|depress|anxiety|stress.manag|talk.therapy|cognitive|cbt|mindfuln|wellbeing|burnout|grief|trauma.therapy/.test(t)) return '🧘';

  // ── Musculoskeletal / Orthopaedics ───────────────────────────────────────
  if (/bone|orthop|fracture|arthrit|joint.pain|spine|scoliosis|osteoporos|ligament|tendon/.test(t)) return '🦴';
  if (/back.pain|neck.pain|shoulder.pain|hip.pain|knee.pain|ankle/.test(t)) return '🦴';

  // ── Physiotherapy / Rehabilitation ──────────────────────────────────────
  if (/massage|manual.therapy|deep.tissue|trigger.point|myofascial/.test(t)) return '🙌';
  if (/physio|rehabilitation|mobility|stretching|movement.therapy|motor.skill|gait|posture|neuromuscular/.test(t)) return '💪';
  if (/exercise.plan|workout|athletic|sport.injur|fitness.program/.test(t)) return '🏃';

  // ── Nutrition / Diet ─────────────────────────────────────────────────────
  if (/meal.plan|food.diary|calori.count|macronutr|micronutr|supplement|eating.disorder/.test(t)) return '🥗';
  if (/nutrit|diet.plan|diet.consult|weight.manag|weight.loss|obesity|bmi/.test(t)) return '🥗';

  // ── Endocrinology / Metabolic ────────────────────────────────────────────
  if (/diabetes|glucose|insulin|blood.sugar|hba1c|glycemi/.test(t)) return '🩸';
  if (/thyroid|hormone|endocrin|metabol|adrenal|pituitary/.test(t)) return '🧬';

  // ── Lab / Blood Tests ────────────────────────────────────────────────────
  if (/blood.test|blood.draw|hematol|anemia|coagul|complete.blood|cbc|haem|hemo|platelet|white.blood/.test(t)) return '🩸';
  if (/genetic|dna|genomic|pcr|sequenc/.test(t)) return '🧬';
  if (/cholesterol|lipid.panel/.test(t)) return '🩸';
  if (/urine.test|urinalysis|urol|bladder.scan/.test(t)) return '🧪';
  if (/lab.test|sample|culture|swab|pathol|microbiol|serology|stool|sputum|culture/.test(t)) return '🔬';
  if (/liver.function|hepat.test|renal.function|kidney.function|electrolyte/.test(t)) return '🔬';
  if (/microscop|test.tube|specimen/.test(t)) return '🔬';

  // ── Vaccination / Immunisation ───────────────────────────────────────────
  if (/vaccin|immuniz|booster|flu.shot|inocul|jab|shot/.test(t)) return '💉';

  // ── Injection / IV / Infusion ────────────────────────────────────────────
  if (/inject|iv.drip|infusion|catheter|cannula|venipunctur/.test(t)) return '💉';

  // ── Wound Care / Nursing Procedures ─────────────────────────────────────
  if (/wound|dressing|bandage|suture|stitch|lacerat|ulcer.care/.test(t)) return '🩹';
  if (/pressure.sore|bedsore|decubit/.test(t)) return '🩹';

  // ── Medication / Pharmacy ────────────────────────────────────────────────
  if (/prescription|dispensing|medication.delivery|drug.deliver|refill|repeat.prescription/.test(t)) return '💊';
  if (/medicat|drug|pill|tablet|capsule|pharmaceutical|otc/.test(t)) return '💊';

  // ── Skin / Dermatology ───────────────────────────────────────────────────
  if (/skin|derma|acne|rash|eczema|psoriasis|mole|wart|melanoma|hives|urticaria/.test(t)) return '🧴';

  // ── Kidney / Renal ───────────────────────────────────────────────────────
  if (/kidney|renal|dialysis|nephr/.test(t)) return '💧';
  if (/prostate|urinary.tract|uti/.test(t)) return '💧';

  // ── Gastroenterology ─────────────────────────────────────────────────────
  if (/gastro|stomach|digest|bowel|colon|intestin|acid.reflux|ibs|crohn|colitis|ulcer|hernia|hepatit|liver/.test(t)) return '🫃';

  // ── Pregnancy / Maternal Health ──────────────────────────────────────────
  if (/pregnan|obstetric|maternal|antenatal|prenatal|midwif|birth|delivery|postpartum|breastfeed|lactation/.test(t)) return '🤰';

  // ── Baby / Neonatal / Paediatrics ────────────────────────────────────────
  if (/newborn|neonat|infant|paediatric|pediatr|baby.health/.test(t)) return '👶';
  if (/child.care|childcare|babysit|nanny|child.developm|growth.monitor|child.nutri/.test(t)) return '🧸';

  // ── Elderly / Geriatrics ─────────────────────────────────────────────────
  if (/elder|geriat|senior.care|aged.care|dementia.care|palliative|end.of.life/.test(t)) return '🧓';

  // ── Ear / Nose / Throat ──────────────────────────────────────────────────
  if (/ear|hearing|ent|audiol|tinnit|sinus|throat|larynx|tonsil|rhinit|nasal/.test(t)) return '👂';

  // ── Cancer / Oncology ────────────────────────────────────────────────────
  if (/cancer|oncol|tumor|tumour|chemo|radiother|palliative.care|lymphoma|leukaemia|malignant/.test(t)) return '🎗️';

  // ── Home Visit ───────────────────────────────────────────────────────────
  if (/home.visit|house.call|domicil|home.care|home.nursing|at.home/.test(t)) return '🏠';

  // ── Video / Telemedicine ─────────────────────────────────────────────────
  if (/video.consult|teleconsult|telehealth|telemedicine|online.consult|virtual.consult|remote.consult/.test(t)) return '📹';

  // ── Monitoring / Vitals ──────────────────────────────────────────────────
  if (/vital.signs|vital.check|monitoring|observation|health.check|wellness.check/.test(t)) return '📊';
  if (/blood.oxygen|spo2|pulse.oximetr/.test(t)) return '💨';
  if (/temperature|fever|thermom/.test(t)) return '🌡️';
  if (/weight|bmi|anthropom|height.measur/.test(t)) return '⚖️';

  // ── General Consultation / Checkup ───────────────────────────────────────
  if (/general.consult|check.up|annual.physical|wellness.exam|health.screen|preventive|follow.up|review/.test(t)) return '🩺';
  if (/consult/.test(t)) return '🩺';

  // ── Caregiver / Personal Care ────────────────────────────────────────────
  if (/personal.care|daily.assist|companion|caregiv/.test(t)) return '🫶';
  if (/bathing|grooming|dressing.assist|toileting|feeding.assist/.test(t)) return '🫶';

  // ── Provider-type fallback ────────────────────────────────────────────────
  switch (providerType.toUpperCase()) {
    case 'DOCTOR':          return '🩺';
    case 'NURSE':           return '🩹';
    case 'DENTIST':         return '🦷';
    case 'OPTOMETRIST':     return '👁️';
    case 'PHYSIOTHERAPIST': return '💪';
    case 'NUTRITIONIST':    return '🥗';
    case 'PHARMACIST':      return '💊';
    case 'LAB_TECHNICIAN':  return '🔬';
    case 'EMERGENCY_WORKER': return '🚑';
    case 'CAREGIVER':       return '🫶';
    case 'NANNY':           return '🧸';
    default:                return '🩺';
  }
}

export async function seedIconKeys() {
  console.log('  → Seeding icon keys for ProviderRole...');

  const roles = await prisma.providerRole.findMany({ select: { id: true, code: true } });
  let roleCount = 0;
  for (const role of roles) {
    const iconKey = ROLE_ICONS[role.code];
    if (iconKey) {
      await prisma.providerRole.update({ where: { id: role.id }, data: { iconKey } });
      roleCount++;
    }
  }
  console.log(`     ✓ Updated ${roleCount}/${roles.length} provider roles with iconKey`);

  console.log('  → Seeding emoji illustrations for PlatformService...');

  const services = await prisma.platformService.findMany({
    select: { id: true, serviceName: true, category: true, providerType: true },
  });
  let svcCount = 0;
  for (const svc of services) {
    const emoji = resolveServiceEmoji(svc.serviceName, svc.category, svc.providerType as string);
    // iconKey = null so the emoji always renders (prevents blank iconify icons)
    await prisma.platformService.update({ where: { id: svc.id }, data: { iconKey: null, emoji } });
    svcCount++;
  }
  console.log(`     ✓ Updated ${svcCount} platform services with emoji illustrations`);
}
