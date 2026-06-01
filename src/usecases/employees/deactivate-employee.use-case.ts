import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { UserEntity } from '@domain/entities/user.entity';
import { UserRole } from '@/generated/prisma/enums';

export interface DeactivateEmployeeContext {
  actorRole: UserRole;
  actorDepartmentId: bigint | null;
}

@Injectable()
export class DeactivateEmployeeUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
  ) {}

  async execute(employeeId: bigint, ctx: DeactivateEmployeeContext): Promise<UserEntity> {
    const employee = await this.userRepo.findById(employeeId);
    if (!employee) throw new NotFoundException('Employee not found');

    if (ctx.actorRole === UserRole.DEPARTMENT_MANAGER) {
      if (employee.department_id !== ctx.actorDepartmentId) {
        throw new ForbiddenException('You can only deactivate employees in your own department');
      }
    }

    if (!employee.is_active) {
      throw new BadRequestException('Employee account is already inactive');
    }

    return this.userRepo.update(employeeId, { is_active: false });
  }
}
