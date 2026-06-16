import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  providerSpecialty: {
    findMany: jest.fn().mockResolvedValue([]),
  },
  providerServiceConfig: {
    findMany: jest.fn().mockResolvedValue([]),
  },
};

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    jest.clearAllMocks();
    // Restore defaults cleared by clearAllMocks
    mockPrisma.providerSpecialty.findMany.mockResolvedValue([]);
    mockPrisma.providerServiceConfig.findMany.mockResolvedValue([]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchProviders', () => {
    // ─── Input validation ────────────────────────────────────────────────

    it('should throw BadRequestException when type is empty string', async () => {
      await expect(service.searchProviders('')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when type is not provided', async () => {
      await expect(service.searchProviders(undefined as any)).rejects.toThrow(BadRequestException);
    });

    // ─── Basic search by type ────────────────────────────────────────────

    it('should return paginated results for DOCTOR type', async () => {
      const mockUsers = [
        {
          id: 'DOC001', firstName: 'John', lastName: 'Doc', profileImage: null,
          address: 'Port Louis', phone: '+230123', verified: true, userType: 'DOCTOR', gender: 'male',
          doctorProfile: {
            id: 'DP001', specialty: ['Cardiology'], subSpecialties: [], rating: 4.5,
            reviewCount: 10, experience: 15, consultationFee: 1500,
            videoConsultationFee: 1200, consultationTypes: ['video'], bio: 'Expert',
            location: 'Port Louis', languages: ['English'], emergencyAvailable: false,
            homeVisitAvailable: false, telemedicineAvailable: true,
          },
        },
      ];
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await service.searchProviders('DOCTOR');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('John Doc');
      expect(result.data[0].userId).toBe('DOC001');
      expect(result.data[0].profileId).toBe('DP001');
      expect(result.data[0].rating).toBe(4.5);
      expect(result.data[0].consultationFee).toBe(1500);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should return NURSE results with specializations', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'NRS001', firstName: 'Jane', lastName: 'Nurse', profileImage: null,
          address: null, phone: null, verified: true, userType: 'NURSE', gender: 'female',
          nurseProfile: { id: 'NP001', specializations: ['ICU', 'Pediatrics'], experience: 8, licenseNumber: 'NL001' },
        },
      ]);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await service.searchProviders('NURSE');

      expect(result.data[0].specializations).toEqual(['ICU', 'Pediatrics']);
      expect(result.data[0].experience).toBe(8);
    });

    it('should derive serviceModes from the providers linked service workflows', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'DOC001', firstName: 'John', lastName: 'Doc', profileImage: null,
          address: null, phone: null, verified: true, userType: 'DOCTOR', gender: 'male',
          doctorProfile: { id: 'DP001', specialty: [], rating: 0, consultationFee: 0 },
        },
      ]);
      mockPrisma.user.count.mockResolvedValue(1);
      mockPrisma.providerServiceConfig.findMany.mockResolvedValue([
        {
          providerUserId: 'DOC001',
          workflowTemplates: [
            { workflowTemplate: { serviceMode: 'office', isActive: true } },
            { workflowTemplate: { serviceMode: 'video', isActive: true } },
            { workflowTemplate: { serviceMode: 'office', isActive: true } }, // duplicate → deduped
            { workflowTemplate: { serviceMode: 'home', isActive: false } },  // inactive → excluded
          ],
        },
      ]);

      const result = await service.searchProviders('DOCTOR');

      expect(result.data[0].serviceModes.sort()).toEqual(['office', 'video']);
    });

    it('should return empty serviceModes when the provider has no service configs', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'DOC001', firstName: 'John', lastName: 'Doc', profileImage: null,
          address: null, phone: null, verified: true, userType: 'DOCTOR', gender: 'male',
          doctorProfile: { id: 'DP001', specialty: [], rating: 0, consultationFee: 0 },
        },
      ]);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await service.searchProviders('DOCTOR');

      expect(result.data[0].serviceModes).toEqual([]);
    });

    it('should uppercase the type parameter', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.searchProviders('doctor');

      const callArgs = mockPrisma.user.findMany.mock.calls[0][0];
      expect(callArgs.where.userType).toBe('DOCTOR');
    });

    // ─── Text query filtering ────────────────────────────────────────────

    it('should filter by name/address when query is provided', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.searchProviders('NURSE', 'Jane');

      const callArgs = mockPrisma.user.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toBeDefined();
      expect(callArgs.where.OR).toEqual(
        expect.arrayContaining([
          { firstName: { contains: 'Jane', mode: 'insensitive' } },
          { lastName: { contains: 'Jane', mode: 'insensitive' } },
          { address: { contains: 'Jane', mode: 'insensitive' } },
        ]),
      );
    });

    it('should not add OR clause when no query is provided', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.searchProviders('DOCTOR');

      const callArgs = mockPrisma.user.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toBeUndefined();
    });

    // ─── Specialty filtering ─────────────────────────────────────────────

    it('should filter DOCTOR by specialty using profile relation', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.searchProviders('DOCTOR', undefined, undefined, undefined, 'Cardiology');

      const callArgs = mockPrisma.user.findMany.mock.calls[0][0];
      expect(callArgs.where.doctorProfile).toEqual({ specialty: { has: 'Cardiology' } });
    });

    it('should filter NURSE by specializations using profile relation', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.searchProviders('NURSE', undefined, undefined, undefined, 'ICU');

      const callArgs = mockPrisma.user.findMany.mock.calls[0][0];
      expect(callArgs.where.nurseProfile).toEqual({ specializations: { has: 'ICU' } });
    });

    // ─── Pagination ──────────────────────────────────────────────────────

    it('should respect pagination parameters', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      const result = await service.searchProviders('DOCTOR', undefined, 2, 10);

      const callArgs = mockPrisma.user.findMany.mock.calls[0][0];
      expect(callArgs.take).toBe(10);
      expect(callArgs.skip).toBe(10); // page 2, skip first 10
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });

    it('should cap limit at 100', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      const result = await service.searchProviders('DOCTOR', undefined, 1, 999);

      const callArgs = mockPrisma.user.findMany.mock.calls[0][0];
      expect(callArgs.take).toBe(100);
      expect(result.limit).toBe(100);
    });

    it('should default to page 1 and limit 50', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      const result = await service.searchProviders('DOCTOR');

      const callArgs = mockPrisma.user.findMany.mock.calls[0][0];
      expect(callArgs.take).toBe(50);
      expect(callArgs.skip).toBe(0);
      expect(result.page).toBe(1);
    });

    it('should clamp page to minimum of 1', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      const result = await service.searchProviders('DOCTOR', undefined, -1);

      expect(result.page).toBe(1);
    });

    it('should calculate totalPages correctly', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(45);

      const result = await service.searchProviders('DOCTOR', undefined, 1, 10);

      expect(result.totalPages).toBe(5); // ceil(45/10)
    });

    // ─── Dynamic roles (no profile table) ────────────────────────────────

    it('should handle dynamic roles without profile tables by using ProviderSpecialty', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'CG001', firstName: 'Care', lastName: 'Giver', profileImage: null,
          address: null, phone: null, verified: true, userType: 'CAREGIVER', gender: null,
          caregiverProfile: { id: 'CGP001', experience: 5, specializations: ['Elderly Care'], certifications: ['CPR'] },
        },
      ]);
      mockPrisma.user.count.mockResolvedValue(1);
      mockPrisma.providerSpecialty.findMany.mockResolvedValue([
        { name: 'Elderly Care', icon: 'heart' },
        { name: 'Disability Care', icon: 'wheelchair' },
      ]);

      const result = await service.searchProviders('CAREGIVER');

      expect(result.data[0].name).toBe('Care Giver');
      expect(result.data[0].specializations).toEqual(['Elderly Care']);
    });

    // ─── Active status filter ────────────────────────────────────────────

    it('should only return users with active account status', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.searchProviders('DOCTOR');

      const callArgs = mockPrisma.user.findMany.mock.calls[0][0];
      expect(callArgs.where.accountStatus).toBe('active');
    });
  });
});
