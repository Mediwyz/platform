/**
 * Seed 57 - Comprehensive doctor specialty services + enhanced other-role services
 *
 * Strategy:
 *   - Each doctor specialty gets 5-8 services with its verified healthicons:* iconKey
 *   - emoji = null so the Iconify SVG renders in the service card
 *   - Other provider roles get enriched service lists with verified icons
 *   - Uses upsert-by-name so re-running is safe
 *   - Existing default workflow templates from seed 34 cover all new services
 *     via cascade resolution (level 5: providerType + serviceMode default)
 *
 * Icon keys all verified against @iconify-json/healthicons
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Helper ──────────────────────────────────────────────────────────────────

async function upsertService(data: {
  serviceName: string;
  category: string;
  description: string;
  providerType: string;
  iconKey: string | null;
  emoji: string | null;
  defaultPrice: number;
  duration: number | null;
  isDefault?: boolean;
}) {
  const existing = await prisma.platformService.findFirst({
    where: { serviceName: data.serviceName, providerType: data.providerType as any },
  });
  if (existing) {
    await prisma.platformService.update({
      where: { id: existing.id },
      data: { iconKey: data.iconKey, emoji: data.emoji, category: data.category, description: data.description },
    });
  } else {
    await prisma.platformService.create({
      data: {
        serviceName: data.serviceName,
        category: data.category,
        description: data.description,
        providerType: data.providerType as any,
        iconKey: data.iconKey,
        emoji: data.emoji,
        defaultPrice: data.defaultPrice,
        currency: 'MUR',
        duration: data.duration,
        isDefault: data.isDefault ?? true,
        isActive: true,
      },
    });
  }
}

// ─── Doctor specialty service definitions ─────────────────────────────────────

const DOCTOR_SERVICES: Array<{
  category: string;
  iconKey: string | null;
  emoji: string | null;
  services: Array<{ name: string; desc: string; price: number; dur: number | null }>;
}> = [
  // ── General Practice ──────────────────────────────────────────────────────
  {
    category: 'General Practice',
    iconKey: 'healthicons:outpatient-department',
    emoji: null,
    services: [
      { name: 'General Consultation', desc: 'Standard GP consultation for common illnesses, check-ups, and referrals.', price: 800, dur: 30 },
      { name: 'Annual Health Screening', desc: 'Comprehensive annual health check with physical examination and lab referrals.', price: 3500, dur: 60 },
      { name: 'Follow-up Consultation', desc: 'Review and follow-up after initial diagnosis or treatment.', price: 600, dur: 20 },
      { name: 'Home Visit - General', desc: 'Doctor visits patient at home for general care or elderly patients.', price: 2500, dur: 60 },
      { name: 'Video Consultation - GP', desc: 'Remote video consultation for non-emergency general conditions.', price: 600, dur: 20 },
      { name: 'Sick Note & Certificate', desc: 'Medical certificate for work, school, or insurance purposes.', price: 400, dur: 15 },
    ],
  },

  // ── Cardiology ────────────────────────────────────────────────────────────
  {
    category: 'Cardiology',
    iconKey: 'healthicons:cardiology',
    emoji: null,
    services: [
      { name: 'Cardiac Consultation', desc: 'Specialist assessment for heart conditions, risk factors, and cardiovascular health.', price: 2000, dur: 45 },
      { name: 'Electrocardiogram (ECG)', desc: 'Heart rhythm recording to detect arrhythmias, infarction, and conduction disorders.', price: 800, dur: 20 },
      { name: 'Echocardiogram', desc: 'Ultrasound imaging of the heart to assess structure and function.', price: 3500, dur: 45 },
      { name: 'Holter Monitoring', desc: '24–72 hour ambulatory ECG monitoring for intermittent arrhythmias.', price: 2500, dur: 30 },
      { name: 'Cardiac Stress Test', desc: 'Exercise or pharmacological stress test to evaluate coronary artery disease.', price: 3000, dur: 60 },
      { name: 'Heart Failure Management', desc: 'Ongoing management and optimisation of heart failure therapy.', price: 1500, dur: 30 },
      { name: 'Hypertension Management', desc: 'Blood pressure review, medication adjustment, and cardiovascular risk reduction.', price: 1200, dur: 30 },
      { name: 'Arrhythmia Assessment', desc: 'Evaluation and management of irregular heart rhythms including atrial fibrillation.', price: 1800, dur: 45 },
    ],
  },

  // ── Endocrinology ─────────────────────────────────────────────────────────
  {
    category: 'Endocrinology',
    iconKey: 'healthicons:endocrinology',
    emoji: null,
    services: [
      { name: 'Endocrinology Consultation', desc: 'Specialist assessment for hormonal and metabolic disorders.', price: 2000, dur: 45 },
      { name: 'Diabetes Management', desc: 'Blood glucose optimisation, insulin review, and complication screening.', price: 1200, dur: 30 },
      { name: 'Thyroid Assessment', desc: 'Evaluation of thyroid function including hypothyroidism, hyperthyroidism, and nodules.', price: 1500, dur: 30 },
      { name: 'Hormone Panel Review', desc: 'Comprehensive hormonal assessment and treatment planning.', price: 1800, dur: 45 },
      { name: 'PCOS Management', desc: 'Polycystic ovary syndrome assessment, lifestyle advice, and treatment.', price: 1500, dur: 45 },
      { name: 'Metabolic Syndrome Management', desc: 'Integrated management of obesity, dyslipidaemia, hypertension, and insulin resistance.', price: 1500, dur: 30 },
      { name: 'Adrenal Disorder Assessment', desc: 'Evaluation of adrenal insufficiency, Cushing\'s syndrome, and phaeochromocytoma.', price: 2000, dur: 45 },
    ],
  },

  // ── Gastroenterology ──────────────────────────────────────────────────────
  {
    category: 'Gastroenterology',
    iconKey: 'healthicons:gastroenterology',
    emoji: null,
    services: [
      { name: 'Gastroenterology Consultation', desc: 'Specialist assessment for digestive system disorders.', price: 2000, dur: 45 },
      { name: 'Acid Reflux & GERD Management', desc: 'Diagnosis and treatment of gastro-oesophageal reflux and peptic ulcer disease.', price: 1200, dur: 30 },
      { name: 'IBS & Digestive Assessment', desc: 'Evaluation of irritable bowel syndrome, bloating, and chronic abdominal pain.', price: 1500, dur: 30 },
      { name: 'Liver Disease Assessment', desc: 'Hepatitis, fatty liver, and cirrhosis evaluation with LFT interpretation.', price: 2000, dur: 45 },
      { name: 'Inflammatory Bowel Disease', desc: 'Crohn\'s disease and ulcerative colitis monitoring and treatment adjustment.', price: 1800, dur: 45 },
      { name: 'H. Pylori Treatment Review', desc: 'Helicobacter pylori eradication therapy prescription and follow-up.', price: 1200, dur: 30 },
      { name: 'Colorectal Screening Consultation', desc: 'Pre-colonoscopy counselling and colorectal cancer risk assessment.', price: 1500, dur: 30 },
    ],
  },

  // ── Geriatrics ────────────────────────────────────────────────────────────
  {
    category: 'Geriatrics',
    iconKey: 'healthicons:geriatrics',
    emoji: null,
    services: [
      { name: 'Geriatric Assessment', desc: 'Comprehensive multidimensional evaluation of older adults including functional status.', price: 2500, dur: 60 },
      { name: 'Dementia Screening', desc: 'Cognitive assessment, early dementia detection, and management planning.', price: 2000, dur: 45 },
      { name: 'Fall Risk Assessment', desc: 'Balance, gait, and risk factor evaluation to prevent falls in elderly patients.', price: 1500, dur: 45 },
      { name: 'Polypharmacy Review', desc: 'Medication reconciliation and deprescribing to reduce adverse drug events.', price: 1500, dur: 45 },
      { name: 'Frailty & Rehabilitation Consultation', desc: 'Assessment and intervention plan for frailty and functional decline.', price: 2000, dur: 60 },
    ],
  },

  // ── Gynecology ────────────────────────────────────────────────────────────
  {
    category: 'Gynecology',
    iconKey: 'healthicons:gynecology',
    emoji: null,
    services: [
      { name: 'Gynecological Consultation', desc: 'Specialist women\'s health assessment and reproductive care.', price: 1800, dur: 45 },
      { name: 'Pap Smear & Cervical Screening', desc: 'Cervical cancer screening with sample collection and HPV co-test.', price: 1200, dur: 30 },
      { name: 'Prenatal Visit', desc: 'Antenatal check-up including fetal monitoring and pregnancy health review.', price: 1500, dur: 30 },
      { name: 'Menopause Management', desc: 'Hormone therapy assessment and symptom management for perimenopause.', price: 1800, dur: 45 },
      { name: 'Fertility Consultation', desc: 'Initial assessment for couples experiencing difficulty conceiving.', price: 2500, dur: 60 },
      { name: 'Contraception Consultation', desc: 'Family planning and contraception method selection advice.', price: 1200, dur: 30 },
      { name: 'PCOS & Hormonal Imbalance', desc: 'Assessment and management of polycystic ovary syndrome and hormonal disorders.', price: 1500, dur: 45 },
    ],
  },

  // ── Neurology ─────────────────────────────────────────────────────────────
  {
    category: 'Neurology',
    iconKey: 'healthicons:neurology',
    emoji: null,
    services: [
      { name: 'Neurology Consultation', desc: 'Specialist neurological assessment for brain and nervous system disorders.', price: 2200, dur: 45 },
      { name: 'Migraine Management', desc: 'Diagnosis, preventive therapy, and acute migraine treatment planning.', price: 1500, dur: 30 },
      { name: 'Epilepsy Review', desc: 'Seizure management, anti-epileptic drug review, and driving advice.', price: 1800, dur: 45 },
      { name: 'Stroke Follow-up', desc: 'Post-stroke rehabilitation planning, secondary prevention, and risk factor management.', price: 2000, dur: 45 },
      { name: 'Memory & Cognitive Assessment', desc: 'Evaluation of memory loss, cognitive decline, and early Alzheimer\'s screening.', price: 2000, dur: 60 },
      { name: 'Peripheral Neuropathy Assessment', desc: 'Diagnosis and management of numbness, tingling, and nerve damage.', price: 1800, dur: 45 },
      { name: 'Parkinson\'s Disease Management', desc: 'Medication review and symptom management for Parkinson\'s disease.', price: 2000, dur: 45 },
    ],
  },

  // ── Oncology ──────────────────────────────────────────────────────────────
  {
    category: 'Oncology',
    iconKey: 'healthicons:oncology',
    emoji: null,
    services: [
      { name: 'Oncology Consultation', desc: 'Cancer diagnosis discussion, staging, and treatment planning with a specialist.', price: 2500, dur: 60 },
      { name: 'Cancer Screening Consultation', desc: 'Risk assessment and recommended screening programme for common cancers.', price: 1500, dur: 45 },
      { name: 'Chemotherapy Monitoring', desc: 'Review of chemotherapy side effects, blood counts, and treatment tolerability.', price: 2000, dur: 45 },
      { name: 'Palliative Care Consultation', desc: 'Symptom management and quality of life planning for advanced cancer patients.', price: 2000, dur: 60 },
      { name: 'Survivorship Follow-up', desc: 'Long-term follow-up and health monitoring after cancer treatment completion.', price: 1800, dur: 45 },
    ],
  },

  // ── Ophthalmology ─────────────────────────────────────────────────────────
  {
    category: 'Ophthalmology',
    iconKey: 'healthicons:opthalmology',
    emoji: null,
    services: [
      { name: 'Ophthalmology Consultation', desc: 'Specialist eye examination by a medical doctor ophthalmologist.', price: 2000, dur: 45 },
      { name: 'Retinal Examination', desc: 'Fundus examination for diabetic retinopathy, macular degeneration, and retinal detachment.', price: 2500, dur: 30 },
      { name: 'Glaucoma Screening & Management', desc: 'Intraocular pressure assessment and optic nerve evaluation for glaucoma.', price: 2000, dur: 30 },
      { name: 'Cataract Assessment', desc: 'Lens opacity evaluation and surgical referral planning for cataract patients.', price: 2000, dur: 30 },
      { name: 'Dry Eye Management', desc: 'Assessment and treatment of dry eye syndrome and ocular surface disease.', price: 1500, dur: 30 },
    ],
  },

  // ── Orthopedics ───────────────────────────────────────────────────────────
  {
    category: 'Orthopedics',
    iconKey: 'healthicons:orthopaedics',
    emoji: null,
    services: [
      { name: 'Orthopedic Consultation', desc: 'Specialist assessment of bones, joints, muscles, and musculoskeletal system.', price: 2000, dur: 45 },
      { name: 'Joint Pain Assessment', desc: 'Diagnosis and management plan for knee, hip, shoulder, and other joint pain.', price: 1500, dur: 30 },
      { name: 'Fracture & Cast Review', desc: 'Follow-up for fractures, cast removal, and rehabilitation planning.', price: 1200, dur: 30 },
      { name: 'Spine Assessment', desc: 'Back and neck pain evaluation including disc herniation and scoliosis.', price: 2000, dur: 45 },
      { name: 'Sports Injury Evaluation', desc: 'Ligament, tendon, and cartilage injury assessment and return-to-sport planning.', price: 1800, dur: 45 },
      { name: 'Osteoporosis Management', desc: 'Bone density assessment, DEXA scan review, and anti-osteoporosis therapy.', price: 1800, dur: 45 },
      { name: 'Surgical Consultation - Orthopedics', desc: 'Pre-surgical assessment for joint replacement or orthopedic procedure.', price: 2500, dur: 60 },
    ],
  },

  // ── Pediatrics ────────────────────────────────────────────────────────────
  {
    category: 'Pediatrics',
    iconKey: 'healthicons:pediatrics',
    emoji: null,
    services: [
      { name: 'Pediatric Consultation', desc: 'Medical assessment and care for infants, children, and adolescents.', price: 1200, dur: 30 },
      { name: 'Child Vaccination', desc: 'Immunisation according to the national childhood vaccination schedule.', price: 500, dur: 20 },
      { name: 'Growth & Development Assessment', desc: 'Monitoring of weight, height, and developmental milestones in children.', price: 1000, dur: 30 },
      { name: 'Newborn Check-up', desc: 'Comprehensive neonatal examination in the first weeks after birth.', price: 1200, dur: 45 },
      { name: 'Child Nutrition Counseling', desc: 'Dietary assessment and feeding guidance for healthy child growth.', price: 1000, dur: 30 },
      { name: 'Adolescent Health Consultation', desc: 'Health assessment, mental health screening, and guidance for teenagers.', price: 1200, dur: 45 },
      { name: 'Pediatric Asthma Management', desc: 'Assessment and management of childhood asthma and respiratory conditions.', price: 1200, dur: 30 },
      { name: 'ADHD Evaluation - Pediatric', desc: 'Attention deficit assessment, diagnosis, and management plan for children.', price: 2000, dur: 60 },
    ],
  },

  // ── Psychiatry / Mental Health ────────────────────────────────────────────
  {
    category: 'Mental Health',
    iconKey: 'healthicons:mental-health',
    emoji: null,
    services: [
      { name: 'Psychiatric Assessment', desc: 'Comprehensive mental health evaluation and diagnosis by a psychiatrist.', price: 2500, dur: 60 },
      { name: 'Depression & Anxiety Treatment', desc: 'Medication management and therapy planning for depression and anxiety disorders.', price: 1800, dur: 45 },
      { name: 'ADHD Evaluation - Adult', desc: 'Adult ADHD assessment, diagnosis, and treatment initiation.', price: 2500, dur: 60 },
      { name: 'Medication Management - Psychiatry', desc: 'Psychiatric medication review, dose adjustment, and side effect monitoring.', price: 1500, dur: 30 },
      { name: 'Bipolar Disorder Management', desc: 'Mood stabiliser review and management of bipolar spectrum disorders.', price: 2000, dur: 45 },
      { name: 'Psychosis Assessment', desc: 'Evaluation and management of psychotic disorders including schizophrenia.', price: 2500, dur: 60 },
      { name: 'Stress & Burnout Consultation', desc: 'Occupational stress assessment and management strategies for burnout.', price: 1800, dur: 45 },
    ],
  },

  // ── Pulmonology ───────────────────────────────────────────────────────────
  {
    category: 'Pulmonology',
    iconKey: 'healthicons:respirology',
    emoji: null,
    services: [
      { name: 'Pulmonology Consultation', desc: 'Specialist assessment of lung and respiratory tract disorders.', price: 2000, dur: 45 },
      { name: 'Asthma Management', desc: 'Inhaler technique review, step-up/down therapy, and asthma action plan.', price: 1200, dur: 30 },
      { name: 'COPD Management', desc: 'Chronic obstructive pulmonary disease monitoring and treatment optimisation.', price: 1500, dur: 30 },
      { name: 'Spirometry Test', desc: 'Lung function testing to diagnose and grade obstructive or restrictive disorders.', price: 1000, dur: 30 },
      { name: 'Sleep Apnea Assessment', desc: 'Obstructive sleep apnea evaluation and CPAP treatment initiation.', price: 2000, dur: 45 },
      { name: 'Pneumonia Follow-up', desc: 'Post-pneumonia review including chest X-ray interpretation and recovery monitoring.', price: 1200, dur: 30 },
      { name: 'Pleural & Lung Mass Evaluation', desc: 'Assessment of pleural effusion, lung nodules, and unexplained chest findings.', price: 2500, dur: 45 },
    ],
  },

  // ── Rheumatology ──────────────────────────────────────────────────────────
  {
    category: 'Rheumatology',
    iconKey: 'healthicons:rheumatology',
    emoji: null,
    services: [
      { name: 'Rheumatology Consultation', desc: 'Specialist assessment for arthritis, connective tissue diseases, and autoimmune disorders.', price: 2000, dur: 45 },
      { name: 'Arthritis Management', desc: 'Rheumatoid arthritis, osteoarthritis, and gout diagnosis and treatment.', price: 1500, dur: 30 },
      { name: 'Autoimmune Disease Assessment', desc: 'Evaluation of lupus, vasculitis, myositis, and other systemic autoimmune conditions.', price: 2000, dur: 45 },
      { name: 'Osteoporosis Review', desc: 'Bone density assessment and anti-resorptive therapy planning.', price: 1800, dur: 45 },
      { name: 'Fibromyalgia Management', desc: 'Chronic widespread pain assessment and multimodal management plan.', price: 1500, dur: 45 },
    ],
  },

  // ── Urology ───────────────────────────────────────────────────────────────
  {
    category: 'Urology',
    iconKey: 'healthicons:urology',
    emoji: null,
    services: [
      { name: 'Urology Consultation', desc: 'Specialist assessment of urinary tract and male reproductive system disorders.', price: 2000, dur: 45 },
      { name: 'Prostate Assessment', desc: 'PSA review, digital rectal examination, and prostate cancer screening.', price: 1800, dur: 45 },
      { name: 'Kidney Stone Management', desc: 'Renal colic evaluation, stone composition analysis, and prevention plan.', price: 2000, dur: 45 },
      { name: 'Urinary Incontinence Assessment', desc: 'Evaluation of urinary leakage, overactive bladder, and pelvic floor disorders.', price: 1500, dur: 30 },
      { name: 'Erectile Dysfunction Consultation', desc: 'Medical assessment and treatment planning for erectile dysfunction.', price: 1800, dur: 45 },
      { name: 'Recurrent UTI Assessment', desc: 'Investigation and prevention strategy for recurrent urinary tract infections.', price: 1500, dur: 30 },
    ],
  },

  // ── Ear, Nose & Throat ────────────────────────────────────────────────────
  {
    category: 'ENT',
    iconKey: 'healthicons:ears-nose-and-throat',
    emoji: null,
    services: [
      { name: 'ENT Consultation', desc: 'Specialist assessment of ear, nose, and throat conditions.', price: 1800, dur: 45 },
      { name: 'Hearing Assessment', desc: 'Audiogram and hearing loss evaluation including tinnitus management.', price: 1500, dur: 30 },
      { name: 'Sinus & Allergy Treatment', desc: 'Chronic sinusitis, nasal polyps, and allergic rhinitis management.', price: 1500, dur: 30 },
      { name: 'Throat & Tonsil Evaluation', desc: 'Assessment of sore throat, tonsillitis, and tonsillectomy candidacy.', price: 1200, dur: 30 },
      { name: 'Sleep-Disordered Breathing - ENT', desc: 'Snoring and obstructive sleep apnea surgical consultation.', price: 2000, dur: 45 },
      { name: 'Voice & Larynx Assessment', desc: 'Laryngoscopy and voice disorder evaluation.', price: 2000, dur: 30 },
    ],
  },

  // ── Hepatology ────────────────────────────────────────────────────────────
  {
    category: 'Hepatology',
    iconKey: 'healthicons:hepatology',
    emoji: null,
    services: [
      { name: 'Hepatology Consultation', desc: 'Specialist liver and biliary system assessment.', price: 2000, dur: 45 },
      { name: 'Viral Hepatitis Treatment', desc: 'Hepatitis B and C antiviral therapy initiation and monitoring.', price: 2000, dur: 45 },
      { name: 'Fatty Liver Assessment', desc: 'NAFLD/NASH evaluation with LFT, fibroscan, and lifestyle counselling.', price: 1800, dur: 45 },
      { name: 'Cirrhosis Management', desc: 'Complication monitoring and disease management for liver cirrhosis.', price: 2500, dur: 60 },
    ],
  },

  // ── Nephrology ────────────────────────────────────────────────────────────
  {
    category: 'Nephrology',
    iconKey: 'healthicons:nephrology',
    emoji: null,
    services: [
      { name: 'Nephrology Consultation', desc: 'Kidney disease assessment and chronic kidney disease staging.', price: 2000, dur: 45 },
      { name: 'Chronic Kidney Disease Management', desc: 'CKD progression monitoring and renoprotective therapy optimisation.', price: 1800, dur: 45 },
      { name: 'Dialysis Monitoring', desc: 'Haemodialysis or peritoneal dialysis adequacy review and complications check.', price: 2000, dur: 45 },
      { name: 'Nephrotic Syndrome Assessment', desc: 'Proteinuria evaluation, biopsy planning, and immunosuppression management.', price: 2500, dur: 60 },
    ],
  },

  // ── Hematology ────────────────────────────────────────────────────────────
  {
    category: 'Hematology',
    iconKey: 'healthicons:hematology',
    emoji: null,
    services: [
      { name: 'Hematology Consultation', desc: 'Blood disorder assessment including anaemia, clotting, and haematological cancers.', price: 2000, dur: 45 },
      { name: 'Anaemia Assessment', desc: 'Investigation of iron, B12, folate, and haemolytic anaemias with treatment plan.', price: 1500, dur: 30 },
      { name: 'Coagulation Disorder Assessment', desc: 'Evaluation of bleeding tendencies, thrombophilia, and anticoagulation management.', price: 2000, dur: 45 },
      { name: 'Lymphoma & Blood Cancer Consultation', desc: 'Haematological malignancy staging, treatment options, and monitoring.', price: 2500, dur: 60 },
    ],
  },

  // ── Vascular Surgery ──────────────────────────────────────────────────────
  {
    category: 'Vascular Surgery',
    iconKey: 'healthicons:vascular-surgery',
    emoji: null,
    services: [
      { name: 'Vascular Consultation', desc: 'Assessment of arteries, veins, and peripheral vascular disease.', price: 2000, dur: 45 },
      { name: 'Varicose Vein Assessment', desc: 'Venous duplex ultrasound review and treatment options for varicose veins.', price: 1800, dur: 45 },
      { name: 'Peripheral Arterial Disease', desc: 'PAD assessment including ankle-brachial index and revascularisation planning.', price: 2000, dur: 45 },
      { name: 'Carotid Artery Assessment', desc: 'Carotid Doppler review for stroke prevention and surgical candidacy.', price: 2500, dur: 45 },
    ],
  },

  // ── Radiology ─────────────────────────────────────────────────────────────
  {
    category: 'Radiology',
    iconKey: 'healthicons:radiology',
    emoji: null,
    services: [
      { name: 'Radiology Consultation', desc: 'Specialist imaging interpretation and diagnostic report.', price: 1500, dur: 30 },
      { name: 'X-Ray Interpretation', desc: 'Chest, limb, or abdominal X-ray reading and clinical correlation.', price: 800, dur: 20 },
      { name: 'MRI Review Consultation', desc: 'Brain, spine, or musculoskeletal MRI interpretation with clinical recommendations.', price: 2500, dur: 30 },
      { name: 'CT Scan Review', desc: 'CT abdomen, chest, or head interpretation and follow-up plan.', price: 2500, dur: 30 },
      { name: 'Ultrasound Consultation', desc: 'Abdominal, pelvic, or vascular ultrasound review and guidance.', price: 1800, dur: 30 },
    ],
  },

  // ── General Surgery ───────────────────────────────────────────────────────
  {
    category: 'General Surgery',
    iconKey: 'healthicons:general-surgery',
    emoji: null,
    services: [
      { name: 'Surgical Consultation', desc: 'Pre-operative assessment and surgical planning for elective or urgent procedures.', price: 2000, dur: 45 },
      { name: 'Hernia Assessment', desc: 'Evaluation of inguinal, umbilical, and incisional hernias with surgical plan.', price: 1800, dur: 30 },
      { name: 'Gallbladder & Appendix Consultation', desc: 'Assessment for cholecystectomy and appendectomy candidacy.', price: 2000, dur: 45 },
      { name: 'Post-Surgery Follow-up', desc: 'Wound check, suture removal, and recovery review after surgical procedures.', price: 1200, dur: 30 },
      { name: 'Minor Procedure - Lump & Lesion', desc: 'Excision biopsy or removal of benign skin lumps and lipomas.', price: 3000, dur: 45 },
    ],
  },

  // ── Pain Management ───────────────────────────────────────────────────────
  {
    category: 'Pain Management',
    iconKey: 'healthicons:pain-managment',
    emoji: null,
    services: [
      { name: 'Pain Management Consultation', desc: 'Multidisciplinary chronic pain assessment and treatment planning.', price: 2000, dur: 45 },
      { name: 'Chronic Pain Assessment', desc: 'Evaluation of persistent pain and biopsychosocial management approach.', price: 1800, dur: 45 },
      { name: 'Nerve Block Consultation', desc: 'Pre-procedural assessment for nerve block or epidural steroid injection.', price: 2500, dur: 45 },
      { name: 'Neuropathic Pain Management', desc: 'Diagnosis and pharmacological management of neuropathic pain syndromes.', price: 1800, dur: 45 },
    ],
  },

  // ── Dermatology ───────────────────────────────────────────────────────────
  {
    category: 'Dermatology',
    iconKey: null,
    emoji: '🧴',
    services: [
      { name: 'Dermatology Consultation', desc: 'Specialist skin, hair, and nail assessment by a dermatologist.', price: 1800, dur: 45 },
      { name: 'Acne & Skin Treatment', desc: 'Diagnosis and treatment of acne vulgaris, rosacea, and seborrhoea.', price: 1500, dur: 30 },
      { name: 'Mole & Lesion Check', desc: 'Dermoscopy of pigmented lesions and skin cancer screening.', price: 1800, dur: 30 },
      { name: 'Eczema & Psoriasis Management', desc: 'Treatment of eczema, psoriasis, and chronic inflammatory skin disorders.', price: 1500, dur: 30 },
      { name: 'Skin Allergy Testing', desc: 'Patch testing for contact dermatitis and allergic skin reactions.', price: 2000, dur: 45 },
      { name: 'Hair Loss Assessment', desc: 'Trichology evaluation of alopecia and scalp disorders.', price: 1800, dur: 45 },
      { name: 'Cosmetic Dermatology Consultation', desc: 'Assessment for chemical peels, laser therapy, and anti-aging treatments.', price: 2000, dur: 45 },
    ],
  },

  // ── Sports Medicine ───────────────────────────────────────────────────────
  {
    category: 'Sports Medicine',
    iconKey: null,
    emoji: '🏃',
    services: [
      { name: 'Sports Medicine Consultation', desc: 'Musculoskeletal and sports injury assessment by a sports medicine specialist.', price: 1800, dur: 45 },
      { name: 'Athletic Performance Assessment', desc: 'Sports-specific physical evaluation and performance optimisation plan.', price: 2000, dur: 60 },
      { name: 'Return to Sport Clearance', desc: 'Medical clearance and graded return-to-play programme after injury.', price: 1500, dur: 45 },
      { name: 'Sports Nutrition Consultation - Medical', desc: 'Evidence-based nutritional strategy for athletic performance and recovery.', price: 1800, dur: 45 },
    ],
  },

  // ── Occupational Medicine ─────────────────────────────────────────────────
  {
    category: 'Occupational Medicine',
    iconKey: 'healthicons:occupational-therapy',
    emoji: null,
    services: [
      { name: 'Occupational Health Assessment', desc: 'Fitness for work evaluation and occupational health review.', price: 1500, dur: 45 },
      { name: 'Pre-Employment Medical', desc: 'Comprehensive medical examination for new employment or insurance.', price: 2000, dur: 60 },
      { name: 'Work-Related Injury Assessment', desc: 'Assessment of workplace injury and occupational disease.', price: 1800, dur: 45 },
    ],
  },

  // ── Sexual & Reproductive Health ──────────────────────────────────────────
  {
    category: 'Sexual Health',
    iconKey: null,
    emoji: '🔬',
    services: [
      { name: 'Sexual Health Consultation', desc: 'Confidential STI screening, sexual health assessment, and counselling.', price: 1500, dur: 45 },
      { name: 'STI Screening & Treatment', desc: 'Testing and treatment for sexually transmitted infections.', price: 1200, dur: 30 },
      { name: 'HIV Pre-Exposure Prophylaxis (PrEP)', desc: 'PrEP eligibility assessment, prescription, and follow-up monitoring.', price: 2000, dur: 45 },
      { name: 'Travel Medicine Consultation', desc: 'Pre-travel vaccinations, malaria prophylaxis, and health advice for travellers.', price: 1200, dur: 30 },
    ],
  },
];

// ─── Enhanced services for other provider roles ───────────────────────────────

const NURSE_EXTRA: Array<{ name: string; category: string; desc: string; price: number; dur: number | null; iconKey: string | null; emoji: string | null }> = [
  { name: 'Catheter Care', category: 'Nursing Procedures', iconKey: null, emoji: '🩹', desc: 'Urinary catheter insertion, management, and removal at home.', price: 600, dur: 30 },
  { name: 'Nasogastric Tube Management', category: 'Nursing Procedures', iconKey: null, emoji: '🩹', desc: 'NG tube insertion, feeding management, and patient education.', price: 800, dur: 45 },
  { name: 'Stoma Care', category: 'Nursing Procedures', iconKey: null, emoji: '🩹', desc: 'Colostomy, ileostomy, and urostomy care and patient education.', price: 700, dur: 45 },
  { name: 'Palliative Home Nursing', category: 'Palliative Care', iconKey: 'healthicons:community-healthworker', emoji: null, desc: 'Comfort-focused nursing care for end-of-life patients at home.', price: 1800, dur: 120 },
  { name: 'Maternal & Newborn Home Visit', category: 'Maternity', iconKey: null, emoji: '🤰', desc: 'Post-natal nursing visit for mother and newborn assessment.', price: 1200, dur: 60 },
  { name: 'Compression Bandaging', category: 'Wound Care', iconKey: null, emoji: '🩹', desc: 'Multi-layer compression bandaging for venous leg ulcers and oedema.', price: 600, dur: 45 },
  { name: 'Blood Glucose Monitoring', category: 'Chronic Disease', iconKey: 'healthicons:diabetes-measure', emoji: null, desc: 'Blood sugar testing, insulin adjustment support, and diabetes diary review.', price: 300, dur: 20 },
  { name: 'Sputum & Swab Collection', category: 'Diagnostics', iconKey: 'healthicons:bacteria', emoji: null, desc: 'Specimen collection for culture and sensitivity testing.', price: 350, dur: 20 },
];

const LAB_EXTRA: Array<{ name: string; category: string; desc: string; price: number; dur: number | null; iconKey: string | null; emoji: string | null }> = [
  { name: 'Blood Culture', category: 'Microbiology', iconKey: 'healthicons:bacteria', emoji: null, desc: 'Blood sample culture for bacteraemia and sepsis investigation.', price: 1200, dur: 15 },
  { name: 'Urine Culture & Sensitivity', category: 'Microbiology', iconKey: 'healthicons:bacteria', emoji: null, desc: 'Urine culture to identify urinary tract pathogens.', price: 800, dur: 15 },
  { name: 'STI Panel', category: 'Serology', iconKey: 'healthicons:hiv-pos', emoji: null, desc: 'Comprehensive sexually transmitted infection screening panel.', price: 2500, dur: 15 },
  { name: 'COVID-19 PCR Test', category: 'Molecular', iconKey: 'healthicons:virus', emoji: null, desc: 'Nasopharyngeal swab PCR for SARS-CoV-2 detection.', price: 1500, dur: 15 },
  { name: 'Vitamin D & B12 Panel', category: 'Clinical Chemistry', iconKey: 'healthicons:dna', emoji: null, desc: 'Vitamin D3, B12, and folate levels for nutritional assessment.', price: 1200, dur: 15 },
  { name: 'Renal Function Panel', category: 'Clinical Chemistry', iconKey: null, emoji: '🔬', desc: 'Creatinine, eGFR, urea, and electrolytes for kidney function.', price: 800, dur: 15 },
  { name: 'Hormone Panel - Female', category: 'Endocrinology', iconKey: 'healthicons:endocrinology', emoji: null, desc: 'FSH, LH, oestradiol, progesterone, and prolactin levels.', price: 2000, dur: 15 },
  { name: 'Testosterone & PSA', category: 'Endocrinology', iconKey: 'healthicons:urology', emoji: null, desc: 'Total testosterone and prostate-specific antigen for male health.', price: 1500, dur: 15 },
  { name: 'COVID-19 Rapid Antigen Test', category: 'Rapid Tests', iconKey: 'healthicons:virus', emoji: null, desc: 'Rapid antigen test with result in 15–30 minutes.', price: 500, dur: 15 },
  { name: 'Malaria Rapid Test', category: 'Rapid Tests', iconKey: 'healthicons:malaria-testing', emoji: null, desc: 'Rapid diagnostic test for Plasmodium falciparum and vivax.', price: 600, dur: 15 },
  { name: 'Home Blood Collection', category: 'Sample Collection', iconKey: 'healthicons:blood-drop', emoji: null, desc: 'Trained phlebotomist visits home for blood sample collection.', price: 400, dur: 30 },
  { name: 'INR / PT - Anticoagulation Monitoring', category: 'Hematology', iconKey: 'healthicons:blood-cells', emoji: null, desc: 'Prothrombin time and INR for warfarin dose management.', price: 500, dur: 15 },
];

const PHYSIO_EXTRA: Array<{ name: string; category: string; desc: string; price: number; dur: number | null; iconKey: string | null; emoji: string | null }> = [
  { name: 'Manual Therapy Session', category: 'Manual Therapy', iconKey: null, emoji: '🙌', desc: 'Hands-on joint mobilisation and manipulation for pain relief.', price: 1000, dur: 45 },
  { name: 'Dry Needling Session', category: 'Dry Needling', iconKey: null, emoji: '💉', desc: 'Intramuscular stimulation targeting trigger points for myofascial pain.', price: 1200, dur: 45 },
  { name: 'Hydrotherapy Session', category: 'Hydrotherapy', iconKey: null, emoji: '🏊', desc: 'Water-based physiotherapy exercises for joint pain and rehabilitation.', price: 1200, dur: 45 },
  { name: 'Neurological Rehabilitation', category: 'Neurological', iconKey: 'healthicons:neurology', emoji: null, desc: 'Physiotherapy for stroke, Parkinson\'s, and neurological conditions.', price: 1200, dur: 60 },
  { name: 'Pelvic Floor Rehabilitation', category: 'Pelvic Health', iconKey: null, emoji: '🧘', desc: 'Assessment and treatment of pelvic floor dysfunction and incontinence.', price: 1500, dur: 45 },
  { name: 'Paediatric Physiotherapy', category: 'Pediatric', iconKey: 'healthicons:pediatrics', emoji: null, desc: 'Age-appropriate physiotherapy for developmental delays and paediatric conditions.', price: 1200, dur: 45 },
  { name: 'Ergonomic Assessment - Home/Office', category: 'Ergonomics', iconKey: null, emoji: '🪑', desc: 'Workstation assessment and ergonomic advice to prevent musculoskeletal injuries.', price: 2000, dur: 60 },
];

const DENTIST_EXTRA: Array<{ name: string; category: string; desc: string; price: number; dur: number | null; iconKey: string | null; emoji: string | null }> = [
  { name: 'Emergency Dental Appointment', category: 'Emergency', iconKey: null, emoji: '🚑', desc: 'Urgent dental care for acute toothache, broken tooth, or dental trauma.', price: 1500, dur: 30 },
  { name: 'Orthodontic Consultation', category: 'Orthodontics', iconKey: 'healthicons:tooth', emoji: null, desc: 'Braces or aligner assessment, treatment planning, and cost estimate.', price: 1500, dur: 45 },
  { name: 'Gum Disease Treatment (Periodontology)', category: 'Periodontics', iconKey: 'healthicons:tooth', emoji: null, desc: 'Deep cleaning, scaling, and root planing for periodontal disease.', price: 2500, dur: 60 },
  { name: 'Crown & Bridge Consultation', category: 'Prosthodontics', iconKey: 'healthicons:tooth', emoji: null, desc: 'Assessment for dental crowns, bridges, and fixed prosthetics.', price: 2000, dur: 45 },
  { name: 'Dental Implant Consultation', category: 'Implantology', iconKey: 'healthicons:tooth', emoji: null, desc: 'Implant candidacy assessment including bone density and surgical planning.', price: 2000, dur: 60 },
  { name: 'Night Guard & Bruxism Treatment', category: 'Oral Health', iconKey: 'healthicons:dental-hygiene', emoji: null, desc: 'Custom night guard fabrication for teeth grinding and jaw pain.', price: 2500, dur: 30 },
  { name: 'Paediatric Dentistry', category: 'Paediatric Dentistry', iconKey: null, emoji: '🦷', desc: 'Child-friendly dental check-up, fissure sealants, and fluoride treatment.', price: 800, dur: 30 },
];

const OPTOMETRIST_EXTRA: Array<{ name: string; category: string; desc: string; price: number; dur: number | null; iconKey: string | null; emoji: string | null }> = [
  { name: 'Low Vision Assessment', category: 'Low Vision', iconKey: 'healthicons:eye', emoji: null, desc: 'Functional vision assessment and magnification aids for visually impaired patients.', price: 1800, dur: 45 },
  { name: 'Colour Vision Test', category: 'Vision Testing', iconKey: 'healthicons:eye', emoji: null, desc: 'Colour vision deficiency screening using Ishihara plates.', price: 600, dur: 15 },
  { name: 'Myopia Control Consultation', category: 'Paediatric Eye Care', iconKey: null, emoji: '👓', desc: 'Assessment and management of progressive myopia in children.', price: 1500, dur: 45 },
  { name: 'Digital Eye Strain Assessment', category: 'Occupational Eye Care', iconKey: 'healthicons:eye', emoji: null, desc: 'Evaluation and management of computer vision syndrome.', price: 1200, dur: 30 },
  { name: 'Binocular Vision Assessment', category: 'Binocular Vision', iconKey: 'healthicons:eye', emoji: null, desc: 'Evaluation of eye teaming, focusing, and tracking disorders.', price: 1500, dur: 45 },
];

const NUTRITIONIST_EXTRA: Array<{ name: string; category: string; desc: string; price: number; dur: number | null; iconKey: string | null; emoji: string | null }> = [
  { name: 'Prenatal Nutrition Plan', category: 'Maternity Nutrition', iconKey: null, emoji: '🤰', desc: 'Personalised nutrition counselling and supplementation plan for pregnant women.', price: 1500, dur: 45 },
  { name: 'Paediatric Nutrition Assessment', category: 'Paediatric Nutrition', iconKey: 'healthicons:pediatrics', emoji: null, desc: 'Nutritional assessment and feeding plan for infants and children.', price: 1500, dur: 45 },
  { name: 'Renal Diet Consultation', category: 'Clinical Nutrition', iconKey: 'healthicons:nephrology', emoji: null, desc: 'Low-potassium, low-phosphate meal plan for chronic kidney disease patients.', price: 1500, dur: 45 },
  { name: 'Cardiac Diet Counselling', category: 'Clinical Nutrition', iconKey: 'healthicons:cardiology', emoji: null, desc: 'Heart-healthy diet plan for cardiovascular disease and dyslipidaemia.', price: 1500, dur: 45 },
  { name: 'Food Intolerance Assessment', category: 'Allergy & Intolerance', iconKey: null, emoji: '🥗', desc: 'Elimination diet guidance and food intolerance management.', price: 1800, dur: 45 },
  { name: 'Weight Management Programme', category: 'Weight Management', iconKey: 'healthicons:nutrition', emoji: null, desc: 'Structured 12-week personalised weight management plan.', price: 3000, dur: 60 },
];

// ─── Main seed function ───────────────────────────────────────────────────────

export async function seedDoctorSpecialtyServices() {
  let created = 0;
  let updated = 0;

  // ── Doctor specialty services ────────────────────────────────────────────
  console.log('  → Seeding doctor specialty services...');
  for (const specialty of DOCTOR_SERVICES) {
    for (const svc of specialty.services) {
      const existing = await prisma.platformService.findFirst({
        where: { serviceName: svc.name, providerType: 'DOCTOR' },
      });
      if (existing) {
        await prisma.platformService.update({
          where: { id: existing.id },
          data: {
            iconKey: specialty.iconKey,
            emoji: specialty.emoji,
            category: specialty.category,
            description: svc.desc,
          },
        });
        updated++;
      } else {
        await prisma.platformService.create({
          data: {
            serviceName: svc.name,
            category: specialty.category,
            description: svc.desc,
            providerType: 'DOCTOR' as any,
            iconKey: specialty.iconKey,
            emoji: specialty.emoji,
            defaultPrice: svc.price,
            currency: 'MUR',
            duration: svc.dur,
            isDefault: true,
            isActive: true,
          },
        });
        created++;
      }
    }
  }
  console.log(`     ✓ Doctor specialty services: ${created} created, ${updated} updated`);

  // ── Nurse extra services ─────────────────────────────────────────────────
  console.log('  → Seeding nurse extra services...');
  let n = 0;
  for (const svc of NURSE_EXTRA) {
    const ex = await prisma.platformService.findFirst({ where: { serviceName: svc.name, providerType: 'NURSE' } });
    if (!ex) {
      await prisma.platformService.create({ data: { serviceName: svc.name, category: svc.category, description: svc.desc, providerType: 'NURSE' as any, iconKey: svc.iconKey, emoji: svc.emoji, defaultPrice: svc.price, currency: 'MUR', duration: svc.dur, isDefault: true, isActive: true } });
      n++;
    } else {
      await prisma.platformService.update({ where: { id: ex.id }, data: { iconKey: svc.iconKey, emoji: svc.emoji } });
    }
  }
  console.log(`     ✓ Nurse: ${n} new services`);

  // ── Lab extra services ───────────────────────────────────────────────────
  console.log('  → Seeding lab technician extra services...');
  let l = 0;
  for (const svc of LAB_EXTRA) {
    const ex = await prisma.platformService.findFirst({ where: { serviceName: svc.name, providerType: 'LAB_TECHNICIAN' } });
    if (!ex) {
      await prisma.platformService.create({ data: { serviceName: svc.name, category: svc.category, description: svc.desc, providerType: 'LAB_TECHNICIAN' as any, iconKey: svc.iconKey, emoji: svc.emoji, defaultPrice: svc.price, currency: 'MUR', duration: svc.dur, isDefault: true, isActive: true } });
      l++;
    } else {
      await prisma.platformService.update({ where: { id: ex.id }, data: { iconKey: svc.iconKey, emoji: svc.emoji } });
    }
  }
  console.log(`     ✓ Lab Technician: ${l} new services`);

  // ── Physiotherapist extra services ───────────────────────────────────────
  console.log('  → Seeding physiotherapist extra services...');
  let p = 0;
  for (const svc of PHYSIO_EXTRA) {
    const ex = await prisma.platformService.findFirst({ where: { serviceName: svc.name, providerType: 'PHYSIOTHERAPIST' } });
    if (!ex) {
      await prisma.platformService.create({ data: { serviceName: svc.name, category: svc.category, description: svc.desc, providerType: 'PHYSIOTHERAPIST' as any, iconKey: svc.iconKey, emoji: svc.emoji, defaultPrice: svc.price, currency: 'MUR', duration: svc.dur, isDefault: true, isActive: true } });
      p++;
    } else {
      await prisma.platformService.update({ where: { id: ex.id }, data: { iconKey: svc.iconKey, emoji: svc.emoji } });
    }
  }
  console.log(`     ✓ Physiotherapist: ${p} new services`);

  // ── Dentist extra services ───────────────────────────────────────────────
  console.log('  → Seeding dentist extra services...');
  let d = 0;
  for (const svc of DENTIST_EXTRA) {
    const ex = await prisma.platformService.findFirst({ where: { serviceName: svc.name, providerType: 'DENTIST' } });
    if (!ex) {
      await prisma.platformService.create({ data: { serviceName: svc.name, category: svc.category, description: svc.desc, providerType: 'DENTIST' as any, iconKey: svc.iconKey, emoji: svc.emoji, defaultPrice: svc.price, currency: 'MUR', duration: svc.dur, isDefault: true, isActive: true } });
      d++;
    } else {
      await prisma.platformService.update({ where: { id: ex.id }, data: { iconKey: svc.iconKey, emoji: svc.emoji } });
    }
  }
  console.log(`     ✓ Dentist: ${d} new services`);

  // ── Optometrist extra services ───────────────────────────────────────────
  console.log('  → Seeding optometrist extra services...');
  let o = 0;
  for (const svc of OPTOMETRIST_EXTRA) {
    const ex = await prisma.platformService.findFirst({ where: { serviceName: svc.name, providerType: 'OPTOMETRIST' } });
    if (!ex) {
      await prisma.platformService.create({ data: { serviceName: svc.name, category: svc.category, description: svc.desc, providerType: 'OPTOMETRIST' as any, iconKey: svc.iconKey, emoji: svc.emoji, defaultPrice: svc.price, currency: 'MUR', duration: svc.dur, isDefault: true, isActive: true } });
      o++;
    } else {
      await prisma.platformService.update({ where: { id: ex.id }, data: { iconKey: svc.iconKey, emoji: svc.emoji } });
    }
  }
  console.log(`     ✓ Optometrist: ${o} new services`);

  // ── Nutritionist extra services ──────────────────────────────────────────
  console.log('  → Seeding nutritionist extra services...');
  let nu = 0;
  for (const svc of NUTRITIONIST_EXTRA) {
    const ex = await prisma.platformService.findFirst({ where: { serviceName: svc.name, providerType: 'NUTRITIONIST' } });
    if (!ex) {
      await prisma.platformService.create({ data: { serviceName: svc.name, category: svc.category, description: svc.desc, providerType: 'NUTRITIONIST' as any, iconKey: svc.iconKey, emoji: svc.emoji, defaultPrice: svc.price, currency: 'MUR', duration: svc.dur, isDefault: true, isActive: true } });
      nu++;
    } else {
      await prisma.platformService.update({ where: { id: ex.id }, data: { iconKey: svc.iconKey, emoji: svc.emoji } });
    }
  }
  console.log(`     ✓ Nutritionist: ${nu} new services`);

  console.log(`\n  ✅ Seed 57 complete: ${created} doctor services created, ${updated} updated`);
}
