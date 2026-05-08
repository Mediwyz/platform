import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { userTypeToProfileRelation } from '../auth/auth.service';

/**
 * LEGACY profile include map — for backward compatibility with roles that have
 * dedicated profile tables. New dynamic roles (created by regional admins)
 * don't have profile tables and use User fields + ProviderRole config only.
 *
 * This map will shrink over time as legacy profiles are deprecated.
 * `specialtyField` is the array field on the profile that holds specialties —
 * stored here so specialty-filter logic never needs to branch on role codes.
 */
const LEGACY_PROFILE_INCLUDE: Record<string, { include: Record<string, any>; specialtyField: string }> = {
  DOCTOR:           { specialtyField: 'specialty',        include: { doctorProfile: { select: { id: true, specialty: true, subSpecialties: true, rating: true, reviewCount: true, experience: true, consultationFee: true, videoConsultationFee: true, consultationTypes: true, bio: true, location: true, languages: true, emergencyAvailable: true, homeVisitAvailable: true, telemedicineAvailable: true } } } },
  NURSE:            { specialtyField: 'specializations',  include: { nurseProfile: { select: { id: true, specializations: true, experience: true, licenseNumber: true } } } },
  NANNY:            { specialtyField: 'certifications',   include: { nannyProfile: { select: { id: true, experience: true, certifications: true } } } },
  PHARMACIST:       { specialtyField: 'specializations',  include: { pharmacistProfile: { select: { id: true, pharmacyName: true, specializations: true } } } },
  LAB_TECHNICIAN:   { specialtyField: 'specializations',  include: { labTechProfile: { select: { id: true, labName: true, specializations: true } } } },
  EMERGENCY_WORKER: { specialtyField: 'certifications',   include: { emergencyWorkerProfile: { select: { id: true, certifications: true, vehicleType: true, responseZone: true, emtLevel: true } } } },
  CAREGIVER:        { specialtyField: 'specializations',  include: { caregiverProfile: { select: { id: true, experience: true, specializations: true, certifications: true } } } },
  PHYSIOTHERAPIST:  { specialtyField: 'specializations',  include: { physiotherapistProfile: { select: { id: true, experience: true, specializations: true, clinicName: true } } } },
  DENTIST:          { specialtyField: 'specializations',  include: { dentistProfile: { select: { id: true, experience: true, specializations: true, clinicName: true } } } },
  OPTOMETRIST:      { specialtyField: 'specializations',  include: { optometristProfile: { select: { id: true, experience: true, specializations: true, clinicName: true } } } },
  NUTRITIONIST:     { specialtyField: 'specializations',  include: { nutritionistProfile: { select: { id: true, experience: true, specializations: true, certifications: true } } } },
  INSURANCE_REP:    { specialtyField: 'coverageTypes',    include: { insuranceRepProfile: { select: { id: true, companyName: true, coverageTypes: true } } } },
};

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * Search providers by type — works for ANY ProviderRole (legacy or dynamic).
   *
   * For legacy roles with dedicated profile tables: includes profile data.
   * For new dynamic roles: uses User fields only + ProviderSpecialty for filtering.
   */
  // ─── GET /search/available-slots — real slot availability across a role ──────
  // Reads ProviderAvailability (weekly schedule) + BookedSlot (taken slots) to
  // return per-time-slot availability counts for the hero booking widget.
  // Public endpoint — no auth required.
  async getAvailableSlots(dateStr: string, roleCode: string) {
    const uType = roleCode.toUpperCase();

    // Parse date parts from YYYY-MM-DD (avoid timezone shift from new Date(str))
    const parts = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!parts) return { slots: [], providerCount: 0 };
    const [, yStr, mStr, dStr] = parts;
    const year = parseInt(yStr), month = parseInt(mStr) - 1, day = parseInt(dStr);
    const dayOfWeek = new Date(year, month, day).getDay(); // 0=Sun, 6=Sat

    const dayStart = new Date(Date.UTC(year, month, day, 0, 0, 0));
    const dayEnd   = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

    // All active providers of this role
    const providers = await this.prisma.user.findMany({
      where: { userType: uType as any, accountStatus: 'active' },
      select: { id: true },
    });
    if (providers.length === 0) return { slots: [], providerCount: 0 };

    const providerIds = providers.map(p => p.id);

    // Weekly availability windows for this day of week
    const availabilities = await this.prisma.providerAvailability.findMany({
      where: { userId: { in: providerIds }, dayOfWeek, isActive: true },
    });
    if (availabilities.length === 0) return { slots: [], providerCount: providers.length };

    // Already-taken slots on this date
    const bookedSlots = await this.prisma.bookedSlot.findMany({
      where: {
        providerUserId: { in: providerIds },
        date: { gte: dayStart, lte: dayEnd },
        status: 'booked',
      },
      select: { providerUserId: true, startTime: true },
    });
    const bookedSet = new Set(bookedSlots.map(b => `${b.providerUserId}:${b.startTime}`));

    const toMin = (t: string) => {
      const [h, m = 0] = t.split(':').map(Number);
      return h * 60 + m;
    };

    // Aggregate: for each time string, count how many providers have it free vs taken
    const slotMap = new Map<string, { available: number; total: number }>();

    for (const avail of availabilities) {
      const startMin = toMin(avail.startTime);
      const endMin   = toMin(avail.endTime);
      const duration = avail.slotDuration ?? 60;

      for (let m = startMin; m < endMin; m += duration) {
        const h = Math.floor(m / 60);
        const min = m % 60;
        const timeStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

        const entry = slotMap.get(timeStr) ?? { available: 0, total: 0 };
        entry.total++;
        if (!bookedSet.has(`${avail.userId}:${timeStr}`)) entry.available++;
        slotMap.set(timeStr, entry);
      }
    }

    const slots = Array.from(slotMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, c]) => ({ time, available: c.available, total: c.total, taken: c.available === 0 }));

    return { slots, providerCount: providers.length };
  }

  async searchProviders(type: string, query?: string, page?: number, limit?: number, specialty?: string, serviceId?: string, entityId?: string) {
    if (!type) throw new BadRequestException('type parameter is required');
    const uType = type.toUpperCase();
    const take = Math.min(limit || 50, 100);
    const pageNum = Math.max(page || 1, 1);
    const skip = (pageNum - 1) * take;

    const where: any = { userType: uType, accountStatus: 'active' };

    // When entityId is supplied, restrict to providers who work at that healthcare entity
    let entityUserIds: string[] | null = null;
    if (entityId) {
      const workplaces = await (this.prisma.providerWorkplace as any).findMany({
        where: { healthcareEntityId: entityId, isActive: true, status: 'active' },
        select: { providerUserId: true },
      });
      if (workplaces.length === 0) return { data: [], total: 0, page: 1, limit: take, totalPages: 0 };
      entityUserIds = workplaces.map((w: any) => w.providerUserId as string);
    }

    // When serviceId is supplied, only return providers who have that service
    // in their ProviderServiceConfig (they explicitly offer it).
    // If nobody offers it yet → return empty list; the booking drawer shows
    // "No providers available" rather than a misleading unfiltered list.
    let serviceUserIds: string[] | null = null;
    if (serviceId) {
      const configs = await this.prisma.providerServiceConfig.findMany({
        where: {
          platformServiceId: serviceId, isActive: true,
          // Pre-filter by entity providers if both filters are active, avoiding overwrite
          ...(entityUserIds ? { providerUserId: { in: entityUserIds } } : {}),
        },
        select: { providerUserId: true },
      });
      if (configs.length === 0) return { data: [], total: 0, page: 1, limit: take, totalPages: 0 };
      serviceUserIds = configs.map(c => c.providerUserId);
    }

    // Merge filters: intersection when both are present, otherwise whichever is set
    if (serviceUserIds !== null) {
      where.id = { in: serviceUserIds };
    } else if (entityUserIds !== null) {
      where.id = { in: entityUserIds };
    }

    if (query) {
      where.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Specialty filtering — uses the specialtyField declared in LEGACY_PROFILE_INCLUDE
    // (no hardcoded role-code branches). New dynamic roles are filtered post-query
    // via ProviderSpecialty since they have no dedicated profile relation.
    if (specialty) {
      const legacyEntry = LEGACY_PROFILE_INCLUDE[uType];
      if (legacyEntry) {
        const profileRelation = userTypeToProfileRelation[uType];
        if (profileRelation) {
          where[profileRelation] = { [legacyEntry.specialtyField]: { has: specialty } };
        }
      }
    }

    // Include legacy profile data if available, otherwise just user fields
    const profileInclude = LEGACY_PROFILE_INCLUDE[uType]?.include ?? {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true, firstName: true, lastName: true, profileImage: true,
          address: true, phone: true, verified: true, userType: true, gender: true,
          ...profileInclude,
        },
        take, skip,
        orderBy: { firstName: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Fetch specialties for this provider type from the dynamic ProviderSpecialty model
    const providerSpecialties = await this.prisma.providerSpecialty.findMany({
      where: { providerType: uType as any, isActive: true },
      select: { name: true, icon: true },
    });

    // Flatten profile data into top-level for frontend compatibility
    const data = users.map((u: any) => {
      const profileRelation = userTypeToProfileRelation[uType];
      const profile = profileRelation ? u[profileRelation] : null;
      const rest = profileRelation ? (() => { const { [profileRelation]: _unused, ...r } = u; return r; })() : u;

      return {
        ...(profile || {}),
        ...rest,
        name: `${u.firstName} ${u.lastName}`,
        id: u.id,
        userId: u.id,
        profileId: profile?.id,
        specializations: profile?.specializations || profile?.specialty || profile?.certifications || providerSpecialties.map(s => s.name),
        experience: profile?.experience || null,
        rating: profile?.rating || 0,
        consultationFee: profile?.consultationFee || 0,
        bio: profile?.bio || '',
      };
    });

    return { data, total, page: pageNum, limit: take, totalPages: Math.ceil(total / take) };
  }
}
