import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import {
  IRequestTaskRepository,
  UpdateRequestTaskData,
} from '@service-requests/domain/repositories/request-task-repository.interface';
import { RequestTaskEntity } from '@service-requests/domain/entities/request-task.entity';
import { RequestTaskWithRequestEntity } from '@service-requests/domain/entities/request-task-with-request.entity';
import { RequestStatus } from '@/generated/prisma/enums';

@Injectable()
export class PrismaRequestTaskRepository implements IRequestTaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: bigint): Promise<RequestTaskEntity | null> {
    return this.prisma.requestTask
      .findUnique({ where: { id } })
      .then((row) => (row ? this.toEntity(row) : null));
  }

  findByIdWithRequest(
    id: bigint,
  ): Promise<RequestTaskWithRequestEntity | null> {
    return this.prisma.requestTask
      .findUnique({
        where: { id },
        include: {
          request: {
            include: {
              service: { select: { name: true } },
              tasks: { orderBy: { task_order: 'asc' } },
            },
          },
        },
      })
      .then((row) => {
        if (!row || row.request.is_deleted) return null;

        return {
          ...this.toEntity(row),
          request: {
            id: row.request.id,
            citizen_id: row.request.citizen_id,
            service_id: row.request.service_id,
            status: row.request
              .status as RequestTaskWithRequestEntity['request']['status'],
            payment_status: row.request
              .payment_status as RequestTaskWithRequestEntity['request']['payment_status'],
            current_task_id: row.request.current_task_id,
            submitted_at: row.request.submitted_at,
            completed_at: row.request.completed_at,
            is_deleted: row.request.is_deleted,
            created_at: row.request.created_at,
            updated_at: row.request.updated_at,
            service_name: row.request.service.name,
          },
          sibling_tasks: row.request.tasks.map((task) => this.toEntity(task)),
        };
      });
  }

  findBySection(sectionId: bigint): Promise<RequestTaskEntity[]> {
    return this.prisma.requestTask
      .findMany({
        where: {
          section_id: sectionId,
          request: {
            is_deleted: false,
            status: {
              notIn: [RequestStatus.APPROVED, RequestStatus.REJECTED],
            },
          },
        },
        orderBy: [{ task_order: 'asc' }, { created_at: 'asc' }],
      })
      .then((rows) => rows.map((row) => this.toEntity(row)));
  }

  update(id: bigint, data: UpdateRequestTaskData): Promise<RequestTaskEntity> {
    return this.prisma.requestTask
      .update({ where: { id }, data })
      .then((row) => this.toEntity(row));
  }

  findNextTask(
    requestId: bigint,
    afterOrder: number,
  ): Promise<RequestTaskEntity | null> {
    return this.prisma.requestTask
      .findFirst({
        where: {
          request_id: requestId,
          task_order: { gt: afterOrder },
        },
        orderBy: { task_order: 'asc' },
      })
      .then((row) => (row ? this.toEntity(row) : null));
  }

  private toEntity(row: {
    id: bigint;
    request_id: bigint;
    service_task_id: bigint;
    section_id: bigint;
    name: string;
    task_order: number;
    estimated_time_hours: number;
    assigned_employee_id: bigint | null;
    status: string;
    assigned_at: Date | null;
    completed_at: Date | null;
    rejection_reason: string | null;
    created_at: Date;
    updated_at: Date;
  }): RequestTaskEntity {
    return {
      id: row.id,
      request_id: row.request_id,
      service_task_id: row.service_task_id,
      section_id: row.section_id,
      name: row.name,
      task_order: row.task_order,
      estimated_time_hours: row.estimated_time_hours,
      assigned_employee_id: row.assigned_employee_id,
      status: row.status as RequestTaskEntity['status'],
      assigned_at: row.assigned_at,
      completed_at: row.completed_at,
      rejection_reason: row.rejection_reason,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
