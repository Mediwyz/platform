import { Test, TestingModule } from '@nestjs/testing';
import { AuthService, cookieToPrismaUserType, prismaUserTypeToCookie } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RolesResolverService } from '../shared/services/roles-resolver.service';
import { TreasuryService } from '../shared/services/treasury.service';
import { ProviderIndexService } from '../embeddings/provider-index.service';
import { UnauthorizedException, ConflictException } from '@nestjs/common';

// Mock PrismaService
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  patientProfile: { create: jest.fn() },
  doctorProfile: { create: jest.fn() },
  nurseProfile: { create: jest.fn() },
  nannyProfile: { create: jest.fn() },
  pharmacistProfile: { create: jest.fn() },
  labTechProfile: { create: jest.fn() },
  emergencyWorkerProfile: { create: jest.fn() },
  insuranceRepProfile: { create: jest.fn() },
  corporateAdminProfile: { create: jest.fn() },
  referralPartnerProfile: { create: jest.fn() },
  regionalAdminProfile: { create: jest.fn() },
  caregiverProfile: { create: jest.fn() },
  physiotherapistProfile: { create: jest.fn() },
  dentistProfile: { create: jest.fn() },
  optometristProfile: { create: jest.fn() },
  nutritionistProfile: { create: jest.fn() },
  userWallet: { create: jest.fn().mockResolvedValue({ id: 'W1' }) },
  walletTransaction: { create: jest.fn() },
  providerRole: { findFirst: jest.fn() },
  platformService: { findMany: jest.fn() },
  providerServiceConfig: { create: jest.fn() },
  $transaction: jest.fn((fn) => (typeof fn === 'function' ? fn(mockPrisma) : Promise.all(fn))),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const mockRolesResolver = {
      cookieToCodeAsync: jest.fn().mockResolvedValue(null),
      codeToCookieAsync: jest.fn().mockResolvedValue(null),
      signupToCodeAsync: jest.fn().mockResolvedValue(null),
      cookieToCodeSync: jest.fn().mockReturnValue(null),
      codeToCookieSync: jest.fn().mockReturnValue(null),
      refresh: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RolesResolverService, useValue: mockRolesResolver },
        { provide: TreasuryService, useValue: { creditPlatformFee: jest.fn() } },
        { provide: ProviderIndexService, useValue: { reembedProvider: jest.fn().mockResolvedValue(false) } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('cookieToPrismaUserType mapping', () => {
    it('maps patient correctly', () => {
      expect(cookieToPrismaUserType['patient']).toBe('MEMBER');
    });
    it('maps doctor correctly', () => {
      expect(cookieToPrismaUserType['doctor']).toBe('DOCTOR');
    });
    it('maps child-care-nurse to NANNY', () => {
      expect(cookieToPrismaUserType['child-care-nurse']).toBe('NANNY');
    });
    it('maps pharmacy to PHARMACIST', () => {
      expect(cookieToPrismaUserType['pharmacy']).toBe('PHARMACIST');
    });
    it('maps lab to LAB_TECHNICIAN', () => {
      expect(cookieToPrismaUserType['lab']).toBe('LAB_TECHNICIAN');
    });
    it('maps ambulance to EMERGENCY_WORKER', () => {
      expect(cookieToPrismaUserType['ambulance']).toBe('EMERGENCY_WORKER');
    });
    it('covers all 16 user types', () => {
      expect(Object.keys(cookieToPrismaUserType).length).toBeGreaterThanOrEqual(16);
    });
  });

  describe('prismaUserTypeToCookie mapping', () => {
    it('maps PATIENT to patient', () => {
      expect(prismaUserTypeToCookie['MEMBER']).toBe('patient');
    });
    it('maps DOCTOR to doctor', () => {
      expect(prismaUserTypeToCookie['DOCTOR']).toBe('doctor');
    });
    it('maps NANNY to child-care-nurse', () => {
      expect(prismaUserTypeToCookie['NANNY']).toBe('child-care-nurse');
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException for non-existent user', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      await expect(service.login('nonexistent@test.com', 'password'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-1', email: 'test@test.com', password: '$2b$10$invalidhash',
        userType: 'MEMBER', accountStatus: 'active',
      });
      await expect(service.login('test@test.com', 'wrongpassword'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('throws ConflictException for duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });
      await expect(service.register({
        fullName: 'John Doe',
        email: 'existing@test.com', password: 'password123',
        phone: '+230-5555-0001', dateOfBirth: '1990-01-01',
        gender: 'male', address: 'Test Address',
        userType: 'patient',
      })).rejects.toThrow(ConflictException);
    });
  });
});
