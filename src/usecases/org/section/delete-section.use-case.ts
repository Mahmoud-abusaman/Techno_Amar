import { Injectable, Inject, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { ISectionRepository } from '@domain/repositories/section-repository.interface';
import { UserRole } from '@/generated/prisma/enums';

export type DeleteSectionContext = {
  actorRole: UserRole;
  actorDepartmentId: bigint | null;
};

@Injectable()
export class DeleteSectionUseCase {
  constructor(
    @Inject(ISectionRepository) private readonly sectionRepo: ISectionRepository,
  ) {}

  async execute(id: bigint, ctx: DeleteSectionContext): Promise<void> {
    const section = await this.sectionRepo.findById(id);
    if (!section) throw new NotFoundException(`Section ${id} not found`);

    if (ctx.actorRole === UserRole.DEPARTMENT_MANAGER) {
      if (!ctx.actorDepartmentId || ctx.actorDepartmentId !== section.department_id) {
        throw new ForbiddenException('Managers can only delete sections in their own department');
      }
    }

    const hasDependents = await this.sectionRepo.hasDependents(id);
    if (hasDependents) {
      throw new ConflictException('Cannot delete section with assigned employees');
    }

    await this.sectionRepo.delete(id);
  }
}
