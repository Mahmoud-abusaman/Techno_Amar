import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { UserEntity } from '@domain/entities/user.entity';
import { UserRole } from '@/generated/prisma/enums';

export interface GetEmployeeContext {
  actorRole: UserRole;
  actorDepartmentId: bigint | null;
}

@Injectable()
export class GetEmployeeUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
  ) {}

  async execute(employeeId: bigint, ctx: GetEmployeeContext): Promise<UserEntity> {
    const employee = await this.userRepo.findById(employeeId);
    if (!employee) throw new NotFoundException('Employee not found');

    if (
      ctx.actorRole === UserRole.DEPARTMENT_MANAGER &&
      employee.department_id !== ctx.actorDepartmentId
    ) {
      throw new ForbiddenException('Access denied');
    }

    return employee;
  }
}
