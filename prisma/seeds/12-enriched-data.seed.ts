import { PrismaClient } from '@prisma/client'

export async function seedEnrichedData(prisma: PrismaClient) {
  // ─── 1. Medical Records (MR006–MR015) ──────────────────────────────────────

  const medicalRecords = [
    {
      id: 'MR006',
      patientId: 'PPROF001',
      doctorId: 'DPROF002',
      title: 'Diabetic Neuropathy Evaluation',
      date: new Date('2024-10-08'),
      type: 'consultation',
      summary: 'Patient reports tingling and numbness in feet. Monofilament testing shows reduced sensation in both feet. Nerve conduction study recommended.',
      diagnosis: 'Early diabetic peripheral neuropathy',
      treatment: 'Pregabalin 75mg twice daily, foot care education',
      notes: 'Referred to podiatry for specialized foot assessment',
      attachments: [],
    },
    {
      id: 'MR007',
      patientId: 'PPROF002',
      doctorId: 'DPROF001',
      title: 'Migraine Assessment',
      date: new Date('2024-10-22'),
      type: 'consultation',
      summary: 'Recurrent migraines with aura occurring 3-4 times per month. Triggers identified include stress and irregular sleep. No red flag symptoms.',
      diagnosis: 'Migraine with aura',
      treatment: 'Sumatriptan 50mg as needed, propranolol 40mg daily for prophylaxis',
      notes: 'Patient advised to maintain headache diary',
    },
    {
      id: 'MR008',
      patientId: 'PPROF003',
      doctorId: 'DPROF003',
      title: 'Iron Deficiency Workup',
      date: new Date('2024-11-05'),
      type: 'lab_result',
      summary: 'CBC and iron studies confirm iron deficiency anemia. Ferritin 8 ng/mL, hemoglobin 10.2 g/dL. GI causes ruled out.',
      diagnosis: 'Iron deficiency anemia',
      treatment: 'Ferrous sulfate 325mg twice daily with vitamin C',
      notes: 'Recheck CBC and ferritin in 8 weeks',
      attachments: ['iron-panel-results.pdf'],
    },
    {
      id: 'MR009',
      patientId: 'PPROF004',
      doctorId: 'DPROF001',
      title: 'Hypertension Management',
      date: new Date('2024-11-18'),
      type: 'consultation',
      summary: 'Blood pressure consistently elevated at 148/92 despite lifestyle modifications. Starting pharmacological therapy.',
      diagnosis: 'Essential hypertension, stage 1',
      treatment: 'Lisinopril 10mg daily, DASH diet counseling',
      notes: 'Follow up in 4 weeks to assess BP response',
    },
    {
      id: 'MR010',
      patientId: 'PPROF005',
      doctorId: 'DPROF002',
      title: 'Annual Wellness Exam',
      date: new Date('2024-11-25'),
      type: 'consultation',
      summary: 'Comprehensive annual wellness exam. All vitals within normal limits. Up to date on vaccinations. BMI 23.4.',
      diagnosis: 'Healthy - routine preventive visit',
      treatment: 'Continue current health maintenance',
      notes: 'Recommended flu vaccine for upcoming season',
    },
    {
      id: 'MR011',
      patientId: 'PPROF001',
      doctorId: 'DPROF003',
      title: 'ECG Follow-up',
      date: new Date('2024-12-02'),
      type: 'imaging',
      summary: 'Follow-up ECG shows normal sinus rhythm. No ST changes. QTc within normal range. Echo scheduled for comprehensive cardiac evaluation.',
      diagnosis: 'Normal ECG, no acute cardiac pathology',
      treatment: 'Continue current cardiac medications',
      notes: 'Echocardiogram scheduled for next visit',
      attachments: ['ecg-report-dec2024.pdf'],
    },
    {
      id: 'MR012',
      patientId: 'PPROF002',
      doctorId: 'DPROF002',
      title: 'Gastritis Evaluation',
      date: new Date('2024-12-10'),
      type: 'consultation',
      summary: 'Epigastric pain worsening over 3 weeks. No alarm features. Negative for H. pylori on breath test. Likely NSAID-induced gastritis.',
      diagnosis: 'NSAID-induced gastritis',
      treatment: 'Omeprazole 20mg daily for 4 weeks, discontinue ibuprofen',
      notes: 'Switch to paracetamol for pain management. Follow up if symptoms persist.',
    },
    {
      id: 'MR013',
      patientId: 'PPROF003',
      doctorId: 'DPROF001',
      title: 'Thyroid Function Review',
      date: new Date('2024-12-15'),
      type: 'lab_result',
      summary: 'TSH elevated at 8.2 mIU/L, free T4 low-normal at 0.9 ng/dL. Consistent with subclinical hypothyroidism.',
      diagnosis: 'Subclinical hypothyroidism',
      treatment: 'Levothyroxine 25mcg daily, recheck TSH in 6 weeks',
      notes: 'Discuss symptoms of hypothyroidism and monitoring plan',
      attachments: ['thyroid-panel-dec2024.pdf'],
    },
    {
      id: 'MR014',
      patientId: 'PPROF005',
      doctorId: 'DPROF003',
      title: 'Lower Back Pain Assessment',
      date: new Date('2024-12-18'),
      type: 'consultation',
      summary: 'Acute lower back pain following heavy lifting 5 days ago. No radiculopathy. Negative straight leg raise. Muscular in origin.',
      diagnosis: 'Acute mechanical low back pain',
      treatment: 'Ibuprofen 400mg TID for 5 days, heat therapy, gradual return to activity',
      notes: 'Red flags discussed. Return if symptoms worsen or persist beyond 4 weeks.',
    },
    {
      id: 'MR015',
      patientId: 'PPROF004',
      doctorId: 'DPROF002',
      title: 'Vitamin D Deficiency',
      date: new Date('2024-12-20'),
      type: 'lab_result',
      summary: 'Vitamin D level critically low at 12 ng/mL. Patient reports fatigue and muscle weakness. Calcium levels normal.',
      diagnosis: 'Severe vitamin D deficiency',
      treatment: 'Cholecalciferol 50,000 IU weekly for 8 weeks, then 2000 IU daily maintenance',
      notes: 'Recheck vitamin D in 3 months. Encourage sun exposure and dietary sources.',
      attachments: ['vitamin-d-results.pdf'],
    },
  ]
  await prisma.medicalRecord.createMany({ data: medicalRecords, skipDuplicates: true })

  // ─── 2. Prescriptions (PRE006–PRE010) ──────────────────────────────────────

  const prescriptions = [
    {
      id: 'PRE006',
      patientId: 'PPROF003',
      doctorId: 'DPROF003',
      date: new Date('2024-11-05'),
      diagnosis: 'Iron deficiency anemia',
      isActive: true,
      nextRefill: new Date('2025-02-05'),
      notes: 'Take on empty stomach with vitamin C for better absorption',
    },
    {
      id: 'PRE007',
      patientId: 'PPROF004',
      doctorId: 'DPROF001',
      date: new Date('2024-11-18'),
      diagnosis: 'Essential hypertension',
      isActive: true,
      nextRefill: new Date('2025-02-18'),
      notes: 'Monitor blood pressure weekly',
    },
    {
      id: 'PRE008',
      patientId: 'PPROF002',
      doctorId: 'DPROF002',
      date: new Date('2024-12-10'),
      diagnosis: 'NSAID-induced gastritis',
      isActive: true,
      nextRefill: new Date('2025-01-10'),
      notes: 'Take 30 minutes before meals',
    },
    {
      id: 'PRE009',
      patientId: 'PPROF003',
      doctorId: 'DPROF001',
      date: new Date('2024-12-15'),
      diagnosis: 'Subclinical hypothyroidism',
      isActive: true,
      nextRefill: new Date('2025-03-15'),
      notes: 'Take on empty stomach, 30 min before breakfast',
    },
    {
      id: 'PRE010',
      patientId: 'PPROF005',
      doctorId: 'DPROF003',
      date: new Date('2024-12-18'),
      diagnosis: 'Acute mechanical low back pain',
      isActive: false,
      notes: 'Short course completed',
    },
  ]
  await prisma.prescription.createMany({ data: prescriptions, skipDuplicates: true })

  // ─── Prescription Medicines (8 entries for PRE006–PRE010) ──────────────────

  const prescriptionMedicines = [
    // PRE006 - iron deficiency anemia
    { prescriptionId: 'PRE006', medicineId: 'MED007', dosage: '500mg', frequency: 'Twice daily', duration: '3 months', instructions: 'Take with orange juice for better iron absorption' },
    // PRE007 - hypertension
    { prescriptionId: 'PRE007', medicineId: 'MED002', dosage: '10mg', frequency: 'Once daily', duration: 'Ongoing', instructions: 'Take in the morning' },
    { prescriptionId: 'PRE007', medicineId: 'MED004', dosage: '5mg', frequency: 'Once daily', duration: 'Ongoing', instructions: 'Take in the evening' },
    // PRE008 - gastritis
    { prescriptionId: 'PRE008', medicineId: 'MED005', dosage: '20mg', frequency: 'Once daily', duration: '4 weeks', instructions: 'Take 30 minutes before breakfast' },
    // PRE009 - hypothyroidism (using paracetamol as placeholder - levothyroxine not in MED list)
    { prescriptionId: 'PRE009', medicineId: 'MED007', dosage: '25mcg', frequency: 'Once daily', duration: '6 months', instructions: 'Take on empty stomach, 30 min before breakfast. Do not take with calcium or iron supplements.' },
    // PRE010 - lower back pain
    { prescriptionId: 'PRE010', medicineId: 'MED008', dosage: '400mg', frequency: 'Three times daily', duration: '5 days', instructions: 'Take with food to reduce stomach irritation' },
    { prescriptionId: 'PRE010', medicineId: 'MED007', dosage: '1000mg', frequency: 'Every 6 hours as needed', duration: '7 days', instructions: 'Do not exceed 4g per day' },
    { prescriptionId: 'PRE010', medicineId: 'MED009', dosage: '10mg', frequency: 'Once daily at bedtime', duration: '5 days', instructions: 'May cause drowsiness' },
  ]
  await prisma.prescriptionMedicine.createMany({ data: prescriptionMedicines, skipDuplicates: true })

  // ─── 3. Vital Signs (15 entries, Oct–Dec 2024) ─────────────────────────────

  const vitalSigns = [
    // PPROF001 - diabetic patient, slightly elevated BP trend
    { patientId: 'PPROF001', recordedAt: new Date('2024-10-01T09:00:00'), systolicBP: 138, diastolicBP: 88, heartRate: 78, temperature: 36.7, weight: 69.2, height: 165, oxygenSaturation: 97, glucose: 132, cholesterol: 205, facility: 'City Medical Center', recordedBy: 'Lab Tech Lisa' },
    { patientId: 'PPROF001', recordedAt: new Date('2024-10-15T10:30:00'), systolicBP: 134, diastolicBP: 86, heartRate: 74, temperature: 36.6, weight: 68.8, height: 165, oxygenSaturation: 98, glucose: 118, facility: 'City Medical Center', recordedBy: 'Lab Tech Lisa' },
    { patientId: 'PPROF001', recordedAt: new Date('2024-11-01T08:45:00'), systolicBP: 132, diastolicBP: 84, heartRate: 72, temperature: 36.5, weight: 68.5, height: 165, oxygenSaturation: 98, glucose: 115, cholesterol: 198, facility: 'City Medical Center', recordedBy: 'Lab Tech Lisa' },
    { patientId: 'PPROF001', recordedAt: new Date('2024-12-01T09:15:00'), systolicBP: 128, diastolicBP: 82, heartRate: 70, temperature: 36.6, weight: 68.0, height: 165, oxygenSaturation: 98, glucose: 108, cholesterol: 190, facility: 'City Medical Center', recordedBy: 'Lab Tech Lisa' },

    // PPROF002 - asthma patient, generally healthy vitals
    { patientId: 'PPROF002', recordedAt: new Date('2024-10-10T11:00:00'), systolicBP: 118, diastolicBP: 76, heartRate: 72, temperature: 36.5, weight: 74.5, height: 178, oxygenSaturation: 98, facility: 'Rose Hill Medical Clinic', recordedBy: 'Lab Tech Mark' },
    { patientId: 'PPROF002', recordedAt: new Date('2024-11-08T10:30:00'), systolicBP: 122, diastolicBP: 78, heartRate: 68, temperature: 36.6, weight: 75.2, height: 178, oxygenSaturation: 99, facility: 'Rose Hill Medical Clinic', recordedBy: 'Lab Tech Mark' },
    { patientId: 'PPROF002', recordedAt: new Date('2024-12-12T14:00:00'), systolicBP: 120, diastolicBP: 75, heartRate: 70, temperature: 37.1, weight: 74.8, height: 178, oxygenSaturation: 97, facility: 'Rose Hill Medical Clinic', recordedBy: 'Lab Tech Mark' },

    // PPROF003 - anemia patient, lower BP, improving over time
    { patientId: 'PPROF003', recordedAt: new Date('2024-10-05T09:30:00'), systolicBP: 110, diastolicBP: 70, heartRate: 88, temperature: 36.4, weight: 61.0, height: 160, oxygenSaturation: 97, facility: 'City Medical Center', recordedBy: 'Lab Tech Lisa' },
    { patientId: 'PPROF003', recordedAt: new Date('2024-11-05T10:00:00'), systolicBP: 112, diastolicBP: 72, heartRate: 84, temperature: 36.5, weight: 61.5, height: 160, oxygenSaturation: 98, facility: 'City Medical Center', recordedBy: 'Lab Tech Lisa' },
    { patientId: 'PPROF003', recordedAt: new Date('2024-12-15T11:00:00'), systolicBP: 116, diastolicBP: 74, heartRate: 78, temperature: 36.5, weight: 62.5, height: 160, oxygenSaturation: 99, facility: 'City Medical Center', recordedBy: 'Lab Tech Lisa' },

    // PPROF004 - hypertension + cholesterol patient
    { patientId: 'PPROF004', recordedAt: new Date('2024-10-12T08:00:00'), systolicBP: 148, diastolicBP: 94, heartRate: 80, temperature: 36.7, weight: 83.0, height: 175, oxygenSaturation: 97, cholesterol: 252, facility: 'Cardiac Care Center', recordedBy: 'Lab Tech Sarah' },
    { patientId: 'PPROF004', recordedAt: new Date('2024-11-18T09:00:00'), systolicBP: 142, diastolicBP: 90, heartRate: 76, temperature: 36.6, weight: 82.5, height: 175, oxygenSaturation: 98, cholesterol: 240, facility: 'Cardiac Care Center', recordedBy: 'Lab Tech Sarah' },
    { patientId: 'PPROF004', recordedAt: new Date('2024-12-20T08:30:00'), systolicBP: 136, diastolicBP: 86, heartRate: 74, temperature: 36.5, weight: 81.5, height: 175, oxygenSaturation: 98, cholesterol: 228, facility: 'Cardiac Care Center', recordedBy: 'Lab Tech Sarah' },

    // PPROF005 - generally healthy patient
    { patientId: 'PPROF005', recordedAt: new Date('2024-10-20T13:00:00'), systolicBP: 116, diastolicBP: 74, heartRate: 66, temperature: 36.4, weight: 70.0, height: 172, oxygenSaturation: 99, facility: 'City Medical Center', recordedBy: 'Lab Tech Lisa' },
    { patientId: 'PPROF005', recordedAt: new Date('2024-12-18T14:00:00'), systolicBP: 118, diastolicBP: 76, heartRate: 68, temperature: 36.5, weight: 70.2, height: 172, oxygenSaturation: 99, facility: 'City Medical Center', recordedBy: 'Lab Tech Lisa' },
  ]
  await prisma.vitalSigns.createMany({ data: vitalSigns, skipDuplicates: true })

  // ─── 4. Lab Tests (LT005–LT010) with 12 results ──────────────────────────

  const labTests = [
    // Complete metabolic panel for PPROF001
    { id: 'LT005', patientId: 'PPROF001', testName: 'Comprehensive Metabolic Panel', category: 'Blood Chemistry', orderedAt: new Date('2024-11-15'), completedAt: new Date('2024-11-16'), status: 'completed', facility: 'City Medical Center', orderedBy: 'Dr. Sarah Johnson', notes: 'Fasting panel for diabetes management' },
    // Iron studies for PPROF003
    { id: 'LT006', patientId: 'PPROF003', testName: 'Iron Studies Panel', category: 'Hematology', orderedAt: new Date('2024-11-05'), completedAt: new Date('2024-11-06'), status: 'completed', facility: 'City Medical Center', orderedBy: 'Dr. Marie Dupont', notes: 'Confirm iron deficiency anemia' },
    // Thyroid panel for PPROF003
    { id: 'LT007', patientId: 'PPROF003', testName: 'Thyroid Function Panel', category: 'Endocrinology', orderedAt: new Date('2024-12-15'), completedAt: new Date('2024-12-16'), status: 'completed', facility: 'City Medical Center', orderedBy: 'Dr. Sarah Johnson', notes: 'Evaluate thyroid function due to fatigue' },
    // Full lipid panel for PPROF004
    { id: 'LT008', patientId: 'PPROF004', testName: 'Advanced Lipid Panel', category: 'Cardiology', orderedAt: new Date('2024-12-20'), completedAt: new Date('2024-12-21'), status: 'completed', facility: 'Cardiac Care Center', orderedBy: 'Dr. Marie Dupont', notes: 'Follow-up cholesterol management' },
    // CBC for PPROF005 - pending
    { id: 'LT009', patientId: 'PPROF005', testName: 'Complete Blood Count', category: 'Hematology', orderedAt: new Date('2024-12-22'), status: 'in_progress', facility: 'City Medical Center', orderedBy: 'Dr. Raj Patel', notes: 'Routine annual screening' },
    // Vitamin D for PPROF004
    { id: 'LT010', patientId: 'PPROF004', testName: 'Vitamin D, 25-Hydroxy', category: 'Endocrinology', orderedAt: new Date('2024-12-20'), completedAt: new Date('2024-12-21'), status: 'completed', facility: 'Cardiac Care Center', orderedBy: 'Dr. Raj Patel', notes: 'Evaluate vitamin D status' },
  ]
  await prisma.labTest.createMany({ data: labTests, skipDuplicates: true })

  const labTestResults = [
    // LT005 - Comprehensive Metabolic Panel results
    { labTestId: 'LT005', parameter: 'Fasting Glucose', value: '112', unit: 'mg/dL', referenceMin: '70', referenceMax: '100', isAbnormal: true },
    { labTestId: 'LT005', parameter: 'Creatinine', value: '0.9', unit: 'mg/dL', referenceMin: '0.6', referenceMax: '1.2', isAbnormal: false },
    { labTestId: 'LT005', parameter: 'BUN', value: '18', unit: 'mg/dL', referenceMin: '7', referenceMax: '20', isAbnormal: false },

    // LT006 - Iron Studies
    { labTestId: 'LT006', parameter: 'Serum Iron', value: '35', unit: 'mcg/dL', referenceMin: '60', referenceMax: '170', isAbnormal: true },
    { labTestId: 'LT006', parameter: 'Ferritin', value: '8', unit: 'ng/mL', referenceMin: '12', referenceMax: '150', isAbnormal: true },
    { labTestId: 'LT006', parameter: 'TIBC', value: '450', unit: 'mcg/dL', referenceMin: '250', referenceMax: '370', isAbnormal: true },

    // LT007 - Thyroid Function Panel
    { labTestId: 'LT007', parameter: 'TSH', value: '8.2', unit: 'mIU/L', referenceMin: '0.4', referenceMax: '4.0', isAbnormal: true },
    { labTestId: 'LT007', parameter: 'Free T4', value: '0.9', unit: 'ng/dL', referenceMin: '0.8', referenceMax: '1.8', isAbnormal: false },

    // LT008 - Advanced Lipid Panel
    { labTestId: 'LT008', parameter: 'Total Cholesterol', value: '228', unit: 'mg/dL', referenceMin: '0', referenceMax: '200', isAbnormal: true },
    { labTestId: 'LT008', parameter: 'LDL Cholesterol', value: '142', unit: 'mg/dL', referenceMin: '0', referenceMax: '100', isAbnormal: true },
    { labTestId: 'LT008', parameter: 'HDL Cholesterol', value: '48', unit: 'mg/dL', referenceMin: '40', referenceMax: '60', isAbnormal: false },

    // LT010 - Vitamin D
    { labTestId: 'LT010', parameter: 'Vitamin D, 25-Hydroxy', value: '12', unit: 'ng/mL', referenceMin: '30', referenceMax: '100', isAbnormal: true },
  ]
  await prisma.labTestResult.createMany({ data: labTestResults, skipDuplicates: true })

  // ─── 5. Nutrition Analyses (8 entries) ─────────────────────────────────────

  const nutritionAnalyses = [
    // PPROF001 - diabetic diet tracking
    {
      patientId: 'PPROF001',
      foodName: 'Oatmeal with Berries and Almonds',
      date: new Date('2024-12-16T07:30:00'),
      calories: 320,
      carbs: 42,
      protein: 12,
      fat: 10,
      vitamins: ['B1', 'B6', 'E', 'Manganese'],
      healthScore: 90,
      suggestions: ['Excellent choice for blood sugar management'],
      allergens: ['Tree nuts'],
      nutritionalBenefits: ['High fiber', 'Low glycemic index', 'Antioxidant-rich'],
      mealType: 'breakfast',
    },
    {
      patientId: 'PPROF001',
      foodName: 'Grilled Chicken Salad with Quinoa',
      date: new Date('2024-12-16T12:30:00'),
      calories: 480,
      carbs: 35,
      protein: 42,
      fat: 16,
      vitamins: ['A', 'C', 'K', 'B6'],
      healthScore: 92,
      suggestions: ['Great protein-to-carb ratio for diabetic diet'],
      allergens: [],
      nutritionalBenefits: ['High protein', 'Complete amino acids', 'Rich in vitamins'],
      mealType: 'lunch',
    },
    // PPROF002 - general health
    {
      patientId: 'PPROF002',
      foodName: 'Butter Chicken with Naan',
      date: new Date('2024-12-14T19:00:00'),
      calories: 680,
      carbs: 62,
      protein: 38,
      fat: 28,
      vitamins: ['A', 'B12', 'D'],
      healthScore: 60,
      suggestions: ['Consider reducing portion size', 'Choose whole wheat naan'],
      allergens: ['Gluten', 'Dairy'],
      nutritionalBenefits: ['Good protein content', 'Rich in B12'],
      mealType: 'dinner',
    },
    {
      patientId: 'PPROF002',
      foodName: 'Greek Yogurt with Honey and Walnuts',
      date: new Date('2024-12-15T10:00:00'),
      calories: 250,
      carbs: 28,
      protein: 18,
      fat: 8,
      vitamins: ['B2', 'B12', 'Calcium'],
      healthScore: 82,
      suggestions: ['Good probiotic source for gut health'],
      allergens: ['Dairy', 'Tree nuts'],
      nutritionalBenefits: ['Probiotics', 'High calcium', 'Protein-rich'],
      mealType: 'snack',
    },
    // PPROF003 - iron-rich diet recommended
    {
      patientId: 'PPROF003',
      foodName: 'Spinach and Lentil Soup',
      date: new Date('2024-12-17T12:00:00'),
      calories: 310,
      carbs: 38,
      protein: 22,
      fat: 6,
      vitamins: ['A', 'C', 'Iron', 'Folate'],
      healthScore: 95,
      suggestions: ['Excellent iron-rich meal for anemia recovery'],
      allergens: [],
      nutritionalBenefits: ['High iron', 'High fiber', 'Plant-based protein', 'Folate-rich'],
      mealType: 'lunch',
    },
    {
      patientId: 'PPROF003',
      foodName: 'Beef Stir-Fry with Broccoli and Brown Rice',
      date: new Date('2024-12-17T19:00:00'),
      calories: 520,
      carbs: 48,
      protein: 36,
      fat: 18,
      vitamins: ['B12', 'Iron', 'C', 'Zinc'],
      healthScore: 88,
      suggestions: ['Vitamin C from broccoli enhances iron absorption'],
      allergens: ['Soy'],
      nutritionalBenefits: ['Heme iron source', 'Complete protein', 'High fiber'],
      mealType: 'dinner',
    },
    // PPROF004 - heart-healthy diet
    {
      patientId: 'PPROF004',
      foodName: 'Salmon with Steamed Vegetables',
      date: new Date('2024-12-18T18:30:00'),
      calories: 420,
      carbs: 18,
      protein: 40,
      fat: 22,
      vitamins: ['D', 'B12', 'Omega-3', 'Selenium'],
      healthScore: 94,
      suggestions: ['Heart-healthy omega-3 rich meal, excellent choice'],
      allergens: ['Fish'],
      nutritionalBenefits: ['Rich in omega-3', 'Heart-healthy fats', 'High protein'],
      mealType: 'dinner',
    },
    // PPROF005 - general wellness
    {
      patientId: 'PPROF005',
      foodName: 'Avocado Toast with Poached Eggs',
      date: new Date('2024-12-19T08:00:00'),
      calories: 380,
      carbs: 30,
      protein: 18,
      fat: 22,
      vitamins: ['E', 'K', 'B6', 'Potassium'],
      healthScore: 85,
      suggestions: ['Good balance of healthy fats and protein'],
      allergens: ['Gluten', 'Eggs'],
      nutritionalBenefits: ['Healthy monounsaturated fats', 'Good fiber', 'Choline from eggs'],
      mealType: 'breakfast',
    },
  ]
  await prisma.nutritionAnalysis.createMany({ data: nutritionAnalyses, skipDuplicates: true })

  // ─── 6. Appointments (APT009–APT023) ───────────────────────────────────────

  const appointments = [
    // November 2024 - completed appointments
    {
      id: 'APT009',
      patientId: 'PPROF001',
      doctorId: 'DPROF002',
      scheduledAt: new Date('2024-11-04T09:00:00'),
      type: 'in-person',
      status: 'completed',
      specialty: 'General Medicine',
      reason: 'Diabetic neuropathy evaluation',
      duration: 30,
      location: 'Rose Hill Medical Clinic',
      notes: 'Monofilament test performed. Referred to podiatry.',
    },
    {
      id: 'APT010',
      patientId: 'PPROF002',
      doctorId: 'DPROF001',
      scheduledAt: new Date('2024-11-08T14:00:00'),
      type: 'video',
      status: 'completed',
      specialty: 'Endocrinology',
      reason: 'Migraine follow-up',
      duration: 20,
      notes: 'Headache diary reviewed. Prophylaxis started.',
    },
    {
      id: 'APT011',
      patientId: 'PPROF003',
      doctorId: 'DPROF003',
      scheduledAt: new Date('2024-11-12T10:30:00'),
      type: 'in-person',
      status: 'completed',
      specialty: 'Cardiology',
      reason: 'Iron deficiency workup discussion',
      duration: 30,
      location: 'City Medical Center',
      notes: 'Lab results reviewed. Iron supplementation started.',
    },
    {
      id: 'APT012',
      patientId: 'PPROF004',
      doctorId: 'DPROF001',
      scheduledAt: new Date('2024-11-18T08:30:00'),
      type: 'in-person',
      status: 'completed',
      specialty: 'Endocrinology',
      reason: 'Hypertension initial consultation',
      duration: 45,
      location: 'City Medical Center',
      notes: 'Blood pressure monitoring plan established.',
    },
    {
      id: 'APT013',
      patientId: 'PPROF005',
      doctorId: 'DPROF002',
      scheduledAt: new Date('2024-11-25T11:00:00'),
      type: 'in-person',
      status: 'completed',
      specialty: 'General Medicine',
      reason: 'Annual wellness exam',
      duration: 30,
      location: 'Rose Hill Medical Clinic',
      notes: 'All vitals normal. Vaccinations up to date.',
    },
    // Cancelled appointment
    {
      id: 'APT014',
      patientId: 'PPROF001',
      doctorId: 'DPROF001',
      scheduledAt: new Date('2024-11-22T15:00:00'),
      type: 'video',
      status: 'cancelled',
      specialty: 'Endocrinology',
      reason: 'Diabetes medication review',
      duration: 30,
      notes: 'Patient cancelled due to scheduling conflict. Rescheduled.',
    },

    // December 2024 - mix of statuses
    {
      id: 'APT015',
      patientId: 'PPROF002',
      doctorId: 'DPROF002',
      scheduledAt: new Date('2024-12-03T09:30:00'),
      type: 'in-person',
      status: 'completed',
      specialty: 'General Medicine',
      reason: 'Gastritis evaluation',
      duration: 20,
      location: 'Rose Hill Medical Clinic',
      notes: 'H. pylori test negative. PPI prescribed.',
    },
    {
      id: 'APT016',
      patientId: 'PPROF003',
      doctorId: 'DPROF001',
      scheduledAt: new Date('2024-12-10T10:00:00'),
      type: 'video',
      status: 'completed',
      specialty: 'Endocrinology',
      reason: 'Thyroid results discussion',
      duration: 20,
      notes: 'TSH elevated. Levothyroxine started.',
    },
    {
      id: 'APT017',
      patientId: 'PPROF004',
      doctorId: 'DPROF002',
      scheduledAt: new Date('2024-12-16T14:30:00'),
      type: 'in-person',
      status: 'no_show',
      specialty: 'General Medicine',
      reason: 'Vitamin D follow-up',
      duration: 30,
      location: 'Rose Hill Medical Clinic',
      notes: 'Patient did not attend. Follow-up call made.',
    },
    {
      id: 'APT018',
      patientId: 'PPROF005',
      doctorId: 'DPROF003',
      scheduledAt: new Date('2024-12-18T16:00:00'),
      type: 'video',
      status: 'completed',
      specialty: 'Cardiology',
      reason: 'Lower back pain consultation',
      duration: 20,
      notes: 'Acute mechanical cause. Short-course NSAIDs prescribed.',
    },
    {
      id: 'APT019',
      patientId: 'PPROF001',
      doctorId: 'DPROF003',
      scheduledAt: new Date('2024-12-20T10:00:00'),
      type: 'in-person',
      status: 'completed',
      specialty: 'Cardiology',
      reason: 'ECG follow-up and cardiac review',
      duration: 30,
      location: 'Cardiac Care Center',
      notes: 'ECG normal. Echo recommended for comprehensive evaluation.',
    },

    // January 2025 - upcoming/scheduled
    {
      id: 'APT020',
      patientId: 'PPROF001',
      doctorId: 'DPROF001',
      scheduledAt: new Date('2025-01-10T09:00:00'),
      type: 'video',
      status: 'upcoming',
      specialty: 'Endocrinology',
      reason: 'Quarterly diabetes management review',
      duration: 30,
      notes: 'HbA1c recheck and medication adjustment if needed.',
    },
    {
      id: 'APT021',
      patientId: 'PPROF003',
      doctorId: 'DPROF001',
      scheduledAt: new Date('2025-01-20T11:00:00'),
      type: 'video',
      status: 'upcoming',
      specialty: 'Endocrinology',
      reason: 'Thyroid recheck - 6-week follow-up',
      duration: 20,
      notes: 'Recheck TSH after levothyroxine initiation.',
    },
    {
      id: 'APT022',
      patientId: 'PPROF004',
      doctorId: 'DPROF003',
      scheduledAt: new Date('2025-01-15T08:30:00'),
      type: 'in-person',
      status: 'upcoming',
      specialty: 'Cardiology',
      reason: 'Cholesterol and BP management review',
      duration: 30,
      location: 'Cardiac Care Center',
      notes: 'Recheck lipid panel results.',
    },
    {
      id: 'APT023',
      patientId: 'PPROF002',
      doctorId: 'DPROF002',
      scheduledAt: new Date('2025-01-22T15:00:00'),
      type: 'in-person',
      status: 'cancelled',
      specialty: 'General Medicine',
      reason: 'Gastritis follow-up',
      duration: 20,
      location: 'Rose Hill Medical Clinic',
      notes: 'Patient requested phone follow-up instead.',
    },
  ]
  await prisma.appointment.createMany({ data: appointments, skipDuplicates: true })

  // ─── Summary ───────────────────────────────────────────────────────────────

  console.log(`  Seeded enriched data:`)
  console.log(`    ${medicalRecords.length} medical records (MR006–MR015)`)
  console.log(`    ${prescriptions.length} prescriptions (PRE006–PRE010) with ${prescriptionMedicines.length} prescription medicines`)
  console.log(`    ${vitalSigns.length} vital signs (Oct–Dec 2024)`)
  console.log(`    ${labTests.length} lab tests (LT005–LT010) with ${labTestResults.length} lab test results`)
  console.log(`    ${nutritionAnalyses.length} nutrition analyses`)
  console.log(`    ${appointments.length} appointments (APT009–APT023)`)
}
