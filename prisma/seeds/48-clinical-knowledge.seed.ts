import prisma from '../../lib/db'

/**
 * Seeds the AI assistant's clinical knowledge base. Each row maps a
 * condition to one line of dietary/wellness guidance that gets injected
 * into the AI system prompt when a user has that condition on file.
 *
 * Regional admins can later edit / add / deactivate rows via the admin
 * UI without touching code. Keep the guidance short (< 200 chars) - the
 * prompt has a 4KB soft budget and long lines eat it fast.
 */
export async function seedClinicalKnowledge() {
  const entries = [
    {
      conditionKey: 'diabetes',
      aliases: ['diabetic', 'type 2 diabetes', 'type 1 diabetes', 't2dm', 't1dm'],
      dietaryGuidance: 'Diabetes: low-GI foods, limit added sugars, emphasise fibre-rich veg, whole grains, lean protein; monitor carbs.',
      sources: ['ADA 2024 Standards of Care'],
    },
    {
      conditionKey: 'hypertension',
      aliases: ['high blood pressure', 'htn'],
      dietaryGuidance: 'Hypertension: DASH diet, <2300mg sodium/day, more potassium (bananas, sweet potato, spinach), limit alcohol + caffeine.',
      sources: ['NIH DASH Diet guidelines'],
    },
    {
      conditionKey: 'cholesterol',
      aliases: ['high cholesterol', 'hyperlipidemia', 'dyslipidemia'],
      dietaryGuidance: 'High cholesterol: heart-healthy fats (olive oil, nuts, fish), limit saturated + trans fats, more soluble fibre (oats, beans, lentils).',
      sources: ['AHA Dietary Guidelines'],
    },
    {
      conditionKey: 'asthma',
      aliases: ['reactive airway disease'],
      dietaryGuidance: 'Asthma: anti-inflammatory omega-3 rich foods, antioxidants; avoid sulfite-preserved foods.',
      sources: [],
    },
    {
      conditionKey: 'anemia',
      aliases: ['anaemia', 'iron deficiency'],
      dietaryGuidance: 'Anemia: iron-rich foods (red meat, spinach, lentils); pair with vitamin C; avoid tea/coffee with meals.',
      sources: [],
    },
    {
      conditionKey: 'kidney',
      aliases: ['renal', 'ckd', 'chronic kidney disease'],
      dietaryGuidance: 'Kidney concerns: watch potassium, phosphorus, sodium; monitor protein. Refer to renal dietitian.',
      sources: ['KDIGO 2024 guidelines'],
    },
    {
      conditionKey: 'obesity',
      aliases: ['overweight', 'bmi>30'],
      dietaryGuidance: 'Weight management: portion control, calorie-aware eating, whole foods, regular activity, sustainable gradual change.',
      sources: [],
    },
  ];

  let created = 0, updated = 0;
  for (const entry of entries) {
    const existing = await prisma.clinicalKnowledge.findUnique({
      where: { conditionKey: entry.conditionKey },
    });
    if (existing) {
      await prisma.clinicalKnowledge.update({
        where: { id: existing.id },
        data: entry,
      });
      updated++;
    } else {
      await prisma.clinicalKnowledge.create({
        data: { ...entry, category: 'nutrition', active: true },
      });
      created++;
    }
  }
  console.log(`  ✓ clinical knowledge: ${created} created, ${updated} updated`);
}

if (require.main === module) {
  seedClinicalKnowledge().finally(() => prisma.$disconnect());
}
