import { RequestTaskWithRequestEntity } from '@service-requests/domain/entities/request-task-with-request.entity';
import { RequestTaskEntity } from '@service-requests/domain/entities/request-task.entity';
import { UserEntity } from '@users/domain/entities/user.entity';
import { IRequestTaskRepository } from '@service-requests/domain/repositories/request-task-repository.interface';
import { IServiceRequestRepository } from '@service-requests/domain/repositories/service-request-repository.interface';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { RequestStatus } from '@/generated/prisma/enums';

export const makeEmployee = (
  overrides: Partial<UserEntity> = {},
): UserEntity => ({
  id: 5n,
  full_name: 'Employee',
  email: 'emp@test.com',
  password_hash: 'hash',
  national_id: null,
  employee_id: 'E001',
  phone: null,
  address: null,
  city: 'GAZA',
  is_verified: true,
  role: 'EMPLOYEE',
  section_id: 3n,
  account_status: 'ACTIVE',
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const makeRequest = (
  overrides: Partial<RequestTaskWithRequestEntity['request']> = {},
): RequestTaskWithRequestEntity['request'] => ({
  id: 10n,
  citizen_id: 1n,
  service_id: 2n,
  status: RequestStatus.IN_PROGRESS,
  payment_status: 'NOT_REQUIRED',
  current_task_id: 1n,
  submitted_at: new Date(),
  completed_at: null,
  is_deleted: false,
  created_at: new Date(),
  updated_at: new Date(),
  service_name: 'Permit',
  ...overrides,
});

export const makeTask = (
  overrides: Partial<RequestTaskEntity> = {},
): RequestTaskEntity => ({
  id: 1n,
  request_id: 10n,
  service_task_id: 5n,
  section_id: 3n,
  name: 'Review',
  task_order: 1,
  estimated_time_hours: 4,
  assigned_employee_id: 5n,
  status: 'IN_PROGRESS',
  assigned_at: new Date(),
  completed_at: null,
  rejection_reason: null,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const makeTaskWithRequest = (
  overrides: Partial<RequestTaskWithRequestEntity> = {},
): RequestTaskWithRequestEntity => ({
  ...makeTask(),
  request: makeRequest(),
  sibling_tasks: [makeTask()],
  ...overrides,
});

export const makeTaskRepo = (): jest.Mocked<IRequestTaskRepository> => ({
  findById: jest.fn(),
  findByIdWithRequest: jest.fn(),
  findBySection: jest.fn(),
  update: jest.fn(),
  findNextTask: jest.fn(),
});

export const makeRequestRepo = (): jest.Mocked<IServiceRequestRepository> => ({
  createWithTasks: jest.fn(),
  findById: jest.fn(),
  findByIdWithTasks: jest.fn(),
  findByCitizen: jest.fn(),
  updateStatus: jest.fn(),
  countActiveByServiceId: jest.fn(),
  findActivities: jest.fn(),
  addActivity: jest.fn(),
});

export const makeUserRepo = (): jest.Mocked<IUserRepository> => ({
  create: jest.fn(),
  createCitizenProfile: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByIdWithProfile: jest.fn(),
  updateCitizenProfile: jest.fn(),
  findByEmail: jest.fn(),
  findByPhone: jest.fn(),
  findByNationalId: jest.fn(),
  findByEmployeeId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});
