import { Injectable, Inject } from '@nestjs/common';
import {
  IServiceRepository,
  ServiceFilters,
} from '@services/domain/repositories/service-repository.interface';
import { ServiceEntity } from '@services/domain/entities/service.entity';

@Injectable()
export class GetServicesUseCase {
  constructor(
    @Inject(IServiceRepository)
    private readonly serviceRepo: IServiceRepository,
  ) {}

  execute(filters?: ServiceFilters): Promise<ServiceEntity[]> {
    return this.serviceRepo.findAll(filters);
  }
}
