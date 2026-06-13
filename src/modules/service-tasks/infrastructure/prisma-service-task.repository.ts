import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import {
  IServiceTaskRepository,
  CreateServiceTaskData,
  UpdateServiceTaskData,
} from '@service-tasks/domain/repositories/service-task-repository.interface';
import { ServiceTaskEntity } from '@service-tasks/domain/entities/service-task.entity';

@Injectable()
export class PrismaServiceTaskRepository implements IServiceTaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateServiceTaskData): Promise<ServiceTaskEntity> {
    return this.prisma.serviceTask.create({
      data,
    }) as Promise<ServiceTaskEntity>;
  }

  findByServiceId(
    serviceId: bigint,
    activeOnly = false,
  ): Promise<ServiceTaskEntity[]> {
    return this.prisma.serviceTask.findMany({
      where: {
        service_id: serviceId,
        ...(activeOnly ? { is_active: true } : {}),
      },
      orderBy: { task_order: 'asc' },
    }) as Promise<ServiceTaskEntity[]>;
  }

  findById(id: bigint): Promise<ServiceTaskEntity | null> {
    return this.prisma.serviceTask.findUnique({
      where: { id },
    }) as Promise<ServiceTaskEntity | null>;
  }

  findByIdAndServiceId(
    id: bigint,
    serviceId: bigint,
  ): Promise<ServiceTaskEntity | null> {
    return this.prisma.serviceTask.findFirst({
      where: { id, service_id: serviceId },
    }) as Promise<ServiceTaskEntity | null>;
  }

  update(
    id: bigint,
    data: UpdateServiceTaskData,
  ): Promise<ServiceTaskEntity> {
    return this.prisma.serviceTask.update({
      where: { id },
      data,
    }) as Promise<ServiceTaskEntity>;
  }

  async delete(id: bigint): Promise<void> {
    await this.prisma.serviceTask.update({
      where: { id },
      data: { is_active: false },
    });
  }

  countActiveByServiceId(serviceId: bigint): Promise<number> {
    return this.prisma.serviceTask.count({
      where: { service_id: serviceId, is_active: true },
    });
  }

  async getMaxOrder(serviceId: bigint): Promise<number> {
    const result = await this.prisma.serviceTask.aggregate({
      where: { service_id: serviceId },
      _max: { task_order: true },
    });
    return result._max.task_order ?? 0;
  }

  async incrementOrdersFrom(
    serviceId: bigint,
    fromOrder: number,
  ): Promise<void> {
    await this.prisma.serviceTask.updateMany({
      where: {
        service_id: serviceId,
        task_order: { gte: fromOrder },
      },
      data: { task_order: { increment: 1 } },
    });
  }

  async reorderTask(
    serviceId: bigint,
    taskId: bigint,
    oldOrder: number,
    newOrder: number,
  ): Promise<void> {
    if (oldOrder === newOrder) return;

    await this.prisma.$transaction(async (tx) => {
      if (newOrder < oldOrder) {
        await tx.serviceTask.updateMany({
          where: {
            service_id: serviceId,
            task_order: { gte: newOrder, lt: oldOrder },
            id: { not: taskId },
          },
          data: { task_order: { increment: 1 } },
        });
      } else {
        await tx.serviceTask.updateMany({
          where: {
            service_id: serviceId,
            task_order: { gt: oldOrder, lte: newOrder },
            id: { not: taskId },
          },
          data: { task_order: { decrement: 1 } },
        });
      }

      await tx.serviceTask.update({
        where: { id: taskId },
        data: { task_order: newOrder },
      });
    });
  }
}
