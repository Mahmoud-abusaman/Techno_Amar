import { ServiceEntity, ServiceStatus } from '../entities/service.entity';
import { ServiceWithTasksEntity } from '../entities/service-with-tasks.entity';

export const IServiceRepository = Symbol('IServiceRepository');

export type CreateServiceData = {
  name: string;
  description?: string | null;
  department_id: bigint;
  fee: number;
  estimated_processing_days: number;
  created_by: bigint;
};

export type CreateServiceTaskInput = {
  section_id: bigint;
  name: string;
  description?: string | null;
  task_order: number;
  estimated_time_hours: number;
};

export type CreateServiceWithTasksData = CreateServiceData & {
  workflow_tasks: CreateServiceTaskInput[];
};

export type UpdateServiceData = Partial<
  Omit<CreateServiceData, 'created_by'>
> & {
  is_active?: boolean;
  status?: ServiceStatus;
  published_at?: Date | null;
};

export type ServiceFilters = {
  activeOnly?: boolean;
  status?: ServiceStatus;
  publishedOnly?: boolean;
};

export interface IServiceRepository {
  create(data: CreateServiceData): Promise<ServiceEntity>;
  createWithTasks(
    data: CreateServiceWithTasksData,
  ): Promise<ServiceWithTasksEntity>;
  findAll(filters?: ServiceFilters): Promise<ServiceEntity[]>;
  findById(id: bigint): Promise<ServiceEntity | null>;
  findByIdWithTasks(
    id: bigint,
    options?: { activeTasksOnly?: boolean },
  ): Promise<ServiceWithTasksEntity | null>;
  findByName(name: string): Promise<ServiceEntity | null>;
  update(id: bigint, data: UpdateServiceData): Promise<ServiceEntity>;
  delete(id: bigint): Promise<void>;
  countActiveTasks(serviceId: bigint): Promise<number>;
}
