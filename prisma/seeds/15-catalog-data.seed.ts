import { PrismaClient } from '@prisma/client'

export async function seedCatalogData(prisma: PrismaClient) {
  console.log('Seeding catalog data...')

  // ── Doctor Service Catalog ────────────────────────────────────────────────

  const doctorServices = [
    // Dr. DOC001 - GP (DPROF001)
    { doctorId: 'DPROF001', serviceName: 'General Consultation', category: 'Consultation', description: 'Standard GP consultation for common illnesses, check-ups, and referrals.', price: 800, duration: 30 },
    { doctorId: 'DPROF001', serviceName: 'Video Consultation', category: 'Consultation', description: 'Remote video consultation for non-emergency conditions.', price: 600, duration: 20 },
    { doctorId: 'DPROF001', serviceName: 'Annual Health Screening', category: 'Screening', description: 'Comprehensive annual health check with lab work and physical exam.', price: 3500, duration: 60 },
    { doctorId: 'DPROF001', serviceName: 'Travel Medicine Consultation', category: 'Consultation', description: 'Pre-travel health advice, vaccinations, and prophylaxis prescriptions.', price: 1200, duration: 30 },
    { doctorId: 'DPROF001', serviceName: 'Chronic Disease Management', category: 'Consultation', description: 'Follow-up consultations for diabetes, hypertension, and other chronic conditions.', price: 700, duration: 30 },
    // Dr. DOC002 - Specialist (DPROF002)
    { doctorId: 'DPROF002', serviceName: 'Cardiology Consultation', category: 'Specialist Consultation', description: 'Specialist heart and cardiovascular assessment.', price: 2000, duration: 45 },
    { doctorId: 'DPROF002', serviceName: 'ECG Interpretation', category: 'Procedure', description: 'Electrocardiogram reading and interpretation.', price: 1500, duration: 30 },
    { doctorId: 'DPROF002', serviceName: 'Stress Test', category: 'Screening', description: 'Cardiac stress test to evaluate heart function during exercise.', price: 4000, duration: 60 },
    { doctorId: 'DPROF002', serviceName: 'Echocardiogram', category: 'Procedure', description: 'Ultrasound imaging of the heart structure and function.', price: 5000, duration: 45 },
    // Dr. DOC003 - Specialist (DPROF003)
    { doctorId: 'DPROF003', serviceName: 'Dermatology Consultation', category: 'Specialist Consultation', description: 'Skin, hair, and nail condition assessment and treatment.', price: 1800, duration: 30 },
    { doctorId: 'DPROF003', serviceName: 'Skin Biopsy', category: 'Procedure', description: 'Minor skin biopsy for diagnostic purposes.', price: 3000, duration: 30 },
    { doctorId: 'DPROF003', serviceName: 'Cryotherapy', category: 'Procedure', description: 'Liquid nitrogen treatment for warts, skin tags, and lesions.', price: 2000, duration: 20 },
  ]

  for (const svc of doctorServices) {
    await prisma.doctorServiceCatalog.create({ data: svc })
  }
  console.log(`  Seeded ${doctorServices.length} doctor service catalog entries`)

  // ── Pharmacy Medicines ──────────────────────────────────────────────────────

  const medicines = [
    // PillPal Pharmacy (PHPROF001)
    { pharmacistId: 'PHPROF001', name: 'Paracetamol 500mg', genericName: 'Acetaminophen', category: 'Pain Relief', description: 'Effective pain reliever and fever reducer for mild to moderate pain.', dosageForm: 'Tablet', strength: '500mg', price: 45, quantity: 200, inStock: true, requiresPrescription: false, sideEffects: ['Nausea', 'Liver damage (overdose)'] },
    { pharmacistId: 'PHPROF001', name: 'Amoxicillin 250mg', genericName: 'Amoxicillin', category: 'Antibiotics', description: 'Broad-spectrum antibiotic for bacterial infections.', dosageForm: 'Capsule', strength: '250mg', price: 120, quantity: 150, inStock: true, requiresPrescription: true, sideEffects: ['Diarrhea', 'Nausea', 'Rash'] },
    { pharmacistId: 'PHPROF001', name: 'Omeprazole 20mg', genericName: 'Omeprazole', category: 'Digestive Health', description: 'Proton pump inhibitor for acid reflux and stomach ulcers.', dosageForm: 'Capsule', strength: '20mg', price: 85, quantity: 100, inStock: true, requiresPrescription: false, sideEffects: ['Headache', 'Nausea', 'Abdominal pain'] },
    { pharmacistId: 'PHPROF001', name: 'Metformin 500mg', genericName: 'Metformin HCl', category: 'Diabetes', description: 'First-line medication for type 2 diabetes management.', dosageForm: 'Tablet', strength: '500mg', price: 95, quantity: 180, inStock: true, requiresPrescription: true, sideEffects: ['Nausea', 'Diarrhea', 'Abdominal discomfort'] },
    { pharmacistId: 'PHPROF001', name: 'Cetirizine 10mg', genericName: 'Cetirizine HCl', category: 'Allergy', description: 'Non-drowsy antihistamine for allergy relief.', dosageForm: 'Tablet', strength: '10mg', price: 55, quantity: 250, inStock: true, requiresPrescription: false, sideEffects: ['Drowsiness', 'Dry mouth'] },
    { pharmacistId: 'PHPROF001', name: 'Ibuprofen 400mg', genericName: 'Ibuprofen', category: 'Pain Relief', description: 'Anti-inflammatory pain reliever for headaches, muscle pain, and arthritis.', dosageForm: 'Tablet', strength: '400mg', price: 60, quantity: 300, inStock: true, requiresPrescription: false, sideEffects: ['Stomach irritation', 'Nausea', 'Dizziness'] },
    // HealthyHippo Pharmacy (PHPROF002)
    { pharmacistId: 'PHPROF002', name: 'Salbutamol Inhaler', genericName: 'Salbutamol', category: 'Respiratory', description: 'Fast-acting bronchodilator for asthma and COPD relief.', dosageForm: 'Inhaler', strength: '100mcg/dose', price: 250, quantity: 80, inStock: true, requiresPrescription: true, sideEffects: ['Tremor', 'Rapid heartbeat', 'Headache'] },
    { pharmacistId: 'PHPROF002', name: 'Atorvastatin 20mg', genericName: 'Atorvastatin', category: 'Cardiovascular', description: 'Statin medication to lower cholesterol and reduce heart disease risk.', dosageForm: 'Tablet', strength: '20mg', price: 150, quantity: 120, inStock: true, requiresPrescription: true, sideEffects: ['Muscle pain', 'Headache', 'Nausea'] },
    { pharmacistId: 'PHPROF002', name: 'Vitamin D3 1000IU', genericName: 'Cholecalciferol', category: 'Vitamins', description: 'Essential vitamin D supplement for bone health and immune support.', dosageForm: 'Capsule', strength: '1000IU', price: 180, quantity: 500, inStock: true, requiresPrescription: false, sideEffects: ['Nausea (high doses)', 'Constipation'] },
    { pharmacistId: 'PHPROF002', name: 'Amlodipine 5mg', genericName: 'Amlodipine', category: 'Cardiovascular', description: 'Calcium channel blocker for hypertension and angina.', dosageForm: 'Tablet', strength: '5mg', price: 75, quantity: 90, inStock: true, requiresPrescription: true, sideEffects: ['Swollen ankles', 'Flushing', 'Headache'] },
    { pharmacistId: 'PHPROF002', name: 'Cough Syrup DM', genericName: 'Dextromethorphan', category: 'Respiratory', description: 'Cough suppressant for dry, non-productive cough relief.', dosageForm: 'Syrup', strength: '15mg/5ml', price: 90, quantity: 160, inStock: true, requiresPrescription: false, sideEffects: ['Drowsiness', 'Dizziness', 'Nausea'] },
    { pharmacistId: 'PHPROF002', name: 'Diclofenac Gel 1%', genericName: 'Diclofenac', category: 'Pain Relief', description: 'Topical anti-inflammatory gel for joint and muscle pain.', dosageForm: 'Cream', strength: '1%', price: 135, quantity: 75, inStock: true, requiresPrescription: false, sideEffects: ['Skin irritation', 'Redness at application site'] },
  ]

  for (const med of medicines) {
    await prisma.pharmacyMedicine.create({ data: med })
  }
  console.log(`  Seeded ${medicines.length} pharmacy medicines`)

  // ── Lab Test Catalog ────────────────────────────────────────────────────────

  const labTests = [
    // WizardLab Mauritius (LTPROF001)
    { labTechId: 'LTPROF001', testName: 'Complete Blood Count (CBC)', category: 'Blood', description: 'Measures red blood cells, white blood cells, hemoglobin, hematocrit, and platelets.', price: 500, turnaroundTime: '4-6 hours', sampleType: 'Blood', preparation: 'No fasting required' },
    { labTechId: 'LTPROF001', testName: 'Lipid Panel', category: 'Blood', description: 'Measures cholesterol levels including HDL, LDL, triglycerides, and total cholesterol.', price: 800, turnaroundTime: '24 hours', sampleType: 'Blood', preparation: '12 hours fasting required' },
    { labTechId: 'LTPROF001', testName: 'HbA1c (Glycated Hemoglobin)', category: 'Blood', description: 'Measures average blood sugar levels over the past 2-3 months for diabetes monitoring.', price: 650, turnaroundTime: '24 hours', sampleType: 'Blood', preparation: 'No fasting required' },
    { labTechId: 'LTPROF001', testName: 'Liver Function Test (LFT)', category: 'Blood', description: 'Evaluates liver health by measuring enzymes, proteins, and bilirubin levels.', price: 900, turnaroundTime: '24 hours', sampleType: 'Blood', preparation: 'No fasting required' },
    { labTechId: 'LTPROF001', testName: 'Thyroid Panel (TSH, T3, T4)', category: 'Blood', description: 'Comprehensive thyroid function assessment measuring TSH, Free T3, and Free T4.', price: 1200, turnaroundTime: '24-48 hours', sampleType: 'Blood', preparation: 'No fasting required' },
    { labTechId: 'LTPROF001', testName: 'Urinalysis', category: 'Urine', description: 'Complete urine analysis for kidney function, infections, and metabolic conditions.', price: 350, turnaroundTime: '2-4 hours', sampleType: 'Urine', preparation: 'Mid-stream clean catch sample' },
    // BubbleTest Labs (LTPROF002)
    { labTechId: 'LTPROF002', testName: 'COVID-19 PCR Test', category: 'Infectious Disease', description: 'Molecular test for active SARS-CoV-2 infection using RT-PCR technology.', price: 1500, turnaroundTime: '24-48 hours', sampleType: 'Nasopharyngeal Swab', preparation: 'No special preparation' },
    { labTechId: 'LTPROF002', testName: 'Dengue NS1 Antigen', category: 'Infectious Disease', description: 'Rapid detection of dengue virus NS1 antigen for early diagnosis.', price: 800, turnaroundTime: '4-6 hours', sampleType: 'Blood', preparation: 'No fasting required' },
    { labTechId: 'LTPROF002', testName: 'Kidney Function Panel', category: 'Blood', description: 'Measures creatinine, BUN, eGFR, and electrolytes to assess kidney function.', price: 750, turnaroundTime: '24 hours', sampleType: 'Blood', preparation: '8 hours fasting recommended' },
    { labTechId: 'LTPROF002', testName: 'Vitamin D Level', category: 'Blood', description: 'Measures 25-hydroxyvitamin D levels to assess vitamin D status.', price: 1000, turnaroundTime: '48 hours', sampleType: 'Blood', preparation: 'No fasting required' },
    { labTechId: 'LTPROF002', testName: 'Allergy Panel (IgE)', category: 'Blood', description: 'Comprehensive allergy testing measuring IgE antibodies for common allergens.', price: 2500, turnaroundTime: '3-5 days', sampleType: 'Blood', preparation: 'No fasting required' },
    { labTechId: 'LTPROF002', testName: 'Stool Culture', category: 'Microbiology', description: 'Identifies bacterial pathogens in stool samples for gastrointestinal infections.', price: 600, turnaroundTime: '48-72 hours', sampleType: 'Stool', preparation: 'Fresh sample required' },
  ]

  for (const test of labTests) {
    await prisma.labTestCatalog.create({ data: test })
  }
  console.log(`  Seeded ${labTests.length} lab test catalog entries`)

  // ── Nurse Service Catalog ──────────────────────────────────────────────────

  const nurseServices = [
    // Nurse 1 (NPROF001)
    { nurseId: 'NPROF001', serviceName: 'Blood Pressure Monitoring', category: 'Monitoring', description: 'Regular blood pressure checks with detailed logging and trend analysis.', price: 300, duration: '30 minutes' },
    { nurseId: 'NPROF001', serviceName: 'Wound Care & Dressing', category: 'Wound Care', description: 'Professional wound cleaning, dressing, and healing assessment.', price: 500, duration: '45 minutes' },
    { nurseId: 'NPROF001', serviceName: 'Injection Administration', category: 'Injection', description: 'Intramuscular and subcutaneous injection services including insulin.', price: 250, duration: '15 minutes' },
    { nurseId: 'NPROF001', serviceName: 'Post-Surgery Home Care', category: 'Post-Surgery', description: 'Comprehensive post-operative care including wound monitoring, medication management, and recovery assessment.', price: 1200, duration: '2 hours' },
    { nurseId: 'NPROF001', serviceName: 'Diabetes Management', category: 'Chronic Care', description: 'Blood glucose monitoring, insulin management, and lifestyle counseling for diabetic patients.', price: 600, duration: '1 hour' },
    { nurseId: 'NPROF001', serviceName: 'Health Assessment', category: 'Assessment', description: 'Full health assessment including vital signs, physical examination, and health report.', price: 800, duration: '1 hour' },
    // Nurse 2 (NPROF002)
    { nurseId: 'NPROF002', serviceName: 'Medication Administration', category: 'Medication', description: 'Safe administration of prescribed medications with dosage verification.', price: 350, duration: '30 minutes' },
    { nurseId: 'NPROF002', serviceName: 'Elderly Care Assistance', category: 'Chronic Care', description: 'Comprehensive elderly care including mobility assistance, medication reminders, and wellness checks.', price: 900, duration: '2 hours' },
    { nurseId: 'NPROF002', serviceName: 'Vital Signs Monitoring', category: 'Monitoring', description: 'Complete vital signs check: temperature, pulse, respiration, blood pressure, and oxygen saturation.', price: 400, duration: '30 minutes' },
    { nurseId: 'NPROF002', serviceName: 'IV Therapy', category: 'Medication', description: 'Intravenous fluid administration and IV medication management at home.', price: 1500, duration: '1-2 hours' },
    { nurseId: 'NPROF002', serviceName: 'Health Education Session', category: 'Education', description: 'Personalized health education on chronic disease management, nutrition, and preventive care.', price: 500, duration: '45 minutes' },
  ]

  for (const svc of nurseServices) {
    await prisma.nurseServiceCatalog.create({ data: svc })
  }
  console.log(`  Seeded ${nurseServices.length} nurse service catalog entries`)

  // ── Nanny Service Catalog ─────────────────────────────────────────────────

  const nannyServiceList = [
    // Nanny 1 (NAPROF001)
    { nannyId: 'NAPROF001', serviceName: 'Reading & Storytelling', category: 'Educational', description: 'Age-appropriate books and interactive stories to develop literacy and imagination.', price: 400, ageRange: '2-8 years' },
    { nannyId: 'NAPROF001', serviceName: 'Arts & Crafts', category: 'Creative', description: 'Creative activities to develop fine motor skills and artistic expression.', price: 450, ageRange: '3-10 years' },
    { nannyId: 'NAPROF001', serviceName: 'Meal Preparation', category: 'Daily Care', description: 'Healthy meal planning and preparation tailored to dietary needs and preferences.', price: 350, ageRange: 'All ages' },
    { nannyId: 'NAPROF001', serviceName: 'Sleep Routine Management', category: 'Daily Care', description: 'Establishing and maintaining healthy sleep patterns and bedtime routines.', price: 500, ageRange: '0-5 years' },
    { nannyId: 'NAPROF001', serviceName: 'Safety & First Aid', category: 'Health & Safety', description: 'Comprehensive child safety supervision with certified first aid training.', price: 600, ageRange: 'All ages' },
    { nannyId: 'NAPROF001', serviceName: 'Language Development', category: 'Language', description: 'Multilingual exposure and communication skills development in English, French, and Creole.', price: 550, ageRange: '1-6 years' },
    // Nanny 2 (NAPROF002)
    { nannyId: 'NAPROF002', serviceName: 'Music & Dancing', category: 'Music', description: 'Musical activities for cognitive development including singing, rhythm, and movement.', price: 400, ageRange: '2-8 years' },
    { nannyId: 'NAPROF002', serviceName: 'Educational Games', category: 'Educational', description: 'Learning through play with age-appropriate structured activities and puzzles.', price: 350, ageRange: '3-10 years' },
    { nannyId: 'NAPROF002', serviceName: 'Outdoor Activities', category: 'Physical Activity', description: 'Supervised outdoor play, nature walks, and physical exercise for healthy development.', price: 450, ageRange: '3-12 years' },
    { nannyId: 'NAPROF002', serviceName: 'Homework Help', category: 'Educational', description: 'Academic support and homework assistance for school-age children.', price: 500, ageRange: '5-14 years' },
    { nannyId: 'NAPROF002', serviceName: 'Special Needs Care', category: 'Special Needs', description: 'Specialized care for children with special needs, adapted activities and routines.', price: 800, ageRange: 'All ages' },
  ]

  for (const svc of nannyServiceList) {
    await prisma.nannyServiceCatalog.create({ data: svc })
  }
  console.log(`  Seeded ${nannyServiceList.length} nanny service catalog entries`)

  // ── Emergency Service Listings ──────────────────────────────────────────────

  const emergencyServices = [
    // Jean-Marc Lafleur (EWPROF001)
    { workerId: 'EWPROF001', serviceName: 'Advanced Life Support Ambulance', serviceType: 'Ambulance', description: 'Fully equipped ALS ambulance with paramedic crew for medical emergencies, cardiac events, and trauma.', responseTime: '10-15 minutes', available24h: true, coverageArea: 'Port Louis & Northern Districts', contactNumber: '+230 5789 2001', price: 3500, specializations: ['Cardiac Emergencies', 'Trauma Care', 'Critical Transport'] },
    { workerId: 'EWPROF001', serviceName: 'Medical Event Coverage', serviceType: 'First Aid', description: 'On-site medical support for corporate events, sports competitions, and public gatherings.', responseTime: 'On-site', available24h: false, coverageArea: 'Island-wide', contactNumber: '+230 5789 2001', price: 8000, specializations: ['Event Medicine', 'Mass Casualty Triage'] },
    { workerId: 'EWPROF001', serviceName: 'Inter-Hospital Transfer', serviceType: 'Medical Transport', description: 'Safe and monitored patient transfer between hospitals with medical team escort.', responseTime: '30 minutes', available24h: true, coverageArea: 'Island-wide', contactNumber: '+230 5789 2001', price: 5000, specializations: ['Patient Transfer', 'ICU Transport'] },
    // Fatima Joomun (EWPROF002)
    { workerId: 'EWPROF002', serviceName: 'Rapid Response Motorcycle', serviceType: 'First Aid', description: 'Fast first-response motorcycle paramedic for urban emergencies, reaching patients before ambulance.', responseTime: '5-8 minutes', available24h: true, coverageArea: 'Central Plateau', contactNumber: '+230 5789 2002', price: 1500, specializations: ['First Response', 'Basic Life Support'] },
    { workerId: 'EWPROF002', serviceName: 'Community First Aid Training', serviceType: 'Training', description: 'CPR and first aid certification courses for businesses, schools, and community groups.', responseTime: 'Scheduled', available24h: false, coverageArea: 'Central Plateau & Upper Plaines', contactNumber: '+230 5789 2002', price: 2000, specializations: ['CPR Training', 'First Aid Education'] },
  ]

  for (const svc of emergencyServices) {
    await prisma.emergencyServiceListing.create({ data: svc })
  }
  console.log(`  Seeded ${emergencyServices.length} emergency service listings`)

  // ── Insurance Plan Listings ─────────────────────────────────────────────────

  const insurancePlans = [
    // Flamingo Assurance Ltd (IRPROF001)
    { id: 'INSPLAN001', insuranceRepId: 'IRPROF001', planName: 'Flamingo Health Essential', planType: 'Health', description: 'Comprehensive health insurance covering hospitalization, outpatient care, and specialist consultations.', monthlyPremium: 2500, annualPremium: 27000, coverageAmount: 500000, deductible: 5000, coverageDetails: ['Hospitalization', 'Outpatient care', 'Specialist consultations', 'Prescription drugs', 'Lab tests'], eligibility: 'Ages 18-65' },
    { id: 'INSPLAN002', insuranceRepId: 'IRPROF001', planName: 'Flamingo Family Care Plus', planType: 'Family', description: 'Family health plan covering spouse and up to 3 children with maternity benefits.', monthlyPremium: 5500, annualPremium: 60000, coverageAmount: 1000000, deductible: 3000, coverageDetails: ['Family hospitalization', 'Maternity care', 'Pediatric care', 'Dental (basic)', 'Vision check-ups', 'Vaccination'], eligibility: 'Family with children under 21' },
    { id: 'INSPLAN003', insuranceRepId: 'IRPROF001', planName: 'Flamingo Life Assurance', planType: 'Life', description: 'Term life insurance with death benefit and optional critical illness rider.', monthlyPremium: 1500, annualPremium: 16500, coverageAmount: 2000000, deductible: 0, coverageDetails: ['Death benefit', 'Critical illness cover', 'Accidental death benefit', 'Terminal illness benefit'], eligibility: 'Ages 21-60' },
    { id: 'INSPLAN004', insuranceRepId: 'IRPROF001', planName: 'Flamingo Dental Care', planType: 'Dental', description: 'Dental insurance covering preventive, basic, and major dental procedures.', monthlyPremium: 800, annualPremium: 8800, coverageAmount: 100000, deductible: 1000, coverageDetails: ['Preventive checkups', 'Fillings', 'Root canals', 'Crowns', 'Orthodontics (partial)'], eligibility: 'Ages 5-70' },
    // CloudNine Insurance (IRPROF002)
    { id: 'INSPLAN005', insuranceRepId: 'IRPROF002', planName: 'CloudNine Health Shield', planType: 'Health', description: 'Affordable health insurance with focus on hospital and surgery coverage.', monthlyPremium: 1800, annualPremium: 19800, coverageAmount: 300000, deductible: 7500, coverageDetails: ['Hospitalization', 'Surgery', 'Emergency care', 'Ambulance services'], eligibility: 'Ages 18-60' },
    { id: 'INSPLAN006', insuranceRepId: 'IRPROF002', planName: 'CloudNine Vision Plus', planType: 'Vision', description: 'Vision care plan covering eye exams, glasses, and contact lenses.', monthlyPremium: 450, annualPremium: 5000, coverageAmount: 50000, deductible: 500, coverageDetails: ['Annual eye exams', 'Prescription glasses', 'Contact lenses', 'Laser surgery (partial)'], eligibility: 'All ages' },
    { id: 'INSPLAN007', insuranceRepId: 'IRPROF002', planName: 'CloudNine Corporate Health', planType: 'Health', description: 'Group health insurance for businesses with 10+ employees. Customizable coverage options.', monthlyPremium: 1200, annualPremium: 13200, coverageAmount: 400000, deductible: 5000, coverageDetails: ['Group hospitalization', 'Outpatient care', 'Mental health support', 'Wellness programs', 'Annual health screenings'], eligibility: 'Businesses with 10+ employees' },
    { id: 'INSPLAN008', insuranceRepId: 'IRPROF002', planName: 'CloudNine Senior Care', planType: 'Health', description: 'Specialized health plan for seniors covering chronic conditions and home healthcare.', monthlyPremium: 3500, annualPremium: 38000, coverageAmount: 750000, deductible: 2500, coverageDetails: ['Chronic disease management', 'Home healthcare', 'Physiotherapy', 'Medical devices', 'Palliative care'], eligibility: 'Ages 55-80' },
  ]

  for (const plan of insurancePlans) {
    await prisma.insurancePlanListing.create({ data: plan })
  }
  console.log(`  Seeded ${insurancePlans.length} insurance plan listings`)

  console.log('Catalog data seeded successfully!')
}
