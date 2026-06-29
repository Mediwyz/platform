import { Injectable, BadRequestException, NotFoundException, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WorkflowEngineService } from '../workflow/workflow-engine.service';

/**
 * Unified booking service — ALL bookings go through ServiceBooking.
 *
 * Legacy booking tables (Appointment, NurseBooking, ChildcareBooking, LabTestBooking,
 * EmergencyBooking) are READ-ONLY for historical data. New bookings always use
 * ServiceBooking regardless of provider type.
 *
 * Default fees come from:
 *   1. ProviderServiceConfig.priceOverride (provider-specific)
 *   2. PlatformService.defaultPrice (service-level default)
 *   3. ProviderRole.defaultBookingFee (role-level default)
 *   4. 0 (no fee)
 */

/** Legacy booking models for backward-compat reads */
const LEGACY_MODEL_MAP: Record<string, string> = {
  appointment: 'appointment',
  nurse_booking: 'nurseBooking',
  childcare_booking: 'childcareBooking',
  lab_test_booking: 'labTestBooking',
  emergency_booking: 'emergencyBooking',
};

@Injectable()
export class BookingsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private workflowEngine: WorkflowEngineService,
  ) {}

  /** Boot-time safety net: ensure EVERY provider has bookable availability.
   *  The deploy seed wipes + reseeds availability and can leave some provider
   *  types (e.g. doctors with a null accountStatus) with none, which dead-ends
   *  the in-chat booking. This runs after the post-deploy restart, is idempotent
   *  (only providers with zero windows are seeded), and is immune to seed crashes. */
  onApplicationBootstrap() {
    setTimeout(() => { void this.backfillAvailability(); }, 8000);
    setTimeout(() => { void this.backfillCoordinates(); }, 9000);
  }

  /**
   * Geo-tag providers that have no GPS coordinates so the agent's "near me"
   * search returns results. Seed 61 maps specific seeded IDs to real practice
   * locations, but it doesn't run on prod — so here we deterministically spread
   * any coord-less provider across real Mauritius city centres (stable per user
   * id). Approximate by design; good enough for distance-ranked discovery.
   */
  private async backfillCoordinates() {
    try {
      const PROVIDER_TYPES = ['DOCTOR', 'NURSE', 'NANNY', 'PHARMACIST', 'LAB_TECHNICIAN', 'EMERGENCY_WORKER', 'CAREGIVER', 'PHYSIOTHERAPIST', 'DENTIST', 'OPTOMETRIST', 'NUTRITIONIST'];
      // Real Mauritius town centres (lat, lng).
      const CITIES: Array<[number, number]> = [
        [-20.1609, 57.4977], // Port Louis
        [-20.2342, 57.4617], // Rose Hill
        [-20.2648, 57.4759], // Quatre Bornes
        [-20.3173, 57.5259], // Curepipe
        [-20.2985, 57.4786], // Vacoas
        [-20.2455, 57.4836], // Ebène / Cybercity
        [-20.0140, 57.5815], // Grand Baie
        [-20.4072, 57.7020], // Mahébourg
        [-20.2366, 57.5056], // Moka
        [-20.3095, 57.5016], // Floréal
      ];
      const missing = await this.prisma.user.findMany({
        where: { userType: { in: PROVIDER_TYPES as any }, OR: [{ latitude: null }, { longitude: null }] },
        select: { id: true },
      });
      if (!missing.length) return;
      let updated = 0;
      for (const { id } of missing) {
        // Stable hash of the id → a city + a small deterministic jitter so
        // co-located providers don't all collapse onto the exact same point.
        let h = 0;
        for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
        const [lat, lng] = CITIES[h % CITIES.length];
        const jLat = (((h >> 4) % 100) / 100 - 0.5) * 0.04; // ±0.02° ≈ ±2.2 km
        const jLng = (((h >> 8) % 100) / 100 - 0.5) * 0.04;
        await this.prisma.user.update({
          where: { id },
          data: { latitude: lat + jLat, longitude: lng + jLng },
        });
        updated++;
      }
      this.logger.log(`Coordinate backfill: geo-tagged ${updated} provider(s) lacking GPS`);
    } catch (e: any) {
      this.logger.warn(`Coordinate backfill failed: ${e?.message}`);
    }
  }

  private async backfillAvailability() {
    try {
      const PROVIDER_TYPES = ['DOCTOR', 'NURSE', 'NANNY', 'PHARMACIST', 'LAB_TECHNICIAN', 'EMERGENCY_WORKER', 'CAREGIVER', 'PHYSIOTHERAPIST', 'DENTIST', 'OPTOMETRIST', 'NUTRITIONIST'];
      const providers = await this.prisma.user.findMany({
        where: { userType: { in: PROVIDER_TYPES as any } },
        select: { id: true },
      });
      const ids = providers.map(p => p.id);
      if (!ids.length) return;
      const have = await this.prisma.providerAvailability.findMany({
        where: { userId: { in: ids } }, select: { userId: true }, distinct: ['userId'],
      });
      const haveSet = new Set(have.map(h => h.userId));
      const missing = ids.filter(id => !haveSet.has(id));
      if (!missing.length) return;
      const rows = missing.flatMap(userId =>
        [1, 2, 3, 4, 5].map(day => ({ userId, dayOfWeek: day, startTime: '09:00', endTime: '17:00', slotDuration: 30, isActive: true })),
      );
      const res = await this.prisma.providerAvailability.createMany({ data: rows, skipDuplicates: true });
      this.logger.log(`Availability backfill: created ${res.count} windows for ${missing.length} provider(s) with none`);
    } catch (e: any) {
      this.logger.warn(`Availability backfill failed: ${e?.message}`);
    }
  }

  /** Ensure user has a PatientProfile */
  private async ensurePatientProfile(userId: string) {
    const existing = await this.prisma.patientProfile.findUnique({ where: { userId }, select: { id: true } });
    if (existing) return existing;
    const { randomUUID } = require('crypto');
    return this.prisma.patientProfile.create({
      data: { userId, nationalId: `AUTO-${randomUUID().slice(0, 12).toUpperCase()}`, bloodType: 'Unknown', allergies: [], chronicConditions: [], healthScore: 50 },
      select: { id: true },
    });
  }

  /** Combine date string + time string into a single DateTime */
  private buildScheduledAt(date: string, time?: string): Date {
    if (!date) return new Date();
    if (date.includes('T')) return new Date(date);
    const timeStr = time || '09:00';
    const normalized = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
    return new Date(`${date}T${normalized}`);
  }

  /** Check wallet balance */
  private async checkBalance(userId: string, amount: number) {
    const wallet = await this.prisma.userWallet.findUnique({ where: { userId }, select: { balance: true } });
    if (!wallet || wallet.balance < amount) {
      throw new BadRequestException(`Insufficient wallet balance. Required: ${amount}, Available: ${wallet?.balance ?? 0}`);
    }
  }

  /**
   * Resolve the booking fee dynamically from DB:
   * 1. ProviderServiceConfig (provider's custom price)
   * 2. PlatformService.defaultPrice
   * 3. ProviderRole.defaultBookingFee
   * 4. Fallback to 0
   */
  private async resolveBookingFee(providerUserId: string, providerType: string, serviceName?: string): Promise<number> {
    // Try provider's service config for this specific service
    if (serviceName) {
      try {
        const config = await this.prisma.providerServiceConfig.findFirst({
          where: {
            providerUserId,
            platformService: { serviceName, providerType: providerType as any },
          },
          select: { priceOverride: true, platformService: { select: { defaultPrice: true } } },
        });
        if (config) {
          return config.priceOverride ?? config.platformService.defaultPrice ?? 0;
        }
      } catch {
        // Relation query may fail if no matching service exists — continue to fallback
      }
    }

    // Try any default platform service for this provider type
    const platformService = await this.prisma.platformService.findFirst({
      where: { providerType: providerType as any, isDefault: true },
      select: { defaultPrice: true },
    });
    if (platformService?.defaultPrice) return platformService.defaultPrice;

    // Try ProviderRole.defaultBookingFee
    const role = await this.prisma.providerRole.findUnique({
      where: { code: providerType },
      select: { defaultBookingFee: true },
    });
    if (role?.defaultBookingFee) return role.defaultBookingFee;

    return 0;
  }

  // ─── Subscription Discount Resolution ────────────────────────────────

  /**
   * Checks the patient's active subscription and applies any plan discount.
   * Returns the effective fee to charge plus tracking info for usage increment.
   *
   * Logic:
   *  - Find active UserSubscription for this patient
   *  - Find a SubscriptionPlanService that covers providerType (via platformServiceId or serviceGroup)
   *  - If monthlyLimit allows another use this month → apply discount / adminPrice / isFree price
   *  - Quota exhausted or no matching plan coverage → return originalFee unchanged
   */
  private async applySubscriptionDiscount(
    patientUserId: string,
    providerType: string,
    platformServiceId: string | undefined,
    originalFee: number,
  ): Promise<{ effectiveFee: number; subscriptionId?: string; usageKey?: string }> {
    try {
      const sub = await this.prisma.userSubscription.findUnique({
        where: { userId: patientUserId },
        select: { id: true, status: true, planId: true },
      });
      if (!sub || sub.status !== 'active') return { effectiveFee: originalFee };

      // Find plan coverage: direct platformService match first, then by providerType via serviceGroups
      let planService: any = null;

      if (platformServiceId) {
        planService = await this.prisma.subscriptionPlanService.findFirst({
          where: {
            planId: sub.planId,
            platformServiceId,
          },
          select: { id: true, isFree: true, discountPercent: true, adminPrice: true, monthlyLimit: true },
        });
      }

      // Fallback: find any plan service whose platformService covers this providerType
      if (!planService) {
        planService = await this.prisma.subscriptionPlanService.findFirst({
          where: {
            planId: sub.planId,
            platformService: { providerType: providerType as any },
          },
          select: { id: true, isFree: true, discountPercent: true, adminPrice: true, monthlyLimit: true },
        });
      }

      if (!planService) return { effectiveFee: originalFee };

      // monthlyLimit: -1 = unlimited, 0 = pay-per-use (no quota), N = N per month
      if (planService.monthlyLimit === 0) return { effectiveFee: originalFee };

      const usageKey = providerType;
      if (planService.monthlyLimit > 0) {
        // Check current month usage
        const month = new Date().toISOString().slice(0, 7); // "YYYY-MM"
        const usage = await this.prisma.subscriptionUsage.findUnique({
          where: { subscriptionId_month: { subscriptionId: sub.id, month } },
          select: { usageData: true },
        });
        const usageData = (usage?.usageData ?? {}) as Record<string, number>;
        const usedCount = usageData[usageKey] ?? 0;
        if (usedCount >= planService.monthlyLimit) {
          // Quota exhausted — charge full price
          return { effectiveFee: originalFee };
        }
      }

      // Apply pricing
      let effectiveFee = originalFee;
      if (planService.isFree) {
        effectiveFee = 0;
      } else if (planService.adminPrice != null) {
        effectiveFee = planService.adminPrice;
      } else if (planService.discountPercent > 0) {
        effectiveFee = originalFee * (1 - planService.discountPercent / 100);
      }

      return { effectiveFee, subscriptionId: sub.id, usageKey };
    } catch {
      // Non-fatal — if subscription check fails, fall back to full price
      return { effectiveFee: originalFee };
    }
  }

  /** Increment SubscriptionUsage after a booking is confirmed */
  private async trackSubscriptionUsage(subscriptionId: string, usageKey: string) {
    const month = new Date().toISOString().slice(0, 7);
    try {
      const existing = await this.prisma.subscriptionUsage.findUnique({
        where: { subscriptionId_month: { subscriptionId, month } },
        select: { id: true, usageData: true },
      });
      const usageData = ((existing?.usageData ?? {}) as Record<string, number>);
      usageData[usageKey] = (usageData[usageKey] ?? 0) + 1;

      if (existing) {
        await this.prisma.subscriptionUsage.update({
          where: { subscriptionId_month: { subscriptionId, month } },
          data: { usageData },
        });
      } else {
        await this.prisma.subscriptionUsage.create({
          data: { subscriptionId, month, usageData },
        });
      }
    } catch {
      // Non-fatal — usage tracking is a best-effort operation
    }
  }

  // ─── Unified Booking Creation ─────────────────────────────────────────

  async createBooking(patientUserId: string, data: {
    providerUserId: string; providerType: string; scheduledDate: string; scheduledTime: string;
    type?: string; reason?: string; notes?: string; duration?: number;
    serviceName?: string; servicePrice?: number; consultationType?: string;
    children?: any[]; sampleType?: string; priority?: string;
    testName?: string; location?: string; contactNumber?: string; specialty?: string;
    platformServiceId?: string;
    /** Optional: the org this booking was made through (org-level booking). */
    organizationId?: string;
    /** Optional: pin to a specific workflow template, bypassing the registry cascade. */
    workflowTemplateId?: string;
    /** 'wallet' (default, pre-funded) or 'pay_at_appointment' (cash/card on the day,
     *  no wallet pre-funding required — used by the in-chat agent booking flow). */
    paymentMethod?: string;
  }) {
    const providerType = data.providerType.toUpperCase();
    const payAtAppointment = data.paymentMethod === 'pay_at_appointment';

    // Verify provider exists and is verified
    const provider = await this.prisma.user.findUnique({
      where: { id: data.providerUserId },
      select: { id: true, firstName: true, lastName: true, userType: true, regionId: true, phone: true, verified: true },
    });
    if (!provider) throw new NotFoundException('Provider not found');
    if (!provider.verified) {
      throw new BadRequestException('This provider\'s account is pending document verification and cannot accept bookings yet.');
    }

    // Ensure patient profile
    const patientProfile = await this.ensurePatientProfile(patientUserId);

    // Build scheduled date/time
    const scheduledAt = this.buildScheduledAt(data.scheduledDate, data.scheduledTime);

    // Resolve fee from DB — server-authoritative. We deliberately IGNORE any
    // `data.servicePrice` the client sends; prices come from ProviderServiceConfig
    // / PlatformService. Letting the client dictate the charge was a silent
    // money-flow hole (found in the April 2026 audit).
    const marketFee = await this.resolveBookingFee(data.providerUserId, providerType, data.serviceName);

    // Apply subscription discount (or quota enforcement) if the patient has an active plan
    const { effectiveFee: fee, subscriptionId, usageKey } = await this.applySubscriptionDiscount(
      patientUserId, providerType, data.platformServiceId, marketFee,
    );

    // Check balance — skip if role has skipWalletCheck (e.g., emergency services)
    // or the patient chose to pay at the appointment (no wallet pre-funding).
    if (fee > 0 && !payAtAppointment) {
      const role = await this.prisma.providerRole.findUnique({ where: { code: providerType }, select: { skipWalletCheck: true } });
      if (!role?.skipWalletCheck) {
        await this.checkBalance(patientUserId, fee);
      }
    }

    // Build role-specific metadata (any extra fields go here)
    const metadata: Record<string, any> = {};
    metadata.paymentMethod = payAtAppointment ? 'pay_at_appointment' : 'wallet';
    if (data.children?.length) metadata.children = data.children;
    if (data.sampleType) metadata.sampleType = data.sampleType;
    if (data.testName) metadata.testName = data.testName;
    if (data.contactNumber) metadata.contactNumber = data.contactNumber;

    // Resolve service name from platformServiceId when available
    let resolvedServiceName = data.serviceName;
    if (data.platformServiceId && !resolvedServiceName) {
      const svc = await this.prisma.platformService.findUnique({
        where: { id: data.platformServiceId },
        select: { serviceName: true },
      });
      if (svc) resolvedServiceName = svc.serviceName;
    }

    // Create unified ServiceBooking for ALL provider types
    const booking = await this.prisma.serviceBooking.create({
      data: {
        patientId: patientProfile.id,
        providerUserId: data.providerUserId,
        providerType: providerType as any,
        providerName: `${provider.firstName} ${provider.lastName}`,
        scheduledAt,
        duration: data.duration || 30,
        type: data.type || 'in_person',
        status: 'pending',
        reason: data.reason || resolvedServiceName,
        notes: data.notes,
        serviceName: resolvedServiceName,
        servicePrice: fee,
        specialty: data.specialty,
        location: data.location,
        organizationId: data.organizationId,
        priority: data.priority || 'normal',
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      },
    });

    // Block ALL 30-min chunks for the full service duration immediately on
    // booking creation, so other patients never see overlapping slots.
    try {
      const bookingDate = new Date(data.scheduledDate + 'T00:00:00');
      const durationMins = data.duration || 30;
      const startMins = this.timeToMinutes(data.scheduledTime);
      const slotUpserts: Promise<any>[] = [];
      for (let t = startMins; t < startMins + durationMins; t += 30) {
        const slotStartTime = this.minutesToTime(t);
        const slotEndTime   = this.minutesToTime(t + 30);
        slotUpserts.push(
          this.prisma.bookedSlot.upsert({
            where: { providerUserId_date_startTime: {
              providerUserId: data.providerUserId,
              date: bookingDate,
              startTime: slotStartTime,
            }},
            create: { providerUserId: data.providerUserId, bookingId: booking.id, date: bookingDate, startTime: slotStartTime, endTime: slotEndTime, status: 'booked' },
            update: { bookingId: booking.id, status: 'booked' },
          })
        );
      }
      await Promise.all(slotUpserts);
    } catch { /* non-fatal — slot blocking is a UX optimisation, not a hard constraint */ }

    // Derive the service mode (consultation type) from the workflow template.
    // Priority: user-selected workflowTemplateId > service-linked default > client hint.
    let derivedConsultationType = data.consultationType || data.type;
    if (data.workflowTemplateId) {
      const pinnedTemplate = await this.prisma.workflowTemplate.findUnique({
        where: { id: data.workflowTemplateId },
        select: { serviceMode: true },
      });
      if (pinnedTemplate) derivedConsultationType = pinnedTemplate.serviceMode;
    } else if (data.platformServiceId) {
      const linkedTemplate = await this.prisma.workflowTemplate.findFirst({
        where: { platformServiceId: data.platformServiceId, isActive: true },
        select: { serviceMode: true },
        orderBy: { isDefault: 'desc' },
      });
      if (linkedTemplate) derivedConsultationType = linkedTemplate.serviceMode;
    }

    // Attach workflow — pass workflowTemplateId so the registry pins to the
    // template the patient explicitly selected instead of running the full cascade.
    const wf = await this.workflowEngine.attachWorkflow({
      bookingId: booking.id, bookingRoute: 'service', patientUserId,
      providerUserId: data.providerUserId, providerType,
      consultationType: derivedConsultationType,
      servicePrice: fee, regionCode: provider.regionId,
      platformServiceId: data.platformServiceId,
      workflowTemplateId: data.workflowTemplateId,
    });

    if (!wf.workflowInstanceId) {
      // Every service must have a workflow — if none resolves, this is a
      // configuration problem, not a client error. Roll back the booking.
      await this.prisma.serviceBooking.delete({ where: { id: booking.id } }).catch(() => {});
      throw new BadRequestException(
        'No workflow template is configured for this service type. ' +
        'A regional admin must create a workflow template before bookings can be accepted.',
      );
    }

    // Track subscription usage — fire-and-forget, non-blocking
    if (subscriptionId && usageKey) {
      this.trackSubscriptionUsage(subscriptionId, usageKey).catch(() => {});
    }

    return { booking, workflowInstanceId: wf.workflowInstanceId };
  }

  // ─── Unified Bookings List (reads from all tables including legacy) ────

  async getUnified(userId: string, role: 'patient' | 'provider', opts: { status?: string; page?: number; limit?: number } = {}) {
    const results: any[] = [];
    const { status: statusFilter, page = 1, limit = 50 } = opts;

    if (role === 'patient') {
      const profile = await this.prisma.patientProfile.findUnique({ where: { userId }, select: { id: true } });
      if (!profile) return { data: [] as any[], total: 0, page };

      // Query ServiceBooking (universal) + legacy tables for historical data
      const [serviceBookings, appointments, nurseBookings, childcareBookings, labTests, emergencyBookings] = await Promise.all([
        this.prisma.serviceBooking.findMany({ where: { patientId: profile.id, deletedAt: null }, orderBy: { scheduledAt: 'desc' }, take: 50 }),
        this.prisma.appointment.findMany({ where: { patientId: profile.id }, orderBy: { scheduledAt: 'desc' }, take: 50 }),
        this.prisma.nurseBooking.findMany({ where: { patientId: profile.id }, orderBy: { scheduledAt: 'desc' }, take: 50 }),
        this.prisma.childcareBooking.findMany({ where: { patientId: profile.id }, orderBy: { scheduledAt: 'desc' }, take: 50 }),
        this.prisma.labTestBooking.findMany({ where: { patientId: profile.id }, orderBy: { scheduledAt: 'desc' }, take: 50 }),
        this.prisma.emergencyBooking.findMany({ where: { patientId: profile.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
      ]);

      const toPlain = (obj: any) => JSON.parse(JSON.stringify(obj));
      serviceBookings.forEach(b => results.push({ ...toPlain(b), bookingType: 'service_booking', type: 'service' }));
      appointments.forEach(a => results.push({ ...toPlain(a), bookingType: 'appointment', type: 'doctor' }));
      nurseBookings.forEach(b => results.push({ ...toPlain(b), bookingType: 'nurse_booking', type: 'nurse' }));
      childcareBookings.forEach(b => results.push({ ...toPlain(b), bookingType: 'childcare_booking', type: 'nanny' }));
      labTests.forEach(b => results.push({ ...toPlain(b), bookingType: 'lab_test_booking', type: 'lab-test' }));
      emergencyBookings.forEach(b => results.push({ ...toPlain(b), bookingType: 'emergency_booking', type: 'emergency' }));
    } else {
      // Provider: get bookings via workflow instances + enrich with ServiceBooking details
      const instances = await this.prisma.workflowInstance.findMany({
        where: { providerUserId: userId },
        include: { template: { select: { name: true, providerType: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      });

      // Split booking ids by booking type so we resolve against the right table.
      // Previously only ServiceBooking was consulted, so every legacy booking
      // (appointment, nurse_booking, childcare_booking, lab_test_booking,
      // emergency_booking) showed up as "Unknown Patient" in the provider's
      // My Practice view.
      const idsByType = new Map<string, string[]>();
      for (const i of instances) {
        const arr = idsByType.get(i.bookingType) ?? [];
        arr.push(i.bookingId);
        idsByType.set(i.bookingType, arr);
      }

      const [serviceBookings, appointments, nurseBookings, childcareBookings, labTests, emergencyBookings] = await Promise.all([
        this.prisma.serviceBooking.findMany({ where: { id: { in: idsByType.get('service_booking') ?? [] }, deletedAt: null } }),
        this.prisma.appointment.findMany({ where: { id: { in: idsByType.get('appointment') ?? [] } } }),
        this.prisma.nurseBooking.findMany({ where: { id: { in: idsByType.get('nurse_booking') ?? [] } } }),
        this.prisma.childcareBooking.findMany({ where: { id: { in: idsByType.get('childcare_booking') ?? [] } } }),
        this.prisma.labTestBooking.findMany({ where: { id: { in: idsByType.get('lab_test_booking') ?? [] } } }),
        this.prisma.emergencyBooking.findMany({ where: { id: { in: idsByType.get('emergency_booking') ?? [] } } }),
      ]);

      // Build a normalised lookup: bookingId → { patientId, scheduledAt, ... }
      const detailMap = new Map<string, any>();
      serviceBookings.forEach(b => detailMap.set(b.id, b));
      appointments.forEach(b => detailMap.set(b.id, b));
      nurseBookings.forEach(b => detailMap.set(b.id, b));
      childcareBookings.forEach(b => detailMap.set(b.id, b));
      labTests.forEach(b => detailMap.set(b.id, b));
      emergencyBookings.forEach(b => detailMap.set(b.id, b));

      // Collect every patient profile id referenced by any of the booking tables
      const patientIds = new Set<string>();
      for (const b of detailMap.values()) {
        if (b?.patientId) patientIds.add(b.patientId);
      }
      const patients = await this.prisma.patientProfile.findMany({
        where: { id: { in: [...patientIds] } },
        include: { user: { select: { firstName: true, lastName: true, profileImage: true } } },
      });
      const patientMap = new Map<string, { user: { firstName: string; lastName: string; profileImage: string | null } }>();
      patients.forEach(p => patientMap.set(p.id, p));

      instances.forEach(i => {
        const detail: any = detailMap.get(i.bookingId);
        const patient = detail?.patientId ? patientMap.get(detail.patientId) : undefined;
        results.push({
          id: i.bookingId, bookingType: i.bookingType, status: i.currentStatus,
          workflowInstanceId: i.id, templateName: i.template.name,
          createdAt: i.createdAt, updatedAt: i.updatedAt,
          patientName: patient ? `${patient.user.firstName} ${patient.user.lastName}` : 'Unknown Patient',
          patientImage: patient?.user.profileImage || null,
          scheduledAt: detail?.scheduledAt,
          serviceName: detail?.serviceName || detail?.type || undefined,
          reason: detail?.reason,
          type: detail?.type,
          duration: detail?.duration,
          price: detail?.servicePrice ?? detail?.price,
          providerType: detail?.providerType || i.template.providerType,
        });
      });
    }

    // Apply optional status filter
    const filtered = statusFilter
      ? results.filter(r => (r.status || r.bookingStatus || '').toLowerCase() === statusFilter.toLowerCase())
      : results;

    // Sort by most recent first (scheduledAt or createdAt or updatedAt)
    filtered.sort((a, b) => {
      const da = new Date(a.updatedAt ?? a.scheduledAt ?? a.createdAt ?? 0).getTime();
      const db = new Date(b.updatedAt ?? b.scheduledAt ?? b.createdAt ?? 0).getTime();
      return db - da;
    });

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const data = filtered.slice(offset, offset + limit);

    return { data, total, page };
  }

  // ─── Cancel ────────────────────────────────────────────────────────────

  async cancel(userId: string, bookingId: string, bookingType: string) {
    // Try workflow transition first
    try {
      const result = await this.workflowEngine.transition({
        bookingId, bookingType, action: 'cancel',
        actionByUserId: userId, actionByRole: 'patient',
      });
      return result;
    } catch {
      // Direct cancel — try ServiceBooking first, then legacy tables
      const serviceBooking = await this.prisma.serviceBooking.findUnique({ where: { id: bookingId } });
      if (serviceBooking) {
        await this.prisma.serviceBooking.update({
          where: { id: bookingId },
          data: { status: 'cancelled', cancelledBy: userId, cancelledAt: new Date() },
        });
        return { success: true, message: 'Booking cancelled' };
      }

      // Fallback to legacy models
      const legacyModel = LEGACY_MODEL_MAP[bookingType];
      if (legacyModel) {
        await (this.prisma as any)[legacyModel]?.update?.({
          where: { id: bookingId }, data: { status: 'cancelled' },
        });
      }
      return { success: true, message: 'Booking cancelled' };
    }
  }

  // ─── Time helpers ──────────────────────────────────────────────────────

  private timeToMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  private minutesToTime(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  // ─── Available Slots ───────────────────────────────────────────────────

  async getAvailableSlots(providerUserId: string, date: string, serviceDurationMin = 30, organizationId?: string) {
    // Use noon on the target date to avoid DST shifts when computing dayOfWeek
    const dayOfWeek = new Date(date + 'T12:00:00').getDay();

    // When booking through an org, prefer the provider's per-org hours; fall back
    // to their global availability if they haven't set org-specific hours.
    let orgAvail: { startTime: string; endTime: string }[] = [];
    if (organizationId) {
      orgAvail = await (this.prisma as any).orgProviderAvailability.findMany({
        where: { userId: providerUserId, healthcareEntityId: organizationId, dayOfWeek, isActive: true },
        select: { startTime: true, endTime: true },
        orderBy: { startTime: 'asc' },
      });
    }

    const [globalAvail, bookedSlots] = await Promise.all([
      this.prisma.providerAvailability.findMany({
        where: { userId: providerUserId, dayOfWeek, isActive: true },
        select: { startTime: true, endTime: true },
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.bookedSlot.findMany({
        where: { providerUserId, date: new Date(date + 'T00:00:00'), status: 'booked' },
        select: { startTime: true },
      }),
    ]);
    const availabilities = orgAvail.length > 0 ? orgAvail : globalAvail;

    // All 30-min blocks that are occupied (start times only)
    const bookedBlocks = new Set(bookedSlots.map(b => b.startTime));

    const availableStarts: string[] = [];

    for (const avail of availabilities) {
      const windowStart = this.timeToMinutes(avail.startTime);
      const windowEnd   = this.timeToMinutes(avail.endTime);

      // Candidate start times in 30-min increments
      for (let t = windowStart; t + serviceDurationMin <= windowEnd; t += 30) {
        // All 30-min chunks within [t, t+serviceDuration) must be free
        let allFree = true;
        for (let chunk = t; chunk < t + serviceDurationMin; chunk += 30) {
          if (bookedBlocks.has(this.minutesToTime(chunk))) {
            allFree = false;
            break;
          }
        }
        if (allFree) availableStarts.push(this.minutesToTime(t));
      }
    }

    return availableStarts;
  }

  // ─── Reschedule ────────────────────────────────────────────────────────

  async reschedule(userId: string, bookingId: string, bookingType: string, newDate: string, newTime: string) {
    const scheduledAt = this.buildScheduledAt(newDate, newTime);

    // Try ServiceBooking first
    const serviceBooking = await this.prisma.serviceBooking.findUnique({ where: { id: bookingId } });
    if (serviceBooking) {
      await this.prisma.serviceBooking.update({ where: { id: bookingId }, data: { scheduledAt } });
      return { message: 'Booking rescheduled successfully' };
    }

    // Fallback to legacy models
    const legacyModel = LEGACY_MODEL_MAP[bookingType];
    if (!legacyModel) throw new BadRequestException('Invalid booking type');

    await (this.prisma as any)[legacyModel].update({
      where: { id: bookingId },
      data: { scheduledAt },
    });
    return { message: 'Booking rescheduled successfully' };
  }

  async listServiceBookingsForUser(userId: string) {
    const patientProfile = await this.prisma.patientProfile.findUnique({ where: { userId }, select: { id: true } });
    return this.prisma.serviceBooking.findMany({
      where: { OR: [...(patientProfile ? [{ patientId: patientProfile.id }] : []), { providerUserId: userId }] },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async fallbackStatusUpdate(bookingId: string, bookingType: string, action: string) {
    const statusMap: Record<string, string> = { accept: 'confirmed', deny: 'cancelled', decline: 'cancelled', cancel: 'cancelled', complete: 'completed' };
    const newStatus = statusMap[action] || action;

    try {
      await this.prisma.serviceBooking.update({ where: { id: bookingId }, data: { status: newStatus } });
    } catch {
      const modelMap: Record<string, string> = { appointment: 'appointment', nurse_booking: 'nurseBooking', childcare_booking: 'childcareBooking', lab_test_booking: 'labTestBooking', emergency_booking: 'emergencyBooking' };
      const modelName = modelMap[bookingType];
      if (modelName) await (this.prisma as any)[modelName]?.update?.({ where: { id: bookingId }, data: { status: newStatus } }).catch(() => {});
    }

    await this.prisma.workflowInstance.updateMany({
      where: { bookingId },
      data: {
        currentStatus: newStatus,
        ...(newStatus === 'completed' ? { completedAt: new Date() } : {}),
        ...(newStatus === 'cancelled' ? { cancelledAt: new Date() } : {}),
      },
    }).catch(() => {});
  }
}
