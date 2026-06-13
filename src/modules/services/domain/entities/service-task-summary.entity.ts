export class ServiceTaskSummaryEntity {
  id: bigint;
  service_id: bigint;
  section_id: bigint;
  name: string;
  description: string | null;
  task_order: number;
  estimated_time_hours: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
