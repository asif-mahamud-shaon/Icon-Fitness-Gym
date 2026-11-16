import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MembersModule } from './modules/members/members.module';
import { TrainersModule } from './modules/trainers/trainers.module';
import { MembershipPlansModule } from './modules/membership-plans/membership-plans.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { WorkoutsModule } from './modules/workouts/workouts.module';
import { ClassesModule } from './modules/classes/classes.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { GalleryModule } from './modules/gallery/gallery.module';
import { TestimonialsModule } from './modules/testimonials/testimonials.module';
import { InquiriesModule } from './modules/inquiries/inquiries.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { AccessControlModule } from './modules/access-control/access-control.module';
import { StoreModule } from './modules/store/store.module';
import { HrmModule } from './modules/hrm/hrm.module';
import { CrmModule } from './modules/crm/crm.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    PrismaModule,
    AuditLogsModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    MembersModule,
    TrainersModule,
    MembershipPlansModule,
    MembershipsModule,
    PaymentsModule,
    ExercisesModule,
    WorkoutsModule,
    ClassesModule,
    SchedulesModule,
    BookingsModule,
    AttendanceModule,
    GalleryModule,
    TestimonialsModule,
    InquiriesModule,
    ReportsModule,
    SettingsModule,
    AccessControlModule,
    StoreModule,
    HrmModule,
    CrmModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}

