import { Injectable, Inject, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { ISectionRepository, CreateSectionData } from '@domain/repositories/section-repository.interface';
import { IDepartmentRepository } from '@domain/repositories/department-repository.interface';
import { SectionEntity } from '@domain/entities/section.entity';
import { UserRole } from '@/generated/prisma/enums';

export type CreateSectionContext = {
  actorRole: UserRole;
  actorDepartmentId: bigint | null;
};

@Injectable()
export class CreateSectionUseCase {
  constructor(
    @Inject(ISectionRepository) private readonly sectionRepo: ISectionRepository,
    @Inject(IDepartmentRepository) private readonly deptRepo: IDepartmentRepository,
  ) {}

  async execute(data: CreateSectionData, ctx: CreateSectionContext): Promise<SectionEntity> {
    if (ctx.actorRole === UserRole.DEPARTMENT_MANAGER) {
      if (!ctx.actorDepartmentId || ctx.actorDepartmentId !== data.department_id) {
        throw new ForbiddenException('Managers can only create sections in their own department');
      }
    }

    const dept = await this.deptRepo.findById(data.department_id);
    if (!dept) throw new NotFoundException(`Department ${data.department_id} not found`);
    if (!dept.is_active) throw new ConflictException('Cannot add section to an inactive department');

    const existing = await this.sectionRepo.findByNameInDepartment(data.name, data.department_id);
    if (existing) throw new ConflictException(`Section "${data.name}" already exists in this department`);

    return this.sectionRepo.create(data);
  }
}
