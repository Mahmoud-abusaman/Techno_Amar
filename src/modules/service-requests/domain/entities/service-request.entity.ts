export type RequestStatus =
  | 'SUBMITTED'
  | 'IN_PROGRESS'
  | 'APPROVED'
  | 'REJECTED';

export type RequestPaymentStatus =
  | 'NOT_REQUIRED'
  | 'PENDING_VERIFICATION'
  | 'PAID'
  | 'FAILED';

export class ServiceRequestEntity {
  id: bigint;
  citizen_id: bigint;
  service_id: bigint;
  status: RequestStatus;
  payment_status: RequestPaymentStatus;
  current_task_id: bigint | null;
  submitted_at: Date;
  completed_at: Date | null;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}
