import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { IServiceRepository } from '@services/domain/repositories/service-repository.interface';
import { IServiceRequestRepository } from '@service-requests/domain/repositories/service-request-repository.interface';

@Injectable()
export class DeleteServiceUseCase {
  constructor(
    @Inject(IServiceRepository)
    private readonly serviceRepo: IServiceRepository,
    @Inject(IServiceRequestRepository)
    private readonly requestRepo: IServiceRequestRepository,
  ) {}

  async execute(id: bigint): Promise<void> {
    const service = await this.serviceRepo.findById(id);
    if (!service) throw new NotFoundException(`Service ${id} not found`);
    if (!service.is_active)
      throw new ConflictException(`Service ${id} is already inactive`);

    const activeRequests = await this.requestRepo.countActiveByServiceId(id);
    if (activeRequests > 0) {
      throw new ConflictException(
        'Cannot delete service while active requests exist',
      );
    }

    await this.serviceRepo.delete(id);
  }
}
