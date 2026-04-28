import { UserRole } from 'generated/prisma/enums';

export interface ActiveUserData {
  sub: string;
  email: string;
  role: UserRole;
}
