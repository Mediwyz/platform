'use client'

/**
 * ServiceIcon — renders a distinct, relevant icon for each service.
 *
 * Priority:
 *   1. provider-uploaded image (svc.imageUrl)  → shown as a real picture
 *   2. keyword match on the service name/category → a specific medical react-icon
 *   3. provider-type fallback icon
 *
 * This replaces the previous emoji-only rendering so every service gets its own
 * illustrative icon, while letting providers override it with their own image at
 * service-creation time (the PlatformService.imageUrl field).
 */

import Image from 'next/image'
import type { IconType } from 'react-icons'
import {
  TbHeartbeat, TbLungs, TbDental, TbEye, TbBrain, TbBone, TbVaccine, TbPill,
  TbFlask, TbMicroscope, TbAmbulance, TbSalad, TbBabyCarriage, TbStethoscope,
  TbEar, TbDroplet, TbWheelchair, TbHome, TbVideo, TbMoodSmile, TbScan, TbVirus,
  TbNurse, TbReportMedical, TbActivityHeartbeat, TbWoman, TbBandage, TbDna,
} from 'react-icons/tb'
import { MdMedicalServices, MdBloodtype } from 'react-icons/md'

const TEAL = '#0C6780'

// Keyword → icon. First match wins, so order specific terms before generic ones.
const KEYWORD_ICONS: [RegExp, IconType][] = [
  [/cardiac|heart|arrhythmia|echocardiogram|\becg\b|coronary|carotid|stress test|cardiovascular/i, TbHeartbeat],
  [/asthma|copd|lung|respiratory|pulmonary|spiromet/i, TbLungs],
  [/dental|tooth|teeth|crown|bridge|filling|implant|orthodont|cavit/i, TbDental],
  [/eye|vision|cataract|glaucoma|optometr|optical|lens|glasses|retina|ocular|binocular|colour vision|colorblind/i, TbEye],
  [/adhd|dementia|epilep|bipolar|depress|anxiety|mental|psych|cognitive|alzheimer|mood|autism/i, TbBrain],
  [/arthritis|fracture|cast|joint|orthopa|bone|spine|spinal|osteo/i, TbBone],
  [/physio|dry needling|rehab|musculoskeletal|ergonomic|mobility|posture/i, TbActivityHeartbeat],
  [/vaccin|immuni|injection|jab/i, TbVaccine],
  [/pharmac|medication|prescription|\brx\b|dispens|drug/i, TbPill],
  [/lab |laborator|culture|panel|pcr|antigen|\bcbc\b|complete blood|specimen|assay|biopsy/i, TbFlask],
  [/screening|microscop|histolog|cytolog|pathol/i, TbMicroscope],
  [/ambulance|emergency|first aid|paramedic|dispatch|trauma|resus/i, TbAmbulance],
  [/nutrition|diet|dietary|food intoleran|weight/i, TbSalad],
  [/anaemia|anemia|blood count|haemo|hemato|coagulat|blood culture/i, MdBloodtype],
  [/glucose|diabet|insulin|hba1c/i, TbDroplet],
  [/child|paediatr|pediatr|adolescent|nanny|arts & crafts|growth & develop|nursery/i, TbBabyCarriage],
  [/elder|geriatr|frailty|fall risk|dementia companion/i, TbWheelchair],
  [/\bent\b|ear|nose|throat|hearing|audiolog|sinus/i, TbEar],
  [/skin|derma|acne|eczema|psoriasis|cosmetic|rosacea|mole/i, TbMoodSmile],
  [/ct scan|mri|x-ray|xray|ultrasound|imaging|radiolog|doppler|scan/i, TbScan],
  [/covid|infection|virus|sepsis|hiv|hepatit|influenza/i, TbVirus],
  [/fertility|contracept|pregnan|obstetric|gyna|cervical|menopause|prenatal/i, TbWoman],
  [/dna|genetic|autoimmune|allergy|lupus|thyroid|adrenal|endocrin|hormone/i, TbDna],
  [/wound|bandage|compression|catheter|suture|ulcer|dressing/i, TbBandage],
  [/home visit|home care|at home|domicile/i, TbHome],
  [/video|tele(consult|medicine|health)|online consult|remote/i, TbVideo],
  [/nursing|nurse/i, TbNurse],
  [/report|record|certificate|assessment|evaluation|review|monitor|check-?up|annual/i, TbReportMedical],
  [/consult|general|follow-?up|gp\b|examination|appointment/i, TbStethoscope],
]

const PROVIDER_FALLBACK: Record<string, IconType> = {
  DOCTOR: TbStethoscope,
  NURSE: TbNurse,
  NANNY: TbBabyCarriage,
  PHARMACIST: TbPill,
  LAB_TECHNICIAN: TbFlask,
  EMERGENCY_WORKER: TbAmbulance,
  CAREGIVER: TbHeartbeat,
  PHYSIOTHERAPIST: TbActivityHeartbeat,
  DENTIST: TbDental,
  OPTOMETRIST: TbEye,
  NUTRITIONIST: TbSalad,
}

export function resolveServiceIcon(serviceName?: string | null, category?: string | null, providerType?: string | null): IconType {
  const hay = `${serviceName ?? ''} ${category ?? ''}`
  for (const [re, Icon] of KEYWORD_ICONS) {
    if (re.test(hay)) return Icon
  }
  return PROVIDER_FALLBACK[providerType ?? ''] ?? MdMedicalServices
}

interface ServiceIconProps {
  serviceName?: string | null
  category?: string | null
  providerType?: string | null
  imageUrl?: string | null
  size?: number
  color?: string
  className?: string
}

export default function ServiceIcon({
  serviceName, category, providerType, imageUrl, size = 22, color = TEAL, className = '',
}: ServiceIconProps) {
  // 1. Provider-uploaded image takes priority.
  if (imageUrl) {
    return (
      <span className={`relative inline-block overflow-hidden ${className}`} style={{ width: size + 12, height: size + 12 }}>
        <Image src={imageUrl} alt={serviceName ?? 'Service'} fill className="object-cover" sizes={`${size + 12}px`} />
      </span>
    )
  }
  // 2 + 3. Keyword / provider-type icon.
  const Icon = resolveServiceIcon(serviceName, category, providerType)
  return <Icon size={size} color={color} className={className} aria-hidden />
}
