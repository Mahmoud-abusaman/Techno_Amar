import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import {
  IDepartmentRepository,
  CreateDepartmentData,
  UpdateDepartmentData,
} from '@org/domain/repositories/department-repository.interface';
import { DepartmentEntity } from '@org/domain/entities/department.entity';

@Injectable()
export class PrismaDepartmentRepository implements IDepartmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateDepartmentData): Promise<DepartmentEntity> {
    return this.prisma.department.create({ data }) as Promise<DepartmentEntity>;
  }

  findAll(activeOnly = false): Promise<DepartmentEntity[]> {
    return this.prisma.department.findMany({
      where: activeOnly ? { is_active: true } : undefined,
      orderBy: { name: 'asc' },
    }) as Promise<DepartmentEntity[]>;
  }

  findById(id: bigint): Promise<DepartmentEntity | null> {
    return this.prisma.department.findUnique({
      where: { id },
    }) as Promise<DepartmentEntity | null>;
  }

  findByName(name: string): Promise<DepartmentEntity | null> {
    return this.prisma.department.findUnique({
      where: { name },
    }) as Promise<DepartmentEntity | null>;
  }

  update(id: bigint, data: UpdateDepartmentData): Promise<DepartmentEntity> {
    return this.prisma.department.update({
      where: { id },
      data,
    }) as Promise<DepartmentEntity>;
  }

  async delete(id: bigint): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.section.updateMany({
        where: { department_id: id },
        data: { is_active: false },
      }),
      this.prisma.department.update({
        where: { id },
        data: { is_active: false },
      }),
    ]);
  }
}
