import { ServiceTaskEntity } from '../entities/service-task.entity';

export const IServiceTaskRepository = Symbol('IServiceTaskRepository');

export type CreateServiceTaskData = {
  service_id: bigint;
  section_id: bigint;
  name: string;
  description?: string | null;
  task_order: number;
  estimated_time_hours: number;
};

export type UpdateServiceTaskData = Partial<
  Omit<CreateServiceTaskData, 'service_id'>
> & {
  is_active?: boolean;
};

export interface IServiceTaskRepository {
  create(data: CreateServiceTaskData): Promise<ServiceTaskEntity>;
  findByServiceId(
    serviceId: bigint,
    activeOnly?: boolean,
  ): Promise<ServiceTaskEntity[]>;
  findById(id: bigint): Promise<ServiceTaskEntity | null>;
  findByIdAndServiceId(
    id: bigint,
    serviceId: bigint,
  ): Promise<ServiceTaskEntity | null>;
  update(id: bigint, data: UpdateServiceTaskData): Promise<ServiceTaskEntity>;
  delete(id: bigint): Promise<void>;
  countActiveByServiceId(serviceId: bigint): Promise<number>;
  getMaxOrder(serviceId: bigint): Promise<number>;
  incrementOrdersFrom(
    serviceId: bigint,
    fromOrder: number,
  ): Promise<void>;
  reorderTask(
    serviceId: bigint,
    taskId: bigint,
    oldOrder: number,
    newOrder: number,
  ): Promise<void>;
}
