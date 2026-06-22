'use client'

/**
 * ServiceIcon - renders the Healthicons illustration for a service.
 *
 * Priority:
 *   1. provider-uploaded image (PlatformService.imageUrl)        → real picture
 *   2. explicit healthicon stored on the service (iconKey, e.g.   → chosen icon
 *      "specialties/cardiology")
 *   3. keyword match on the service name/category                → best-fit healthicon
 *   4. provider-type fallback healthicon
 *
 * Icons are the Healthicons set shipped under /public/healthicons/<category>/<id>.svg
 * (740 health-specific icons). Providers pick one of these - or upload custom - 
 * when creating a service; see HealthiconPicker.
 */

import Image from 'next/image'

const HEALTHICON_BASE = '/healthicons'
const DEFAULT_ICON = 'symbols/health'

// Keyword → healthicon path (all verified to exist in /public/healthicons).
// Order matters: specific terms before generic ones.
const KEYWORD_ICONS: [RegExp, string][] = [
  [/cardiac|heart|arrhythmia|echocardiogram|\becg\b|coronary|carotid|stress test|cardiovascular/i, 'specialties/cardiology'],
  [/asthma|copd|lung|respiratory|pulmonary|spiromet/i, 'body/lungs'],
  [/dental|tooth|teeth|crown|bridge|filling|implant|orthodont|cavit/i, 'body/tooth'],
  [/eye|vision|cataract|glaucoma|optometr|optical|lens|glasses|retina|ocular|binocular|colour vision/i, 'specialties/opthalmology'],
  [/adhd|dementia|epilep|bipolar|depress|anxiety|mental|psych|cognitive|alzheimer|\bmood\b|autism|neuro/i, 'body/neurology'],
  [/rheumat|fibromyalgia|\blupus\b/i, 'specialties/rheumatology'],
  [/arthritis|fracture|\bcast\b|joint|orthopa|\bbone\b|spine|spinal|osteo/i, 'specialties/orthopaedics'],
  [/physio|dry needling|rehab|musculoskeletal|mobility|posture/i, 'exercise/walking'],
  [/athletic|sports|\bgym\b|fitness|performance/i, 'specialties/gym'],
  [/vaccin|immuni/i, 'devices/syringe-vaccine'],
  [/injection|\bjab\b|syringe/i, 'devices/syringe'],
  [/anaemia|anemia|blood count|haemo|hemato|coagulat|blood culture/i, 'specialties/hematology'],
  [/glucose|diabet|insulin|hba1c/i, 'symbols/diabetes'],
  [/kidney|nephro|dialysis|renal/i, 'body/kidneys'],
  [/stomach|reflux|gerd|gastro|bowel|colorectal|colonoscopy|\bibs\b|appendix|gallbladder/i, 'specialties/gastroenterology'],
  [/liver|hepat|cirrhosis|fatty liver/i, 'specialties/hepatology'],
  [/cancer|oncolog|chemo|tumour|tumor|carcinoma|screening/i, 'specialties/oncology'],
  [/pharmac|medication|prescription|\brx\b|dispens|\bdrug\b|\bpill/i, 'medications/medicines'],
  [/lab |laborator|culture|panel|\bpcr\b|antigen|\bcbc\b|complete blood|specimen|assay|biopsy/i, 'devices/microscope'],
  [/ct scan|\bmri\b|x-?ray|radiolog/i, 'devices/xray'],
  [/ultrasound|\becho\b|doppler/i, 'devices/ultrasound_scanner'],
  [/ambulance|first aid|paramedic|dispatch|\btrauma\b|resus/i, 'vehicles/ambulance'],
  [/emergency/i, 'specialties/accident_and_emergency'],
  [/nutrition|\bdiet\b|dietary|food intoleran|\bweight\b|obesity/i, 'nutrition/nutrition'],
  [/childcare|arts & crafts|day ?care/i, 'people/child_cognition'],
  [/child|paediatr|pediatr|adolescent|nanny|nursery|growth & develop|vaccination/i, 'people/baby_male_0609m'],
  [/pregnan|fertility|obstetric|prenatal|antenatal/i, 'people/pregnant'],
  [/gyna|cervical|menopause|contracept|family planning/i, 'specialties/gynecology'],
  [/elder|geriatr|frailty|fall risk|dementia companion/i, 'people/elderly'],
  [/\bent\b|\bear\b|nose|throat|hearing|audiolog|sinus/i, 'specialties/ears_nose_and_throat'],
  [/skin|derma|acne|eczema|psoriasis|cosmetic|rosacea|\bmole\b/i, 'conditions/skin_cancer'],
  [/covid|infection|\bvirus\b|sepsis|\bhiv\b|hepatit|influenza|\bflu\b/i, 'symbols/virus'],
  [/allerg/i, 'conditions/allergies'],
  [/\bdna\b|genetic/i, 'body/dna'],
  [/autoimmune|thyroid|adrenal|endocrin|hormone/i, 'specialties/endocrinology'],
  [/wheelchair|disab|paraly/i, 'devices/wheelchair'],
  [/nursing|\bnurse\b|wound|bandage|catheter|dressing|compression/i, 'people/nurse'],
  // Specialty *names* (the resolver above is tuned for service names; these
  // catch the bare specialty labels used as category tiles).
  [/cardiolog|\bvascular\b/i, 'specialties/cardiology'],
  [/op?hthalmolog/i, 'specialties/opthalmology'],
  [/orthop(a)?edic|orthopaedic/i, 'specialties/orthopaedics'],
  [/pulmonolog/i, 'body/lungs'],
  [/gyn(a)?ecolog/i, 'specialties/gynecology'],
  [/urolog|bladder|prostate/i, 'body/kidneys'],
  [/haematolog|hematolog/i, 'specialties/hematology'],
  [/consult|general|follow-?up|\bgp\b|examination|appointment|check-?up|assessment|review|monitor|annual/i, 'devices/stethoscope'],
]

const PROVIDER_FALLBACK: Record<string, string> = {
  DOCTOR: 'devices/stethoscope',
  NURSE: 'people/nurse',
  NANNY: 'people/baby_male_0609m',
  PHARMACIST: 'medications/medicines',
  LAB_TECHNICIAN: 'devices/microscope',
  EMERGENCY_WORKER: 'vehicles/ambulance',
  CAREGIVER: 'people/elderly',
  PHYSIOTHERAPIST: 'exercise/walking',
  DENTIST: 'body/tooth',
  OPTOMETRIST: 'specialties/opthalmology',
  NUTRITIONIST: 'nutrition/nutrition',
}

/** Returns a healthicon path like "specialties/cardiology" (no extension). */
export function resolveServiceHealthicon(serviceName?: string | null, category?: string | null, providerType?: string | null): string {
  const hay = `${serviceName ?? ''} ${category ?? ''}`
  for (const [re, path] of KEYWORD_ICONS) {
    if (re.test(hay)) return path
  }
  return PROVIDER_FALLBACK[providerType ?? ''] ?? DEFAULT_ICON
}

export const healthiconUrl = (path: string) => `${HEALTHICON_BASE}/${path}.svg`

interface ServiceIconProps {
  serviceName?: string | null
  category?: string | null
  providerType?: string | null
  imageUrl?: string | null
  /** Explicit healthicon path chosen by the provider, e.g. "specialties/cardiology". */
  iconKey?: string | null
  size?: number
  className?: string
}

export default function ServiceIcon({
  serviceName, category, providerType, imageUrl, iconKey, size = 24, className = '',
}: ServiceIconProps) {
  // 1. Provider-uploaded image takes priority.
  if (imageUrl) {
    return (
      <span className={`relative inline-block overflow-hidden rounded ${className}`} style={{ width: size + 8, height: size + 8 }}>
        <Image src={imageUrl} alt={serviceName ?? 'Service'} fill className="object-cover" sizes={`${size + 8}px`} />
      </span>
    )
  }
  // 2. Explicit chosen healthicon, else 3/4 resolver.
  const path = (iconKey && iconKey.includes('/')) ? iconKey : resolveServiceHealthicon(serviceName, category, providerType)
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local static SVG, next/image adds no value
    <img
      src={healthiconUrl(path)}
      alt={serviceName ?? 'Service icon'}
      width={size}
      height={size}
      loading="lazy"
      className={className}
    />
  )
}
