import { Module } from '@nestjs/common';
import { OrgModule } from '@org/org.module';
import { IServiceRepository } from '@services/domain/repositories/service-repository.interface';
import { PrismaServiceRepository } from '@services/infrastructure/prisma-service.repository';
import { CreateServiceUseCase } from '@services/application/create-service.use-case';
import { GetServicesUseCase } from '@services/application/get-services.use-case';
import { GetServiceUseCase } from '@services/application/get-service.use-case';
import { UpdateServiceUseCase } from '@services/application/update-service.use-case';
import { DeleteServiceUseCase } from '@services/application/delete-service.use-case';
import { PublishServiceUseCase } from '@services/application/publish-service.use-case';
import { ArchiveServiceUseCase } from '@services/application/archive-service.use-case';
import { AdminServicesController } from '@services/presentation/admin-services.controller';
import { ServicesController } from '@services/presentation/services.controller';

@Module({
  imports: [OrgModule],
  controllers: [AdminServicesController, ServicesController],
  providers: [
    { provide: IServiceRepository, useClass: PrismaServiceRepository },
    CreateServiceUseCase,
    GetServicesUseCase,
    GetServiceUseCase,
    UpdateServiceUseCase,
    DeleteServiceUseCase,
    PublishServiceUseCase,
    ArchiveServiceUseCase,
  ],
  exports: [IServiceRepository],
})
export class ServicesModule {}
