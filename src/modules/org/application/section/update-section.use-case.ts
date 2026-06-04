import { Injectable, Inject, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { ISectionRepository, UpdateSectionData } from '@domain/repositories/section-repository.interface';
import { SectionEntity } from '@domain/entities/section.entity';
import { UserRole } from '@/generated/prisma/enums';

export type UpdateSectionContext = {
  actorRole: UserRole;
  actorDepartmentId: bigint | null;
};

@Injectable()
export class UpdateSectionUseCase {
  constructor(
    @Inject(ISectionRepository) private readonly sectionRepo: ISectionRepository,
  ) {}

  async execute(id: bigint, data: UpdateSectionData, ctx: UpdateSectionContext): Promise<SectionEntity> {
    const section = await this.sectionRepo.findById(id);
    if (!section) throw new NotFoundException(`Section ${id} not found`);

    if (ctx.actorRole === UserRole.DEPARTMENT_MANAGER) {
      if (!ctx.actorDepartmentId || ctx.actorDepartmentId !== section.department_id) {
        throw new ForbiddenException('Managers can only update sections in their own department');
      }
    }

    if (data.name && data.name !== section.name) {
      const conflict = await this.sectionRepo.findByNameInDepartment(data.name, section.department_id);
      if (conflict) throw new ConflictException(`Section "${data.name}" already exists in this department`);
    }

    return this.sectionRepo.update(id, data);
  }
}
