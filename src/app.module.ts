import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfiguration from '@shared/config/app.configuration';
import { PrismaModule } from '@shared/database/prisma.module';
import { AuthModule } from '@auth/auth.module';
import { UsersModule } from '@users/users.module';
import { OrgModule } from '@org/org.module';
import { ServicesModule } from '@services/services.module';
import { ServiceTasksModule } from '@service-tasks/service-tasks.module';
import { DamageAssessmentsModule } from '@damage-assessments/damage-assessments.module';
import { ComplaintsModule } from '@complaints/complaints.module';
import { ServiceRequestsModule } from '@service-requests/service-requests.module';
import { UploadsModule } from '@uploads/uploads.module';
import { RequiredDocumentsModule } from '@required-documents/required-documents.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV
        ? `.env.${process.env.NODE_ENV}`
        : '.env',
      load: [appConfiguration],
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    OrgModule,
    ServicesModule,
    ServiceTasksModule,
    DamageAssessmentsModule,
    ComplaintsModule,
    ServiceRequestsModule,
    UploadsModule,
    RequiredDocumentsModule,
    PaymentsModule,
  ],
})
export class AppModule {}
