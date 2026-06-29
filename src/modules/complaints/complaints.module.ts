import { Module } from '@nestjs/common';
import { UploadsModule } from '@uploads/uploads.module';
import { IComplaintRepository } from '@complaints/domain/repositories/complaint-repository.interface';
import { PrismaComplaintRepository } from '@complaints/infrastructure/prisma-complaint.repository';
import { SubmitComplaintUseCase } from '@complaints/application/submit-complaint.use-case';
import { GetMyComplaintsUseCase } from '@complaints/application/get-my-complaints.use-case';
import { GetComplaintUseCase } from '@complaints/application/get-complaint.use-case';
import { GetAllComplaintsUseCase } from '@complaints/application/get-all-complaints.use-case';
import { GetComplaintAdminUseCase } from '@complaints/application/get-complaint-admin.use-case';
import { ResolveComplaintUseCase } from '@complaints/application/resolve-complaint.use-case';
import { ComplaintsController } from '@complaints/presentation/complaints.controller';
import { AdminComplaintsController } from '@complaints/presentation/admin-complaints.controller';

@Module({
  imports: [UploadsModule],
  controllers: [ComplaintsController, AdminComplaintsController],
  providers: [
    {
      provide: IComplaintRepository,
      useClass: PrismaComplaintRepository,
    },
    SubmitComplaintUseCase,
    GetMyComplaintsUseCase,
    GetComplaintUseCase,
    GetAllComplaintsUseCase,
    GetComplaintAdminUseCase,
    ResolveComplaintUseCase,
  ],
  exports: [IComplaintRepository],
})
export class ComplaintsModule {}
