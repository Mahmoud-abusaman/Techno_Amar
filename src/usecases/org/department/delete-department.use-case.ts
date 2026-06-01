import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { IDepartmentRepository } from '@domain/repositories/department-repository.interface';

@Injectable()
export class DeleteDepartmentUseCase {
  constructor(
    @Inject(IDepartmentRepository) private readonly deptRepo: IDepartmentRepository,
  ) {}

  async execute(id: bigint): Promise<void> {
    const dept = await this.deptRepo.findById(id);
    if (!dept) throw new NotFoundException(`Department ${id} not found`);

    const hasDependents = await this.deptRepo.hasDependents(id);
    if (hasDependents) {
      throw new ConflictException('Cannot delete department with existing sections or employees');
    }

    await this.deptRepo.delete(id);
  }
}
