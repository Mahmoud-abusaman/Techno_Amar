import { Injectable, Inject, ConflictException } from '@nestjs/common';
import {
  IDepartmentRepository,
  CreateDepartmentData,
} from '@domain/repositories/department-repository.interface';
import { DepartmentEntity } from '@domain/entities/department.entity';

@Injectable()
export class CreateDepartmentUseCase {
  constructor(
    @Inject(IDepartmentRepository) private readonly deptRepo: IDepartmentRepository,
  ) {}

  async execute(data: CreateDepartmentData): Promise<DepartmentEntity> {
    const existing = await this.deptRepo.findByName(data.name);
    if (existing) throw new ConflictException(`Department "${data.name}" already exists`);
    return this.deptRepo.create(data);
  }
}
