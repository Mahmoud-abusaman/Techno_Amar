import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IServiceRepository } from '@services/domain/repositories/service-repository.interface';
import { ServiceWithTasksEntity } from '@services/domain/entities/service-with-tasks.entity';
import { ServiceStatus } from '@/generated/prisma/enums';

export type GetServiceOptions = {
  publishedOnly?: boolean;
  activeTasksOnly?: boolean;
};

@Injectable()
export class GetServiceUseCase {
  constructor(
    @Inject(IServiceRepository)
    private readonly serviceRepo: IServiceRepository,
  ) {}

  async execute(
    id: bigint,
    options: GetServiceOptions = {},
  ): Promise<ServiceWithTasksEntity> {
    const service = await this.serviceRepo.findByIdWithTasks(id, {
      activeTasksOnly: options.activeTasksOnly ?? options.publishedOnly,
    });

    if (!service) throw new NotFoundException(`Service ${id} not found`);

    if (options.publishedOnly) {
      if (service.status !== ServiceStatus.PUBLISHED || !service.is_active) {
        throw new NotFoundException(`Service ${id} not found`);
      }
    }

    return service;
  }
}
