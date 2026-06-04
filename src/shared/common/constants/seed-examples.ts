/**
 * Swagger / API examples aligned with prisma/seed.ts (insert order → typical ids 1–4).
 */
export const SEED = {
  admin: {
    id: '1',
    full_name: 'System Admin',
    email: 'admin@technoamar.ps',
    password: 'Admin@1234',
    employee_id: 'EMP-ADMIN-001',
    phone: '+970599000001',
    city: 'GAZA',
    role: 'ADMIN',
  },
  citizen: {
    id: '2',
    full_name: 'Ahmed Al-Citizen',
    email: 'citizen@technoamar.ps',
    password: 'Citizen@1234',
    national_id: '123456789',
    phone: '+970599000002',
    city: 'KHAN',
    role: 'CITIZEN',
  },
  employee: {
    id: '3',
    full_name: 'Sara Al-Employee',
    email: 'employee@technoamar.ps',
    password: 'Employee@1234',
    employee_id: 'EMP-001',
    phone: '+970599000003',
    city: 'MIDDLE',
    role: 'EMPLOYEE',
  },
  manager: {
    id: '4',
    full_name: 'Omar Al-Manager',
    email: 'manager@technoamar.ps',
    password: 'Manager@1234',
    employee_id: 'EMP-MGR-001',
    phone: '+970599000004',
    city: 'NORTH',
    role: 'DEPARTMENT_MANAGER',
  },
} as const;
