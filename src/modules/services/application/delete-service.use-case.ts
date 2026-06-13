import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { IServiceRepository } from '@services/domain/repositories/service-repository.interface';

@Injectable()
export class DeleteServiceUseCase {
  constructor(
    @Inject(IServiceRepository)
    private readonly serviceRepo: IServiceRepository,
  ) {}

  async execute(id: bigint): Promise<void> {
    const service = await this.serviceRepo.findById(id);
    if (!service) throw new NotFoundException(`Service ${id} not found`);
    if (!service.is_active)
      throw new ConflictException(`Service ${id} is already inactive`);

    await this.serviceRepo.delete(id);
  }
}
