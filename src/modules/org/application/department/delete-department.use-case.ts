import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IDepartmentRepository } from '@org/domain/repositories/department-repository.interface';

@Injectable()
export class DeleteDepartmentUseCase {
  constructor(
    @Inject(IDepartmentRepository)
    private readonly deptRepo: IDepartmentRepository,
  ) {}

  async execute(id: bigint): Promise<void> {
    const dept = await this.deptRepo.findById(id);
    if (!dept) throw new NotFoundException(`Department ${id} not found`);

    await this.deptRepo.delete(id);
  }
}
