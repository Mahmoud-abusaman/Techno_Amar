import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  IServiceRepository,
  UpdateServiceData,
} from '@services/domain/repositories/service-repository.interface';
import { IDepartmentRepository } from '@org/domain/repositories/department-repository.interface';
import { ServiceEntity } from '@services/domain/entities/service.entity';

@Injectable()
export class UpdateServiceUseCase {
  constructor(
    @Inject(IServiceRepository)
    private readonly serviceRepo: IServiceRepository,
    @Inject(IDepartmentRepository)
    private readonly deptRepo: IDepartmentRepository,
  ) {}

  async execute(
    id: bigint,
    data: UpdateServiceData,
  ): Promise<ServiceEntity> {
    const service = await this.serviceRepo.findById(id);
    if (!service) throw new NotFoundException(`Service ${id} not found`);

    if (data.name && data.name !== service.name) {
      const conflict = await this.serviceRepo.findByName(data.name);
      if (conflict)
        throw new ConflictException(`Service "${data.name}" already exists`);
    }

    if (data.department_id && data.department_id !== service.department_id) {
      const dept = await this.deptRepo.findById(data.department_id);
      if (!dept)
        throw new NotFoundException(
          `Department ${data.department_id} not found`,
        );
      if (!dept.is_active)
        throw new ConflictException(
          'Cannot assign service to an inactive department',
        );
    }

    return this.serviceRepo.update(id, data);
  }
}
