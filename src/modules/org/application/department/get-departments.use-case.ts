import { Injectable, Inject } from '@nestjs/common';
import { IDepartmentRepository } from '@org/domain/repositories/department-repository.interface';
import { DepartmentEntity } from '@org/domain/entities/department.entity';

@Injectable()
export class GetDepartmentsUseCase {
  constructor(
    @Inject(IDepartmentRepository)
    private readonly deptRepo: IDepartmentRepository,
  ) {}

  execute(activeOnly = false): Promise<DepartmentEntity[]> {
    return this.deptRepo.findAll(activeOnly);
  }
}
