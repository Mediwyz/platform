-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserType" AS ENUM ('MEMBER', 'DOCTOR', 'NURSE', 'NANNY', 'PHARMACIST', 'LAB_TECHNICIAN', 'EMERGENCY_WORKER', 'INSURANCE_REP', 'CORPORATE_ADMIN', 'REFERRAL_PARTNER', 'REGIONAL_ADMIN', 'CAREGIVER', 'PHYSIOTHERAPIST', 'DENTIST', 'OPTOMETRIST', 'NUTRITIONIST');

-- CreateEnum
CREATE TYPE "public"."AppointmentType" AS ENUM ('video', 'in_person', 'home_visit');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "public"."MealType" AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- CreateEnum
CREATE TYPE "public"."ActivityLevel" AS ENUM ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active');

-- CreateEnum
CREATE TYPE "public"."WeightGoal" AS ENUM ('lose', 'maintain', 'gain');

-- CreateEnum
CREATE TYPE "public"."ExerciseIntensity" AS ENUM ('light', 'moderate', 'vigorous');

-- CreateEnum
CREATE TYPE "public"."SubscriptionPlanType" AS ENUM ('individual', 'corporate');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('active', 'cancelled', 'expired', 'past_due');

-- CreateEnum
CREATE TYPE "public"."WalletTxType" AS ENUM ('credit', 'debit');

-- CreateEnum
CREATE TYPE "public"."TreasuryTxType" AS ENUM ('contribution', 'platform_fee', 'claim_payout', 'direct_billing');

-- CreateEnum
CREATE TYPE "public"."CorporateEmployeeStatus" AS ENUM ('pending', 'active', 'removed');

-- CreateEnum
CREATE TYPE "public"."SleepQuality" AS ENUM ('terrible', 'poor', 'fair', 'good', 'excellent');

-- CreateEnum
CREATE TYPE "public"."PaymentTiming" AS ENUM ('IMMEDIATE', 'ON_ACCEPTANCE', 'ON_COMPLETION', 'PAY_LATER');

-- CreateEnum
CREATE TYPE "public"."WorkflowSuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."ProviderRole" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "singularLabel" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'FaUserMd',
    "iconKey" TEXT,
    "color" TEXT NOT NULL DEFAULT '#0C6780',
    "cardImage" TEXT,
    "description" TEXT,
    "searchEnabled" BOOLEAN NOT NULL DEFAULT true,
    "bookingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inventoryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isProvider" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 100,
    "defaultBookingFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "skipWalletCheck" BOOLEAN NOT NULL DEFAULT false,
    "requiredContentType" TEXT,
    "regionCode" TEXT,
    "createdByAdminId" TEXT,
    "urlPrefix" TEXT,
    "cookieValue" TEXT,
    "profileFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RoleVerificationDoc" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RoleVerificationDoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "flag" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'MUR',
    "currencySymbol" TEXT NOT NULL DEFAULT 'Rs',
    "trialCredit" DOUBLE PRECISION NOT NULL DEFAULT 4500,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "profileImage" TEXT,
    "coverImage" TEXT,
    "bio" TEXT,
    "phone" TEXT NOT NULL,
    "userType" "public"."UserType" NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "accountStatus" TEXT NOT NULL DEFAULT 'active',
    "referredByCode" TEXT,
    "regionId" TEXT,
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "securityQuestion" TEXT,
    "securityAnswerHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PatientProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "passportNumber" TEXT,
    "bloodType" TEXT NOT NULL,
    "allergies" TEXT[],
    "chronicConditions" TEXT[],
    "healthScore" INTEGER NOT NULL DEFAULT 50,

    CONSTRAINT "PatientProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DoctorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specialty" TEXT[],
    "subSpecialties" TEXT[],
    "licenseNumber" TEXT NOT NULL,
    "licenseExpiryDate" TIMESTAMP(3) NOT NULL,
    "clinicAffiliation" TEXT NOT NULL,
    "hospitalPrivileges" TEXT[],
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "experience" TEXT NOT NULL,
    "publications" TEXT[],
    "awards" TEXT[],
    "location" TEXT NOT NULL,
    "alternatePhone" TEXT,
    "website" TEXT,
    "languages" TEXT[],
    "nextAvailable" TIMESTAMP(3),
    "consultationDuration" INTEGER NOT NULL DEFAULT 30,
    "consultationFee" DOUBLE PRECISION NOT NULL,
    "videoConsultationFee" DOUBLE PRECISION NOT NULL,
    "emergencyConsultationFee" DOUBLE PRECISION NOT NULL,
    "consultationTypes" TEXT[],
    "emergencyAvailable" BOOLEAN NOT NULL DEFAULT false,
    "homeVisitAvailable" BOOLEAN NOT NULL DEFAULT false,
    "telemedicineAvailable" BOOLEAN NOT NULL DEFAULT true,
    "nationality" TEXT,
    "bio" TEXT NOT NULL,
    "philosophy" TEXT,
    "specialInterests" TEXT[],
    "verificationDate" TIMESTAMP(3),

    CONSTRAINT "DoctorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DoctorServiceCatalog" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MUR',
    "duration" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorServiceCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NurseProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "experience" INTEGER NOT NULL,
    "specializations" TEXT[],

    CONSTRAINT "NurseProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NannyProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "experience" INTEGER NOT NULL,
    "certifications" TEXT[],

    CONSTRAINT "NannyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PharmacistProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "pharmacyName" TEXT NOT NULL,
    "pharmacyAddress" TEXT NOT NULL,
    "specializations" TEXT[],

    CONSTRAINT "PharmacistProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LabTechProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "labName" TEXT NOT NULL,
    "specializations" TEXT[],

    CONSTRAINT "LabTechProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmergencyWorkerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "certifications" TEXT[],
    "vehicleType" TEXT,
    "responseZone" TEXT,
    "emtLevel" TEXT,

    CONSTRAINT "EmergencyWorkerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InsuranceRepProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "coverageTypes" TEXT[],

    CONSTRAINT "InsuranceRepProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CorporateAdminProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "employeeCount" INTEGER,
    "industry" TEXT,
    "isInsuranceCompany" BOOLEAN NOT NULL DEFAULT false,
    "monthlyContribution" DOUBLE PRECISION,
    "coverageDescription" TEXT,
    "subscriptionPlanId" TEXT,

    CONSTRAINT "CorporateAdminProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReferralPartnerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "referralCode" TEXT NOT NULL,
    "totalReferrals" INTEGER NOT NULL DEFAULT 0,
    "totalCommissionEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "ReferralPartnerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RegionalAdminProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "countryCode" TEXT,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "totalCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "RegionalAdminProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CaregiverProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "specializations" TEXT[],
    "certifications" TEXT[],

    CONSTRAINT "CaregiverProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PhysiotherapistProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "specializations" TEXT[],
    "clinicName" TEXT,
    "clinicAddress" TEXT,

    CONSTRAINT "PhysiotherapistProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DentistProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "specializations" TEXT[],
    "clinicName" TEXT,
    "clinicAddress" TEXT,

    CONSTRAINT "DentistProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OptometristProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "specializations" TEXT[],
    "clinicName" TEXT,
    "clinicAddress" TEXT,

    CONSTRAINT "OptometristProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NutritionistProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "specializations" TEXT[],
    "certifications" TEXT[],

    CONSTRAINT "NutritionistProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProviderSpecialty" (
    "id" TEXT NOT NULL,
    "providerType" "public"."UserType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderSpecialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HealthProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "providerType" "public"."UserType" NOT NULL,
    "specialty" TEXT,
    "durationWeeks" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MUR',
    "maxParticipants" INTEGER,
    "countryCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProgramSession" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "serviceName" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProgramSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProgramProvider" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'collaborator',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProgramEnrollment" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'enrolled',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ProgramEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProgramSessionProgress" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "bookingId" TEXT,

    CONSTRAINT "ProgramSessionProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubscriptionPlanProgram" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SubscriptionPlanProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MedicalRecord" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "notes" TEXT,
    "attachments" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Prescription" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diagnosis" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "nextRefill" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Medicine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Medicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PrescriptionMedicine" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "instructions" TEXT,

    CONSTRAINT "PrescriptionMedicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VitalSigns" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "systolicBP" INTEGER,
    "diastolicBP" INTEGER,
    "heartRate" INTEGER,
    "temperature" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "oxygenSaturation" INTEGER,
    "glucose" INTEGER,
    "cholesterol" INTEGER,
    "facility" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VitalSigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LabTest" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "orderedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "facility" TEXT,
    "orderedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LabTestResult" (
    "id" TEXT NOT NULL,
    "labTestId" TEXT NOT NULL,
    "parameter" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "referenceMin" TEXT,
    "referenceMax" TEXT,
    "isAbnormal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LabTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Appointment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "specialty" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "location" TEXT,
    "roomId" TEXT,
    "notes" TEXT,
    "cancellationReason" TEXT,
    "cancelledBy" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "serviceName" TEXT,
    "servicePrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScheduleSlot" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ScheduleSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NurseBooking" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "nurseId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "notes" TEXT,
    "serviceName" TEXT,
    "servicePrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NurseBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChildcareBooking" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "nannyId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "children" TEXT[],
    "specialInstructions" TEXT,
    "reason" TEXT,
    "serviceName" TEXT,
    "servicePrice" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildcareBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VideoRoom" (
    "id" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "name" TEXT,
    "creatorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "maxParticipants" INTEGER NOT NULL DEFAULT 2,
    "mode" TEXT NOT NULL DEFAULT 'video',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VideoRoomParticipant" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'participant',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoRoomParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VideoCallSession" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "callQuality" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoCallSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WebRTCConnection" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "socketId" TEXT,
    "connectionState" TEXT NOT NULL DEFAULT 'new',
    "iceState" TEXT,
    "signalData" JSONB,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebRTCConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Conversation" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'direct',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConversationParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PatientEmergencyContact" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,

    CONSTRAINT "PatientEmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmergencyServiceContact" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "available24h" BOOLEAN NOT NULL DEFAULT true,
    "responseTime" TEXT,
    "specialization" TEXT[],
    "location" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',

    CONSTRAINT "EmergencyServiceContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BillingInfo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "lastFour" TEXT NOT NULL,
    "cardHolder" TEXT NOT NULL,
    "expiryDate" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PillReminder" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "medicineName" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "times" TEXT[],
    "frequency" TEXT NOT NULL,
    "nextDose" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notificationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PillReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NutritionAnalysis" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "foodName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calories" INTEGER NOT NULL,
    "carbs" INTEGER NOT NULL,
    "protein" INTEGER NOT NULL,
    "fat" INTEGER NOT NULL,
    "vitamins" TEXT[],
    "healthScore" INTEGER NOT NULL,
    "suggestions" TEXT[],
    "allergens" TEXT[],
    "nutritionalBenefits" TEXT[],
    "mealType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NutritionAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" TEXT DEFAULT 'pending',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MedicineOrder" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "pharmacy" TEXT,
    "orderedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicineOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MedicineOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "pharmacyMedicineId" TEXT,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MedicineOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminActionLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB,
    "groupKey" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DoctorEducation" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "honors" TEXT,

    CONSTRAINT "DoctorEducation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DoctorCertification" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuingBody" TEXT NOT NULL,
    "dateObtained" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DoctorCertification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DoctorWorkHistory" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DoctorWorkHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PatientComment" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CmsSection" (
    "id" TEXT NOT NULL,
    "sectionType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "countryCode" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CmsHeroSlide" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "imageUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "countryCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsHeroSlide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CmsTestimonial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "countryCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsTestimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PharmacyMedicine" (
    "id" TEXT NOT NULL,
    "pharmacistId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "genericName" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dosageForm" TEXT NOT NULL,
    "strength" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MUR',
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "requiresPrescription" BOOLEAN NOT NULL DEFAULT false,
    "sideEffects" TEXT[],
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacyMedicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LabTestCatalog" (
    "id" TEXT NOT NULL,
    "labTechId" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MUR',
    "turnaroundTime" TEXT NOT NULL,
    "sampleType" TEXT NOT NULL,
    "preparation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabTestCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NurseServiceCatalog" (
    "id" TEXT NOT NULL,
    "nurseId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MUR',
    "duration" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NurseServiceCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NannyServiceCatalog" (
    "id" TEXT NOT NULL,
    "nannyId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MUR',
    "ageRange" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NannyServiceCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmergencyServiceListing" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "responseTime" TEXT NOT NULL,
    "available24h" BOOLEAN NOT NULL DEFAULT true,
    "coverageArea" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'MUR',
    "specializations" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyServiceListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InsurancePlanListing" (
    "id" TEXT NOT NULL,
    "insuranceRepId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "planType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "monthlyPremium" DOUBLE PRECISION NOT NULL,
    "annualPremium" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'MUR',
    "coverageAmount" DOUBLE PRECISION NOT NULL,
    "deductible" DOUBLE PRECISION,
    "coverageDetails" TEXT[],
    "eligibility" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsurancePlanListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InsuranceClaim" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "insuranceRepId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "planId" TEXT,
    "policyHolderName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "policyType" TEXT NOT NULL,
    "claimAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserWallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 4500,
    "currency" TEXT NOT NULL DEFAULT 'MUR',
    "initialCredit" DOUBLE PRECISION NOT NULL DEFAULT 4500,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "public"."WalletTxType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "serviceType" TEXT,
    "referenceId" TEXT,
    "balanceBefore" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "platformCommission" DOUBLE PRECISION,
    "regionalCommission" DOUBLE PRECISION,
    "providerAmount" DOUBLE PRECISION,
    "regionalAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "patientUserId" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "bookingId" TEXT,
    "orderId" TEXT,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "providerAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'MUR',
    "status" TEXT NOT NULL DEFAULT 'paid',
    "description" TEXT NOT NULL,
    "items" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DoctorPost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "companyId" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "tags" TEXT[],
    "imageUrl" TEXT,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DoctorPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PostComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PostLike" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LabTestBooking" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "labTechId" TEXT,
    "testName" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sampleType" TEXT,
    "notes" TEXT,
    "price" DOUBLE PRECISION,
    "resultFindings" TEXT,
    "resultNotes" TEXT,
    "resultDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabTestBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmergencyBooking" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "responderId" TEXT,
    "emergencyType" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServiceBooking" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "providerType" "public"."UserType" NOT NULL,
    "providerName" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "type" TEXT NOT NULL DEFAULT 'in_person',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "notes" TEXT,
    "serviceName" TEXT,
    "servicePrice" DOUBLE PRECISION,
    "specialty" TEXT,
    "location" TEXT,
    "roomId" TEXT,
    "priority" TEXT DEFAULT 'normal',
    "cancellationReason" TEXT,
    "cancelledBy" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ServiceBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProviderAvailability" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotDuration" INTEGER NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BookedSlot" (
    "id" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'booked',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookedSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AiChatSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New Chat',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AiChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AiPatientInsight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiPatientInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClinicalKnowledge" (
    "id" TEXT NOT NULL,
    "conditionKey" TEXT NOT NULL,
    "aliases" TEXT[],
    "dietaryGuidance" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'nutrition',
    "sources" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalKnowledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AiCallLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "surface" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "promptVersion" TEXT,
    "emergencyCategory" TEXT,
    "allergyMatched" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiCallLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HealthTrackerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "heightCm" DOUBLE PRECISION,
    "weightKg" DOUBLE PRECISION,
    "age" INTEGER,
    "gender" TEXT,
    "activityLevel" "public"."ActivityLevel" NOT NULL DEFAULT 'moderately_active',
    "weightGoal" "public"."WeightGoal" NOT NULL DEFAULT 'maintain',
    "targetCalories" INTEGER,
    "targetWaterMl" INTEGER NOT NULL DEFAULT 2000,
    "targetExerciseMin" INTEGER NOT NULL DEFAULT 30,
    "targetSleepMin" INTEGER NOT NULL DEFAULT 480,
    "dietaryPreferences" TEXT[],
    "allergenSettings" TEXT[],
    "tdeeCalories" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthTrackerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FoodEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "mealType" "public"."MealType" NOT NULL,
    "name" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fiber" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'serving',
    "servingSize" TEXT,
    "foodDbId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExerciseEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "exerciseType" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "caloriesBurned" INTEGER NOT NULL,
    "intensity" "public"."ExerciseIntensity" NOT NULL DEFAULT 'moderate',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WaterEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amountMl" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaterEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SleepEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sleepStart" TIMESTAMP(3),
    "sleepEnd" TIMESTAMP(3),
    "durationMin" INTEGER NOT NULL,
    "quality" "public"."SleepQuality" NOT NULL DEFAULT 'fair',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SleepEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyGoalSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "caloriesConsumed" INTEGER NOT NULL DEFAULT 0,
    "caloriesBurned" INTEGER NOT NULL DEFAULT 0,
    "waterConsumedMl" INTEGER NOT NULL DEFAULT 0,
    "exerciseMinutes" INTEGER NOT NULL DEFAULT 0,
    "targetCalories" INTEGER NOT NULL,
    "targetWaterMl" INTEGER NOT NULL,
    "targetExerciseMin" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyGoalSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MealPlanEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "mealType" "public"."MealType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "calories" INTEGER NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isGenerated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MealPlanEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FoodDatabase" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fiber" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "servingSize" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'serving',
    "isLocal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FoodDatabase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProviderReview" (
    "id" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "reviewerUserId" TEXT NOT NULL,
    "providerType" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PlatformConfig" (
    "id" TEXT NOT NULL,
    "platformCommissionRate" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "regionalCommissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "providerCommissionRate" DOUBLE PRECISION NOT NULL DEFAULT 85,
    "currency" TEXT NOT NULL DEFAULT 'MUR',
    "trialWalletAmount" DOUBLE PRECISION NOT NULL DEFAULT 4500,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RoleFeatureConfig" (
    "id" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleFeatureConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RequiredDocumentConfig" (
    "id" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequiredDocumentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InsuranceCompanyTreasury" (
    "id" TEXT NOT NULL,
    "companyProfileId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'MUR',
    "totalInflow" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalOutflow" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceCompanyTreasury_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TreasuryTransaction" (
    "id" TEXT NOT NULL,
    "treasuryId" TEXT NOT NULL,
    "type" "public"."TreasuryTxType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "memberId" TEXT,
    "claimId" TEXT,
    "description" TEXT NOT NULL,
    "balanceBefore" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreasuryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PlatformTreasury" (
    "id" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'MUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformTreasury_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InsurancePlan" (
    "id" TEXT NOT NULL,
    "companyProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthlyContribution" DOUBLE PRECISION NOT NULL,
    "annualCeiling" DOUBLE PRECISION NOT NULL,
    "deductible" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "coPayPercent" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "waitingPeriodDays" INTEGER NOT NULL DEFAULT 30,
    "categoryLimits" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsurancePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InsurancePolicy" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renewsAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "ytdClaimsPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ytdResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deductibleUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsurancePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PolicyRenewalLog" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "chargedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyRenewalLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PolicyBeneficiary" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyBeneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClaimDecisionLog" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "payoutAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rulesApplied" JSONB NOT NULL,
    "reason" TEXT,
    "decidedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimDecisionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PreAuthorization" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "companyProfileId" TEXT NOT NULL,
    "serviceCode" TEXT,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "requestedAmount" DOUBLE PRECISION NOT NULL,
    "approvedAmount" DOUBLE PRECISION,
    "memberPaysAmount" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "rulesApplied" JSONB,
    "denialReason" TEXT,
    "usedAt" TIMESTAMP(3),
    "claimId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreAuthorization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProviderFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InsuranceClaimSubmission" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "companyProfileId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MUR',
    "receiptUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewerNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceClaimSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HealthStreak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastCheckInDate" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthStreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AppointmentReminder" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "bookingType" TEXT NOT NULL,
    "reminderType" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'Indian/Mauritius',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "appointmentReminders" BOOLEAN NOT NULL DEFAULT true,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "profileVisibility" TEXT NOT NULL DEFAULT 'public',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReferralClick" (
    "id" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "referralPartnerId" TEXT,
    "source" TEXT,
    "medium" TEXT,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "location" TEXT,
    "landingPage" TEXT,
    "convertedUserId" TEXT,
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserConnection" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "public"."SubscriptionPlanType" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MUR',
    "countryCode" TEXT,
    "targetAudience" TEXT,
    "quotas" JSONB NOT NULL DEFAULT '[]',
    "discounts" JSONB,
    "paidServices" JSONB,
    "features" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "public"."SubscriptionStatus" NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "corporateAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubscriptionRenewalLog" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "chargedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionRenewalLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubscriptionUsage" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "usageData" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CorporateEmployee" (
    "id" TEXT NOT NULL,
    "corporateAdminId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."CorporateEmployeeStatus" NOT NULL DEFAULT 'pending',
    "department" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    "lastContributionMonth" TEXT,
    "lastContributionAt" TIMESTAMP(3),

    CONSTRAINT "CorporateEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PlatformService" (
    "id" TEXT NOT NULL,
    "providerType" "public"."UserType" NOT NULL,
    "serviceName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconKey" TEXT,
    "emoji" TEXT,
    "imageUrl" TEXT,
    "defaultPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'MUR',
    "duration" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "countryCode" TEXT,
    "createdByProviderId" TEXT,
    "requiredContentType" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProviderServiceConfig" (
    "id" TEXT NOT NULL,
    "platformServiceId" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "priceOverride" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderServiceConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProviderServiceWorkflow" (
    "id" TEXT NOT NULL,
    "providerServiceConfigId" TEXT NOT NULL,
    "workflowTemplateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderServiceWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServiceGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "countryCode" TEXT NOT NULL,
    "createdByAdminId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServiceGroupItem" (
    "id" TEXT NOT NULL,
    "serviceGroupId" TEXT NOT NULL,
    "platformServiceId" TEXT NOT NULL,

    CONSTRAINT "ServiceGroupItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubscriptionPlanService" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "platformServiceId" TEXT,
    "serviceGroupId" TEXT,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "adminPrice" DOUBLE PRECISION,
    "monthlyLimit" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SubscriptionPlanService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkflowStepType" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "defaultFlags" JSONB NOT NULL DEFAULT '{}',
    "defaultActionsProvider" JSONB NOT NULL DEFAULT '[]',
    "defaultActionsPatient" JSONB NOT NULL DEFAULT '[]',
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,
    "isCancellation" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowStepType_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "public"."WorkflowTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "providerType" TEXT NOT NULL,
    "serviceMode" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "isLibrary" BOOLEAN NOT NULL DEFAULT false,
    "isBundle" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "paymentTiming" "public"."PaymentTiming" NOT NULL DEFAULT 'ON_ACCEPTANCE',
    "suggestedByProviderId" TEXT,
    "suggestionStatus" "public"."WorkflowSuggestionStatus",
    "suggestionNote" TEXT,
    "suggestedAt" TIMESTAMP(3),
    "createdByProviderId" TEXT,
    "createdByAdminId" TEXT,
    "regionCode" TEXT,
    "platformServiceId" TEXT,
    "steps" JSONB NOT NULL,
    "transitions" JSONB NOT NULL,
    "expectedDurationHours" INTEGER,
    "slaNote" TEXT,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "stepsHistory" JSONB NOT NULL DEFAULT '[]',
    "serviceConfig" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkflowInstance" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "bookingType" TEXT NOT NULL,
    "currentStatus" TEXT NOT NULL,
    "previousStatus" TEXT,
    "patientUserId" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "serviceMode" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "metadata" JSONB,
    "templateSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkflowStepLog" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actionByUserId" TEXT NOT NULL,
    "actionByRole" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "message" TEXT,
    "contentType" TEXT,
    "contentData" JSONB,
    "triggeredVideoCallId" TEXT,
    "triggeredStockActions" JSONB,
    "notificationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowStepLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkflowNotificationTemplate" (
    "id" TEXT NOT NULL,
    "workflowTemplateId" TEXT NOT NULL,
    "statusCode" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL DEFAULT 'workflow',
    "createdByProviderId" TEXT,
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowNotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProviderInventoryItem" (
    "id" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "providerType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "genericName" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'unit',
    "strength" TEXT,
    "dosageForm" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MUR',
    "discountPercent" DOUBLE PRECISION,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "minStockAlert" INTEGER NOT NULL DEFAULT 5,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "requiresPrescription" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sideEffects" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderInventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryOrder" (
    "id" TEXT NOT NULL,
    "patientUserId" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "providerType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MUR',
    "deliveryType" TEXT,
    "deliveryAddress" TEXT,
    "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prescriptionRequired" BOOLEAN NOT NULL DEFAULT false,
    "prescriptionId" TEXT,
    "workflowInstanceId" TEXT,
    "orderedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HealthcareEntity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'MU',
    "regionId" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "founderUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthcareEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProviderWorkplace" (
    "id" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "healthcareEntityId" TEXT NOT NULL,
    "role" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderWorkplace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkplaceInvitation" (
    "id" TEXT NOT NULL,
    "healthcareEntityId" TEXT NOT NULL,
    "invitedByUserId" TEXT NOT NULL,
    "invitedEmail" TEXT NOT NULL,
    "suggestedRole" TEXT,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkplaceInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderRole_code_key" ON "public"."ProviderRole"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderRole_slug_key" ON "public"."ProviderRole"("slug");

-- CreateIndex
CREATE INDEX "ProviderRole_isActive_isProvider_idx" ON "public"."ProviderRole"("isActive", "isProvider");

-- CreateIndex
CREATE INDEX "ProviderRole_regionCode_idx" ON "public"."ProviderRole"("regionCode");

-- CreateIndex
CREATE INDEX "RoleVerificationDoc_roleId_idx" ON "public"."RoleVerificationDoc"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "Region_name_key" ON "public"."Region"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Region_countryCode_key" ON "public"."Region"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "public"."User"("passwordResetToken");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_userType_idx" ON "public"."User"("userType");

-- CreateIndex
CREATE INDEX "User_verified_accountStatus_idx" ON "public"."User"("verified", "accountStatus");

-- CreateIndex
CREATE INDEX "User_regionId_idx" ON "public"."User"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientProfile_userId_key" ON "public"."PatientProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientProfile_nationalId_key" ON "public"."PatientProfile"("nationalId");

-- CreateIndex
CREATE INDEX "PatientProfile_userId_idx" ON "public"."PatientProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorProfile_userId_key" ON "public"."DoctorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorProfile_licenseNumber_key" ON "public"."DoctorProfile"("licenseNumber");

-- CreateIndex
CREATE INDEX "DoctorProfile_userId_idx" ON "public"."DoctorProfile"("userId");

-- CreateIndex
CREATE INDEX "DoctorServiceCatalog_doctorId_idx" ON "public"."DoctorServiceCatalog"("doctorId");

-- CreateIndex
CREATE INDEX "DoctorServiceCatalog_category_idx" ON "public"."DoctorServiceCatalog"("category");

-- CreateIndex
CREATE UNIQUE INDEX "NurseProfile_userId_key" ON "public"."NurseProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NurseProfile_licenseNumber_key" ON "public"."NurseProfile"("licenseNumber");

-- CreateIndex
CREATE INDEX "NurseProfile_userId_idx" ON "public"."NurseProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NannyProfile_userId_key" ON "public"."NannyProfile"("userId");

-- CreateIndex
CREATE INDEX "NannyProfile_userId_idx" ON "public"."NannyProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PharmacistProfile_userId_key" ON "public"."PharmacistProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PharmacistProfile_licenseNumber_key" ON "public"."PharmacistProfile"("licenseNumber");

-- CreateIndex
CREATE INDEX "PharmacistProfile_userId_idx" ON "public"."PharmacistProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LabTechProfile_userId_key" ON "public"."LabTechProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LabTechProfile_licenseNumber_key" ON "public"."LabTechProfile"("licenseNumber");

-- CreateIndex
CREATE INDEX "LabTechProfile_userId_idx" ON "public"."LabTechProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmergencyWorkerProfile_userId_key" ON "public"."EmergencyWorkerProfile"("userId");

-- CreateIndex
CREATE INDEX "EmergencyWorkerProfile_userId_idx" ON "public"."EmergencyWorkerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceRepProfile_userId_key" ON "public"."InsuranceRepProfile"("userId");

-- CreateIndex
CREATE INDEX "InsuranceRepProfile_userId_idx" ON "public"."InsuranceRepProfile"("userId");

-- CreateIndex
CREATE INDEX "CorporateAdminProfile_userId_idx" ON "public"."CorporateAdminProfile"("userId");

-- CreateIndex
CREATE INDEX "CorporateAdminProfile_isInsuranceCompany_idx" ON "public"."CorporateAdminProfile"("isInsuranceCompany");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralPartnerProfile_userId_key" ON "public"."ReferralPartnerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralPartnerProfile_referralCode_key" ON "public"."ReferralPartnerProfile"("referralCode");

-- CreateIndex
CREATE INDEX "ReferralPartnerProfile_userId_idx" ON "public"."ReferralPartnerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RegionalAdminProfile_userId_key" ON "public"."RegionalAdminProfile"("userId");

-- CreateIndex
CREATE INDEX "RegionalAdminProfile_userId_idx" ON "public"."RegionalAdminProfile"("userId");

-- CreateIndex
CREATE INDEX "RegionalAdminProfile_countryCode_idx" ON "public"."RegionalAdminProfile"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "CaregiverProfile_userId_key" ON "public"."CaregiverProfile"("userId");

-- CreateIndex
CREATE INDEX "CaregiverProfile_userId_idx" ON "public"."CaregiverProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PhysiotherapistProfile_userId_key" ON "public"."PhysiotherapistProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PhysiotherapistProfile_licenseNumber_key" ON "public"."PhysiotherapistProfile"("licenseNumber");

-- CreateIndex
CREATE INDEX "PhysiotherapistProfile_userId_idx" ON "public"."PhysiotherapistProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DentistProfile_userId_key" ON "public"."DentistProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DentistProfile_licenseNumber_key" ON "public"."DentistProfile"("licenseNumber");

-- CreateIndex
CREATE INDEX "DentistProfile_userId_idx" ON "public"."DentistProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OptometristProfile_userId_key" ON "public"."OptometristProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OptometristProfile_licenseNumber_key" ON "public"."OptometristProfile"("licenseNumber");

-- CreateIndex
CREATE INDEX "OptometristProfile_userId_idx" ON "public"."OptometristProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionistProfile_userId_key" ON "public"."NutritionistProfile"("userId");

-- CreateIndex
CREATE INDEX "NutritionistProfile_userId_idx" ON "public"."NutritionistProfile"("userId");

-- CreateIndex
CREATE INDEX "ProviderSpecialty_providerType_idx" ON "public"."ProviderSpecialty"("providerType");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderSpecialty_providerType_name_key" ON "public"."ProviderSpecialty"("providerType", "name");

-- CreateIndex
CREATE INDEX "HealthProgram_providerType_idx" ON "public"."HealthProgram"("providerType");

-- CreateIndex
CREATE INDEX "HealthProgram_countryCode_idx" ON "public"."HealthProgram"("countryCode");

-- CreateIndex
CREATE INDEX "HealthProgram_createdByUserId_idx" ON "public"."HealthProgram"("createdByUserId");

-- CreateIndex
CREATE INDEX "HealthProgram_isActive_idx" ON "public"."HealthProgram"("isActive");

-- CreateIndex
CREATE INDEX "ProgramSession_programId_idx" ON "public"."ProgramSession"("programId");

-- CreateIndex
CREATE INDEX "ProgramProvider_programId_idx" ON "public"."ProgramProvider"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramProvider_programId_userId_key" ON "public"."ProgramProvider"("programId", "userId");

-- CreateIndex
CREATE INDEX "ProgramEnrollment_programId_idx" ON "public"."ProgramEnrollment"("programId");

-- CreateIndex
CREATE INDEX "ProgramEnrollment_patientId_idx" ON "public"."ProgramEnrollment"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramEnrollment_programId_patientId_key" ON "public"."ProgramEnrollment"("programId", "patientId");

-- CreateIndex
CREATE INDEX "ProgramSessionProgress_enrollmentId_idx" ON "public"."ProgramSessionProgress"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramSessionProgress_enrollmentId_sessionId_key" ON "public"."ProgramSessionProgress"("enrollmentId", "sessionId");

-- CreateIndex
CREATE INDEX "SubscriptionPlanProgram_planId_idx" ON "public"."SubscriptionPlanProgram"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlanProgram_planId_programId_key" ON "public"."SubscriptionPlanProgram"("planId", "programId");

-- CreateIndex
CREATE INDEX "MedicalRecord_patientId_idx" ON "public"."MedicalRecord"("patientId");

-- CreateIndex
CREATE INDEX "MedicalRecord_doctorId_idx" ON "public"."MedicalRecord"("doctorId");

-- CreateIndex
CREATE INDEX "MedicalRecord_date_idx" ON "public"."MedicalRecord"("date");

-- CreateIndex
CREATE INDEX "MedicalRecord_type_idx" ON "public"."MedicalRecord"("type");

-- CreateIndex
CREATE INDEX "Prescription_patientId_idx" ON "public"."Prescription"("patientId");

-- CreateIndex
CREATE INDEX "Prescription_doctorId_idx" ON "public"."Prescription"("doctorId");

-- CreateIndex
CREATE INDEX "Prescription_isActive_idx" ON "public"."Prescription"("isActive");

-- CreateIndex
CREATE INDEX "Prescription_date_idx" ON "public"."Prescription"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Medicine_name_key" ON "public"."Medicine"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PrescriptionMedicine_prescriptionId_medicineId_key" ON "public"."PrescriptionMedicine"("prescriptionId", "medicineId");

-- CreateIndex
CREATE INDEX "VitalSigns_patientId_idx" ON "public"."VitalSigns"("patientId");

-- CreateIndex
CREATE INDEX "VitalSigns_recordedAt_idx" ON "public"."VitalSigns"("recordedAt");

-- CreateIndex
CREATE INDEX "LabTest_patientId_idx" ON "public"."LabTest"("patientId");

-- CreateIndex
CREATE INDEX "LabTest_status_idx" ON "public"."LabTest"("status");

-- CreateIndex
CREATE INDEX "LabTest_orderedAt_idx" ON "public"."LabTest"("orderedAt");

-- CreateIndex
CREATE INDEX "LabTestResult_labTestId_idx" ON "public"."LabTestResult"("labTestId");

-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "public"."Appointment"("patientId");

-- CreateIndex
CREATE INDEX "Appointment_doctorId_idx" ON "public"."Appointment"("doctorId");

-- CreateIndex
CREATE INDEX "Appointment_scheduledAt_idx" ON "public"."Appointment"("scheduledAt");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "public"."Appointment"("status");

-- CreateIndex
CREATE INDEX "Appointment_doctorId_patientId_idx" ON "public"."Appointment"("doctorId", "patientId");

-- CreateIndex
CREATE INDEX "Appointment_doctorId_scheduledAt_idx" ON "public"."Appointment"("doctorId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Appointment_status_scheduledAt_idx" ON "public"."Appointment"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "ScheduleSlot_doctorId_idx" ON "public"."ScheduleSlot"("doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleSlot_doctorId_dayOfWeek_startTime_key" ON "public"."ScheduleSlot"("doctorId", "dayOfWeek", "startTime");

-- CreateIndex
CREATE INDEX "NurseBooking_patientId_idx" ON "public"."NurseBooking"("patientId");

-- CreateIndex
CREATE INDEX "NurseBooking_nurseId_idx" ON "public"."NurseBooking"("nurseId");

-- CreateIndex
CREATE INDEX "NurseBooking_scheduledAt_idx" ON "public"."NurseBooking"("scheduledAt");

-- CreateIndex
CREATE INDEX "NurseBooking_status_idx" ON "public"."NurseBooking"("status");

-- CreateIndex
CREATE INDEX "ChildcareBooking_patientId_idx" ON "public"."ChildcareBooking"("patientId");

-- CreateIndex
CREATE INDEX "ChildcareBooking_nannyId_idx" ON "public"."ChildcareBooking"("nannyId");

-- CreateIndex
CREATE INDEX "ChildcareBooking_scheduledAt_idx" ON "public"."ChildcareBooking"("scheduledAt");

-- CreateIndex
CREATE INDEX "ChildcareBooking_status_idx" ON "public"."ChildcareBooking"("status");

-- CreateIndex
CREATE UNIQUE INDEX "VideoRoom_roomCode_key" ON "public"."VideoRoom"("roomCode");

-- CreateIndex
CREATE INDEX "VideoRoom_roomCode_idx" ON "public"."VideoRoom"("roomCode");

-- CreateIndex
CREATE INDEX "VideoRoom_creatorId_idx" ON "public"."VideoRoom"("creatorId");

-- CreateIndex
CREATE INDEX "VideoRoom_status_idx" ON "public"."VideoRoom"("status");

-- CreateIndex
CREATE INDEX "VideoRoomParticipant_roomId_idx" ON "public"."VideoRoomParticipant"("roomId");

-- CreateIndex
CREATE INDEX "VideoRoomParticipant_userId_idx" ON "public"."VideoRoomParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoRoomParticipant_roomId_userId_key" ON "public"."VideoRoomParticipant"("roomId", "userId");

-- CreateIndex
CREATE INDEX "VideoCallSession_roomId_idx" ON "public"."VideoCallSession"("roomId");

-- CreateIndex
CREATE INDEX "VideoCallSession_userId_idx" ON "public"."VideoCallSession"("userId");

-- CreateIndex
CREATE INDEX "VideoCallSession_status_idx" ON "public"."VideoCallSession"("status");

-- CreateIndex
CREATE INDEX "VideoCallSession_startedAt_idx" ON "public"."VideoCallSession"("startedAt");

-- CreateIndex
CREATE INDEX "WebRTCConnection_sessionId_idx" ON "public"."WebRTCConnection"("sessionId");

-- CreateIndex
CREATE INDEX "WebRTCConnection_userId_idx" ON "public"."WebRTCConnection"("userId");

-- CreateIndex
CREATE INDEX "WebRTCConnection_socketId_idx" ON "public"."WebRTCConnection"("socketId");

-- CreateIndex
CREATE UNIQUE INDEX "WebRTCConnection_sessionId_userId_key" ON "public"."WebRTCConnection"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "Conversation_type_idx" ON "public"."Conversation"("type");

-- CreateIndex
CREATE INDEX "Conversation_deletedAt_idx" ON "public"."Conversation"("deletedAt");

-- CreateIndex
CREATE INDEX "ConversationParticipant_conversationId_idx" ON "public"."ConversationParticipant"("conversationId");

-- CreateIndex
CREATE INDEX "ConversationParticipant_userId_idx" ON "public"."ConversationParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON "public"."ConversationParticipant"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "public"."Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "public"."Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "public"."Message"("createdAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_senderId_readAt_idx" ON "public"."Message"("conversationId", "senderId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "PatientEmergencyContact_patientId_key" ON "public"."PatientEmergencyContact"("patientId");

-- CreateIndex
CREATE INDEX "EmergencyServiceContact_patientId_idx" ON "public"."EmergencyServiceContact"("patientId");

-- CreateIndex
CREATE INDEX "BillingInfo_userId_idx" ON "public"."BillingInfo"("userId");

-- CreateIndex
CREATE INDEX "PillReminder_patientId_idx" ON "public"."PillReminder"("patientId");

-- CreateIndex
CREATE INDEX "PillReminder_prescriptionId_idx" ON "public"."PillReminder"("prescriptionId");

-- CreateIndex
CREATE INDEX "PillReminder_isActive_idx" ON "public"."PillReminder"("isActive");

-- CreateIndex
CREATE INDEX "NutritionAnalysis_patientId_idx" ON "public"."NutritionAnalysis"("patientId");

-- CreateIndex
CREATE INDEX "NutritionAnalysis_date_idx" ON "public"."NutritionAnalysis"("date");

-- CreateIndex
CREATE INDEX "Document_userId_idx" ON "public"."Document"("userId");

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "public"."Document"("type");

-- CreateIndex
CREATE INDEX "Document_verificationStatus_idx" ON "public"."Document"("verificationStatus");

-- CreateIndex
CREATE INDEX "MedicineOrder_patientId_idx" ON "public"."MedicineOrder"("patientId");

-- CreateIndex
CREATE INDEX "MedicineOrder_status_idx" ON "public"."MedicineOrder"("status");

-- CreateIndex
CREATE INDEX "MedicineOrderItem_orderId_idx" ON "public"."MedicineOrderItem"("orderId");

-- CreateIndex
CREATE INDEX "MedicineOrderItem_pharmacyMedicineId_idx" ON "public"."MedicineOrderItem"("pharmacyMedicineId");

-- CreateIndex
CREATE INDEX "AdminActionLog_adminId_idx" ON "public"."AdminActionLog"("adminId");

-- CreateIndex
CREATE INDEX "AdminActionLog_action_idx" ON "public"."AdminActionLog"("action");

-- CreateIndex
CREATE INDEX "AdminActionLog_targetType_targetId_idx" ON "public"."AdminActionLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AdminActionLog_createdAt_idx" ON "public"."AdminActionLog"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "public"."Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_readAt_idx" ON "public"."Notification"("readAt");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "public"."Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "public"."Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_userId_groupKey_createdAt_idx" ON "public"."Notification"("userId", "groupKey", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "public"."PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "public"."PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "DoctorEducation_doctorId_idx" ON "public"."DoctorEducation"("doctorId");

-- CreateIndex
CREATE INDEX "DoctorCertification_doctorId_idx" ON "public"."DoctorCertification"("doctorId");

-- CreateIndex
CREATE INDEX "DoctorWorkHistory_doctorId_idx" ON "public"."DoctorWorkHistory"("doctorId");

-- CreateIndex
CREATE INDEX "PatientComment_doctorId_idx" ON "public"."PatientComment"("doctorId");

-- CreateIndex
CREATE INDEX "PatientComment_date_idx" ON "public"."PatientComment"("date");

-- CreateIndex
CREATE INDEX "CmsSection_sectionType_idx" ON "public"."CmsSection"("sectionType");

-- CreateIndex
CREATE INDEX "CmsSection_sortOrder_idx" ON "public"."CmsSection"("sortOrder");

-- CreateIndex
CREATE INDEX "CmsSection_countryCode_idx" ON "public"."CmsSection"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "CmsSection_sectionType_countryCode_key" ON "public"."CmsSection"("sectionType", "countryCode");

-- CreateIndex
CREATE INDEX "CmsHeroSlide_sortOrder_idx" ON "public"."CmsHeroSlide"("sortOrder");

-- CreateIndex
CREATE INDEX "CmsHeroSlide_countryCode_idx" ON "public"."CmsHeroSlide"("countryCode");

-- CreateIndex
CREATE INDEX "CmsTestimonial_countryCode_idx" ON "public"."CmsTestimonial"("countryCode");

-- CreateIndex
CREATE INDEX "PharmacyMedicine_pharmacistId_idx" ON "public"."PharmacyMedicine"("pharmacistId");

-- CreateIndex
CREATE INDEX "PharmacyMedicine_category_idx" ON "public"."PharmacyMedicine"("category");

-- CreateIndex
CREATE INDEX "LabTestCatalog_labTechId_idx" ON "public"."LabTestCatalog"("labTechId");

-- CreateIndex
CREATE INDEX "LabTestCatalog_category_idx" ON "public"."LabTestCatalog"("category");

-- CreateIndex
CREATE INDEX "NurseServiceCatalog_nurseId_idx" ON "public"."NurseServiceCatalog"("nurseId");

-- CreateIndex
CREATE INDEX "NurseServiceCatalog_category_idx" ON "public"."NurseServiceCatalog"("category");

-- CreateIndex
CREATE INDEX "NannyServiceCatalog_nannyId_idx" ON "public"."NannyServiceCatalog"("nannyId");

-- CreateIndex
CREATE INDEX "NannyServiceCatalog_category_idx" ON "public"."NannyServiceCatalog"("category");

-- CreateIndex
CREATE INDEX "EmergencyServiceListing_workerId_idx" ON "public"."EmergencyServiceListing"("workerId");

-- CreateIndex
CREATE INDEX "EmergencyServiceListing_serviceType_idx" ON "public"."EmergencyServiceListing"("serviceType");

-- CreateIndex
CREATE INDEX "InsurancePlanListing_insuranceRepId_idx" ON "public"."InsurancePlanListing"("insuranceRepId");

-- CreateIndex
CREATE INDEX "InsurancePlanListing_planType_idx" ON "public"."InsurancePlanListing"("planType");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceClaim_claimId_key" ON "public"."InsuranceClaim"("claimId");

-- CreateIndex
CREATE INDEX "InsuranceClaim_insuranceRepId_idx" ON "public"."InsuranceClaim"("insuranceRepId");

-- CreateIndex
CREATE INDEX "InsuranceClaim_patientId_idx" ON "public"."InsuranceClaim"("patientId");

-- CreateIndex
CREATE INDEX "InsuranceClaim_status_idx" ON "public"."InsuranceClaim"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserWallet_userId_key" ON "public"."UserWallet"("userId");

-- CreateIndex
CREATE INDEX "UserWallet_userId_idx" ON "public"."UserWallet"("userId");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_idx" ON "public"."WalletTransaction"("walletId");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_createdAt_idx" ON "public"."WalletTransaction"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "WalletTransaction_createdAt_idx" ON "public"."WalletTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "WalletTransaction_regionalAdminId_idx" ON "public"."WalletTransaction"("regionalAdminId");

-- CreateIndex
CREATE INDEX "WalletTransaction_serviceType_idx" ON "public"."WalletTransaction"("serviceType");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "public"."Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_patientUserId_idx" ON "public"."Invoice"("patientUserId");

-- CreateIndex
CREATE INDEX "Invoice_providerUserId_idx" ON "public"."Invoice"("providerUserId");

-- CreateIndex
CREATE INDEX "Invoice_bookingId_idx" ON "public"."Invoice"("bookingId");

-- CreateIndex
CREATE INDEX "DoctorPost_authorId_idx" ON "public"."DoctorPost"("authorId");

-- CreateIndex
CREATE INDEX "DoctorPost_companyId_idx" ON "public"."DoctorPost"("companyId");

-- CreateIndex
CREATE INDEX "DoctorPost_createdAt_idx" ON "public"."DoctorPost"("createdAt");

-- CreateIndex
CREATE INDEX "DoctorPost_category_idx" ON "public"."DoctorPost"("category");

-- CreateIndex
CREATE INDEX "DoctorPost_isPublished_createdAt_idx" ON "public"."DoctorPost"("isPublished", "createdAt");

-- CreateIndex
CREATE INDEX "DoctorPost_deletedAt_idx" ON "public"."DoctorPost"("deletedAt");

-- CreateIndex
CREATE INDEX "PostComment_postId_idx" ON "public"."PostComment"("postId");

-- CreateIndex
CREATE INDEX "PostComment_authorId_idx" ON "public"."PostComment"("authorId");

-- CreateIndex
CREATE INDEX "PostLike_postId_idx" ON "public"."PostLike"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "PostLike_postId_userId_key" ON "public"."PostLike"("postId", "userId");

-- CreateIndex
CREATE INDEX "LabTestBooking_patientId_idx" ON "public"."LabTestBooking"("patientId");

-- CreateIndex
CREATE INDEX "LabTestBooking_labTechId_idx" ON "public"."LabTestBooking"("labTechId");

-- CreateIndex
CREATE INDEX "LabTestBooking_scheduledAt_idx" ON "public"."LabTestBooking"("scheduledAt");

-- CreateIndex
CREATE INDEX "LabTestBooking_status_idx" ON "public"."LabTestBooking"("status");

-- CreateIndex
CREATE INDEX "EmergencyBooking_patientId_idx" ON "public"."EmergencyBooking"("patientId");

-- CreateIndex
CREATE INDEX "EmergencyBooking_responderId_idx" ON "public"."EmergencyBooking"("responderId");

-- CreateIndex
CREATE INDEX "EmergencyBooking_status_idx" ON "public"."EmergencyBooking"("status");

-- CreateIndex
CREATE INDEX "ServiceBooking_patientId_idx" ON "public"."ServiceBooking"("patientId");

-- CreateIndex
CREATE INDEX "ServiceBooking_providerUserId_idx" ON "public"."ServiceBooking"("providerUserId");

-- CreateIndex
CREATE INDEX "ServiceBooking_providerType_idx" ON "public"."ServiceBooking"("providerType");

-- CreateIndex
CREATE INDEX "ServiceBooking_scheduledAt_idx" ON "public"."ServiceBooking"("scheduledAt");

-- CreateIndex
CREATE INDEX "ServiceBooking_status_idx" ON "public"."ServiceBooking"("status");

-- CreateIndex
CREATE INDEX "ServiceBooking_deletedAt_idx" ON "public"."ServiceBooking"("deletedAt");

-- CreateIndex
CREATE INDEX "ProviderAvailability_userId_idx" ON "public"."ProviderAvailability"("userId");

-- CreateIndex
CREATE INDEX "ProviderAvailability_dayOfWeek_idx" ON "public"."ProviderAvailability"("dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderAvailability_userId_dayOfWeek_startTime_key" ON "public"."ProviderAvailability"("userId", "dayOfWeek", "startTime");

-- CreateIndex
CREATE INDEX "BookedSlot_providerUserId_date_idx" ON "public"."BookedSlot"("providerUserId", "date");

-- CreateIndex
CREATE INDEX "BookedSlot_bookingId_idx" ON "public"."BookedSlot"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "BookedSlot_providerUserId_date_startTime_key" ON "public"."BookedSlot"("providerUserId", "date", "startTime");

-- CreateIndex
CREATE INDEX "AiChatSession_userId_idx" ON "public"."AiChatSession"("userId");

-- CreateIndex
CREATE INDEX "AiChatSession_updatedAt_idx" ON "public"."AiChatSession"("updatedAt");

-- CreateIndex
CREATE INDEX "AiChatMessage_sessionId_idx" ON "public"."AiChatMessage"("sessionId");

-- CreateIndex
CREATE INDEX "AiChatMessage_createdAt_idx" ON "public"."AiChatMessage"("createdAt");

-- CreateIndex
CREATE INDEX "AiPatientInsight_userId_date_idx" ON "public"."AiPatientInsight"("userId", "date");

-- CreateIndex
CREATE INDEX "AiPatientInsight_userId_category_idx" ON "public"."AiPatientInsight"("userId", "category");

-- CreateIndex
CREATE INDEX "AiPatientInsight_createdAt_idx" ON "public"."AiPatientInsight"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalKnowledge_conditionKey_key" ON "public"."ClinicalKnowledge"("conditionKey");

-- CreateIndex
CREATE INDEX "ClinicalKnowledge_active_idx" ON "public"."ClinicalKnowledge"("active");

-- CreateIndex
CREATE INDEX "ClinicalKnowledge_category_idx" ON "public"."ClinicalKnowledge"("category");

-- CreateIndex
CREATE INDEX "AiCallLog_userId_createdAt_idx" ON "public"."AiCallLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiCallLog_surface_createdAt_idx" ON "public"."AiCallLog"("surface", "createdAt");

-- CreateIndex
CREATE INDEX "AiCallLog_error_idx" ON "public"."AiCallLog"("error");

-- CreateIndex
CREATE UNIQUE INDEX "HealthTrackerProfile_userId_key" ON "public"."HealthTrackerProfile"("userId");

-- CreateIndex
CREATE INDEX "HealthTrackerProfile_userId_idx" ON "public"."HealthTrackerProfile"("userId");

-- CreateIndex
CREATE INDEX "FoodEntry_userId_date_idx" ON "public"."FoodEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "FoodEntry_userId_mealType_idx" ON "public"."FoodEntry"("userId", "mealType");

-- CreateIndex
CREATE INDEX "ExerciseEntry_userId_date_idx" ON "public"."ExerciseEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "WaterEntry_userId_date_idx" ON "public"."WaterEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "SleepEntry_userId_date_idx" ON "public"."SleepEntry"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SleepEntry_userId_date_key" ON "public"."SleepEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "DailyGoalSnapshot_userId_date_idx" ON "public"."DailyGoalSnapshot"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyGoalSnapshot_userId_date_key" ON "public"."DailyGoalSnapshot"("userId", "date");

-- CreateIndex
CREATE INDEX "MealPlanEntry_userId_weekStartDate_idx" ON "public"."MealPlanEntry"("userId", "weekStartDate");

-- CreateIndex
CREATE INDEX "MealPlanEntry_userId_dayOfWeek_idx" ON "public"."MealPlanEntry"("userId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "FoodDatabase_category_idx" ON "public"."FoodDatabase"("category");

-- CreateIndex
CREATE INDEX "FoodDatabase_name_idx" ON "public"."FoodDatabase"("name");

-- CreateIndex
CREATE INDEX "ProviderReview_providerUserId_idx" ON "public"."ProviderReview"("providerUserId");

-- CreateIndex
CREATE INDEX "ProviderReview_providerUserId_providerType_idx" ON "public"."ProviderReview"("providerUserId", "providerType");

-- CreateIndex
CREATE INDEX "ProviderReview_providerType_idx" ON "public"."ProviderReview"("providerType");

-- CreateIndex
CREATE INDEX "ProviderReview_createdAt_idx" ON "public"."ProviderReview"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderReview_providerUserId_reviewerUserId_providerType_key" ON "public"."ProviderReview"("providerUserId", "reviewerUserId", "providerType");

-- CreateIndex
CREATE INDEX "RoleFeatureConfig_userType_idx" ON "public"."RoleFeatureConfig"("userType");

-- CreateIndex
CREATE UNIQUE INDEX "RoleFeatureConfig_userType_featureKey_key" ON "public"."RoleFeatureConfig"("userType", "featureKey");

-- CreateIndex
CREATE INDEX "RequiredDocumentConfig_userType_idx" ON "public"."RequiredDocumentConfig"("userType");

-- CreateIndex
CREATE UNIQUE INDEX "RequiredDocumentConfig_userType_documentName_key" ON "public"."RequiredDocumentConfig"("userType", "documentName");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceCompanyTreasury_companyProfileId_key" ON "public"."InsuranceCompanyTreasury"("companyProfileId");

-- CreateIndex
CREATE INDEX "InsuranceCompanyTreasury_companyProfileId_idx" ON "public"."InsuranceCompanyTreasury"("companyProfileId");

-- CreateIndex
CREATE INDEX "TreasuryTransaction_treasuryId_createdAt_idx" ON "public"."TreasuryTransaction"("treasuryId", "createdAt");

-- CreateIndex
CREATE INDEX "TreasuryTransaction_claimId_idx" ON "public"."TreasuryTransaction"("claimId");

-- CreateIndex
CREATE INDEX "InsurancePlan_companyProfileId_idx" ON "public"."InsurancePlan"("companyProfileId");

-- CreateIndex
CREATE INDEX "InsurancePlan_isActive_idx" ON "public"."InsurancePlan"("isActive");

-- CreateIndex
CREATE INDEX "InsurancePolicy_memberId_idx" ON "public"."InsurancePolicy"("memberId");

-- CreateIndex
CREATE INDEX "InsurancePolicy_planId_idx" ON "public"."InsurancePolicy"("planId");

-- CreateIndex
CREATE INDEX "InsurancePolicy_status_idx" ON "public"."InsurancePolicy"("status");

-- CreateIndex
CREATE INDEX "InsurancePolicy_renewsAt_idx" ON "public"."InsurancePolicy"("renewsAt");

-- CreateIndex
CREATE INDEX "PolicyRenewalLog_policyId_idx" ON "public"."PolicyRenewalLog"("policyId");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyRenewalLog_policyId_period_key" ON "public"."PolicyRenewalLog"("policyId", "period");

-- CreateIndex
CREATE INDEX "PolicyBeneficiary_policyId_idx" ON "public"."PolicyBeneficiary"("policyId");

-- CreateIndex
CREATE INDEX "ClaimDecisionLog_claimId_idx" ON "public"."ClaimDecisionLog"("claimId");

-- CreateIndex
CREATE INDEX "ClaimDecisionLog_createdAt_idx" ON "public"."ClaimDecisionLog"("createdAt");

-- CreateIndex
CREATE INDEX "PreAuthorization_memberId_idx" ON "public"."PreAuthorization"("memberId");

-- CreateIndex
CREATE INDEX "PreAuthorization_providerId_idx" ON "public"."PreAuthorization"("providerId");

-- CreateIndex
CREATE INDEX "PreAuthorization_companyProfileId_status_idx" ON "public"."PreAuthorization"("companyProfileId", "status");

-- CreateIndex
CREATE INDEX "PreAuthorization_status_expiresAt_idx" ON "public"."PreAuthorization"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "ProviderFavorite_userId_idx" ON "public"."ProviderFavorite"("userId");

-- CreateIndex
CREATE INDEX "ProviderFavorite_providerId_idx" ON "public"."ProviderFavorite"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderFavorite_userId_providerId_key" ON "public"."ProviderFavorite"("userId", "providerId");

-- CreateIndex
CREATE INDEX "InsuranceClaimSubmission_memberId_idx" ON "public"."InsuranceClaimSubmission"("memberId");

-- CreateIndex
CREATE INDEX "InsuranceClaimSubmission_companyProfileId_idx" ON "public"."InsuranceClaimSubmission"("companyProfileId");

-- CreateIndex
CREATE INDEX "InsuranceClaimSubmission_status_idx" ON "public"."InsuranceClaimSubmission"("status");

-- CreateIndex
CREATE INDEX "InsuranceClaimSubmission_companyProfileId_status_idx" ON "public"."InsuranceClaimSubmission"("companyProfileId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "HealthStreak_userId_key" ON "public"."HealthStreak"("userId");

-- CreateIndex
CREATE INDEX "HealthStreak_userId_idx" ON "public"."HealthStreak"("userId");

-- CreateIndex
CREATE INDEX "AppointmentReminder_bookingId_idx" ON "public"."AppointmentReminder"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentReminder_bookingId_reminderType_key" ON "public"."AppointmentReminder"("bookingId", "reminderType");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "public"."UserPreference"("userId");

-- CreateIndex
CREATE INDEX "UserPreference_userId_idx" ON "public"."UserPreference"("userId");

-- CreateIndex
CREATE INDEX "ReferralClick_referralCode_idx" ON "public"."ReferralClick"("referralCode");

-- CreateIndex
CREATE INDEX "ReferralClick_referralPartnerId_idx" ON "public"."ReferralClick"("referralPartnerId");

-- CreateIndex
CREATE INDEX "ReferralClick_utmSource_idx" ON "public"."ReferralClick"("utmSource");

-- CreateIndex
CREATE INDEX "ReferralClick_createdAt_idx" ON "public"."ReferralClick"("createdAt");

-- CreateIndex
CREATE INDEX "ReferralClick_convertedUserId_idx" ON "public"."ReferralClick"("convertedUserId");

-- CreateIndex
CREATE INDEX "UserConnection_senderId_idx" ON "public"."UserConnection"("senderId");

-- CreateIndex
CREATE INDEX "UserConnection_receiverId_idx" ON "public"."UserConnection"("receiverId");

-- CreateIndex
CREATE INDEX "UserConnection_status_idx" ON "public"."UserConnection"("status");

-- CreateIndex
CREATE INDEX "UserConnection_receiverId_status_idx" ON "public"."UserConnection"("receiverId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UserConnection_senderId_receiverId_key" ON "public"."UserConnection"("senderId", "receiverId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_slug_key" ON "public"."SubscriptionPlan"("slug");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_type_idx" ON "public"."SubscriptionPlan"("type");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_isActive_idx" ON "public"."SubscriptionPlan"("isActive");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_countryCode_idx" ON "public"."SubscriptionPlan"("countryCode");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_countryCode_type_idx" ON "public"."SubscriptionPlan"("countryCode", "type");

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscription_userId_key" ON "public"."UserSubscription"("userId");

-- CreateIndex
CREATE INDEX "UserSubscription_planId_idx" ON "public"."UserSubscription"("planId");

-- CreateIndex
CREATE INDEX "UserSubscription_status_idx" ON "public"."UserSubscription"("status");

-- CreateIndex
CREATE INDEX "UserSubscription_corporateAdminId_idx" ON "public"."UserSubscription"("corporateAdminId");

-- CreateIndex
CREATE INDEX "SubscriptionRenewalLog_subscriptionId_idx" ON "public"."SubscriptionRenewalLog"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionRenewalLog_subscriptionId_period_key" ON "public"."SubscriptionRenewalLog"("subscriptionId", "period");

-- CreateIndex
CREATE INDEX "SubscriptionUsage_month_idx" ON "public"."SubscriptionUsage"("month");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionUsage_subscriptionId_month_key" ON "public"."SubscriptionUsage"("subscriptionId", "month");

-- CreateIndex
CREATE INDEX "CorporateEmployee_corporateAdminId_idx" ON "public"."CorporateEmployee"("corporateAdminId");

-- CreateIndex
CREATE INDEX "CorporateEmployee_userId_idx" ON "public"."CorporateEmployee"("userId");

-- CreateIndex
CREATE INDEX "CorporateEmployee_status_idx" ON "public"."CorporateEmployee"("status");

-- CreateIndex
CREATE INDEX "CorporateEmployee_lastContributionMonth_idx" ON "public"."CorporateEmployee"("lastContributionMonth");

-- CreateIndex
CREATE UNIQUE INDEX "CorporateEmployee_corporateAdminId_userId_key" ON "public"."CorporateEmployee"("corporateAdminId", "userId");

-- CreateIndex
CREATE INDEX "PlatformService_providerType_idx" ON "public"."PlatformService"("providerType");

-- CreateIndex
CREATE INDEX "PlatformService_providerType_serviceName_idx" ON "public"."PlatformService"("providerType", "serviceName");

-- CreateIndex
CREATE INDEX "PlatformService_category_idx" ON "public"."PlatformService"("category");

-- CreateIndex
CREATE INDEX "PlatformService_countryCode_idx" ON "public"."PlatformService"("countryCode");

-- CreateIndex
CREATE INDEX "PlatformService_isDefault_idx" ON "public"."PlatformService"("isDefault");

-- CreateIndex
CREATE INDEX "ProviderServiceConfig_providerUserId_idx" ON "public"."ProviderServiceConfig"("providerUserId");

-- CreateIndex
CREATE INDEX "ProviderServiceConfig_platformServiceId_idx" ON "public"."ProviderServiceConfig"("platformServiceId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderServiceConfig_platformServiceId_providerUserId_key" ON "public"."ProviderServiceConfig"("platformServiceId", "providerUserId");

-- CreateIndex
CREATE INDEX "ProviderServiceWorkflow_providerServiceConfigId_idx" ON "public"."ProviderServiceWorkflow"("providerServiceConfigId");

-- CreateIndex
CREATE INDEX "ProviderServiceWorkflow_workflowTemplateId_idx" ON "public"."ProviderServiceWorkflow"("workflowTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderServiceWorkflow_providerServiceConfigId_workflowTem_key" ON "public"."ProviderServiceWorkflow"("providerServiceConfigId", "workflowTemplateId");

-- CreateIndex
CREATE INDEX "ServiceGroup_countryCode_idx" ON "public"."ServiceGroup"("countryCode");

-- CreateIndex
CREATE INDEX "ServiceGroup_createdByAdminId_idx" ON "public"."ServiceGroup"("createdByAdminId");

-- CreateIndex
CREATE INDEX "ServiceGroupItem_serviceGroupId_idx" ON "public"."ServiceGroupItem"("serviceGroupId");

-- CreateIndex
CREATE INDEX "ServiceGroupItem_platformServiceId_idx" ON "public"."ServiceGroupItem"("platformServiceId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceGroupItem_serviceGroupId_platformServiceId_key" ON "public"."ServiceGroupItem"("serviceGroupId", "platformServiceId");

-- CreateIndex
CREATE INDEX "SubscriptionPlanService_planId_idx" ON "public"."SubscriptionPlanService"("planId");

-- CreateIndex
CREATE INDEX "SubscriptionPlanService_platformServiceId_idx" ON "public"."SubscriptionPlanService"("platformServiceId");

-- CreateIndex
CREATE INDEX "SubscriptionPlanService_serviceGroupId_idx" ON "public"."SubscriptionPlanService"("serviceGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTemplate_slug_key" ON "public"."WorkflowTemplate"("slug");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_providerType_serviceMode_idx" ON "public"."WorkflowTemplate"("providerType", "serviceMode");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_platformServiceId_idx" ON "public"."WorkflowTemplate"("platformServiceId");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_createdByProviderId_idx" ON "public"."WorkflowTemplate"("createdByProviderId");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_createdByAdminId_idx" ON "public"."WorkflowTemplate"("createdByAdminId");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_isDefault_idx" ON "public"."WorkflowTemplate"("isDefault");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_isShared_idx" ON "public"."WorkflowTemplate"("isShared");

-- CreateIndex
CREATE INDEX "WorkflowInstance_bookingId_bookingType_idx" ON "public"."WorkflowInstance"("bookingId", "bookingType");

-- CreateIndex
CREATE INDEX "WorkflowInstance_patientUserId_idx" ON "public"."WorkflowInstance"("patientUserId");

-- CreateIndex
CREATE INDEX "WorkflowInstance_providerUserId_idx" ON "public"."WorkflowInstance"("providerUserId");

-- CreateIndex
CREATE INDEX "WorkflowInstance_currentStatus_idx" ON "public"."WorkflowInstance"("currentStatus");

-- CreateIndex
CREATE INDEX "WorkflowInstance_templateId_idx" ON "public"."WorkflowInstance"("templateId");

-- CreateIndex
CREATE INDEX "WorkflowStepLog_instanceId_idx" ON "public"."WorkflowStepLog"("instanceId");

-- CreateIndex
CREATE INDEX "WorkflowStepLog_toStatus_idx" ON "public"."WorkflowStepLog"("toStatus");

-- CreateIndex
CREATE INDEX "WorkflowStepLog_createdAt_idx" ON "public"."WorkflowStepLog"("createdAt");

-- CreateIndex
CREATE INDEX "WorkflowNotificationTemplate_workflowTemplateId_idx" ON "public"."WorkflowNotificationTemplate"("workflowTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowNotificationTemplate_workflowTemplateId_statusCode__key" ON "public"."WorkflowNotificationTemplate"("workflowTemplateId", "statusCode", "targetRole", "createdByProviderId");

-- CreateIndex
CREATE INDEX "ProviderInventoryItem_providerUserId_idx" ON "public"."ProviderInventoryItem"("providerUserId");

-- CreateIndex
CREATE INDEX "ProviderInventoryItem_providerType_category_idx" ON "public"."ProviderInventoryItem"("providerType", "category");

-- CreateIndex
CREATE INDEX "ProviderInventoryItem_category_idx" ON "public"."ProviderInventoryItem"("category");

-- CreateIndex
CREATE INDEX "ProviderInventoryItem_inStock_idx" ON "public"."ProviderInventoryItem"("inStock");

-- CreateIndex
CREATE INDEX "ProviderInventoryItem_name_idx" ON "public"."ProviderInventoryItem"("name");

-- CreateIndex
CREATE INDEX "InventoryOrder_patientUserId_idx" ON "public"."InventoryOrder"("patientUserId");

-- CreateIndex
CREATE INDEX "InventoryOrder_providerUserId_idx" ON "public"."InventoryOrder"("providerUserId");

-- CreateIndex
CREATE INDEX "InventoryOrder_status_idx" ON "public"."InventoryOrder"("status");

-- CreateIndex
CREATE INDEX "InventoryOrderItem_orderId_idx" ON "public"."InventoryOrderItem"("orderId");

-- CreateIndex
CREATE INDEX "InventoryOrderItem_inventoryItemId_idx" ON "public"."InventoryOrderItem"("inventoryItemId");

-- CreateIndex
CREATE INDEX "HealthcareEntity_type_idx" ON "public"."HealthcareEntity"("type");

-- CreateIndex
CREATE INDEX "HealthcareEntity_city_country_idx" ON "public"."HealthcareEntity"("city", "country");

-- CreateIndex
CREATE INDEX "HealthcareEntity_isActive_idx" ON "public"."HealthcareEntity"("isActive");

-- CreateIndex
CREATE INDEX "HealthcareEntity_founderUserId_idx" ON "public"."HealthcareEntity"("founderUserId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthcareEntity_name_city_country_key" ON "public"."HealthcareEntity"("name", "city", "country");

-- CreateIndex
CREATE INDEX "ProviderWorkplace_providerUserId_idx" ON "public"."ProviderWorkplace"("providerUserId");

-- CreateIndex
CREATE INDEX "ProviderWorkplace_healthcareEntityId_idx" ON "public"."ProviderWorkplace"("healthcareEntityId");

-- CreateIndex
CREATE INDEX "ProviderWorkplace_status_idx" ON "public"."ProviderWorkplace"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderWorkplace_providerUserId_healthcareEntityId_key" ON "public"."ProviderWorkplace"("providerUserId", "healthcareEntityId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkplaceInvitation_token_key" ON "public"."WorkplaceInvitation"("token");

-- CreateIndex
CREATE INDEX "WorkplaceInvitation_healthcareEntityId_idx" ON "public"."WorkplaceInvitation"("healthcareEntityId");

-- CreateIndex
CREATE INDEX "WorkplaceInvitation_invitedEmail_idx" ON "public"."WorkplaceInvitation"("invitedEmail");

-- CreateIndex
CREATE INDEX "WorkplaceInvitation_token_idx" ON "public"."WorkplaceInvitation"("token");

-- CreateIndex
CREATE INDEX "WorkplaceInvitation_status_idx" ON "public"."WorkplaceInvitation"("status");

-- AddForeignKey
ALTER TABLE "public"."RoleVerificationDoc" ADD CONSTRAINT "RoleVerificationDoc_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."ProviderRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "public"."Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PatientProfile" ADD CONSTRAINT "PatientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DoctorProfile" ADD CONSTRAINT "DoctorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DoctorServiceCatalog" ADD CONSTRAINT "DoctorServiceCatalog_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NurseProfile" ADD CONSTRAINT "NurseProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NannyProfile" ADD CONSTRAINT "NannyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PharmacistProfile" ADD CONSTRAINT "PharmacistProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabTechProfile" ADD CONSTRAINT "LabTechProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmergencyWorkerProfile" ADD CONSTRAINT "EmergencyWorkerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InsuranceRepProfile" ADD CONSTRAINT "InsuranceRepProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CorporateAdminProfile" ADD CONSTRAINT "CorporateAdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReferralPartnerProfile" ADD CONSTRAINT "ReferralPartnerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RegionalAdminProfile" ADD CONSTRAINT "RegionalAdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CaregiverProfile" ADD CONSTRAINT "CaregiverProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PhysiotherapistProfile" ADD CONSTRAINT "PhysiotherapistProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DentistProfile" ADD CONSTRAINT "DentistProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OptometristProfile" ADD CONSTRAINT "OptometristProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NutritionistProfile" ADD CONSTRAINT "NutritionistProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgramSession" ADD CONSTRAINT "ProgramSession_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."HealthProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgramProvider" ADD CONSTRAINT "ProgramProvider_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."HealthProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgramEnrollment" ADD CONSTRAINT "ProgramEnrollment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."HealthProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgramSessionProgress" ADD CONSTRAINT "ProgramSessionProgress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "public"."ProgramEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgramSessionProgress" ADD CONSTRAINT "ProgramSessionProgress_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."ProgramSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubscriptionPlanProgram" ADD CONSTRAINT "SubscriptionPlanProgram_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubscriptionPlanProgram" ADD CONSTRAINT "SubscriptionPlanProgram_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."HealthProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedicalRecord" ADD CONSTRAINT "MedicalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedicalRecord" ADD CONSTRAINT "MedicalRecord_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."DoctorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Prescription" ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Prescription" ADD CONSTRAINT "Prescription_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."DoctorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PrescriptionMedicine" ADD CONSTRAINT "PrescriptionMedicine_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "public"."Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PrescriptionMedicine" ADD CONSTRAINT "PrescriptionMedicine_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "public"."Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VitalSigns" ADD CONSTRAINT "VitalSigns_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabTest" ADD CONSTRAINT "LabTest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabTestResult" ADD CONSTRAINT "LabTestResult_labTestId_fkey" FOREIGN KEY ("labTestId") REFERENCES "public"."LabTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."DoctorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NurseBooking" ADD CONSTRAINT "NurseBooking_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NurseBooking" ADD CONSTRAINT "NurseBooking_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "public"."NurseProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChildcareBooking" ADD CONSTRAINT "ChildcareBooking_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChildcareBooking" ADD CONSTRAINT "ChildcareBooking_nannyId_fkey" FOREIGN KEY ("nannyId") REFERENCES "public"."NannyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VideoRoomParticipant" ADD CONSTRAINT "VideoRoomParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."VideoRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VideoCallSession" ADD CONSTRAINT "VideoCallSession_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."VideoRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VideoCallSession" ADD CONSTRAINT "VideoCallSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WebRTCConnection" ADD CONSTRAINT "WebRTCConnection_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."VideoCallSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PatientEmergencyContact" ADD CONSTRAINT "PatientEmergencyContact_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmergencyServiceContact" ADD CONSTRAINT "EmergencyServiceContact_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BillingInfo" ADD CONSTRAINT "BillingInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PillReminder" ADD CONSTRAINT "PillReminder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PillReminder" ADD CONSTRAINT "PillReminder_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "public"."Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NutritionAnalysis" ADD CONSTRAINT "NutritionAnalysis_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedicineOrder" ADD CONSTRAINT "MedicineOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedicineOrderItem" ADD CONSTRAINT "MedicineOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."MedicineOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedicineOrderItem" ADD CONSTRAINT "MedicineOrderItem_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "public"."Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedicineOrderItem" ADD CONSTRAINT "MedicineOrderItem_pharmacyMedicineId_fkey" FOREIGN KEY ("pharmacyMedicineId") REFERENCES "public"."PharmacyMedicine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DoctorEducation" ADD CONSTRAINT "DoctorEducation_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DoctorCertification" ADD CONSTRAINT "DoctorCertification_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DoctorWorkHistory" ADD CONSTRAINT "DoctorWorkHistory_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PatientComment" ADD CONSTRAINT "PatientComment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PharmacyMedicine" ADD CONSTRAINT "PharmacyMedicine_pharmacistId_fkey" FOREIGN KEY ("pharmacistId") REFERENCES "public"."PharmacistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabTestCatalog" ADD CONSTRAINT "LabTestCatalog_labTechId_fkey" FOREIGN KEY ("labTechId") REFERENCES "public"."LabTechProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NurseServiceCatalog" ADD CONSTRAINT "NurseServiceCatalog_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "public"."NurseProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NannyServiceCatalog" ADD CONSTRAINT "NannyServiceCatalog_nannyId_fkey" FOREIGN KEY ("nannyId") REFERENCES "public"."NannyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmergencyServiceListing" ADD CONSTRAINT "EmergencyServiceListing_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "public"."EmergencyWorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InsurancePlanListing" ADD CONSTRAINT "InsurancePlanListing_insuranceRepId_fkey" FOREIGN KEY ("insuranceRepId") REFERENCES "public"."InsuranceRepProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_insuranceRepId_fkey" FOREIGN KEY ("insuranceRepId") REFERENCES "public"."InsuranceRepProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."InsurancePlanListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserWallet" ADD CONSTRAINT "UserWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "public"."UserWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DoctorPost" ADD CONSTRAINT "DoctorPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DoctorPost" ADD CONSTRAINT "DoctorPost_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."CorporateAdminProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostComment" ADD CONSTRAINT "PostComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."DoctorPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostComment" ADD CONSTRAINT "PostComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostLike" ADD CONSTRAINT "PostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."DoctorPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostLike" ADD CONSTRAINT "PostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabTestBooking" ADD CONSTRAINT "LabTestBooking_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabTestBooking" ADD CONSTRAINT "LabTestBooking_labTechId_fkey" FOREIGN KEY ("labTechId") REFERENCES "public"."LabTechProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmergencyBooking" ADD CONSTRAINT "EmergencyBooking_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmergencyBooking" ADD CONSTRAINT "EmergencyBooking_responderId_fkey" FOREIGN KEY ("responderId") REFERENCES "public"."EmergencyWorkerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderAvailability" ADD CONSTRAINT "ProviderAvailability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AiChatSession" ADD CONSTRAINT "AiChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AiChatMessage" ADD CONSTRAINT "AiChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AiChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AiPatientInsight" ADD CONSTRAINT "AiPatientInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HealthTrackerProfile" ADD CONSTRAINT "HealthTrackerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FoodEntry" ADD CONSTRAINT "FoodEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExerciseEntry" ADD CONSTRAINT "ExerciseEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WaterEntry" ADD CONSTRAINT "WaterEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SleepEntry" ADD CONSTRAINT "SleepEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyGoalSnapshot" ADD CONSTRAINT "DailyGoalSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MealPlanEntry" ADD CONSTRAINT "MealPlanEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderReview" ADD CONSTRAINT "ProviderReview_providerUserId_fkey" FOREIGN KEY ("providerUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderReview" ADD CONSTRAINT "ProviderReview_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InsuranceCompanyTreasury" ADD CONSTRAINT "InsuranceCompanyTreasury_companyProfileId_fkey" FOREIGN KEY ("companyProfileId") REFERENCES "public"."CorporateAdminProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TreasuryTransaction" ADD CONSTRAINT "TreasuryTransaction_treasuryId_fkey" FOREIGN KEY ("treasuryId") REFERENCES "public"."InsuranceCompanyTreasury"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InsurancePlan" ADD CONSTRAINT "InsurancePlan_companyProfileId_fkey" FOREIGN KEY ("companyProfileId") REFERENCES "public"."CorporateAdminProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InsurancePolicy" ADD CONSTRAINT "InsurancePolicy_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InsurancePolicy" ADD CONSTRAINT "InsurancePolicy_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."InsurancePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PolicyRenewalLog" ADD CONSTRAINT "PolicyRenewalLog_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "public"."InsurancePolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PolicyBeneficiary" ADD CONSTRAINT "PolicyBeneficiary_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "public"."InsurancePolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PreAuthorization" ADD CONSTRAINT "PreAuthorization_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PreAuthorization" ADD CONSTRAINT "PreAuthorization_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PreAuthorization" ADD CONSTRAINT "PreAuthorization_companyProfileId_fkey" FOREIGN KEY ("companyProfileId") REFERENCES "public"."CorporateAdminProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderFavorite" ADD CONSTRAINT "ProviderFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderFavorite" ADD CONSTRAINT "ProviderFavorite_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InsuranceClaimSubmission" ADD CONSTRAINT "InsuranceClaimSubmission_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InsuranceClaimSubmission" ADD CONSTRAINT "InsuranceClaimSubmission_companyProfileId_fkey" FOREIGN KEY ("companyProfileId") REFERENCES "public"."CorporateAdminProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HealthStreak" ADD CONSTRAINT "HealthStreak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserConnection" ADD CONSTRAINT "UserConnection_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserConnection" ADD CONSTRAINT "UserConnection_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserSubscription" ADD CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserSubscription" ADD CONSTRAINT "UserSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubscriptionRenewalLog" ADD CONSTRAINT "SubscriptionRenewalLog_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."UserSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubscriptionUsage" ADD CONSTRAINT "SubscriptionUsage_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."UserSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CorporateEmployee" ADD CONSTRAINT "CorporateEmployee_corporateAdminId_fkey" FOREIGN KEY ("corporateAdminId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CorporateEmployee" ADD CONSTRAINT "CorporateEmployee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderServiceConfig" ADD CONSTRAINT "ProviderServiceConfig_platformServiceId_fkey" FOREIGN KEY ("platformServiceId") REFERENCES "public"."PlatformService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderServiceWorkflow" ADD CONSTRAINT "ProviderServiceWorkflow_providerServiceConfigId_fkey" FOREIGN KEY ("providerServiceConfigId") REFERENCES "public"."ProviderServiceConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderServiceWorkflow" ADD CONSTRAINT "ProviderServiceWorkflow_workflowTemplateId_fkey" FOREIGN KEY ("workflowTemplateId") REFERENCES "public"."WorkflowTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServiceGroupItem" ADD CONSTRAINT "ServiceGroupItem_serviceGroupId_fkey" FOREIGN KEY ("serviceGroupId") REFERENCES "public"."ServiceGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServiceGroupItem" ADD CONSTRAINT "ServiceGroupItem_platformServiceId_fkey" FOREIGN KEY ("platformServiceId") REFERENCES "public"."PlatformService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubscriptionPlanService" ADD CONSTRAINT "SubscriptionPlanService_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubscriptionPlanService" ADD CONSTRAINT "SubscriptionPlanService_platformServiceId_fkey" FOREIGN KEY ("platformServiceId") REFERENCES "public"."PlatformService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubscriptionPlanService" ADD CONSTRAINT "SubscriptionPlanService_serviceGroupId_fkey" FOREIGN KEY ("serviceGroupId") REFERENCES "public"."ServiceGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkflowTemplate" ADD CONSTRAINT "WorkflowTemplate_platformServiceId_fkey" FOREIGN KEY ("platformServiceId") REFERENCES "public"."PlatformService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkflowInstance" ADD CONSTRAINT "WorkflowInstance_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."WorkflowTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkflowStepLog" ADD CONSTRAINT "WorkflowStepLog_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "public"."WorkflowInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkflowNotificationTemplate" ADD CONSTRAINT "WorkflowNotificationTemplate_workflowTemplateId_fkey" FOREIGN KEY ("workflowTemplateId") REFERENCES "public"."WorkflowTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryOrderItem" ADD CONSTRAINT "InventoryOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."InventoryOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryOrderItem" ADD CONSTRAINT "InventoryOrderItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."ProviderInventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HealthcareEntity" ADD CONSTRAINT "HealthcareEntity_founderUserId_fkey" FOREIGN KEY ("founderUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderWorkplace" ADD CONSTRAINT "ProviderWorkplace_providerUserId_fkey" FOREIGN KEY ("providerUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderWorkplace" ADD CONSTRAINT "ProviderWorkplace_healthcareEntityId_fkey" FOREIGN KEY ("healthcareEntityId") REFERENCES "public"."HealthcareEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkplaceInvitation" ADD CONSTRAINT "WorkplaceInvitation_healthcareEntityId_fkey" FOREIGN KEY ("healthcareEntityId") REFERENCES "public"."HealthcareEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkplaceInvitation" ADD CONSTRAINT "WorkplaceInvitation_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

