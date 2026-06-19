export type RequestActivityAction =
  | 'SUBMITTED'
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'TASK_REJECTED'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED';

export class RequestActivityEntity {
  id: bigint;
  request_id: bigint;
  task_id: bigint | null;
  actor_id: bigint;
  action: RequestActivityAction;
  description: string | null;
  created_at: Date;
}
