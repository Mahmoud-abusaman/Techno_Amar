import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import {
  IUserRepository,
  CreateUserData,
  UpdateUserData,
  FindUsersFilter,
  UpdateCitizenProfileData,
  UserWithProfile,
} from '@users/domain/repositories/user-repository.interface';
import { UserEntity } from '@users/domain/entities/user.entity';
import { CitizenProfileEntity } from '@users/domain/entities/citizen-profile.entity';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateUserData): Promise<UserEntity> {
    return this.prisma.user.create({ data }) as Promise<UserEntity>;
  }

  createCitizenProfile(userId: bigint): Promise<CitizenProfileEntity> {
    return this.prisma.citizenProfile.create({
      data: { user_id: userId },
    }) as Promise<CitizenProfileEntity>;
  }

  findAll(filter?: FindUsersFilter): Promise<UserEntity[]> {
    const where: Record<string, unknown> = {};
    if (filter?.role) where.role = filter.role;
    if (filter?.section_id) where.section_id = filter.section_id;
    if (filter?.is_active !== undefined) where.is_active = filter.is_active;
    if (filter?.account_status) where.account_status = filter.account_status;
    if (filter?.department_id) {
      where.section = { department_id: filter.department_id };
    }
    return this.prisma.user.findMany({ where }) as Promise<UserEntity[]>;
  }

  findById(id: bigint): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { id } }) as Promise<UserEntity | null>;
  }

  findByIdWithProfile(id: bigint): Promise<UserWithProfile | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { citizen_profile: true },
    }) as Promise<UserWithProfile | null>;
  }

  updateCitizenProfile(
    userId: bigint,
    data: UpdateCitizenProfileData,
  ): Promise<CitizenProfileEntity> {
    return this.prisma.citizenProfile.update({
      where: { user_id: userId },
      data,
    }) as Promise<CitizenProfileEntity>;
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
