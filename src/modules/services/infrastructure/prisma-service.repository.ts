import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import {
  IServiceRepository,
  CreateServiceData,
  CreateServiceWithTasksData,
  UpdateServiceData,
  ServiceFilters,
} from '@services/domain/repositories/service-repository.interface';
import { ServiceEntity } from '@services/domain/entities/service.entity';
import { ServiceWithTasksEntity } from '@services/domain/entities/service-with-tasks.entity';
import { ServiceStatus } from '@/generated/prisma/enums';

@Injectable()
export class PrismaServiceRepository implements IServiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateServiceData): Promise<ServiceEntity> {
    return this.prisma.service
      .create({ data })
      .then((row) => this.toEntity(row));
  }

  createWithTasks(
    data: CreateServiceWithTasksData,
  ): Promise<ServiceWithTasksEntity> {
    const { workflow_tasks, ...serviceData } = data;

    return this.prisma.$transaction(async (tx) => {
      const service = await tx.service.create({ data: serviceData });

      const tasks = await Promise.all(
        workflow_tasks.map((task) =>
          tx.serviceTask.create({
            data: {
              service_id: service.id,
              section_id: task.section_id,
              name: task.name,
              description: task.description ?? null,
              task_order: task.task_order,
              estimated_time_hours: task.estimated_time_hours,
            },
          }),
        ),
      );

      return this.toServiceWithTasks({ ...service, workflow_tasks: tasks });
    });
  }

  findAll(filters: ServiceFilters = {}): Promise<ServiceEntity[]> {
    const where: Record<string, unknown> = {};

    if (filters.activeOnly) where.is_active = true;
    if (filters.status) where.status = filters.status;
    if (filters.publishedOnly) {
      where.status = ServiceStatus.PUBLISHED;
      where.is_active = true;
    }

    return this.prisma.service
      .findMany({
        where,
        orderBy: { name: 'asc' },
      })
      .then((rows) => rows.map((row) => this.toEntity(row)));
  }

  findById(id: bigint): Promise<ServiceEntity | null> {
    return this.prisma.service
      .findUnique({ where: { id } })
      .then((row) => (row ? this.toEntity(row) : null));
  }

  findByIdWithTasks(
    id: bigint,
    options: { activeTasksOnly?: boolean } = {},
  ): Promise<ServiceWithTasksEntity | null> {
    return this.prisma.service
      .findUnique({
        where: { id },
        include: {
          workflow_tasks: {
            where: options.activeTasksOnly ? { is_active: true } : undefined,
            orderBy: { task_order: 'asc' },
          },
        },
      })
      .then((row) => (row ? this.toServiceWithTasks(row) : null));
  }

  findByName(name: string): Promise<ServiceEntity | null> {
    return this.prisma.service
      .findUnique({ where: { name } })
      .then((row) => (row ? this.toEntity(row) : null));
  }

  update(id: bigint, data: UpdateServiceData): Promise<ServiceEntity> {
    return this.prisma.service
      .update({ where: { id }, data })
      .then((row) => this.toEntity(row));
  }

  async delete(id: bigint): Promise<void> {
    await this.prisma.service.update({
      where: { id },
      data: { is_active: false },
    });
  }

  countActiveTasks(serviceId: bigint): Promise<number> {
    return this.prisma.serviceTask.count({
      where: { service_id: serviceId, is_active: true },
    });
  }

  private toEntity(row: {
    id: bigint;
    name: string;
    description: string | null;
    department_id: bigint;
    fee: { toNumber(): number } | number;
    estimated_processing_days: number;
    status: ServiceStatus;
    created_by: bigint;
    published_at: Date | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  }): ServiceEntity {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      department_id: row.department_id,
      fee: typeof row.fee === 'number' ? row.fee : row.fee.toNumber(),
      estimated_processing_days: row.estimated_processing_days,
      status: row.status as ServiceEntity['status'],
      created_by: row.created_by,
      published_at: row.published_at,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private toServiceWithTasks(row: {
    id: bigint;
    name: string;
    description: string | null;
    department_id: bigint;
    fee: { toNumber(): number } | number;
    estimated_processing_days: number;
    status: ServiceStatus;
    created_by: bigint;
    published_at: Date | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    workflow_tasks: Array<{
      id: bigint;
      service_id: bigint;
      section_id: bigint;
      name: string;
      description: string | null;
      task_order: number;
      estimated_time_hours: number;
      is_active: boolean;
      created_at: Date;
      updated_at: Date;
    }>;
  }): ServiceWithTasksEntity {
    return {
      ...this.toEntity(row),
      workflow_tasks: row.workflow_tasks,
    };
  }
}
