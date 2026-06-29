import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { RequestStatus } from '@/generated/prisma/enums';
import {
  IServiceRequestRepository,
  CreateServiceRequestData,
  UpdateServiceRequestStatusData,
  CreateRequestActivityData,
} from '@service-requests/domain/repositories/service-request-repository.interface';
import { ServiceRequestEntity } from '@service-requests/domain/entities/service-request.entity';
import { ServiceRequestDetailEntity } from '@service-requests/domain/entities/service-request-detail.entity';
import { RequestActivityEntity } from '@service-requests/domain/entities/request-activity.entity';
import { RequestTaskEntity } from '@service-requests/domain/entities/request-task.entity';
import { RequestDocumentEntity } from '@service-requests/domain/entities/request-document.entity';
import { RequestDocumentCategory } from '@/generated/prisma/enums';

@Injectable()
export class PrismaServiceRequestRepository implements IServiceRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWithTasks(
    data: CreateServiceRequestData,
  ): Promise<ServiceRequestDetailEntity> {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.serviceRequest.create({
        data: {
          citizen_id: data.citizen_id,
          service_id: data.service_id,
          payment_status: data.payment_status,
          status: RequestStatus.SUBMITTED,
        },
      });

      const tasks = await Promise.all(
        data.tasks.map((task) =>
          tx.requestTask.create({
            data: {
              request_id: request.id,
              service_task_id: task.service_task_id,
              section_id: task.section_id,
              name: task.name,
              task_order: task.task_order,
              estimated_time_hours: task.estimated_time_hours,
            },
          }),
        ),
      );

      const firstTask = tasks.find((t) => t.task_order === 1) ?? tasks[0];

      const updatedRequest = await tx.serviceRequest.update({
        where: { id: request.id },
        data: { current_task_id: firstTask.id },
        include: { service: { select: { name: true } } },
      });

      await tx.requestActivity.create({
        data: {
          request_id: request.id,
          actor_id: data.activity.actor_id,
          action: data.activity.action,
          description: data.activity.description ?? null,
        },
      });

      if (data.payment) {
        await tx.payment.create({
          data: {
            service_request_id: request.id,
            payer_id: data.citizen_id,
            amount: data.payment.amount,
            serial_number: data.payment.serial_number,
            provider: data.payment.provider,
            receipt_url: data.payment.receipt_url,
            receipt_file_id: data.payment.receipt_file_id,
            status: 'PENDING_VERIFICATION',
          },
        });
      }

      const documents = data.documents?.length
        ? await Promise.all(
            data.documents.map((doc) =>
              tx.requestDocument.create({
                data: {
                  request_id: request.id,
                  required_document_id: doc.required_document_id,
                  name: doc.name,
                  file_type: doc.file_type,
                  file_url: doc.file_url,
                  file_id: doc.file_id,
                  file_path: doc.file_path ?? null,
                  category: RequestDocumentCategory.CITIZEN_UPLOADED,
                  uploaded_by: doc.uploaded_by,
                },
              }),
            ),
          )
        : [];

      return this.toDetail({
        ...updatedRequest,
        tasks,
        documents,
        service_name: updatedRequest.service.name,
      });
    });
  }

  findById(id: bigint): Promise<ServiceRequestEntity | null> {
    return this.prisma.serviceRequest
      .findFirst({
        where: { id, is_deleted: false },
      })
      .then((row) => (row ? this.toEntity(row) : null));
  }

  findByIdWithTasks(id: bigint): Promise<ServiceRequestDetailEntity | null> {
    return this.prisma.serviceRequest
      .findFirst({
        where: { id, is_deleted: false },
        include: {
          service: { select: { name: true } },
          tasks: { orderBy: { task_order: 'asc' } },
          documents: { orderBy: { created_at: 'asc' } },
        },
      })
      .then((row) =>
        row
          ? this.toDetail({
              ...row,
              service_name: row.service.name,
              documents: row.documents,
            })
          : null,
      );
  }

  findByCitizen(citizenId: bigint): Promise<ServiceRequestEntity[]> {
    return this.prisma.serviceRequest
      .findMany({
        where: { citizen_id: citizenId, is_deleted: false },
        orderBy: { submitted_at: 'desc' },
      })
      .then((rows) => rows.map((row) => this.toEntity(row)));
  }

  updateStatus(
    id: bigint,
    data: UpdateServiceRequestStatusData,
  ): Promise<ServiceRequestEntity> {
    return this.prisma.serviceRequest
      .update({ where: { id }, data })
      .then((row) => this.toEntity(row));
  }

  countActiveByServiceId(serviceId: bigint): Promise<number> {
    return this.prisma.serviceRequest.count({
      where: {
        service_id: serviceId,
        is_deleted: false,
        status: { notIn: [RequestStatus.APPROVED, RequestStatus.REJECTED] },
      },
    });
  }

  findActivities(requestId: bigint): Promise<RequestActivityEntity[]> {
    return this.prisma.requestActivity
      .findMany({
        where: { request_id: requestId },
        orderBy: { created_at: 'asc' },
      })
      .then((rows) => rows.map((row) => this.toActivity(row)));
  }

  addActivity(data: CreateRequestActivityData): Promise<RequestActivityEntity> {
    return this.prisma.requestActivity
      .create({ data })
      .then((row) => this.toActivity(row));
  }

  private toEntity(row: {
    id: bigint;
    citizen_id: bigint;
    service_id: bigint;
    status: string;
    payment_status: string;
    current_task_id: bigint | null;
    submitted_at: Date;
    completed_at: Date | null;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
  }): ServiceRequestEntity {
    return {
      id: row.id,
      citizen_id: row.citizen_id,
      service_id: row.service_id,
      status: row.status as ServiceRequestEntity['status'],
      payment_status:
        row.payment_status as ServiceRequestEntity['payment_status'],
      current_task_id: row.current_task_id,
      submitted_at: row.submitted_at,
      completed_at: row.completed_at,
      is_deleted: row.is_deleted,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  findDocuments(requestId: bigint): Promise<RequestDocumentEntity[]> {
    return this.prisma.requestDocument
      .findMany({
        where: { request_id: requestId },
        orderBy: { created_at: 'asc' },
      })
      .then((rows) => rows.map((row) => this.toDocument(row)));
  }

  private toTask(row: {
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

  private toDocument(row: {
    id: bigint;
    request_id: bigint;
    required_document_id: bigint | null;
    task_id: bigint | null;
    name: string;
    file_type: string;
    file_url: string;
    file_id: string;
    file_path: string | null;
    category: string;
    uploaded_by: bigint;
    uploaded_at: Date;
    created_at: Date;
  }): RequestDocumentEntity {
    return {
      id: row.id,
      request_id: row.request_id,
      required_document_id: row.required_document_id,
      task_id: row.task_id,
      name: row.name,
      file_type: row.file_type,
      file_url: row.file_url,
      file_id: row.file_id,
      file_path: row.file_path,
      category: row.category as RequestDocumentEntity['category'],
      uploaded_by: row.uploaded_by,
      uploaded_at: row.uploaded_at,
      created_at: row.created_at,
    };
  }

  private toActivity(row: {
    id: bigint;
    request_id: bigint;
    task_id: bigint | null;
    actor_id: bigint;
    action: string;
    description: string | null;
    created_at: Date;
  }): RequestActivityEntity {
    return {
      id: row.id,
      request_id: row.request_id,
      task_id: row.task_id,
      actor_id: row.actor_id,
      action: row.action as RequestActivityEntity['action'],
      description: row.description,
      created_at: row.created_at,
    };
  }

  private toDetail(row: {
    id: bigint;
    citizen_id: bigint;
    service_id: bigint;
    status: string;
    payment_status: string;
    current_task_id: bigint | null;
    submitted_at: Date;
    completed_at: Date | null;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
    service_name: string;
    tasks: Array<{
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
    }>;
    documents?: Array<{
      id: bigint;
      request_id: bigint;
      required_document_id: bigint | null;
      task_id: bigint | null;
      name: string;
      file_type: string;
      file_url: string;
      file_id: string;
      file_path: string | null;
      category: string;
      uploaded_by: bigint;
      uploaded_at: Date;
      created_at: Date;
    }>;
  }): ServiceRequestDetailEntity {
    return {
      ...this.toEntity(row),
      service_name: row.service_name,
      tasks: row.tasks.map((task) => this.toTask(task)),
      documents: row.documents?.map((doc) => this.toDocument(doc)) ?? [],
    };
  }
}
