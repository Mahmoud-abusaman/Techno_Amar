import { UserRole, GazaCities, AccountStatus } from '@/generated/prisma/enums';

export class UserEntity {
  id: bigint;
  full_name: string;
  email: string;
  password_hash: string;
  national_id: string | null;
  employee_id: string | null;
  phone: string | null;
  address: string | null;
  city: GazaCities;
  is_verified: boolean;
  role: UserRole;
  account_status: AccountStatus;
  department_id: bigint | null;
  section_id: bigint | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
