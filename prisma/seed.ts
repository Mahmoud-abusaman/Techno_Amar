import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import {
  AccountStatus,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  DamageAssessmentStatus,
  DamageSeverity,
  DocumentRequirementType,
  GazaCities,
  PrismaClient,
  RequestActivityAction,
  RequestPaymentStatus,
  RequestStatus,
  RequestTaskStatus,
  ServiceStatus,
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

const SEED_DOC_BASE = 'https://ik.imagekit.io/TechnoAmar/seed';

type SeedUser = {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  city: GazaCities;
  national_id?: string;
  employee_id?: string;
  phone?: string;
  is_verified: boolean;
  account_status?: AccountStatus;
};

const users: SeedUser[] = [
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
  {
    full_name: 'Fatima Pending',
    email: 'pending@technoamar.ps',
    password: 'Pending@1234',
    role: UserRole.CITIZEN,
    city: GazaCities.RAFAH,
    national_id: '987654321',
    phone: '+970599000005',
    is_verified: false,
    account_status: AccountStatus.PENDING_VERIFICATION,
  },
];

const departments = [
  {
    name: 'Municipal Services',
    description: 'General municipal permits and licensing',
    sections: [
      {
        name: 'Permits Desk',
        description: 'Building permits and construction licensing',
      },
      {
        name: 'Licensing Office',
        description: 'Trade and business licenses',
      },
    ],
  },
  {
    name: 'Public Works',
    description: 'Infrastructure, roads, and sanitation',
    sections: [
      {
        name: 'Road Maintenance',
        description: 'Road repairs and pothole reports',
      },
      {
        name: 'Waste Management',
        description: 'Waste collection and recycling',
      },
    ],
  },
  {
    name: 'Urban Planning',
    description: 'Zoning and land-use planning',
    sections: [
      {
        name: 'Zoning Board',
        description: 'Zoning certificates and land-use reviews',
      },
    ],
  },
] as const;

async function upsertUser(
  data: SeedUser,
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
    account_status: data.account_status ?? AccountStatus.ACTIVE,
    section_id: section_id ?? null,
  };

  const user = exists
    ? await prisma.user.update({ where: { id: exists.id }, data: payload })
    : await prisma.user.create({ data: payload });

  if (user.role === UserRole.CITIZEN) {
    const isVerified = user.account_status === AccountStatus.ACTIVE;
    await prisma.citizenProfile.upsert({
      where: { user_id: user.id },
      create: {
        user_id: user.id,
        verified_at: isVerified ? new Date() : null,
        verification_document: isVerified
          ? `${SEED_DOC_BASE}/citizen-id.pdf`
          : `${SEED_DOC_BASE}/pending-id.pdf`,
        id_selfie: isVerified
          ? `${SEED_DOC_BASE}/citizen-selfie.jpg`
          : `${SEED_DOC_BASE}/pending-selfie.jpg`,
      },
      update: {
        verified_at: isVerified ? new Date() : null,
        rejection_reason: null,
      },
    });
  }

  return user;
}

async function upsertDepartment(name: string, description: string) {
  return prisma.department.upsert({
    where: { name },
    create: { name, description },
    update: { description, is_active: true },
  });
}

async function upsertSection(
  department_id: bigint,
  name: string,
  description: string,
) {
  return prisma.section.upsert({
    where: { department_id_name: { department_id, name } },
    create: { department_id, name, description },
    update: { description, is_active: true },
  });
}

type WorkflowTaskSeed = {
  sectionName: string;
  name: string;
  description: string;
  task_order: number;
  estimated_time_hours: number;
};

type ServiceSeed = {
  name: string;
  description: string;
  departmentName: string;
  fee: number;
  estimated_processing_days: number;
  status: ServiceStatus;
  workflow: WorkflowTaskSeed[];
  required_documents?: Array<{
    name: string;
    description: string;
    type: DocumentRequirementType;
  }>;
};

const services: ServiceSeed[] = [
  {
    name: 'Building Permit',
    description: 'Apply for a residential building permit',
    departmentName: 'Municipal Services',
    fee: 0,
    estimated_processing_days: 14,
    status: ServiceStatus.PUBLISHED,
    workflow: [
      {
        sectionName: 'Permits Desk',
        name: 'Initial Review',
        description: 'Verify application completeness',
        task_order: 1,
        estimated_time_hours: 4,
      },
      {
        sectionName: 'Permits Desk',
        name: 'Final Approval',
        description: 'Issue permit decision',
        task_order: 2,
        estimated_time_hours: 2,
      },
    ],
    required_documents: [
      {
        name: 'National ID Copy',
        description: 'Clear scan of both sides',
        type: DocumentRequirementType.MANDATORY,
      },
      {
        name: 'Property Ownership Proof',
        description: 'Land registry or ownership deed',
        type: DocumentRequirementType.MANDATORY,
      },
    ],
  },
  {
    name: 'Trade License',
    description: 'Register a new retail or service business',
    departmentName: 'Municipal Services',
    fee: 0,
    estimated_processing_days: 7,
    status: ServiceStatus.PUBLISHED,
    workflow: [
      {
        sectionName: 'Licensing Office',
        name: 'Document Check',
        description: 'Validate business registration papers',
        task_order: 1,
        estimated_time_hours: 3,
      },
      {
        sectionName: 'Licensing Office',
        name: 'License Issuance',
        description: 'Approve and issue trade license',
        task_order: 2,
        estimated_time_hours: 2,
      },
    ],
    required_documents: [
      {
        name: 'Business Registration',
        description: 'Chamber of commerce registration',
        type: DocumentRequirementType.MANDATORY,
      },
    ],
  },
  {
    name: 'Zoning Certificate',
    description: 'Request a zoning compliance certificate',
    departmentName: 'Urban Planning',
    fee: 0,
    estimated_processing_days: 21,
    status: ServiceStatus.PUBLISHED,
    workflow: [
      {
        sectionName: 'Zoning Board',
        name: 'Site Review',
        description: 'Review property zoning classification',
        task_order: 1,
        estimated_time_hours: 6,
      },
      {
        sectionName: 'Zoning Board',
        name: 'Certificate Issuance',
        description: 'Issue zoning compliance certificate',
        task_order: 2,
        estimated_time_hours: 2,
      },
    ],
  },
  {
    name: 'Road Repair Request',
    description: 'Report road damage for municipal repair (internal draft)',
    departmentName: 'Public Works',
    fee: 0,
    estimated_processing_days: 10,
    status: ServiceStatus.DRAFT,
    workflow: [
      {
        sectionName: 'Road Maintenance',
        name: 'Inspection',
        description: 'Inspect reported road damage',
        task_order: 1,
        estimated_time_hours: 4,
      },
    ],
  },
];

async function seedOrgStructure() {
  const sectionByKey = new Map<string, { id: bigint; department_id: bigint }>();

  for (const dept of departments) {
    const department = await upsertDepartment(dept.name, dept.description);
    for (const section of dept.sections) {
      const row = await upsertSection(
        department.id,
        section.name,
        section.description,
      );
      sectionByKey.set(`${dept.name}::${section.name}`, {
        id: row.id,
        department_id: department.id,
      });
    }
  }

  return sectionByKey;
}

async function seedService(
  seed: ServiceSeed,
  adminId: bigint,
  sectionByKey: Map<string, { id: bigint; department_id: bigint }>,
) {
  const department = await prisma.department.findUnique({
    where: { name: seed.departmentName },
  });
  if (!department) throw new Error(`Department not found: ${seed.departmentName}`);

  const published_at =
    seed.status === ServiceStatus.PUBLISHED ? new Date() : null;

  let service = await prisma.service.findUnique({
    where: { name: seed.name },
    include: { workflow_tasks: { orderBy: { task_order: 'asc' } } },
  });

  if (!service) {
    service = await prisma.service.create({
      data: {
        name: seed.name,
        description: seed.description,
        department_id: department.id,
        fee: seed.fee,
        estimated_processing_days: seed.estimated_processing_days,
        status: seed.status,
        created_by: adminId,
        published_at,
        workflow_tasks: {
          create: seed.workflow.map((task) => {
            const section = sectionByKey.get(
              `${seed.departmentName}::${task.sectionName}`,
            );
            if (!section) {
              throw new Error(
                `Section not found: ${seed.departmentName}::${task.sectionName}`,
              );
            }
            return {
              section_id: section.id,
              name: task.name,
              description: task.description,
              task_order: task.task_order,
              estimated_time_hours: task.estimated_time_hours,
            };
          }),
        },
      },
      include: { workflow_tasks: { orderBy: { task_order: 'asc' } } },
    });
  } else {
    if (service.workflow_tasks.length === 0) {
      await prisma.serviceTask.createMany({
        data: seed.workflow.map((task) => {
          const section = sectionByKey.get(
            `${seed.departmentName}::${task.sectionName}`,
          );
          if (!section) {
            throw new Error(
              `Section not found: ${seed.departmentName}::${task.sectionName}`,
            );
          }
          return {
            service_id: service!.id,
            section_id: section.id,
            name: task.name,
            description: task.description,
            task_order: task.task_order,
            estimated_time_hours: task.estimated_time_hours,
          };
        }),
      });
      service = await prisma.service.findUniqueOrThrow({
        where: { id: service.id },
        include: { workflow_tasks: { orderBy: { task_order: 'asc' } } },
      });
    }

    await prisma.service.update({
      where: { id: service.id },
      data: {
        description: seed.description,
        department_id: department.id,
        fee: seed.fee,
        estimated_processing_days: seed.estimated_processing_days,
        status: seed.status,
        published_at,
        is_active: true,
      },
    });
  }

  if (seed.required_documents?.length) {
    for (const doc of seed.required_documents) {
      await prisma.requiredDocument.upsert({
        where: {
          service_id_name: { service_id: service.id, name: doc.name },
        },
        create: {
          service_id: service.id,
          name: doc.name,
          description: doc.description,
          type: doc.type,
        },
        update: {
          description: doc.description,
          type: doc.type,
          is_active: true,
        },
      });
    }
  }

  return service;
}

async function seedBuildingPermitRequest(
  citizenId: bigint,
  employeeId: bigint,
  serviceId: bigint,
) {
  const existing = await prisma.serviceRequest.findFirst({
    where: {
      citizen_id: citizenId,
      service_id: serviceId,
      is_deleted: false,
    },
  });
  if (existing) return existing;

  const service = await prisma.service.findUniqueOrThrow({
    where: { id: serviceId },
    include: {
      workflow_tasks: { where: { is_active: true }, orderBy: { task_order: 'asc' } },
      required_documents: { where: { is_active: true } },
    },
  });

  const nationalIdDoc = service.required_documents.find(
    (d) => d.name === 'National ID Copy',
  );
  const ownershipDoc = service.required_documents.find(
    (d) => d.name === 'Property Ownership Proof',
  );

  const request = await prisma.serviceRequest.create({
    data: {
      citizen_id: citizenId,
      service_id: serviceId,
      status: RequestStatus.IN_PROGRESS,
      payment_status: RequestPaymentStatus.NOT_REQUIRED,
    },
  });

  const requestTasks = await Promise.all(
    service.workflow_tasks.map((task, index) =>
      prisma.requestTask.create({
        data: {
          request_id: request.id,
          service_task_id: task.id,
          section_id: task.section_id,
          name: task.name,
          task_order: task.task_order,
          estimated_time_hours: task.estimated_time_hours,
          status:
            index === 0
              ? RequestTaskStatus.IN_PROGRESS
              : RequestTaskStatus.BACKLOG,
          assigned_employee_id: index === 0 ? employeeId : null,
          assigned_at: index === 0 ? new Date() : null,
        },
      }),
    ),
  );

  const currentTask = requestTasks[0];

  await prisma.serviceRequest.update({
    where: { id: request.id },
    data: { current_task_id: currentTask.id },
  });

  await prisma.requestActivity.createMany({
    data: [
      {
        request_id: request.id,
        actor_id: citizenId,
        action: RequestActivityAction.SUBMITTED,
        description: `Submitted request for service "${service.name}"`,
      },
      {
        request_id: request.id,
        task_id: currentTask.id,
        actor_id: employeeId,
        action: RequestActivityAction.TASK_ASSIGNED,
        description: `Assigned task "${currentTask.name}" to employee`,
      },
    ],
  });

  const uploads = [
    {
      required_document_id: nationalIdDoc?.id ?? null,
      name: 'National ID Copy.pdf',
      file_id: 'seed_national_id',
    },
    {
      required_document_id: ownershipDoc?.id ?? null,
      name: 'Property Ownership.pdf',
      file_id: 'seed_ownership',
    },
  ];

  for (const doc of uploads) {
    await prisma.requestDocument.create({
      data: {
        request_id: request.id,
        required_document_id: doc.required_document_id,
        name: doc.name,
        file_type: 'application/pdf',
        file_url: `${SEED_DOC_BASE}/${doc.file_id}.pdf`,
        file_id: doc.file_id,
        file_path: `/seed/${doc.file_id}.pdf`,
        uploaded_by: citizenId,
      },
    });
  }

  return request;
}

async function seedTradeLicenseRequest(citizenId: bigint, serviceId: bigint) {
  const existing = await prisma.serviceRequest.findFirst({
    where: {
      citizen_id: citizenId,
      service_id: serviceId,
      is_deleted: false,
      status: RequestStatus.SUBMITTED,
    },
  });
  if (existing) return existing;

  const service = await prisma.service.findUniqueOrThrow({
    where: { id: serviceId },
    include: {
      workflow_tasks: { where: { is_active: true }, orderBy: { task_order: 'asc' } },
    },
  });

  const request = await prisma.serviceRequest.create({
    data: {
      citizen_id: citizenId,
      service_id: serviceId,
      status: RequestStatus.SUBMITTED,
      payment_status: RequestPaymentStatus.NOT_REQUIRED,
    },
  });

  const requestTasks = await Promise.all(
    service.workflow_tasks.map((task) =>
      prisma.requestTask.create({
        data: {
          request_id: request.id,
          service_task_id: task.id,
          section_id: task.section_id,
          name: task.name,
          task_order: task.task_order,
          estimated_time_hours: task.estimated_time_hours,
        },
      }),
    ),
  );

  await prisma.serviceRequest.update({
    where: { id: request.id },
    data: { current_task_id: requestTasks[0].id },
  });

  await prisma.requestActivity.create({
    data: {
      request_id: request.id,
      actor_id: citizenId,
      action: RequestActivityAction.SUBMITTED,
      description: `Submitted request for service "${service.name}"`,
    },
  });

  return request;
}

async function seedComplaint(citizenId: bigint) {
  const title = 'Delayed building permit response';
  const existing = await prisma.complaint.findFirst({
    where: { citizen_id: citizenId, title },
  });
  if (existing) return existing;

  return prisma.complaint.create({
    data: {
      citizen_id: citizenId,
      title,
      category: ComplaintCategory.SERVICE_QUALITY,
      priority: ComplaintPriority.MEDIUM,
      location: 'Al-Rimal, Gaza City',
      description:
        'I submitted a building permit request two weeks ago and have not received an update.',
      status: ComplaintStatus.UNDER_REVIEW,
    },
  });
}

async function seedDamageAssessment(citizenId: bigint) {
  return prisma.damageAssessment.upsert({
    where: { citizen_id: citizenId },
    create: {
      citizen_id: citizenId,
      location: 'Al-Naser, Gaza City',
      description: 'Roof damage from recent shelling; water leaking into bedrooms.',
      damage_severity: DamageSeverity.MODERATE,
      status: DamageAssessmentStatus.UNDER_REVIEW,
      documents: {
        create: [
          {
            name: 'Roof damage photo.jpg',
            file_type: 'image/jpeg',
            file_url: `${SEED_DOC_BASE}/roof-damage.jpg`,
            file_id: 'seed_roof_damage',
            file_path: '/seed/roof-damage.jpg',
          },
        ],
      },
    },
    update: {
      location: 'Al-Naser, Gaza City',
      description: 'Roof damage from recent shelling; water leaking into bedrooms.',
      damage_severity: DamageSeverity.MODERATE,
      status: DamageAssessmentStatus.UNDER_REVIEW,
    },
  });
}

async function main() {
  console.log('Seeding database...\n');

  const passwordHashes = await Promise.all(
    users.map((u) => bcrypt.hash(u.password, SALT_ROUNDS)),
  );

  const sectionByKey = await seedOrgStructure();
  const permitsDesk = sectionByKey.get('Municipal Services::Permits Desk');
  const licensingOffice = sectionByKey.get('Municipal Services::Licensing Office');
  if (!permitsDesk || !licensingOffice) {
    throw new Error('Expected seed sections were not created');
  }

  const admin = await upsertUser(users[0], passwordHashes[0]);
  const citizen = await upsertUser(users[1], passwordHashes[1]);
  const employee = await upsertUser(
    users[2],
    passwordHashes[2],
    permitsDesk.id,
  );
  const manager = await upsertUser(
    users[3],
    passwordHashes[3],
    permitsDesk.id,
  );
  await upsertUser(users[4], passwordHashes[4]);

  console.log('Users:');
  for (const user of users) {
    console.log(
      `  ✓ ${user.role.padEnd(22)} ${user.email.padEnd(28)} password: ${user.password}`,
    );
  }

  console.log('\nOrganization:');
  for (const dept of departments) {
    console.log(`  ✓ Department: ${dept.name}`);
    for (const section of dept.sections) {
      console.log(`      → Section: ${section.name}`);
    }
  }

  console.log('\nServices:');
  for (const serviceSeed of services) {
    const service = await seedService(serviceSeed, admin.id, sectionByKey);
    const docCount = serviceSeed.required_documents?.length ?? 0;
    console.log(
      `  ✓ ${service.name} (${service.status}${docCount ? `, ${docCount} required docs` : ''})`,
    );
  }

  const buildingPermit = await prisma.service.findUniqueOrThrow({
    where: { name: 'Building Permit' },
  });
  const tradeLicense = await prisma.service.findUniqueOrThrow({
    where: { name: 'Trade License' },
  });

  await seedBuildingPermitRequest(citizen.id, employee.id, buildingPermit.id);
  await seedTradeLicenseRequest(citizen.id, tradeLicense.id);
  await seedComplaint(citizen.id);
  await seedDamageAssessment(citizen.id);

  console.log('\nTransactions:');
  console.log('  ✓ Service request: Building Permit (IN_PROGRESS, task assigned)');
  console.log('  ✓ Service request: Trade License (SUBMITTED)');
  console.log('  ✓ Complaint: Delayed building permit response');
  console.log('  ✓ Damage assessment: roof damage (UNDER_REVIEW)');

  console.log('\nDone.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
