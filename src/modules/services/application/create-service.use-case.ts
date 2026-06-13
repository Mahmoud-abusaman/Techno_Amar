import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  IServiceRepository,
} from '@services/domain/repositories/service-repository.interface';
import { IDepartmentRepository } from '@org/domain/repositories/department-repository.interface';
import { ServiceEntity } from '@services/domain/entities/service.entity';
import { CreateServiceDto } from '@services/presentation/dto/service.dto';

@Injectable()
export class CreateServiceUseCase {
  constructor(
    @Inject(IServiceRepository)
    private readonly serviceRepo: IServiceRepository,
    @Inject(IDepartmentRepository)
    private readonly deptRepo: IDepartmentRepository,
  ) {}

  async execute(
    data: CreateServiceDto,
    createdBy: bigint,
  ): Promise<ServiceEntity> {
    const existing = await this.serviceRepo.findByName(data.name);
    if (existing)
      throw new ConflictException(`Service "${data.name}" already exists`);

    const dept = await this.deptRepo.findById(data.department_id);
    if (!dept)
      throw new NotFoundException(`Department ${data.department_id} not found`);
    if (!dept.is_active)
      throw new ConflictException(
        'Cannot assign service to an inactive department',
      );

    return this.serviceRepo.create({
      name: data.name,
      description: data.description ?? null,
      department_id: data.department_id,
      fee: data.fee,
      estimated_processing_days: data.estimated_processing_days,
      created_by: createdBy,
    });
  }
}
