import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { ISectionRepository } from '@domain/repositories/section-repository.interface';
import { UserEntity } from '@domain/entities/user.entity';
import { UserRole } from '@/generated/prisma/enums';

export interface UpdateEmployeeDto {
  full_name?: string;
  phone?: string;
  address?: string;
  section_id?: bigint;
  role?: 'EMPLOYEE' | 'DEPARTMENT_MANAGER';
}

export interface UpdateEmployeeContext {
  actorRole: UserRole;
  actorDepartmentId: bigint | null;
}

@Injectable()
export class UpdateEmployeeUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(ISectionRepository) private readonly sectionRepo: ISectionRepository,
  ) {}

  async execute(employeeId: bigint, dto: UpdateEmployeeDto, ctx: UpdateEmployeeContext): Promise<UserEntity> {
    const employee = await this.userRepo.findById(employeeId);
    if (!employee) throw new NotFoundException('Employee not found');

    if (ctx.actorRole === UserRole.DEPARTMENT_MANAGER) {
      if (employee.department_id !== ctx.actorDepartmentId) {
        throw new ForbiddenException('You can only update employees in your own department');
      }
      if (dto.role) {
        throw new ForbiddenException('Managers cannot change employee roles');
      }
    }

    let department_id = employee.department_id;
    if (dto.section_id) {
      const section = await this.sectionRepo.findById(dto.section_id);
      if (!section) throw new NotFoundException('Section not found');
      if (!section.is_active) throw new BadRequestException('Section is not active');

      if (ctx.actorRole === UserRole.DEPARTMENT_MANAGER && section.department_id !== ctx.actorDepartmentId) {
        throw new ForbiddenException('You can only assign employees to sections in your own department');
      }

      department_id = section.department_id;
    }

    return this.userRepo.update(employeeId, {
      full_name: dto.full_name,
      phone: dto.phone,
      address: dto.address,
      section_id: dto.section_id,
      department_id,
      role: dto.role,
    });
  }
}
