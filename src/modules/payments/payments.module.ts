import { Module } from '@nestjs/common';
import { PrismaModule } from '@shared/database/prisma.module';
import { UploadsModule } from '@uploads/uploads.module';
import { ServiceRequestsModule } from '@service-requests/service-requests.module';
import { ServicesModule } from '@services/services.module';
import { IPaymentRepository } from './domain/repositories/payment-repository.interface';
import { PrismaPaymentRepository } from './infrastructure/prisma-payment.repository';
import { SubmitPaymentUseCase } from './application/submit-payment.use-case';
import { VerifyPaymentUseCase } from './application/verify-payment.use-case';
import { GetAllPaymentsUseCase } from './application/get-all-payments.use-case';
import { PaymentsController } from './presentation/payments.controller';
import { AdminPaymentsController } from './presentation/admin-payments.controller';

@Module({
  imports: [PrismaModule, UploadsModule, ServiceRequestsModule, ServicesModule],
  controllers: [PaymentsController, AdminPaymentsController],
  providers: [
    {
      provide: IPaymentRepository,
      useClass: PrismaPaymentRepository,
    },
    SubmitPaymentUseCase,
    VerifyPaymentUseCase,
    GetAllPaymentsUseCase,
  ],
  exports: [IPaymentRepository],
})
export class PaymentsModule {}
