import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { validate } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { EmbeddingModule } from './embeddings/embedding.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';
import { RolesModule } from './roles/roles.module';
import { WorkflowModule } from './workflow/workflow.module';
import { UsersModule } from './users/users.module';
import { HealthDataModule } from './health-data/health-data.module';
import { ProvidersModule } from './providers/providers.module';
import { SearchModule } from './search/search.module';
import { BookingsModule } from './bookings/bookings.module';
import { InventoryModule } from './inventory/inventory.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { WebRtcModule } from './webrtc/webrtc.module';
import { ConversationsModule } from './conversations/conversations.module';
import { PostsModule } from './posts/posts.module';
import { ProgramsModule } from './programs/programs.module';
import { ServicesModule } from './services/services.module';
import { CorporateModule } from './corporate/corporate.module';
import { RegionalModule } from './regional/regional.module';
import { AdminModule } from './admin/admin.module';
import { ConnectionsModule } from './connections/connections.module';
import { StatsModule } from './stats/stats.module';
import { ContactModule } from './contact/contact.module';
import { ConfigModule } from './config/config.module';
// New modules
import { CmsModule } from './cms/cms.module';
import { LegacyRoutesModule } from './legacy-routes/legacy-routes.module';
import { InsuranceModule } from './insurance/insurance.module';
import { OrdersModule } from './orders/orders.module';
import { DocumentsModule } from './documents/documents.module';
import { AiModule } from './ai/ai.module';
import { ReferralTrackingModule } from './referral-tracking/referral-tracking.module';
import { HealthModule } from './health/health.module';
import { PaymentsModule } from './payments/payments.module';
import { UploadModule } from './upload/upload.module';
import { SharedModule } from './shared/shared.module';
import { FavoritesModule } from './favorites/favorites.module';
import { GeoModule } from './geo/geo.module';
import { HealthStreakModule } from './health-streak/health-streak.module';
import { RemindersModule } from './reminders/reminders.module';
import { OrganizationsModule } from './organizations/organizations.module';

@Module({
  imports: [
    NestConfigModule.forRoot({ isGlobal: true, validate }),
    ScheduleModule.forRoot(),
    PrismaModule,
    EmbeddingModule,
    SharedModule,
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 20 },
      { name: 'medium', ttl: 60000, limit: 300 },
      { name: 'long', ttl: 3600000, limit: 5000 },
    ]),
    AuthModule,
    NotificationsModule,
    ChatModule,
    RolesModule,
    WorkflowModule,
    UsersModule,
    HealthDataModule,
    ProvidersModule,
    SearchModule,
    BookingsModule,
    InventoryModule,
    SubscriptionsModule,
    WebRtcModule,
    ConversationsModule,
    PostsModule,
    ProgramsModule,
    ServicesModule,
    CorporateModule,
    FavoritesModule,
    GeoModule,
    HealthStreakModule,
    RemindersModule,
    OrganizationsModule,
    RegionalModule,
    AdminModule,
    ConnectionsModule,
    StatsModule,
    ContactModule,
    ConfigModule,
    // New modules for missing endpoints
    CmsModule,
    LegacyRoutesModule,
    InsuranceModule,
    OrdersModule,
    DocumentsModule,
    AiModule,
    ReferralTrackingModule,
    HealthModule,
    PaymentsModule,
    UploadModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
