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
export class ArchiveServiceUseCase {
  constructor(
    @Inject(IServiceRepository)
    private readonly serviceRepo: IServiceRepository,
  ) {}

  async execute(id: bigint): Promise<ServiceEntity> {
    const service = await this.serviceRepo.findById(id);
    if (!service) throw new NotFoundException(`Service ${id} not found`);
    if (service.status === ServiceStatus.ARCHIVED)
      throw new ConflictException('Service is already archived');

    return this.serviceRepo.update(id, {
      status: ServiceStatus.ARCHIVED,
    });
  }
}
