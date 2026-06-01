import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import {
  IDepartmentRepository,
  UpdateDepartmentData,
} from '@domain/repositories/department-repository.interface';
import { DepartmentEntity } from '@domain/entities/department.entity';

@Injectable()
export class UpdateDepartmentUseCase {
  constructor(
    @Inject(IDepartmentRepository) private readonly deptRepo: IDepartmentRepository,
  ) {}

  async execute(id: bigint, data: UpdateDepartmentData): Promise<DepartmentEntity> {
    const dept = await this.deptRepo.findById(id);
    if (!dept) throw new NotFoundException(`Department ${id} not found`);

    if (data.name && data.name !== dept.name) {
      const conflict = await this.deptRepo.findByName(data.name);
      if (conflict) throw new ConflictException(`Department "${data.name}" already exists`);
    }

    return this.deptRepo.update(id, data);
  }
}
