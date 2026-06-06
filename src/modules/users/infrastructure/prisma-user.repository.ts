import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import {
  IUserRepository,
  CreateUserData,
  UpdateUserData,
  FindUsersFilter,
} from '@users/domain/repositories/user-repository.interface';
import { UserEntity } from '@users/domain/entities/user.entity';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateUserData): Promise<UserEntity> {
    return this.prisma.user.create({ data }) as Promise<UserEntity>;
  }

  findAll(filter?: FindUsersFilter): Promise<UserEntity[]> {
    const where: Record<string, unknown> = {};
    if (filter?.role) where.role = filter.role;
    if (filter?.section_id) where.section_id = filter.section_id;
    if (filter?.is_active !== undefined) where.is_active = filter.is_active;
    if (filter?.department_id) {
      where.section = { department_id: filter.department_id };
    }
    return this.prisma.user.findMany({ where }) as Promise<UserEntity[]>;
  }

  findById(id: bigint): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { id } }) as Promise<UserEntity | null>;
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.prisma.user.findFirst({ where: { email } }) as Promise<UserEntity | null>;
  }

  findByPhone(phone: string): Promise<UserEntity | null> {
    return this.prisma.user.findFirst({ where: { phone } }) as Promise<UserEntity | null>;
  }

  findByNationalId(nationalId: string): Promise<UserEntity | null> {
    return this.prisma.user.findFirst({
      where: { national_id: nationalId },
    }) as Promise<UserEntity | null>;
  }

  findByEmployeeId(employeeId: string): Promise<UserEntity | null> {
    return this.prisma.user.findFirst({
      where: { employee_id: employeeId },
    }) as Promise<UserEntity | null>;
  }

  update(id: bigint, data: UpdateUserData): Promise<UserEntity> {
    return this.prisma.user.update({ where: { id }, data }) as Promise<UserEntity>;
  }

  delete(id: bigint): Promise<UserEntity> {
    return this.prisma.user.delete({ where: { id } }) as Promise<UserEntity>;
  }
}
