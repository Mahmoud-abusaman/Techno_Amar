import { ServiceRequestEntity } from '../entities/service-request.entity';
import { ServiceRequestDetailEntity } from '../entities/service-request-detail.entity';
import { RequestActivityEntity } from '../entities/request-activity.entity';
import { RequestDocumentEntity } from '../entities/request-document.entity';
import {
  RequestPaymentStatus,
  RequestStatus,
} from '../entities/service-request.entity';
import { RequestActivityAction } from '../entities/request-activity.entity';

export const IServiceRequestRepository = Symbol('IServiceRequestRepository');

export type CreateRequestTaskData = {
  service_task_id: bigint;
  section_id: bigint;
  name: string;
  task_order: number;
  estimated_time_hours: number;
};

export type CreateRequestActivityData = {
  request_id: bigint;
  task_id?: bigint | null;
  actor_id: bigint;
  action: RequestActivityAction;
  description?: string | null;
};

export type CreateRequestDocumentData = {
  required_document_id?: bigint | null;
  task_id?: bigint | null;
  name: string;
  file_type: string;
  file_url: string;
  file_id: string;
  file_path?: string | null;
  category?: RequestDocumentEntity['category'];
  uploaded_by: bigint;
};

export type CreateServiceRequestData = {
  citizen_id: bigint;
  service_id: bigint;
  payment_status: RequestPaymentStatus;
  tasks: CreateRequestTaskData[];
  documents?: CreateRequestDocumentData[];
  activity: Omit<CreateRequestActivityData, 'request_id'>;
  payment?: {
    serial_number: string;
    provider: string;
    receipt_url: string;
    receipt_file_id: string;
    amount: number;
  };
};

export type UpdateServiceRequestStatusData = {
  status?: RequestStatus;
  current_task_id?: bigint | null;
  completed_at?: Date | null;
  payment_status?: RequestPaymentStatus;
};

export interface IServiceRequestRepository {
  createWithTasks(
    data: CreateServiceRequestData,
  ): Promise<ServiceRequestDetailEntity>;
  findById(id: bigint): Promise<ServiceRequestEntity | null>;
  findByIdWithTasks(id: bigint): Promise<ServiceRequestDetailEntity | null>;
  findByCitizen(citizenId: bigint): Promise<ServiceRequestEntity[]>;
  updateStatus(
    id: bigint,
    data: UpdateServiceRequestStatusData,
  ): Promise<ServiceRequestEntity>;
  countActiveByServiceId(serviceId: bigint): Promise<number>;
  findActivities(requestId: bigint): Promise<RequestActivityEntity[]>;
  addActivity(data: CreateRequestActivityData): Promise<RequestActivityEntity>;
  findDocuments(requestId: bigint): Promise<RequestDocumentEntity[]>;
  addDocument(
    requestId: bigint,
    data: CreateRequestDocumentData,
  ): Promise<RequestDocumentEntity>;
}
