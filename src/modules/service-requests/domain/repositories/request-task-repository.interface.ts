import { RequestTaskEntity } from '../entities/request-task.entity';
import { RequestTaskWithRequestEntity } from '../entities/request-task-with-request.entity';
import { RequestTaskStatus } from '../entities/request-task.entity';

export const IRequestTaskRepository = Symbol('IRequestTaskRepository');

export type UpdateRequestTaskData = {
  status?: RequestTaskStatus;
  assigned_employee_id?: bigint | null;
  assigned_at?: Date | null;
  completed_at?: Date | null;
  rejection_reason?: string | null;
};

export interface IRequestTaskRepository {
  findById(id: bigint): Promise<RequestTaskEntity | null>;
  findByIdWithRequest(id: bigint): Promise<RequestTaskWithRequestEntity | null>;
  findBySection(sectionId: bigint): Promise<RequestTaskEntity[]>;
  update(id: bigint, data: UpdateRequestTaskData): Promise<RequestTaskEntity>;
  findNextTask(
    requestId: bigint,
    afterOrder: number,
  ): Promise<RequestTaskEntity | null>;
}
