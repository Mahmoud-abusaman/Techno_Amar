import { Module, forwardRef } from '@nestjs/common';
import { ServicesModule } from '@services/services.module';
import { UsersModule } from '@users/users.module';
import { IServiceRequestRepository } from '@service-requests/domain/repositories/service-request-repository.interface';
import { IRequestTaskRepository } from '@service-requests/domain/repositories/request-task-repository.interface';
import { PrismaServiceRequestRepository } from '@service-requests/infrastructure/prisma-service-request.repository';
import { PrismaRequestTaskRepository } from '@service-requests/infrastructure/prisma-request-task.repository';
import { RequestWorkflowService } from '@service-requests/application/request-workflow.service';
import { SubmitServiceRequestUseCase } from '@service-requests/application/submit-service-request.use-case';
import { ListMyServiceRequestsUseCase } from '@service-requests/application/list-my-service-requests.use-case';
import { GetServiceRequestUseCase } from '@service-requests/application/get-service-request.use-case';
import { GetServiceRequestHistoryUseCase } from '@service-requests/application/get-service-request-history.use-case';
import { GetServiceRequestDocumentsUseCase } from '@service-requests/application/get-service-request-documents.use-case';
import { RequiredDocumentsModule } from '@required-documents/required-documents.module';
import { UploadsModule } from '@uploads/uploads.module';
import { GetSectionTaskBoardUseCase } from '@service-requests/application/get-section-task-board.use-case';
import { GetRequestTaskUseCase } from '@service-requests/application/get-request-task.use-case';
import { AssignRequestTaskUseCase } from '@service-requests/application/assign-request-task.use-case';
import { CompleteRequestTaskUseCase } from '@service-requests/application/complete-request-task.use-case';
import { RejectRequestTaskUseCase } from '@service-requests/application/reject-request-task.use-case';
import { ServiceRequestsController } from '@service-requests/presentation/service-requests.controller';
import { RequestTasksController } from '@service-requests/presentation/request-tasks.controller';

@Module({
  imports: [
    forwardRef(() => ServicesModule),
    UsersModule,
    RequiredDocumentsModule,
    UploadsModule,
  ],
  controllers: [ServiceRequestsController, RequestTasksController],
  providers: [
    {
      provide: IServiceRequestRepository,
      useClass: PrismaServiceRequestRepository,
    },
    { provide: IRequestTaskRepository, useClass: PrismaRequestTaskRepository },
    RequestWorkflowService,
    SubmitServiceRequestUseCase,
    ListMyServiceRequestsUseCase,
    GetServiceRequestUseCase,
    GetServiceRequestHistoryUseCase,
    GetServiceRequestDocumentsUseCase,
    GetSectionTaskBoardUseCase,
    GetRequestTaskUseCase,
    AssignRequestTaskUseCase,
    CompleteRequestTaskUseCase,
    RejectRequestTaskUseCase,
  ],
  exports: [IServiceRequestRepository],
})
export class ServiceRequestsModule {}
