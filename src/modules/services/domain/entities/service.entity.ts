export type ServiceStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export class ServiceEntity {
  id: bigint;
  name: string;
  description: string | null;
  department_id: bigint;
  fee: number;
  estimated_processing_days: number;
  status: ServiceStatus;
  created_by: bigint;
  published_at: Date | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
