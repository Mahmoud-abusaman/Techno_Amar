import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import {
  GazaCities,
  PrismaClient,
  UserRole,
  AccountStatus,
  ServiceStatus,
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

async function upsertUser(
  data: (typeof users)[number],
  password_hash: string,
  section_id?: bigint,
) {
  const { password: _password, ...userData } = data;
  const orClauses: Array<Record<string, string>> = [{ email: userData.email }];
  if (userData.national_id) orClauses.push({ national_id: userData.national_id });
  if (userData.employee_id) orClauses.push({ employee_id: userData.employee_id });

  const exists = await prisma.user.findFirst({ where: { OR: orClauses } });
  const payload = {
    ...userData,
    password_hash,
    account_status: AccountStatus.ACTIVE,
    section_id: section_id ?? null,
  };

  const user = exists
    ? await prisma.user.update({ where: { id: exists.id }, data: payload })
    : await prisma.user.create({ data: payload });

  if (user.role === UserRole.CITIZEN) {
    await prisma.citizenProfile.upsert({
      where: { user_id: user.id },
      create: { user_id: user.id, verified_at: new Date() },
      update: { verified_at: new Date(), rejection_reason: null },
    });
  }

  return user;
}

async function seedPublishedService(adminId: bigint) {
  const department = await prisma.department.upsert({
    where: { name: 'Municipal Services' },
    create: {
      name: 'Municipal Services',
      description: 'General municipal service department',
    },
    update: { is_active: true },
  });

  const section = await prisma.section.upsert({
    where: {
      department_id_name: {
        department_id: department.id,
        name: 'Permits Desk',
      },
    },
    create: {
      department_id: department.id,
      name: 'Permits Desk',
      description: 'Building permits and licensing',
    },
    update: { is_active: true },
  });

  const targetSectionId = section.id;

  const existingService = await prisma.service.findUnique({
    where: { name: 'Building Permit' },
    include: { workflow_tasks: true },
  });

  if (!existingService) {
    await prisma.service.create({
      data: {
        name: 'Building Permit',
        description: 'Apply for a residential building permit',
        department_id: department.id,
        fee: 0,
        estimated_processing_days: 14,
        status: ServiceStatus.PUBLISHED,
        created_by: adminId,
        published_at: new Date(),
        workflow_tasks: {
          create: [
            {
              section_id: targetSectionId,
              name: 'Initial Review',
              description: 'Verify application completeness',
              task_order: 1,
              estimated_time_hours: 4,
            },
            {
              section_id: targetSectionId,
              name: 'Final Approval',
              description: 'Issue permit decision',
              task_order: 2,
              estimated_time_hours: 2,
            },
          ],
        },
      },
    });
    return section;
  }

  if (existingService.workflow_tasks.length === 0) {
    await prisma.serviceTask.createMany({
      data: [
        {
          service_id: existingService.id,
          section_id: targetSectionId,
          name: 'Initial Review',
          description: 'Verify application completeness',
          task_order: 1,
          estimated_time_hours: 4,
        },
        {
          service_id: existingService.id,
          section_id: targetSectionId,
          name: 'Final Approval',
          description: 'Issue permit decision',
          task_order: 2,
          estimated_time_hours: 2,
        },
      ],
    });
  }

  await prisma.service.update({
    where: { id: existingService.id },
    data: {
      status: ServiceStatus.PUBLISHED,
      fee: 0,
      published_at: new Date(),
      is_active: true,
    },
  });

  return section;
}

async function main() {
  console.log('Seeding database...');

  const passwordHashes = await Promise.all(
    users.map((u) => bcrypt.hash(u.password, SALT_ROUNDS)),
  );

  const admin = await upsertUser(users[0], passwordHashes[0]);
  await upsertUser(users[1], passwordHashes[1]);
  const employee = await upsertUser(users[2], passwordHashes[2]);
  const manager = await upsertUser(users[3], passwordHashes[3]);

  const section = await seedPublishedService(admin.id);

  await prisma.user.update({
    where: { id: employee.id },
    data: { section_id: section.id },
  });
  await prisma.user.update({
    where: { id: manager.id },
    data: { section_id: section.id },
  });

  for (const user of users) {
    console.log(
      `  ✓ ${user.role.padEnd(20)} ${user.email}  /  password: ${user.password}`,
    );
  }

  console.log('  ✓ Published service: Building Permit (free, 2 workflow steps)');
  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
