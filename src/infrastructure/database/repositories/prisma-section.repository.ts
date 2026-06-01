import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  ISectionRepository,
  CreateSectionData,
  UpdateSectionData,
} from '@domain/repositories/section-repository.interface';
import { SectionEntity } from '@domain/entities/section.entity';

@Injectable()
export class PrismaSectionRepository implements ISectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateSectionData): Promise<SectionEntity> {
    return this.prisma.section.create({ data }) as Promise<SectionEntity>;
  }

  findAll(departmentId?: bigint, activeOnly = false): Promise<SectionEntity[]> {
    return this.prisma.section.findMany({
      where: {
        ...(departmentId ? { department_id: departmentId } : {}),
        ...(activeOnly ? { is_active: true } : {}),
      },
      orderBy: { name: 'asc' },
    }) as Promise<SectionEntity[]>;
  }

  findById(id: bigint): Promise<SectionEntity | null> {
    return this.prisma.section.findUnique({ where: { id } }) as Promise<SectionEntity | null>;
  }

  findByNameInDepartment(name: string, departmentId: bigint): Promise<SectionEntity | null> {
    return this.prisma.section.findUnique({
      where: { department_id_name: { department_id: departmentId, name } },
    }) as Promise<SectionEntity | null>;
  }

  update(id: bigint, data: UpdateSectionData): Promise<SectionEntity> {
    return this.prisma.section.update({ where: { id }, data }) as Promise<SectionEntity>;
  }

  async delete(id: bigint): Promise<void> {
    await this.prisma.section.delete({ where: { id } });
  }

  async hasDependents(id: bigint): Promise<boolean> {
    const userCount = await this.prisma.user.count({ where: { section_id: id } });
    return userCount > 0;
  }
}
