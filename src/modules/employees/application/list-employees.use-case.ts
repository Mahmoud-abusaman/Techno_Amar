import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { IUserRepository, FindUsersFilter } from '@domain/repositories/user-repository.interface';
import { UserEntity } from '@domain/entities/user.entity';
import { UserRole } from '@/generated/prisma/enums';

export interface ListEmployeesContext {
  actorRole: UserRole;
  actorDepartmentId: bigint | null;
}

export interface ListEmployeesFilter {
  department_id?: bigint;
  section_id?: bigint;
  is_active?: boolean;
}

@Injectable()
export class ListEmployeesUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
  ) {}

  async execute(ctx: ListEmployeesContext, filter: ListEmployeesFilter = {}): Promise<UserEntity[]> {
    if (ctx.actorRole === UserRole.DEPARTMENT_MANAGER) {
      if (!ctx.actorDepartmentId) throw new ForbiddenException('No department assigned');
      // manager can only see their own department
      filter = { ...filter, department_id: ctx.actorDepartmentId };
    }

    const repoFilter: FindUsersFilter = {
      ...filter,
      role: UserRole.EMPLOYEE,
    };

    return this.userRepo.findAll(repoFilter);
  }
}
