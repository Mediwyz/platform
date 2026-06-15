import { PrismaClient } from '@prisma/client'

export async function seedHealthTrackerDemo(prisma: PrismaClient) {
  console.log('Seeding health tracker demo data...')

  // Clean existing data
  await prisma.mealPlanEntry.deleteMany()
  await prisma.dailyGoalSnapshot.deleteMany()
  await prisma.waterEntry.deleteMany()
  await prisma.exerciseEntry.deleteMany()
  await prisma.foodEntry.deleteMany()
  await prisma.healthTrackerProfile.deleteMany()

  // Get all patients
  const patients = await prisma.user.findMany({
    where: { userType: 'MEMBER' },
    select: { id: true, firstName: true, gender: true },
    take: 3,
  })

  if (patients.length === 0) {
    console.log('  No patients found, skipping health tracker demo')
    return
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const patient of patients) {
    // Create profile
    const isFemale = patient.gender === 'Female' || patient.gender === 'female'
    await prisma.healthTrackerProfile.create({
      data: {
        userId: patient.id,
        heightCm: isFemale ? 162 : 175,
        weightKg: isFemale ? 58 : 72,
        age: 30,
        gender: isFemale ? 'female' : 'male',
        activityLevel: 'moderately_active',
        weightGoal: 'maintain',
        targetCalories: isFemale ? 1900 : 2300,
        targetWaterMl: 2000,
        targetExerciseMin: 30,
        dietaryPreferences: [],
        allergenSettings: [],
        tdeeCalories: isFemale ? 1900 : 2300,
      },
    })

    // Create 7 days of food entries
    const meals = [
      { type: 'breakfast' as const, foods: [
        { name: 'Oats', calories: 154, protein: 5.3, carbs: 27, fat: 2.6 },
        { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
      ]},
      { type: 'lunch' as const, foods: [
        { name: 'White Rice (cooked)', calories: 206, protein: 4.3, carbs: 45, fat: 0.4 },
        { name: 'Chicken Curry', calories: 243, protein: 19, carbs: 8, fat: 15 },
      ]},
      { type: 'dinner' as const, foods: [
        { name: 'Roti / Chapati', calories: 240, protein: 7, carbs: 40, fat: 7 },
        { name: 'Lentils / Dal (cooked)', calories: 230, protein: 18, carbs: 40, fat: 0.8 },
      ]},
      { type: 'snack' as const, foods: [
        { name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
      ]},
    ]

    const exercises = [
      { type: 'Walking', duration: 30, calories: 150, intensity: 'moderate' as const },
      { type: 'Running', duration: 20, calories: 250, intensity: 'vigorous' as const },
      { type: 'Yoga', duration: 45, calories: 180, intensity: 'light' as const },
      { type: 'Cycling', duration: 25, calories: 220, intensity: 'moderate' as const },
      { type: 'Swimming', duration: 30, calories: 300, intensity: 'vigorous' as const },
      { type: 'Weight Training', duration: 40, calories: 200, intensity: 'moderate' as const },
      { type: 'Walking', duration: 35, calories: 170, intensity: 'light' as const },
    ]

    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const date = new Date(today)
      date.setDate(date.getDate() - dayOffset)
      const dateStr = date.toISOString()

      // Food entries
      const mealTimes = [7, 12, 19, 15] // hours
      for (let mi = 0; mi < meals.length; mi++) {
        const meal = meals[mi]
        for (const food of meal.foods) {
          const time = new Date(date)
          time.setHours(mealTimes[mi], Math.floor(Math.random() * 30), 0, 0)
          await prisma.foodEntry.create({
            data: {
              userId: patient.id,
              date: new Date(dateStr),
              time,
              mealType: meal.type,
              name: food.name,
              calories: food.calories + Math.floor(Math.random() * 30 - 15),
              protein: food.protein,
              carbs: food.carbs,
              fat: food.fat,
              quantity: 1,
              unit: 'serving',
            },
          })
        }
      }

      // Exercise entry
      const exercise = exercises[dayOffset % exercises.length]
      await prisma.exerciseEntry.create({
        data: {
          userId: patient.id,
          date: new Date(dateStr),
          exerciseType: exercise.type,
          durationMin: exercise.duration,
          caloriesBurned: exercise.calories + Math.floor(Math.random() * 40 - 20),
          intensity: exercise.intensity,
        },
      })

      // Water entries (6-10 glasses per day)
      const glassCount = 6 + Math.floor(Math.random() * 5)
      for (let g = 0; g < glassCount; g++) {
        await prisma.waterEntry.create({
          data: {
            userId: patient.id,
            date: new Date(dateStr),
            amountMl: 250,
          },
        })
      }
    }

    // Create a sample meal plan for this week
    const monday = new Date(today)
    monday.setDate(monday.getDate() - monday.getDay() + 1) // Monday
    monday.setHours(0, 0, 0, 0)

    const planMeals = [
      { day: 0, type: 'breakfast' as const, name: 'Greek Yogurt Parfait', desc: 'A refreshing breakfast parfait layered with Greek yogurt, berries, granola, and honey.', cal: 410, p: 24, c: 60, f: 10 },
      { day: 0, type: 'lunch' as const, name: 'Grilled Chicken Avocado Salad', desc: 'A nutrient-rich lunch with lean grilled chicken breast, creamy avocado, fresh vegetables, and a light vinaigrette.', cal: 550, p: 40, c: 35, f: 28 },
      { day: 0, type: 'snack' as const, name: 'Hummus & Veggie Sticks', desc: 'A satiating afternoon snack of creamy hummus and crisp fresh vegetables.', cal: 210, p: 6, c: 23, f: 11 },
      { day: 0, type: 'dinner' as const, name: 'Salmon, Brown Rice & Roasted Broccoli', desc: 'A wholesome dinner with omega-3 rich salmon, fluffy brown rice, and oven-roasted broccoli.', cal: 650, p: 38, c: 64, f: 24 },
      { day: 1, type: 'breakfast' as const, name: 'Oatmeal with Banana & Almonds', desc: 'Hearty oatmeal topped with sliced banana, almonds, and a drizzle of honey.', cal: 380, p: 12, c: 58, f: 12 },
      { day: 1, type: 'lunch' as const, name: 'Dholl Puri with Chicken Curry', desc: 'Traditional Mauritian dholl puri stuffed with savory chicken curry and pickles.', cal: 520, p: 22, c: 60, f: 20 },
      { day: 1, type: 'snack' as const, name: 'Fresh Mango Slices', desc: 'Sweet, juicy mango slices - a tropical Mauritian favorite.', cal: 135, p: 1, c: 35, f: 0.6 },
      { day: 1, type: 'dinner' as const, name: 'Cari Poisson with White Rice', desc: 'Authentic Mauritian fish curry served with fluffy steamed rice.', cal: 480, p: 28, c: 52, f: 16 },
    ]

    for (const pm of planMeals) {
      await prisma.mealPlanEntry.create({
        data: {
          userId: patient.id,
          weekStartDate: monday,
          dayOfWeek: pm.day,
          mealType: pm.type,
          name: pm.name,
          description: pm.desc,
          calories: pm.cal,
          protein: pm.p,
          carbs: pm.c,
          fat: pm.f,
          isGenerated: true,
        },
      })
    }
  }

  console.log(`  Created health tracker profiles and demo data for ${patients.length} patients`)
}
