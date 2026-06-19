export type RequestTaskStatus =
  | 'BACKLOG'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED';

export class RequestTaskEntity {
  id: bigint;
  request_id: bigint;
  service_task_id: bigint;
  section_id: bigint;
  name: string;
  task_order: number;
  estimated_time_hours: number;
  assigned_employee_id: bigint | null;
  status: RequestTaskStatus;
  assigned_at: Date | null;
  completed_at: Date | null;
  rejection_reason: string | null;
  created_at: Date;
  updated_at: Date;
}
