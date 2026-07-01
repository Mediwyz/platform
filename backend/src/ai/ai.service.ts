import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { checkEmergency, buildEmergencyResponse } from './safety/emergency-gate';
import { checkAllergies } from './safety/allergy-filter';
import { ClinicalKnowledgeService } from './clinical-knowledge.service';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Env-configurable (see agent.service.ts) so models can be swapped without a redeploy.
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const PROMPT_VERSION = '2026.04.1-centralised-profile';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Rich, role-aware profile context passed into every AI prompt. Pulled
 * from the same centralised `/profile/[id]` page the user edits, so the
 * assistant sees EXACTLY what the user sees on their profile — nothing
 * goes stale, nothing is hidden.
 *
 * Structured into three slices:
 *   - `identity`  — basic facts (always available)
 *   - `health`    — tracker + clinical (populated for users who've filled
 *                   the health tracker OR have a PatientProfile)
 *   - `provider`  — only for provider users (DoctorProfile / NurseProfile / …)
 */
interface UserAiContext {
  identity: {
    userId: string;
    firstName: string;
    lastName: string;
    userType: string;       // MEMBER / DOCTOR / NURSE / …
    age?: number;           // derived from DOB or HealthTrackerProfile.age
    gender?: string;
    language?: string;      // en / fr / mfe — drives response language
    regionCode?: string;    // MU / MG / KE / …
  };
  health?: {
    bloodType?: string;
    allergies: string[];
    chronicConditions: string[];
    healthScore?: number;
    recentDiagnoses: string[];
    activeMedications: string[];
    heightCm?: number;
    weightKg?: number;
    bmi?: number;
    activityLevel?: string;
    weightGoal?: string;
    dietaryPreferences: string[];
    allergenSettings: string[];
    targetCalories?: number;
    targetWaterMl?: number;
    targetExerciseMin?: number;
    targetSleepMin?: number;
  };
  provider?: {
    specialty?: string[];
    subSpecialties?: string[];
    experience?: string;
    bio?: string;
    languages?: string[];
    rating?: number;
  };
}

/** Legacy alias kept for callers that still import the old interface. */
type PatientContext = UserAiContext;

interface InsightRecord {
  date: Date;
  category: string;
  summary: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private prisma: PrismaService,
    // Optional so existing unit tests that `new AiService(prismaStub)` keep working.
    private clinicalKnowledge?: ClinicalKnowledgeService,
  ) {}

  // ─── Unified user AI context (centralised-profile-aware) ─────────────────
  //
  // Pulls EVERY field the user maintains on `/profile/[id]` into one object
  // the prompt builder can consume. Works for any user type — MEMBER gets
  // health + tracker data, providers additionally get their specialty / bio
  // / experience so the assistant can tailor professional responses.

  async getPatientContext(userId: string): Promise<UserAiContext | null> {
    return this.getUserContext(userId);
  }

  async getUserContext(userId: string): Promise<UserAiContext | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, firstName: true, lastName: true, userType: true,
        dateOfBirth: true, gender: true,
        region: { select: { countryCode: true, language: true } },
        preferences: { select: { language: true } },
        patientProfile: {
          select: {
            bloodType: true,
            allergies: true,
            chronicConditions: true,
            healthScore: true,
            medicalRecords: {
              where: { date: { gte: new Date(Date.now() - 365 * 86400e3) } },
              select: { diagnosis: true },
              orderBy: { date: 'desc' as const },
              take: 10,
            },
            prescriptions: {
              where: { isActive: true },
              select: {
                medicines: {
                  select: {
                    medicine: { select: { name: true } },
                    dosage: true, frequency: true,
                  },
                },
              },
              take: 10,
            },
          },
        },
        healthTrackerProfile: {
          select: {
            heightCm: true, weightKg: true, age: true, gender: true,
            activityLevel: true, weightGoal: true,
            dietaryPreferences: true, allergenSettings: true,
            targetCalories: true, targetWaterMl: true,
            targetExerciseMin: true, targetSleepMin: true,
          },
        },
        doctorProfile: {
          select: {
            specialty: true, subSpecialties: true, experience: true,
            bio: true, languages: true, rating: true,
          },
        },
        nurseProfile: {
          select: { specializations: true, experience: true, languages: true },
        },
      },
    }).catch(() => null);

    if (!user) return null;

    // Derive age: HealthTrackerProfile.age wins (user set explicitly), else DOB.
    const htAge = user.healthTrackerProfile?.age;
    const dobAge = user.dateOfBirth
      ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 86400e3))
      : undefined;
    const age = htAge ?? dobAge;

    const ht = user.healthTrackerProfile;
    const pp = user.patientProfile;
    const dp = user.doctorProfile;
    const np = user.nurseProfile;

    const bmi = ht?.heightCm && ht?.weightKg
      ? Math.round((ht.weightKg / Math.pow(ht.heightCm / 100, 2)) * 10) / 10
      : undefined;

    const ctx: UserAiContext = {
      identity: {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        age,
        gender: ht?.gender ?? user.gender ?? undefined,
        language: user.preferences?.language ?? user.region?.language ?? 'en',
        regionCode: user.region?.countryCode ?? undefined,
      },
    };

    // Health slice — populated whenever there's ANY clinical / tracker data.
    if (pp || ht) {
      const recentDiagnoses = pp?.medicalRecords
        ?.map((r) => r.diagnosis)
        .filter((d): d is string => !!d) ?? [];
      const activeMedications = pp?.prescriptions?.flatMap((p: any) =>
        p.medicines.map((m: any) => `${m.medicine.name} (${m.dosage}, ${m.frequency})`),
      ) ?? [];
      ctx.health = {
        bloodType: pp?.bloodType,
        allergies: pp?.allergies ?? [],
        chronicConditions: pp?.chronicConditions ?? [],
        healthScore: pp?.healthScore,
        recentDiagnoses,
        activeMedications,
        heightCm: ht?.heightCm ?? undefined,
        weightKg: ht?.weightKg ?? undefined,
        bmi,
        activityLevel: ht?.activityLevel,
        weightGoal: ht?.weightGoal,
        dietaryPreferences: ht?.dietaryPreferences ?? [],
        allergenSettings: ht?.allergenSettings ?? [],
        targetCalories: ht?.targetCalories ?? undefined,
        targetWaterMl: ht?.targetWaterMl,
        targetExerciseMin: ht?.targetExerciseMin,
        targetSleepMin: ht?.targetSleepMin,
      };
    }

    // Provider slice — only for users whose provider profile exists.
    if (dp) {
      ctx.provider = {
        specialty: dp.specialty,
        subSpecialties: dp.subSpecialties,
        experience: dp.experience,
        bio: dp.bio,
        languages: dp.languages,
        rating: dp.rating,
      };
    } else if (np) {
      ctx.provider = {
        specialty: np.specializations,
        experience: typeof np.experience === 'string' ? np.experience : `${np.experience}`,
        languages: np.languages,
      };
    }

    return ctx;
  }

  // ─── Legacy compat — existing call sites that deconstruct the flat shape
  /** @deprecated Use `getUserContext` and read `ctx.identity/.health`. */
  async getLegacyPatientContextFlat(userId: string): Promise<{
    firstName: string; lastName: string; bloodType: string;
    allergies: string[]; chronicConditions: string[]; healthScore: number;
    recentDiagnoses: string[]; activeMedications: string[];
  } | null> {
    const ctx = await this.getUserContext(userId);
    if (!ctx?.health) return null;
    return {
      firstName: ctx.identity.firstName,
      lastName: ctx.identity.lastName,
      bloodType: ctx.health.bloodType ?? '',
      allergies: ctx.health.allergies,
      chronicConditions: ctx.health.chronicConditions,
      healthScore: ctx.health.healthScore ?? 0,
      recentDiagnoses: ctx.health.recentDiagnoses,
      activeMedications: ctx.health.activeMedications,
    };
  }

  // ─── Dietary Insight Storage & Retrieval ─────────────────────────────────────

  async getRecentInsights(userId: string, days: number = 14): Promise<string> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const insights = await this.prisma.aiPatientInsight.findMany({
      where: {
        userId,
        date: { gte: since },
      },
      orderBy: { date: 'desc' },
      select: {
        date: true,
        category: true,
        summary: true,
      },
    });

    if (insights.length === 0) return '';

    // Group by date for readability
    const grouped: Record<string, InsightRecord[]> = {};
    for (const ins of insights) {
      const dateKey = ins.date.toISOString().split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(ins);
    }

    const lines: string[] = ['PATIENT RECENT HISTORY (last ' + days + ' days):'];
    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    for (const dateKey of sortedDates) {
      const dayName = new Date(dateKey + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
      lines.push(`\n${dayName} (${dateKey}):`);
      for (const ins of grouped[dateKey]) {
        lines.push(`  - [${ins.category}] ${ins.summary}`);
      }
    }

    return lines.join('\n');
  }

  // ─── Extract and Store Insights ──────────────────────────────────────────────

  async extractAndStoreInsights(
    userId: string,
    userMessage: string,
    assistantResponse: string,
    apiKey: string,
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    const extractionPrompt = `You are a data extraction tool. Today is ${dayOfWeek}, ${today}.

Analyze the following conversation exchange and extract any health/dietary/exercise/symptom information the patient mentioned. Output ONLY a valid JSON array (no markdown, no explanation). Each item must have:
- "date": the ISO date (YYYY-MM-DD) the information refers to. If the patient says "today", use "${today}". If they say "yesterday", compute it. If they say a weekday name like "Monday", resolve it to the most recent past occurrence (or today if it matches). If unclear, use "${today}".
- "category": one of "food", "exercise", "symptom", "medication", "sleep", "water", "mood"
- "summary": a concise one-line summary of what was reported (max 150 chars)

If NO health/dietary/exercise information is present (e.g. the user is just asking a general question or greeting), return an empty array: []

USER MESSAGE: ${userMessage}

ASSISTANT RESPONSE: ${assistantResponse}

JSON ARRAY:`;

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: 'user', content: extractionPrompt }],
          temperature: 0.1,
          max_tokens: 512,
        }),
      });

      if (!response.ok) return;

      const data: GroqResponse = await response.json();
      const raw = data.choices?.[0]?.message?.content?.trim();
      if (!raw) return;

      // Parse the JSON array from the response
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return;

      const parsed: { date: string; category: string; summary: string }[] = JSON.parse(
        jsonMatch[0],
      );
      if (!Array.isArray(parsed) || parsed.length === 0) return;

      const validCategories = [
        'food',
        'exercise',
        'symptom',
        'medication',
        'sleep',
        'water',
        'mood',
      ];

      const insightsToCreate = parsed
        .filter(
          (item) =>
            item.date &&
            item.category &&
            item.summary &&
            validCategories.includes(item.category) &&
            item.summary.length <= 300,
        )
        .map((item) => ({
          userId,
          date: new Date(item.date + 'T12:00:00Z'),
          category: item.category,
          summary: item.summary.substring(0, 300),
        }));

      if (insightsToCreate.length > 0) {
        await this.prisma.aiPatientInsight.createMany({ data: insightsToCreate });
      }
    } catch {
      // Silent — insight extraction failure should never break the chat
    }
  }

  // ─── Health Tracker Context ─────────────────────────────────────────────────

  async getTrackerContext(userId: string): Promise<string> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
      const [foodEntries, exerciseEntries, waterEntries, sleepEntry, profile] = await Promise.all([
        this.prisma.foodEntry.aggregate({
          where: { userId, date: { gte: today, lt: tomorrow } },
          _sum: { calories: true, protein: true, carbs: true, fat: true },
        }),
        this.prisma.exerciseEntry.aggregate({
          where: { userId, date: { gte: today, lt: tomorrow } },
          _sum: { caloriesBurned: true, durationMin: true },
        }),
        this.prisma.waterEntry.aggregate({
          where: { userId, date: { gte: today, lt: tomorrow } },
          _sum: { amountMl: true },
        }),
        this.prisma.sleepEntry.findFirst({
          where: { userId, date: { gte: today, lt: tomorrow } },
          select: { durationMin: true, quality: true },
        }),
        this.prisma.healthTrackerProfile.findUnique({
          where: { userId },
          select: {
            targetCalories: true,
            targetWaterMl: true,
            targetExerciseMin: true,
            targetSleepMin: true,
            weightGoal: true,
            dietaryPreferences: true,
          },
        }),
      ]);

      const caloriesConsumed = foodEntries._sum.calories || 0;
      const caloriesBurned = exerciseEntries._sum.caloriesBurned || 0;
      const waterMl = waterEntries._sum.amountMl || 0;
      const exerciseMin = exerciseEntries._sum.durationMin || 0;
      const targetCal = profile?.targetCalories || 2000;
      const targetWater = profile?.targetWaterMl || 2000;
      const targetExercise = profile?.targetExerciseMin || 30;
      const targetSleep = profile?.targetSleepMin || 480;
      const sleepMin = sleepEntry?.durationMin || 0;
      const sleepQuality = sleepEntry?.quality || 'not logged';
      const sleepHours = Math.floor(sleepMin / 60);
      const sleepMins = sleepMin % 60;

      const lines = [
        `\nTODAY'S HEALTH TRACKER DATA:`,
        `- Calories consumed: ${caloriesConsumed} / ${targetCal} cal (${Math.round((caloriesConsumed / targetCal) * 100)}%)`,
        `- Calories burned: ${caloriesBurned} cal`,
        `- Net calories: ${caloriesConsumed - caloriesBurned} cal`,
        `- Water intake: ${waterMl}ml / ${targetWater}ml (${Math.round((waterMl / targetWater) * 100)}%)`,
        `- Exercise: ${exerciseMin} / ${targetExercise} min`,
        `- Sleep: ${sleepMin > 0 ? `${sleepHours}h ${sleepMins}m` : 'not logged'} / ${Math.floor(targetSleep / 60)}h target (quality: ${sleepQuality})`,
        `- Weight goal: ${profile?.weightGoal || 'maintain'}`,
      ];

      if (profile?.dietaryPreferences && profile.dietaryPreferences.length > 0) {
        lines.push(`- Dietary preferences: ${profile.dietaryPreferences.join(', ')}`);
      }

      return lines.join('\n');
    } catch {
      return ''; // Silent failure — tracker data is optional
    }
  }

  // ─── System Prompt Builder ───────────────────────────────────────────────────
  //
  // Consumes the rich `UserAiContext` produced by `getUserContext()` and
  // composes a single system prompt. When a `provider` slice is present, a
  // provider-tier preamble is prepended so clinicians get professional-grade
  // answers, not the generic patient wellness tone.

  buildSystemPrompt(
    context: UserAiContext,
    insightsSummary: string,
    trackerContext: string = '',
    conditionNotes: string[] = [],
  ): string {
    const { identity, health, provider } = context;
    const chronic = health?.chronicConditions ?? [];
    const allergies = health?.allergies ?? [];
    const dietaryPrefs = health?.dietaryPreferences ?? [];
    const allergens = health?.allergenSettings ?? [];

    const allergyNote = allergies.length > 0
      ? `CRITICAL — diagnosed allergies: ${allergies.join(', ')}. NEVER recommend foods/supplements containing these.`
      : 'No known food allergies on file.';
    const userSetAllergenNote = allergens.length > 0
      ? `User also flagged these allergens in tracker settings: ${allergens.join(', ')}.`
      : '';
    const medicationNote = (health?.activeMedications?.length ?? 0) > 0
      ? `Active medications: ${health!.activeMedications.join('; ')}. Watch for food-drug interactions.`
      : 'No active medications on file.';
    const diagnosisNote = (health?.recentDiagnoses?.length ?? 0) > 0
      ? `Recent diagnoses (past year): ${health!.recentDiagnoses.join(', ')}.`
      : '';
    const dietPrefNote = dietaryPrefs.length > 0
      ? `Declared dietary preferences: ${dietaryPrefs.join(', ')}. Respect them in every suggestion.`
      : '';
    const goalNote = health?.weightGoal
      ? `Stated goal: ${health.weightGoal.replace('_', ' ')}. Activity level: ${health.activityLevel ?? 'unknown'}.`
      : '';
    const bodyNote = health?.heightCm && health?.weightKg
      ? `Body: ${health.heightCm}cm / ${health.weightKg}kg / BMI ${health.bmi}.`
      : '';
    const targetsNote = health?.targetCalories
      ? `Daily targets: ${health.targetCalories} kcal, ${health.targetWaterMl}ml water, ${health.targetExerciseMin} min exercise, ${Math.round((health.targetSleepMin ?? 480) / 60)}h sleep.`
      : '';

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const langNote = identity.language && identity.language !== 'en'
      ? `User's preferred language: ${identity.language}. Respond in that language unless the user writes in another.`
      : '';

    // ── Provider-tier prompt ───────────────────────────────────────────
    if (provider) {
      const specialty = provider.specialty?.join(', ') ?? 'General practice';
      return `You are MediWyz AI Assistant, talking to ${identity.firstName} ${identity.lastName}, a ${specialty} practitioner on the MediWyz platform.
Today is ${today}. ${langNote}

PROVIDER PROFILE:
- Role: ${identity.userType}
- Specialty: ${specialty}${provider.subSpecialties?.length ? ` (sub-specialties: ${provider.subSpecialties.join(', ')})` : ''}
- Experience: ${provider.experience ?? 'n/a'}
- Languages: ${provider.languages?.join(', ') ?? 'n/a'}
- Bio: ${provider.bio ?? 'Not provided'}

PROVIDER-TIER GUIDELINES:
1. You are speaking with a qualified clinician. Skip the usual "consult a doctor" disclaimers — THEY are the doctor.
2. Give clinical-grade information: differentials, dosing ranges, interaction tables, guideline citations when you can.
3. When the user asks about a patient's case, treat the question as a professional consult, not a patient question. Keep it focused and evidence-based.
4. If you lack information, say so plainly rather than guessing.
5. Use markdown tables for dosages, interactions, and comparisons.
6. Do NOT diagnose the provider themselves — if they mention personal symptoms, treat them as a patient and add the usual safety language.

Keep responses crisp and useful. This is a working consult, not a lecture.`;
    }

    // ── Member / patient-tier prompt ───────────────────────────────────
    return `You are MediWyz AI Assistant — a helpful, knowledgeable health assistant on the MediWyz platform.
Today is ${today}. ${langNote}

USER PROFILE (from their centralised MediWyz profile):
- Name: ${identity.firstName} ${identity.lastName}
- Age: ${identity.age ?? 'unknown'}${identity.gender ? ` · Gender: ${identity.gender}` : ''}
- ${bodyNote}
- Blood Type: ${health?.bloodType ?? 'not recorded'} · Health Score: ${health?.healthScore ?? 'n/a'}/100
- ${allergyNote}
- ${userSetAllergenNote}
- Chronic conditions: ${chronic.length > 0 ? chronic.join(', ') : 'none recorded'}
- ${medicationNote}
${diagnosisNote ? `- ${diagnosisNote}` : ''}
${dietPrefNote ? `- ${dietPrefNote}` : ''}
${goalNote ? `- ${goalNote}` : ''}
${targetsNote ? `- ${targetsNote}` : ''}

${conditionNotes.length > 0 ? 'CONDITION-SPECIFIC DIETARY GUIDANCE:\n' + conditionNotes.join('\n') : ''}

${insightsSummary}
${trackerContext}

YOUR ROLE:
1. Personalise every recommendation to the profile above — specifically the user's age, BMI, weight goal, activity level, dietary prefs, and declared allergens.
2. When the user asks about food or supplements, cross-check allergies + allergen settings + active medications before responding.
3. Tailor suggestions to locally available foods in their region (${identity.regionCode ?? 'Mauritius'}).
4. Be warm, non-judgmental, and concrete — specific foods, specific portions, specific timings.
5. When the user mentions food/exercise/sleep/water/symptoms, acknowledge it, compare against today's targets, and suggest the next concrete action.
6. Track progress against their stated weight goal — celebrate wins, propose small corrections for drift.
7. If sleep data is poor or missing, treat it as a first-order health factor.

IMPORTANT SAFETY RULES:
- Remind the user to consult their doctor before major diet / exercise / medication changes.
- NEVER diagnose or change medications.
- If symptoms could be serious, urge them to contact emergency services or their provider immediately.
- You're a wellness assistant, not a substitute for clinical care.

Keep responses concise but thorough. Use markdown for lists + emphasis.`;
  }

  // buildConditionDietaryNotes moved to `ClinicalKnowledgeService.resolveGuidance`.
  // Guidance is now DB-sourced (admin-editable) and resolved per-call in
  // chatWithAssistant before invoking buildSystemPrompt.

  // ─── Main Chat Function ──────────────────────────────────────────────────────

  async chatWithAssistant(
    userId: string,
    message: string,
    sessionId?: string,
  ): Promise<{
    response: string;
    sessionId: string;
    title: string;
  }> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is not set');
    }

    // Grab the centralised profile context. Works for any user type — patient,
    // provider, regional admin — so the assistant always knows who it's
    // talking to and (when available) their clinical + tracker state.
    const userContext = await this.getUserContext(userId);

    // ─── SAFETY LAYER 1: Emergency keyword gate (runs BEFORE Groq) ───────
    // We never trust the LLM to reliably detect emergencies; the gate is
    // a deterministic pattern-match that short-circuits with a canned
    // region-aware response. Cheap, fast, auditable.
    const emergency = checkEmergency(message);
    if (emergency.matched) {
      const canned = buildEmergencyResponse(
        emergency.category,
        userContext?.identity.regionCode,
        userContext?.identity.firstName,
      );
      const session = await this.ensureSession(userId, sessionId);
      await this.prisma.aiChatMessage.createMany({
        data: [
          { sessionId: session.id, role: 'user', content: message },
          { sessionId: session.id, role: 'assistant', content: canned },
        ],
      });
      await this.logAiCall({
        userId, surface: 'chat', model: 'emergency-gate',
        promptTokens: 0, completionTokens: 0, durationMs: 0,
        emergencyCategory: emergency.category,
      });
      return { response: canned, sessionId: session.id, title: session.title };
    }

    // Retrieve recent dietary/health insights + today's tracker only for
    // users who've actually filled in a health profile (tracker OR patient).
    const hasHealth = !!userContext?.health;
    const insightsSummary = hasHealth ? await this.getRecentInsights(userId, 14) : '';
    const trackerContext = hasHealth ? await this.getTrackerContext(userId) : '';

    // Create or retrieve session
    const session = await this.ensureSession(userId, sessionId);

    // Fetch previous messages for context (last 20)
    const previousMessages = await this.prisma.aiChatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
      take: 20,
      select: { role: true, content: true },
    });

    // Resolve admin-editable clinical guidance for the user's conditions.
    const conditionNotes = this.clinicalKnowledge
      ? await this.clinicalKnowledge.resolveGuidance(userContext?.health?.chronicConditions ?? [])
      : [];

    // Build the message array with the full profile context.
    const systemPrompt = userContext
      ? this.buildSystemPrompt(userContext, insightsSummary, trackerContext, conditionNotes)
      : 'You are MediWyz AI Assistant. Answer concisely and always recommend a qualified healthcare provider for medical decisions.';

    const groqMessages: GroqMessage[] = [
      { role: 'system', content: systemPrompt },
      ...previousMessages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    // Call Groq API for the main response (with timing for cost logging).
    const groqStart = Date.now();
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 0.9,
      }),
    });
    const groqDuration = Date.now() - groqStart;

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Groq API error: ${response.status} ${errorBody}`);
      await this.logAiCall({
        userId, surface: 'chat', model: GROQ_MODEL,
        promptTokens: 0, completionTokens: 0, durationMs: groqDuration,
        error: `http_${response.status}`,
      });
      throw new Error(`AI service error (${response.status}): ${response.statusText}`);
    }

    const data: GroqResponse = await response.json();
    const rawAssistantMessage = data.choices?.[0]?.message?.content;

    if (!rawAssistantMessage) {
      throw new Error('No response from AI service');
    }

    // ─── SAFETY LAYER 2: Allergy post-filter ─────────────────────────────
    // Cross-check the output against the user's declared allergens. If any
    // slipped through the prompt's warning, prepend a review banner. We
    // log matches for prompt-tuning but DO NOT silently rewrite content.
    const allAllergens = [
      ...(userContext?.health?.allergies ?? []),
      ...(userContext?.health?.allergenSettings ?? []),
    ];
    const allergyCheck = checkAllergies(rawAssistantMessage, allAllergens);
    const assistantMessage = allergyCheck.warnedResponse;
    if (allergyCheck.matched.length > 0) {
      this.logger.warn(
        `Allergy slip for user ${userId}: matched=${allergyCheck.matched.join(',')} — banner prepended`,
      );
    }

    // Cost + latency logging for admin dashboard / drift detection.
    await this.logAiCall({
      userId, surface: 'chat', model: GROQ_MODEL,
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      durationMs: groqDuration,
      allergyMatched: allergyCheck.matched.length > 0 ? allergyCheck.matched.join(',') : undefined,
      promptVersion: PROMPT_VERSION,
    });

    // Save both messages to the database
    await this.prisma.aiChatMessage.createMany({
      data: [
        { sessionId: session.id, role: 'user', content: message },
        { sessionId: session.id, role: 'assistant', content: assistantMessage },
      ],
    });

    // Extract and store dietary/health insights from this exchange (background, best-effort)
    this.extractAndStoreInsights(userId, message, assistantMessage, apiKey).catch(() => {
      // Silent failure — extraction is best-effort
    });

    // Auto-generate session title from the first user message
    let title = session.title;
    if (session.title === 'New Chat' && previousMessages.length === 0) {
      title = message.length > 50 ? message.substring(0, 50) + '...' : message;
      await this.prisma.aiChatSession.update({
        where: { id: session.id },
        data: { title },
      });
    }

    // Update session timestamp
    await this.prisma.aiChatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() },
    });

    return {
      response: assistantMessage,
      sessionId: session.id,
      title,
    };
  }

  // ─── Session + logging helpers ──────────────────────────────────────

  /** Find or create a chat session for the given user. */
  private async ensureSession(userId: string, sessionId?: string): Promise<{ id: string; title: string }> {
    if (sessionId) {
      const existing = await this.prisma.aiChatSession.findFirst({
        where: { id: sessionId, userId },
        select: { id: true, title: true },
      });
      if (!existing) throw new Error('Chat session not found');
      return existing;
    }
    return this.prisma.aiChatSession.create({
      data: { userId, title: 'New Chat' },
      select: { id: true, title: true },
    });
  }

  /**
   * Persist one row per Groq (or safety-gate short-circuit) call into
   * `AiCallLog`. Powers cost dashboards + drift detection. Never throws —
   * a logging failure must not break the user's chat.
   */
  private async logAiCall(data: {
    userId: string;
    surface: 'chat' | 'ocr' | 'insights' | 'tracker_context';
    model: string;
    promptTokens: number;
    completionTokens: number;
    durationMs: number;
    promptVersion?: string;
    emergencyCategory?: string;
    allergyMatched?: string;
    error?: string;
  }): Promise<void> {
    try {
      await (this.prisma as any).aiCallLog.create({
        data: {
          userId: data.userId,
          surface: data.surface,
          model: data.model,
          promptTokens: data.promptTokens,
          completionTokens: data.completionTokens,
          durationMs: data.durationMs,
          promptVersion: data.promptVersion ?? null,
          emergencyCategory: data.emergencyCategory ?? null,
          allergyMatched: data.allergyMatched ?? null,
          error: data.error ?? null,
        },
      });
    } catch (e) {
      // Logging failure is never fatal; surface to stderr for ops to notice.
      this.logger.warn(`AI call-log write failed: ${(e as Error).message}`);
    }
  }

  // ─── Session Management ──────────────────────────────────────────────────────

  async listSessions(userId: string) {
    return this.prisma.aiChatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: { _count: { select: { messages: true } } },
    });
  }

  async getSession(sessionId: string, userId: string) {
    const session = await this.prisma.aiChatSession.findFirst({
      where: { id: sessionId, userId },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!session) return null;

    const messages = await this.prisma.aiChatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    return { session, messages };
  }

  async deleteSession(sessionId: string, userId: string): Promise<boolean> {
    const session = await this.prisma.aiChatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) return false;

    await this.prisma.aiChatMessage.deleteMany({ where: { sessionId } });
    await this.prisma.aiChatSession.delete({ where: { id: sessionId } });

    return true;
  }

  /**
   * Public widget chat — no user context required. Used by the floating
   * Health AI Assistant bubble on all pages including the landing page.
   * Runs a lightweight Groq call with a platform system prompt.
   */
  async publicWidgetChat(message: string): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return "AI assistant is temporarily unavailable. Please visit our Help Centre or book a provider directly.";
    }

    const systemPrompt = `You are the MediWyz Health AI Assistant — a friendly, knowledgeable assistant for the MediWyz digital health platform serving Mauritius and neighbouring countries.

You help visitors with:
- Booking doctors, nurses, dentists, nutritionists, physiotherapists and other specialists
- Understanding how the Health Shop works (medicines, vitamins, first aid delivery)
- Learning about subscription plans, insurance coverage, and wallet top-up
- Video consultations and home visit services
- Emergency services available on the platform

Rules:
- Keep replies under 3 clear, friendly sentences
- Never diagnose, never prescribe medication
- If someone describes a medical emergency, tell them to call emergency services immediately
- If someone asks for personal medical advice, encourage them to book a provider
- Be warm, professional and direct`;

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        this.logger.warn(`Groq widget-chat returned ${response.status}`);
        return "I'm having a little trouble right now. Please try again or book a provider directly.";
      }

      const data = await response.json();
      return data?.choices?.[0]?.message?.content?.trim() ??
        "I couldn't generate a response. Please try rephrasing your question.";
    } catch (err) {
      this.logger.error('publicWidgetChat error:', err);
      return "Connection issue. Please try again in a moment.";
    }
  }

  async extractPrescription(imageDataUrl: string): Promise<{ medicines: string[]; rawText: string }> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return { medicines: [], rawText: '' };

    const visionModel = process.env.GROQ_VISION_MODEL || 'llama-3.2-11b-vision-preview';

    const body = {
      model: visionModel,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageDataUrl } },
          {
            type: 'text',
            text: 'You are a pharmacy assistant. Extract ALL medication names, generic drug names, and dosages from this prescription image. Return ONLY valid JSON: {"medicines":["name1","name2"],"rawText":"full extracted text"}. Include both brand and generic names. No text outside the JSON.',
          },
        ],
      }],
      max_tokens: 600,
    };

    try {
      const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json() as { choices?: Array<{ message: { content: string } }>; usage?: { prompt_tokens: number; completion_tokens: number } };
      const content = (json.choices?.[0]?.message?.content ?? '{}').trim();
      if (json.usage) {
        this.logger.log(`[AI] extract-prescription: in=${json.usage.prompt_tokens} out=${json.usage.completion_tokens}`);
      }
      // Strip markdown code fences if present
      const clean = content.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(clean) as { medicines?: string[]; rawText?: string };
      return {
        medicines: Array.isArray(parsed.medicines) ? parsed.medicines.filter(Boolean) : [],
        rawText: parsed.rawText ?? content,
      };
    } catch (err) {
      this.logger.error('[AI] extract-prescription error:', err);
      return { medicines: [], rawText: '' };
    }
  }

  /**
   * Richer authenticated prescription extraction.
   * Returns structured medication list (name, dosage, frequency), prescriber name, date, and raw text.
   * Used by POST /api/prescriptions/extract.
   */
  async extractPrescriptionDetailed(imageDataUrl: string): Promise<{
    medications: Array<{ name: string; dosage: string; frequency: string }>;
    prescriber: string;
    date: string;
    rawText: string;
  }> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return { medications: [], prescriber: '', date: '', rawText: '' };

    const visionModel = process.env.GROQ_VISION_MODEL || 'llama-3.2-11b-vision-preview';

    const body = {
      model: visionModel,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageDataUrl } },
          {
            type: 'text',
            text: `You are a clinical pharmacy AI assistant. Carefully extract the following from this prescription image and return ONLY valid JSON with no markdown fences:
{
  "medications": [{ "name": "string", "dosage": "string", "frequency": "string" }],
  "prescriber": "prescriber full name and credentials if visible",
  "date": "ISO date YYYY-MM-DD if visible, else empty string",
  "rawText": "full verbatim text extracted from the image"
}
Include both brand and generic names in the medication name. If a field is not visible, use an empty string. No text outside the JSON.`,
          },
        ],
      }],
      max_tokens: 800,
    };

    try {
      const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json() as { choices?: Array<{ message: { content: string } }>; usage?: { prompt_tokens: number; completion_tokens: number } };
      const content = (json.choices?.[0]?.message?.content ?? '{}').trim();
      if (json.usage) {
        this.logger.log(`[AI] extract-prescription-detailed: in=${json.usage.prompt_tokens} out=${json.usage.completion_tokens}`);
      }
      const clean = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(clean) as {
        medications?: Array<{ name?: string; dosage?: string; frequency?: string }>;
        prescriber?: string;
        date?: string;
        rawText?: string;
      };
      return {
        medications: Array.isArray(parsed.medications)
          ? parsed.medications
              .filter((m) => m.name)
              .map((m) => ({ name: m.name ?? '', dosage: m.dosage ?? '', frequency: m.frequency ?? '' }))
          : [],
        prescriber: parsed.prescriber ?? '',
        date: parsed.date ?? '',
        rawText: parsed.rawText ?? content,
      };
    } catch (err) {
      this.logger.error('[AI] extract-prescription-detailed error:', err);
      return { medications: [], prescriber: '', date: '', rawText: '' };
    }
  }
}
