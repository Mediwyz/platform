import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class HealthDataService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  /** Ensure user has a PatientProfile (any user type can have health data) */
  private async ensurePatientProfile(userId: string) {
    const existing = await this.prisma.patientProfile.findUnique({ where: { userId }, select: { id: true } });
    if (existing) return existing;
    return this.prisma.patientProfile.create({
      data: { userId, nationalId: `AUTO-${userId.slice(0, 12).toUpperCase()}`, bloodType: 'Unknown', allergies: [], chronicConditions: [], healthScore: 50 },
      select: { id: true },
    });
  }

  // ─── Medical Records ───────────────────────────────────────────────────

  async getMedicalRecords(userId: string, opts: { type?: string; limit?: number; offset?: number }) {
    const profile = await this.ensurePatientProfile(userId);
    const where: any = { patientId: profile.id };
    if (opts.type) where.type = opts.type;
    const [records, total] = await Promise.all([
      this.prisma.medicalRecord.findMany({ where, orderBy: { date: 'desc' }, take: opts.limit || 20, skip: opts.offset || 0 }),
      this.prisma.medicalRecord.count({ where }),
    ]);
    return { records, total };
  }

  async createMedicalRecord(userId: string, doctorUserId: string | null, data: any) {
    const profile = await this.ensurePatientProfile(userId);
    let doctorProfileId: string | null = null;
    if (doctorUserId) {
      const doc = await this.prisma.doctorProfile.findUnique({ where: { userId: doctorUserId }, select: { id: true } });
      doctorProfileId = doc?.id ?? null;
    }
    return this.prisma.medicalRecord.create({
      data: {
        patientId: profile.id, doctorId: doctorProfileId,
        title: data.title, date: new Date(data.date), type: data.type,
        summary: data.summary, diagnosis: data.diagnosis, treatment: data.treatment, notes: data.notes,
      },
    });
  }

  // ─── Prescriptions ─────────────────────────────────────────────────────

  async getPrescriptions(userId: string, opts: { active?: boolean; limit?: number; offset?: number }) {
    const profile = await this.ensurePatientProfile(userId);
    const where: any = { patientId: profile.id };
    if (opts.active !== undefined) where.isActive = opts.active;
    return this.prisma.prescription.findMany({
      where, orderBy: { createdAt: 'desc' }, take: opts.limit || 20, skip: opts.offset || 0,
      include: { medicines: { include: { medicine: true } } },
    });
  }

  /**
   * Flattened view of a single prescription — used by the PDF endpoint.
   * Includes patient + doctor names, license, flattened medication rows.
   */
  async getPrescriptionById(userId: string, prescriptionId: string) {
    const prescription = await this.prisma.prescription.findFirst({
      where: { id: prescriptionId, patient: { userId } },
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true } } } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
        medicines: { include: { medicine: true } },
      },
    });
    if (!prescription) return null;
    return {
      id: prescription.id,
      issuedAt: prescription.createdAt,
      diagnosis: prescription.diagnosis,
      notes: prescription.notes,
      patientName: `${prescription.patient.user.firstName} ${prescription.patient.user.lastName}`.trim(),
      doctorName: `Dr. ${prescription.doctor.user.firstName} ${prescription.doctor.user.lastName}`.trim(),
      doctorLicense: (prescription.doctor as any).licenseNumber ?? null,
      medications: prescription.medicines.map((m) => ({
        name: m.medicine?.name,
        strength: (m.medicine as any)?.strength ?? null,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        notes: m.instructions,
      })),
    };
  }

  async createPrescription(userId: string, doctorUserId: string, data: any) {
    const profile = await this.ensurePatientProfile(userId);
    const doctorProfile = await this.prisma.doctorProfile.findUnique({ where: { userId: doctorUserId }, select: { id: true } });
    if (!doctorProfile) throw new NotFoundException('Doctor profile not found');

    const prescription = await this.prisma.prescription.create({
      data: {
        patientId: profile.id, doctorId: doctorProfile.id,
        diagnosis: data.diagnosis, notes: data.notes, nextRefill: data.nextRefill ? new Date(data.nextRefill) : null,
        medicines: data.medicines?.length ? {
          create: data.medicines.map((m: any) => ({
            medicineId: m.medicineId, dosage: m.dosage, frequency: m.frequency,
            duration: m.duration, instructions: m.instructions,
          })),
        } : undefined,
      },
      include: { medicines: { include: { medicine: true } } },
    });

    await this.notifications.createNotification({
      userId, type: 'prescription', title: 'New Prescription',
      message: `You have a new prescription for: ${data.diagnosis}`,
      referenceId: prescription.id, referenceType: 'prescription',
    });

    return prescription;
  }

  // ─── Vital Signs ───────────────────────────────────────────────────────

  async getVitalSigns(userId: string, opts: { latest?: boolean; limit?: number }) {
    const profile = await this.ensurePatientProfile(userId);
    if (opts.latest) {
      return this.prisma.vitalSigns.findFirst({ where: { patientId: profile.id }, orderBy: { recordedAt: 'desc' } });
    }
    return this.prisma.vitalSigns.findMany({
      where: { patientId: profile.id }, orderBy: { recordedAt: 'desc' }, take: opts.limit || 20,
    });
  }

  async createVitalSigns(userId: string, data: any) {
    const profile = await this.ensurePatientProfile(userId);
    return this.prisma.vitalSigns.create({
      data: {
        patientId: profile.id,
        systolicBP: data.systolicBP, diastolicBP: data.diastolicBP, heartRate: data.heartRate,
        temperature: data.temperature, weight: data.weight, height: data.height,
        oxygenSaturation: data.oxygenSaturation, glucose: data.glucose, cholesterol: data.cholesterol,
      },
    });
  }

  // ─── Pill Reminders ────────────────────────────────────────────────────

  async getPillReminders(userId: string, active?: boolean) {
    const profile = await this.ensurePatientProfile(userId);
    const where: any = { patientId: profile.id };
    if (active !== undefined) where.isActive = active;
    return this.prisma.pillReminder.findMany({
      where, orderBy: { nextDose: 'asc' },
      include: { prescription: true },
    });
  }

  // ─── Lab Tests ─────────────────────────────────────────────────────────

  async getLabTests(userId: string, opts: { status?: string; limit?: number; offset?: number }) {
    const profile = await this.ensurePatientProfile(userId);
    const where: any = { patientId: profile.id };
    if (opts.status) where.status = opts.status;
    const [tests, total] = await Promise.all([
      this.prisma.labTest.findMany({
        where, orderBy: { orderedAt: 'desc' }, take: opts.limit || 20, skip: opts.offset || 0,
        include: { results: true },
      }),
      this.prisma.labTest.count({ where }),
    ]);
    return { tests, total };
  }

  // ─── Insurance Claims ─────────────────────────────────────────────────

  async getClaims(userId: string) {
    const profile = await this.ensurePatientProfile(userId);
    return this.prisma.insuranceClaim.findMany({
      where: { patientId: profile.id },
      orderBy: { submittedDate: 'desc' },
      include: { plan: true },
    });
  }

  async getPatientAppointments(userId: string, limit?: number) {
    const profile = await this.prisma.patientProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) return [];
    return this.prisma.appointment.findMany({
      where: { patientId: profile.id },
      include: { doctor: { include: { user: { select: { id: true, firstName: true, lastName: true, profileImage: true } } } } },
      orderBy: { scheduledAt: 'desc' },
      take: limit || 50,
    });
  }

  async getPatientBookings(userId: string, type?: string, limit?: number) {
    const profile = await this.prisma.patientProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) return [];
    const take = limit || 50;
    const patientId = profile.id;

    const [appointments, nurseBookings, childcareBookings, labTests, emergencyBookings, serviceBookings] = await Promise.all([
      this.prisma.appointment.findMany({ where: { patientId }, orderBy: { scheduledAt: 'desc' }, take }).catch(() => []),
      this.prisma.nurseBooking.findMany({ where: { patientId }, orderBy: { scheduledAt: 'desc' }, take }).catch(() => []),
      this.prisma.childcareBooking.findMany({ where: { patientId }, orderBy: { scheduledAt: 'desc' }, take }).catch(() => []),
      this.prisma.labTestBooking.findMany({ where: { patientId }, orderBy: { scheduledAt: 'desc' }, take }).catch(() => []),
      this.prisma.emergencyBooking.findMany({ where: { patientId }, orderBy: { createdAt: 'desc' }, take }).catch(() => []),
      this.prisma.serviceBooking.findMany({ where: { patientId }, orderBy: { scheduledAt: 'desc' }, take }).catch(() => []),
    ]);

    const toPlain = (obj: any) => JSON.parse(JSON.stringify(obj));
    const bookings: any[] = [];
    appointments.forEach(a => bookings.push({ ...toPlain(a), bookingType: 'appointment', type: 'doctor' }));
    nurseBookings.forEach(b => bookings.push({ ...toPlain(b), bookingType: 'nurse_booking', type: 'nurse' }));
    childcareBookings.forEach(b => bookings.push({ ...toPlain(b), bookingType: 'childcare_booking', type: 'nanny' }));
    labTests.forEach(b => bookings.push({ ...toPlain(b), bookingType: 'lab_test_booking', type: 'lab-test' }));
    emergencyBookings.forEach(b => bookings.push({ ...toPlain(b), bookingType: 'emergency_booking', type: 'emergency' }));
    serviceBookings.forEach(b => bookings.push({ ...toPlain(b), bookingType: 'service_booking', type: 'service' }));

    return type ? bookings.filter(b => b.type === type || b.bookingType?.includes(type)) : bookings;
  }
}
