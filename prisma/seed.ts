import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import {
  GazaCities,
  PrismaClient,
  UserRole,
} from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/techno_amar',
});
const prisma = new PrismaClient({ adapter });
const SALT_ROUNDS = 10;

const users: Array<{
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  city: GazaCities;
  national_id?: string;
  employee_id?: string;
  phone?: string;
  is_verified: boolean;
}> = [
  {
    full_name: 'System Admin',
    email: 'admin@technoamar.ps',
    password: 'Admin@1234',
    role: UserRole.ADMIN,
    city: GazaCities.GAZA,
    employee_id: 'EMP-ADMIN-001',
    phone: '+970599000001',
    is_verified: true,
  },
  {
    full_name: 'Ahmed Al-Citizen',
    email: 'citizen@technoamar.ps',
    password: 'Citizen@1234',
    role: UserRole.CITIZEN,
    city: GazaCities.KHAN,
    national_id: '123456789',
    phone: '+970599000002',
    is_verified: true,
  },
  {
    full_name: 'Sara Al-Employee',
    email: 'employee@technoamar.ps',
    password: 'Employee@1234',
    role: UserRole.EMPLOYEE,
    city: GazaCities.MIDDLE,
    employee_id: 'EMP-001',
    phone: '+970599000003',
    is_verified: true,
  },
  {
    full_name: 'Omar Al-Manager',
    email: 'manager@technoamar.ps',
    password: 'Manager@1234',
    role: UserRole.DEPARTMENT_MANAGER,
    city: GazaCities.NORTH,
    employee_id: 'EMP-MGR-001',
    phone: '+970599000004',
    is_verified: true,
  },
];

async function main() {
  console.log('Seeding database...');

  for (const { password, ...data } of users) {
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const orClauses: any[] = [{ email: data.email }];
    if (data.national_id) orClauses.push({ national_id: data.national_id });
    if (data.employee_id) orClauses.push({ employee_id: data.employee_id });

    const exists = await prisma.user.findFirst({ where: { OR: orClauses } });
    if (!exists) {
      await prisma.user.create({ data: { ...data, password_hash } });
    } else {
      await prisma.user.update({ where: { id: exists.id }, data: { ...data, password_hash } });
    }

    console.log(
      `  ✓ ${data.role.padEnd(20)} ${data.email}  /  password: ${password}`,
    );
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
