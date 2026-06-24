import { PrismaClient } from '@prisma/client'

export async function seedDoctorPosts(prisma: PrismaClient) {
  console.log('📝 Seeding doctor posts...')

  // Get doctors
  const doctors = await prisma.user.findMany({
    where: { userType: 'DOCTOR' },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { createdAt: 'asc' },
  })

  // Get some patients and other users for comments
  const commenters = await prisma.user.findMany({
    where: { userType: { in: ['MEMBER', 'NURSE', 'PHARMACIST'] } },
    select: { id: true, firstName: true, userType: true },
    take: 6,
  })

  if (doctors.length === 0) {
    console.log('  ⚠️ No doctors found, skipping posts seed')
    return
  }

  const posts = [
    {
      authorId: doctors[0]?.id,
      content: "Understanding Diabetes Management in Mauritius\n\nDiabetes affects approximately 22% of adults in Mauritius, making it one of the highest rates in the world. Here are key tips for managing your blood sugar:\n\n1. Monitor your HbA1c levels every 3 months\n2. Maintain a balanced diet rich in local vegetables like brède, lalos, and chouchou\n3. Stay physically active - aim for 30 minutes of walking daily\n4. Take medications as prescribed\n5. Regular eye and foot check-ups are essential\n\nPrevention starts with awareness. Share this with someone who needs it.",
      category: 'health_tips',
      tags: ['diabetes', 'prevention', 'mauritius', 'health'],
      imageUrl: '/images/feed/diabetes.jpg',
    },
    {
      authorId: doctors[0]?.id,
      content: "The Importance of Mental Health in Healthcare Workers\n\nAs healthcare professionals, we often prioritize our patients' well-being over our own. But burnout is real, and it affects the quality of care we provide.\n\nSigns to watch for:\n- Constant fatigue despite adequate rest\n- Emotional detachment from patients\n- Irritability and mood changes\n- Difficulty concentrating\n\nPlease remember: seeking help is a sign of strength, not weakness. MediWyz offers confidential consultations for healthcare workers too.",
      category: 'wellness',
      tags: ['mental-health', 'burnout', 'healthcare-workers'],
      imageUrl: '/images/feed/mental-health.jpg',
    },
    {
      authorId: doctors[1]?.id || doctors[0]?.id,
      content: "Hypertension: The Silent Killer\n\nHigh blood pressure often shows no symptoms until it's too late. In Mauritius, cardiovascular disease is the leading cause of death.\n\nWhat you can do:\n- Check your blood pressure regularly (at least once a month)\n- Reduce salt intake - be mindful of soy sauce and preserved foods\n- Limit alcohol consumption\n- Exercise regularly\n- Manage stress through meditation or yoga\n\nBook a check-up today. Early detection saves lives.",
      category: 'article',
      tags: ['hypertension', 'cardiovascular', 'prevention'],
      imageUrl: '/images/feed/hypertension.jpg',
    },
    {
      authorId: doctors[1]?.id || doctors[0]?.id,
      content: "New Advances in Telemedicine\n\nThe COVID-19 pandemic accelerated the adoption of telemedicine worldwide, and Mauritius is no exception. At MediWyz, we're proud to offer:\n\n- HD Video consultations\n- Real-time vital signs monitoring\n- Digital prescription management\n- Secure medical record sharing\n\nTelemedicine is not a replacement for in-person visits, but it's a powerful complement. Especially for follow-up consultations and chronic disease management.",
      category: 'news',
      tags: ['telemedicine', 'innovation', 'mediwyz'],
      imageUrl: '/images/feed/telemedicine.jpg',
    },
    {
      authorId: doctors[2]?.id || doctors[0]?.id,
      content: "Childhood Vaccinations: What Every Parent Should Know\n\nThe Expanded Programme on Immunization (EPI) in Mauritius covers essential vaccines for children. Here's the schedule:\n\n- Birth: BCG, Hepatitis B\n- 6 weeks: DTP, OPV, Hib\n- 10 weeks: DTP, OPV, Hib\n- 14 weeks: DTP, OPV, Hib\n- 9 months: Measles\n- 15-18 months: MMR\n\nVaccines are safe, effective, and free at government health centres. Don't skip them!",
      category: 'health_tips',
      tags: ['vaccination', 'children', 'parenting'],
      imageUrl: '/images/feed/vaccination.jpg',
    },
    {
      authorId: doctors[2]?.id || doctors[0]?.id,
      content: "Managing Seasonal Allergies in Tropical Climates\n\nWhile we don't experience traditional seasons like temperate countries, Mauritius has its own allergy triggers:\n\n- Sugarcane flowering season (September-November)\n- Dust mites (year-round in humid climates)\n- Mold spores (especially during cyclone season)\n\nTreatment options:\n- Antihistamines (available at MediWyz partner pharmacies)\n- Nasal corticosteroid sprays\n- Allergen avoidance strategies\n- Immunotherapy for severe cases\n\nConsult with us if OTC medications aren't helping.",
      category: 'health_tips',
      tags: ['allergies', 'tropical', 'treatment'],
      imageUrl: '/images/feed/allergies.jpg',
    },
    {
      authorId: doctors[0]?.id,
      content: "Case Study: Successful Management of Type 2 Diabetes Through Lifestyle Changes\n\nPatient (anonymized): 45-year-old male, BMI 32, HbA1c 9.2%\n\nIntervention (6 months):\n- Structured diet plan incorporating local foods\n- Daily 40-minute walks\n- Stress management techniques\n- Regular glucose monitoring\n- Metformin 500mg twice daily\n\nResults:\n- HbA1c reduced to 6.8%\n- Weight loss: 8 kg\n- Blood pressure normalized\n- Medication dosage reduced\n\nThis case demonstrates that lifestyle modifications, combined with appropriate medication, can dramatically improve outcomes.",
      category: 'case_study',
      tags: ['diabetes', 'case-study', 'lifestyle', 'success'],
      imageUrl: '/images/feed/case-study.jpg',
    },
    {
      authorId: doctors[1]?.id || doctors[0]?.id,
      content: "Nutrition Tips for a Healthy Heart\n\nWhat to eat more of:\n- Fish (especially tuna and mackerel - abundant in Mauritius)\n- Leafy greens (brède, watercress, spinach)\n- Fruits (papaya, guava, banana)\n- Whole grains\n- Nuts and seeds\n\nWhat to limit:\n- Processed meats (sausages, ham)\n- Fried foods (gateau piment in moderation!)\n- Sugary drinks\n- Excessive salt\n\nA healthy diet doesn't mean giving up our culture. It means making smarter choices with the wonderful ingredients available to us.",
      category: 'wellness',
      tags: ['nutrition', 'heart-health', 'mauritius-food'],
      imageUrl: '/images/feed/nutrition.jpg',
    },
  ]

  const createdPosts = []
  for (const post of posts) {
    if (!post.authorId) continue
    const created = await prisma.post.create({
      data: {
        authorId: post.authorId,
        content: post.content,
        category: post.category,
        tags: post.tags,
        imageUrl: post.imageUrl,
        isPublished: true,
      },
    })
    createdPosts.push(created)
  }

  // Add comments from various users
  const commentTexts = [
    "Thank you for sharing this, Doctor! Very informative.",
    "This is exactly what I needed to read. I've been struggling with this.",
    "Can you elaborate on the dietary recommendations? I'd love more specifics.",
    "Shared with my family. Prevention is better than cure!",
    "As a nurse, I see these cases daily. Great summary.",
    "Is it possible to book a consultation to discuss this further?",
    "Very well explained. The statistics are eye-opening.",
    "My mother was just diagnosed. This gives us hope. Thank you.",
    "The local food recommendations are very practical. Love it!",
    "Could you write about kidney disease management next?",
    "This should be mandatory reading for all Mauritians.",
    "I've been following these tips for 3 months and already see improvement!",
    "Do you recommend any specific supplements along with the diet?",
    "Excellent case study! More doctors should share their successes.",
    "The telemedicine service has been a lifesaver for my elderly parents.",
    "When is the best time to get vaccinated? Any specific center you recommend?",
  ]

  let commentIndex = 0
  for (const post of createdPosts) {
    // Add 2-3 comments per post
    const numComments = Math.min(2 + Math.floor(commentIndex % 3), commentTexts.length - commentIndex)
    for (let i = 0; i < numComments && commentIndex < commentTexts.length; i++) {
      const commenter = commenters[commentIndex % commenters.length]
      if (commenter) {
        await prisma.postComment.create({
          data: {
            postId: post.id,
            authorId: commenter.id,
            content: commentTexts[commentIndex],
          },
        })
      }
      commentIndex++
    }

    // Add some likes
    for (let i = 0; i < Math.min(3, commenters.length); i++) {
      if (commenters[i]) {
        await prisma.postLike.upsert({
          where: { postId_userId: { postId: post.id, userId: commenters[i].id } },
          update: {},
          create: { postId: post.id, userId: commenters[i].id },
        })
      }
    }

    // Update like count
    const likeCount = await prisma.postLike.count({ where: { postId: post.id } })
    await prisma.post.update({
      where: { id: post.id },
      data: { likeCount },
    })
  }

  console.log(`  ✅ Created ${createdPosts.length} posts with ${commentIndex} comments`)
}
