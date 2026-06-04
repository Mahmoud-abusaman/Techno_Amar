import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { ISectionRepository } from '@domain/repositories/section-repository.interface';
import { IHashPort } from '@domain/ports/hash.port';
import { UserEntity } from '@domain/entities/user.entity';
import { UserRole, GazaCities, AccountStatus } from '@/generated/prisma/enums';

export interface CreateEmployeeDto {
  full_name: string;
  email: string;
  password: string;
  employee_id: string;
  phone?: string;
  address?: string;
  city: GazaCities;
  role: 'EMPLOYEE' | 'DEPARTMENT_MANAGER';
  section_id: bigint;
}

export interface CreateEmployeeContext {
  actorRole: UserRole;
  actorDepartmentId: bigint | null;
}

@Injectable()
export class CreateEmployeeUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(ISectionRepository) private readonly sectionRepo: ISectionRepository,
    @Inject(IHashPort) private readonly hashPort: IHashPort,
  ) {}

  async execute(dto: CreateEmployeeDto, ctx: CreateEmployeeContext): Promise<UserEntity> {
    const section = await this.sectionRepo.findById(dto.section_id);
    if (!section) throw new NotFoundException('Section not found');
    if (!section.is_active) throw new BadRequestException('Section is not active');

    if (
      ctx.actorRole === UserRole.DEPARTMENT_MANAGER &&
      ctx.actorDepartmentId !== section.department_id
    ) {
      throw new ForbiddenException('You can only add employees to your own department');
    }

    const password_hash = await this.hashPort.hash(dto.password);
    const { password, ...rest } = dto;

    try {
      return await this.userRepo.create({
        ...rest,
        password_hash,
        department_id: section.department_id,
        account_status: AccountStatus.ACTIVE,
        is_verified: true,
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        const field = err?.meta?.target?.[0] ?? 'identifier';
        throw new ConflictException(`A user with this ${field} already exists`);
      }
      throw err;
    }
  }
}
