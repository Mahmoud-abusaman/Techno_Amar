export class SectionEntity {
  id: bigint;
  department_id: bigint;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
