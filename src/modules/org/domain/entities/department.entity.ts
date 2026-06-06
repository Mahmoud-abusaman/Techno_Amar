export class DepartmentEntity {
  id: bigint;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
