import { Module } from '@nestjs/common';
import { OrgModule } from '@org/org.module';
import { ServicesModule } from '@services/services.module';
import { IServiceTaskRepository } from '@service-tasks/domain/repositories/service-task-repository.interface';
import { PrismaServiceTaskRepository } from '@service-tasks/infrastructure/prisma-service-task.repository';
import { CreateServiceTaskUseCase } from '@service-tasks/application/create-service-task.use-case';
import { GetServiceTasksUseCase } from '@service-tasks/application/get-service-tasks.use-case';
import { UpdateServiceTaskUseCase } from '@service-tasks/application/update-service-task.use-case';
import { DeleteServiceTaskUseCase } from '@service-tasks/application/delete-service-task.use-case';
import { AdminServiceWorkflowController } from '@service-tasks/presentation/admin-service-workflow.controller';

@Module({
  imports: [OrgModule, ServicesModule],
  controllers: [AdminServiceWorkflowController],
  providers: [
    { provide: IServiceTaskRepository, useClass: PrismaServiceTaskRepository },
    CreateServiceTaskUseCase,
    GetServiceTasksUseCase,
    UpdateServiceTaskUseCase,
    DeleteServiceTaskUseCase,
  ],
  exports: [IServiceTaskRepository],
})
export class ServiceTasksModule {}
