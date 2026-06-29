import { ServiceRequestDetailEntity } from '@service-requests/domain/entities/service-request-detail.entity';
import { ServiceRequestEntity } from '@service-requests/domain/entities/service-request.entity';
import { RequestTaskEntity } from '@service-requests/domain/entities/request-task.entity';
import { RequestActivityEntity } from '@service-requests/domain/entities/request-activity.entity';
import { RequestDocumentEntity } from '@service-requests/domain/entities/request-document.entity';
import { RequestTaskWithRequestEntity } from '@service-requests/domain/entities/request-task-with-request.entity';

export type PublicServiceRequest = {
  id: string;
  service_id: string;
  service_name?: string;
  status: string;
  payment_status: string;
  submitted_at: Date;
  completed_at: Date | null;
  current_task_id: string | null;
  created_at: Date;
};

export type PublicServiceRequestDetail = PublicServiceRequest & {
  service_name: string;
  tasks: PublicRequestTask[];
  documents: PublicRequestDocument[];
};

export type PublicRequestDocument = {
  id: string;
  request_id: string;
  required_document_id: string | null;
  name: string;
  file_type: string;
  file_url: string;
  file_id: string;
  file_path: string | null;
  category: string;
  uploaded_by: string;
  uploaded_at: Date;
};

export type PublicRequestTask = {
  id: string;
  request_id: string;
  name: string;
  task_order: number;
  status: string;
  section_id: string;
  assigned_employee_id: string | null;
  estimated_time_hours: number;
  assigned_at: Date | null;
  completed_at: Date | null;
  rejection_reason: string | null;
};

export type PublicRequestActivity = {
  id: string;
  request_id: string;
  task_id: string | null;
  actor_id: string;
  action: string;
  description: string | null;
  created_at: Date;
};

export type TaskBoardResponse = {
  backlog: PublicRequestTask[];
  in_progress: PublicRequestTask[];
  completed: PublicRequestTask[];
  failed: PublicRequestTask[];
};

export type PublicRequestTaskDetail = PublicRequestTask & {
  request: PublicServiceRequest & { service_name: string };
  sibling_tasks: PublicRequestTask[];
};

export function toPublicServiceRequest(
  request: ServiceRequestEntity,
  serviceName?: string,
): PublicServiceRequest {
  return {
    id: request.id.toString(),
    service_id: request.service_id.toString(),
    service_name: serviceName,
    status: request.status,
    payment_status: request.payment_status,
    submitted_at: request.submitted_at,
    completed_at: request.completed_at,
    current_task_id: request.current_task_id?.toString() ?? null,
    created_at: request.created_at,
  };
}

export function toPublicRequestTask(
  task: RequestTaskEntity,
): PublicRequestTask {
  return {
    id: task.id.toString(),
    request_id: task.request_id.toString(),
    name: task.name,
    task_order: task.task_order,
    status: task.status,
    section_id: task.section_id.toString(),
    assigned_employee_id: task.assigned_employee_id?.toString() ?? null,
    estimated_time_hours: task.estimated_time_hours,
    assigned_at: task.assigned_at,
    completed_at: task.completed_at,
    rejection_reason: task.rejection_reason,
  };
}

export function toPublicServiceRequestDetail(
  request: ServiceRequestDetailEntity,
): PublicServiceRequestDetail {
  return {
    ...toPublicServiceRequest(request, request.service_name),
    service_name: request.service_name,
    tasks: request.tasks.map(toPublicRequestTask),
    documents: (request.documents ?? []).map(toPublicRequestDocument),
  };
}

export function toPublicRequestDocument(
  document: RequestDocumentEntity,
): PublicRequestDocument {
  return {
    id: document.id.toString(),
    request_id: document.request_id.toString(),
    required_document_id: document.required_document_id?.toString() ?? null,
    name: document.name,
    file_type: document.file_type,
    file_url: document.file_url,
    file_id: document.file_id,
    file_path: document.file_path,
    category: document.category,
    uploaded_by: document.uploaded_by.toString(),
    uploaded_at: document.uploaded_at,
  };
}

export function toPublicRequestActivity(
  activity: RequestActivityEntity,
): PublicRequestActivity {
  return {
    id: activity.id.toString(),
    request_id: activity.request_id.toString(),
    task_id: activity.task_id?.toString() ?? null,
    actor_id: activity.actor_id.toString(),
    action: activity.action,
    description: activity.description,
    created_at: activity.created_at,
  };
}

export function toTaskBoard(tasks: RequestTaskEntity[]): TaskBoardResponse {
  const mapped = tasks.map(toPublicRequestTask);
  return {
    backlog: mapped.filter((t) => t.status === 'BACKLOG'),
    in_progress: mapped.filter((t) => t.status === 'IN_PROGRESS'),
    completed: mapped.filter((t) => t.status === 'COMPLETED'),
    failed: mapped.filter((t) => t.status === 'FAILED'),
  };
}

export function toPublicRequestTaskDetail(
  task: RequestTaskWithRequestEntity,
): PublicRequestTaskDetail {
  return {
    ...toPublicRequestTask(task),
    request: {
      ...toPublicServiceRequest(task.request, task.request.service_name),
      service_name: task.request.service_name,
    },
    sibling_tasks: task.sibling_tasks.map(toPublicRequestTask),
  };
}
