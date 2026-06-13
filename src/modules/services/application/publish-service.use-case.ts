import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { IServiceRepository } from '@services/domain/repositories/service-repository.interface';
import { ServiceEntity } from '@services/domain/entities/service.entity';
import { ServiceStatus } from '@/generated/prisma/enums';

@Injectable()
export class PublishServiceUseCase {
  constructor(
    @Inject(IServiceRepository)
    private readonly serviceRepo: IServiceRepository,
  ) {}

  async execute(id: bigint): Promise<ServiceEntity> {
    const service = await this.serviceRepo.findById(id);
    if (!service) throw new NotFoundException(`Service ${id} not found`);
    if (!service.is_active)
      throw new ConflictException('Cannot publish an inactive service');
    if (service.status === ServiceStatus.PUBLISHED)
      throw new ConflictException('Service is already published');

    const activeTaskCount = await this.serviceRepo.countActiveTasks(id);
    if (activeTaskCount < 1)
      throw new ConflictException(
        'Service must have at least one active workflow task before publishing',
      );

    return this.serviceRepo.update(id, {
      status: ServiceStatus.PUBLISHED,
      published_at: new Date(),
    });
  }
}
