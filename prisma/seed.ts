import { PrismaClient } from '@prisma/client'
import { seedRegions } from './seeds/00-regions.seed'
import { seedMedicines } from './seeds/01-medicines.seed'
import { seedDoctors } from './seeds/02-doctors.seed'
import { seedNurses } from './seeds/03-nurses.seed'
import { seedNannies } from './seeds/04-nannies.seed'
import { seedPatients } from './seeds/05-patients.seed'
import { seedClinicalData } from './seeds/06-clinical-data.seed'
import { seedAppointments, seedExtendedBookings } from './seeds/07-appointments.seed'
import { seedVideoRooms } from './seeds/08-video-rooms.seed'
import { seedSupportingData } from './seeds/09-supporting-data.seed'
import { seedNewUserTypes } from './seeds/10-new-user-types.seed'
import { seedConversations } from './seeds/11-conversations.seed'
import { seedEnrichedData } from './seeds/12-enriched-data.seed'
import { seedBillingAndVideo } from './seeds/13-billing-video.seed'
import { seedCmsContent } from './seeds/14-cms-content.seed'
import { seedCatalogData } from './seeds/15-catalog-data.seed'
import { seedWallets } from './seeds/16-wallets.seed'
import { seedDoctorPosts } from './seeds/17-doctor-posts.seed'
import { seedProviderAvailability } from './seeds/18-provider-availability.seed'
import { seedDocumentsAndEnrichment } from './seeds/19-documents-enrichment.seed'
import { seedRoleConfig } from './seeds/20-role-config.seed'
import { seedRequiredDocuments } from './seeds/21-required-documents.seed'
import { seedProviderReviews } from './seeds/22-provider-reviews.seed'
import { seedConnections } from './seeds/23-connections.seed'
import { seedFoodDatabase } from './seeds/24-food-database.seed'
import { seedHealthTrackerDemo } from './seeds/25-health-tracker-demo.seed'
import { seedMultiCountryUsers } from './seeds/27-multi-country-users.seed'
import { seedDocumentsAndFiles } from './seeds/28-seed-documents.seed'
import { seedSubscriptions } from './seeds/29-subscriptions.seed'
import { seedPlatformServices } from './seeds/30-platform-services.seed'
import { seedProviderSpecialties } from './seeds/31-provider-specialties.seed'
import { seedNewProviderRoles } from './seeds/32-new-provider-roles.seed'
import { seedServiceBookings } from './seeds/33-service-bookings.seed'
import { seedWorkflowTemplates } from './seeds/34-workflow-templates.seed'
import { seedProviderRoles } from './seeds/35-provider-roles.seed'
import { seedWallets as seedMissingWallets, seedInventoryItems } from './seeds/36-wallets-inventory.seed'
import { seedWorkflowInstances } from './seeds/37-workflow-instances.seed'
import { seedInventoryOrders, seedNotificationTemplates, seedNotifications } from './seeds/38-orders-notifications.seed'
import { seedRichBookingsAndWorkflows } from './seeds/39-rich-bookings-workflows.seed'
import { seedExpandedSpecialties, seedExpandedProviders, seedExpandedInventory } from './seeds/40-expanded-data.seed'
import { seedCompanyActivity } from './seeds/41-company-activity.seed'
import { seedExpandedProvidersInventory } from './seeds/42-expanded-providers-inventory.seed'
import { seedPatientBookingHistory } from './seeds/43-patient-booking-history.seed'
import { seedExpandedWorkflowsServices } from './seeds/44-expanded-workflows-services.seed'
import { seedRoleProfileFields } from './seeds/45-role-profile-fields.seed'
import { seedWorkflowStepDurations } from './seeds/46-workflow-step-durations.seed'
import { seedInsuranceFavoritesStreaks } from './seeds/47-insurance-favorites-streaks.seed'
import { seedWorkflowStepLibrary } from './seeds/49-workflow-step-library.seed'
import { seedWorkflowDomainTemplates } from './seeds/50-workflow-domain-templates.seed'
import { seedSarahJohnsonAndServices } from './seeds/55-sarah-johnson-services.seed'
import { seedIconKeys } from './seeds/56-icon-keys.seed'
import { seedDoctorSpecialtyServices } from './seeds/57-doctor-specialty-services.seed'
import { seedHealthShopCategories } from './seeds/58-health-shop-categories.seed'
import { seedServiceConfigBackfill } from './seeds/59-service-config-backfill.seed'
import { seedHealthcareEntities } from './seeds/60-healthcare-entities.seed'
import { seedUserCoordinates } from './seeds/61-user-coordinates.seed'
import { seedCleanupNames } from './seeds/62-cleanup-names.seed'

const prisma = new PrismaClient()

async function main() {
  console.log('Cleaning database...')

  // Delete in reverse dependency order

  // 0. Workflow Engine tables
  await prisma.workflowStepLog.deleteMany()
  await prisma.workflowNotificationTemplate.deleteMany()
  await prisma.workflowInstance.deleteMany()
  await prisma.workflowTemplate.deleteMany()
  await prisma.workflowStepType.deleteMany()

  // 0. Provider Inventory tables
  await prisma.inventoryOrderItem.deleteMany()
  await prisma.inventoryOrder.deleteMany()
  await prisma.providerInventoryItem.deleteMany()

  // 0. Programs
  await prisma.programSessionProgress.deleteMany()
  await prisma.programEnrollment.deleteMany()
  await prisma.programProvider.deleteMany()
  await prisma.programSession.deleteMany()
  await prisma.subscriptionPlanProgram.deleteMany()
  await prisma.healthProgram.deleteMany()

  // 0. Subscription + Corporate Employee + Service tables
  await prisma.subscriptionUsage.deleteMany()
  await prisma.userSubscription.deleteMany()
  await prisma.subscriptionPlanService.deleteMany()
  await prisma.subscriptionPlan.deleteMany()
  await prisma.corporateEmployee.deleteMany()
  await prisma.serviceGroupItem.deleteMany()
  await prisma.serviceGroup.deleteMany()
  await prisma.providerServiceConfig.deleteMany()
  await prisma.platformService.deleteMany()
  await prisma.providerSpecialty.deleteMany()

  // 0. Config + Reviews tables (no FK dependencies)
  await prisma.roleFeatureConfig.deleteMany()
  await prisma.requiredDocumentConfig.deleteMany()
  await prisma.providerReview.deleteMany()
  await prisma.userConnection.deleteMany()
  await prisma.insuranceClaim.deleteMany()

  // 0a. Doctor Posts (children before parents)
  await prisma.postLike.deleteMany()
  await prisma.postComment.deleteMany()
  await prisma.post.deleteMany()

  // 0b. Wallets (children before parents)
  await prisma.walletTransaction.deleteMany()
  await prisma.userWallet.deleteMany()

  // 0c. CMS + Catalog tables
  await prisma.cmsTestimonial.deleteMany()
  await prisma.cmsHeroSlide.deleteMany()
  await prisma.cmsSection.deleteMany()
  await prisma.doctorServiceCatalog.deleteMany()
  await prisma.nurseServiceCatalog.deleteMany()
  await prisma.nannyServiceCatalog.deleteMany()
  await prisma.pharmacyMedicine.deleteMany()
  await prisma.labTestCatalog.deleteMany()
  await prisma.emergencyServiceListing.deleteMany()
  await prisma.insurancePlanListing.deleteMany()

  // 0d. Health Tracker tables
  await prisma.mealPlanEntry.deleteMany()
  await prisma.dailyGoalSnapshot.deleteMany()
  await prisma.waterEntry.deleteMany()
  await prisma.exerciseEntry.deleteMany()
  await prisma.foodEntry.deleteMany()
  await prisma.healthTrackerProfile.deleteMany()
  await prisma.foodDatabase.deleteMany()

  // 1. Cross-cutting models
  await prisma.notification.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversationParticipant.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.webRTCConnection.deleteMany()
  await prisma.videoCallSession.deleteMany()
  await prisma.videoRoomParticipant.deleteMany()
  await prisma.videoRoom.deleteMany()
  await prisma.billingInfo.deleteMany()
  await prisma.document.deleteMany()

  // 2. Order-related
  await prisma.medicineOrderItem.deleteMany()
  await prisma.medicineOrder.deleteMany()

  // 3. Patient clinical data
  await prisma.nutritionAnalysis.deleteMany()
  await prisma.emergencyServiceContact.deleteMany()
  await prisma.pillReminder.deleteMany()
  await prisma.labTestResult.deleteMany()
  await prisma.labTest.deleteMany()
  await prisma.vitalSigns.deleteMany()
  await prisma.prescriptionMedicine.deleteMany()
  await prisma.prescription.deleteMany()
  await prisma.medicalRecord.deleteMany()
  await prisma.patientEmergencyContact.deleteMany()

  // 4. Scheduling + Provider Availability
  await prisma.providerAvailability.deleteMany()
  await prisma.serviceBooking.deleteMany()
  await prisma.emergencyBooking.deleteMany()
  await prisma.labTestBooking.deleteMany()
  await prisma.childcareBooking.deleteMany()
  await prisma.nurseBooking.deleteMany()
  await prisma.appointment.deleteMany()

  // 5. Doctor supporting models
  await prisma.patientComment.deleteMany()
  await prisma.scheduleSlot.deleteMany()
  await prisma.doctorWorkHistory.deleteMany()
  await prisma.doctorCertification.deleteMany()
  await prisma.doctorEducation.deleteMany()

  // 6. Medicines (standalone)
  await prisma.medicine.deleteMany()

  // 7. Profile tables (before User)
  await prisma.patientProfile.deleteMany()
  await prisma.doctorProfile.deleteMany()
  await prisma.nurseProfile.deleteMany()
  await prisma.nannyProfile.deleteMany()
  await prisma.pharmacistProfile.deleteMany()
  await prisma.labTechProfile.deleteMany()
  await prisma.emergencyWorkerProfile.deleteMany()
  await prisma.insuranceRepProfile.deleteMany()
  await prisma.corporateAdminProfile.deleteMany()
  await prisma.referralPartnerProfile.deleteMany()
  await prisma.regionalAdminProfile.deleteMany()
  await prisma.caregiverProfile.deleteMany()
  await prisma.physiotherapistProfile.deleteMany()
  await prisma.dentistProfile.deleteMany()
  await prisma.optometristProfile.deleteMany()
  await prisma.nutritionistProfile.deleteMany()

  // 8. User table (last — all FKs cleared above)
  await prisma.user.deleteMany()

  // 9. Regions (after users, since users have optional FK to regions)
  await prisma.region.deleteMany()

  console.log('Seeding database...')

  await seedRegions(prisma)
  await seedMedicines(prisma)
  await seedDoctors(prisma)
  await seedNurses(prisma)
  await seedNannies(prisma)
  await seedPatients(prisma)
  await seedClinicalData(prisma)
  await seedAppointments(prisma)
  await seedVideoRooms(prisma)
  await seedSupportingData(prisma)
  await seedNewUserTypes(prisma)
  await seedExtendedBookings(prisma)
  await seedConversations(prisma)
  await seedEnrichedData(prisma)
  await seedBillingAndVideo(prisma)
  await seedCmsContent(prisma)
  await seedCatalogData(prisma)
  await seedWallets(prisma)
  await seedDoctorPosts(prisma)
  await seedProviderAvailability(prisma)
  await seedDocumentsAndEnrichment(prisma)
  await seedRoleConfig(prisma)
  await seedRequiredDocuments(prisma)
  await seedProviderReviews(prisma)
  await seedConnections(prisma)
  await seedFoodDatabase(prisma)
  await seedHealthTrackerDemo(prisma)
  await seedMultiCountryUsers(prisma)
  await seedDocumentsAndFiles(prisma)
  await seedSubscriptions(prisma)
  await seedPlatformServices(prisma)
  await seedProviderSpecialties(prisma)
  await seedNewProviderRoles(prisma)
  await seedServiceBookings(prisma)
  await seedWorkflowTemplates(prisma)
  await seedProviderRoles(prisma)
  await seedMissingWallets(prisma)
  await seedInventoryItems(prisma)
  await seedWorkflowInstances(prisma)
  await seedInventoryOrders(prisma)
  await seedNotificationTemplates(prisma)
  await seedNotifications(prisma)
  await seedRichBookingsAndWorkflows(prisma)

  // ── Expanded data (seed 40) ─────────────────────────────────────────
  await seedExpandedSpecialties(prisma)
  await seedExpandedProviders(prisma)
  await seedExpandedInventory(prisma)
  await seedCompanyActivity(prisma)
  await seedExpandedProvidersInventory(prisma)
  await seedPatientBookingHistory(prisma)
  await seedExpandedWorkflowsServices(prisma)
  await seedRoleProfileFields(prisma)
  await seedWorkflowStepDurations(prisma)
  await seedSarahJohnsonAndServices(prisma)  // must run before seed 47 (insurance company owner)
  await seedInsuranceFavoritesStreaks(prisma)
  await seedWorkflowStepLibrary(prisma)
  await seedWorkflowDomainTemplates(prisma)
  await seedIconKeys()
  await seedDoctorSpecialtyServices()
  await seedHealthShopCategories(prisma)
  await seedServiceConfigBackfill(prisma)   // must run after 57 + 58
  await seedHealthcareEntities(prisma)      // seed 60 — clinics/hospitals + provider links
  await seedUserCoordinates(prisma)         // seed 61 — GPS coordinates for nearest-provider search
  await seedCleanupNames(prisma)            // seed 62 — delete old real names, rename to mock names

  // ── Final step: ensure ALL users have subscriptions ──────────────
  console.log('  Ensuring all users have subscriptions...')
  const planAssign: Record<string, string> = {
    PATIENT: 'essential', DOCTOR: 'plus', NURSE: 'essential', NANNY: 'essential',
    PHARMACIST: 'essential', LAB_TECHNICIAN: 'essential', EMERGENCY_WORKER: 'essential',
    INSURANCE_REP: 'plus', REFERRAL_PARTNER: 'plus', REGIONAL_ADMIN: 'premium',
    CORPORATE_ADMIN: 'plus', CAREGIVER: 'essential', PHYSIOTHERAPIST: 'essential',
    DENTIST: 'essential', OPTOMETRIST: 'essential', NUTRITIONIST: 'essential',
  }
  const allUsers = await prisma.user.findMany({
    where: { subscription: null },
    select: { id: true, userType: true, regionId: true },
  })
  let enrollCount = 0
  for (const u of allUsers) {
    const base = planAssign[u.userType]
    if (!base) continue
    let cc = 'mu'
    if (u.regionId) {
      const r = await prisma.region.findUnique({ where: { id: u.regionId }, select: { countryCode: true } })
      if (r) cc = r.countryCode.toLowerCase()
    }
    const plan = await prisma.subscriptionPlan.findUnique({ where: { slug: `${base}-${cc}` } })
    if (!plan) continue
    await prisma.userSubscription.create({ data: { userId: u.id, planId: plan.id, status: 'active', autoRenew: true } })
    enrollCount++
  }
  if (enrollCount > 0) console.log(`  ✓ Enrolled ${enrollCount} additional users in plans`)

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
