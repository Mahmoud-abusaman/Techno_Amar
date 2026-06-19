import { ServiceRequestEntity } from '../entities/service-request.entity';
import { ServiceRequestDetailEntity } from '../entities/service-request-detail.entity';
import { RequestActivityEntity } from '../entities/request-activity.entity';
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

export type CreateServiceRequestData = {
  citizen_id: bigint;
  service_id: bigint;
  payment_status: RequestPaymentStatus;
  tasks: CreateRequestTaskData[];
  activity: Omit<CreateRequestActivityData, 'request_id'>;
};

export type UpdateServiceRequestStatusData = {
  status?: RequestStatus;
  current_task_id?: bigint | null;
  completed_at?: Date | null;
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
}
