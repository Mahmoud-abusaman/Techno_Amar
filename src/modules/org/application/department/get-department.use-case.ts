import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IDepartmentRepository } from '@org/domain/repositories/department-repository.interface';
import { DepartmentEntity } from '@org/domain/entities/department.entity';

@Injectable()
export class GetDepartmentUseCase {
  constructor(
    @Inject(IDepartmentRepository)
    private readonly deptRepo: IDepartmentRepository,
  ) {}

  async execute(id: bigint): Promise<DepartmentEntity> {
    const dept = await this.deptRepo.findById(id);
    if (!dept) throw new NotFoundException(`Department ${id} not found`);
    return dept;
  }
}
