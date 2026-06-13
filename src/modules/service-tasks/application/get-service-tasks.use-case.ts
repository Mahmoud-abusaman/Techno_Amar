import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IServiceTaskRepository } from '@service-tasks/domain/repositories/service-task-repository.interface';
import { IServiceRepository } from '@services/domain/repositories/service-repository.interface';
import { ServiceTaskEntity } from '@service-tasks/domain/entities/service-task.entity';

@Injectable()
export class GetServiceTasksUseCase {
  constructor(
    @Inject(IServiceTaskRepository)
    private readonly taskRepo: IServiceTaskRepository,
    @Inject(IServiceRepository)
    private readonly serviceRepo: IServiceRepository,
  ) {}

  async execute(
    serviceId: bigint,
    activeOnly = false,
  ): Promise<ServiceTaskEntity[]> {
    const service = await this.serviceRepo.findById(serviceId);
    if (!service) throw new NotFoundException(`Service ${serviceId} not found`);

    return this.taskRepo.findByServiceId(serviceId, activeOnly);
  }
}
