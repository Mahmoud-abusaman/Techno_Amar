import { NotFoundException } from '@nestjs/common';
import { AssignRequestTaskUseCase } from '../assign-request-task.use-case';
import { IRequestTaskRepository } from '@service-requests/domain/repositories/request-task-repository.interface';
import { IServiceRequestRepository } from '@service-requests/domain/repositories/service-request-repository.interface';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { RequestWorkflowService } from '../request-workflow.service';
import { RequestTaskWithRequestEntity } from '@service-requests/domain/entities/request-task-with-request.entity';
import { UserEntity } from '@users/domain/entities/user.entity';
import { RequestStatus } from '@/generated/prisma/enums';

const makeUser = (): UserEntity => ({
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
});

const makeTaskWithRequest = (): RequestTaskWithRequestEntity => ({
  id: 1n,
  request_id: 10n,
  service_task_id: 5n,
  section_id: 3n,
  name: 'Review',
  task_order: 1,
  estimated_time_hours: 4,
  assigned_employee_id: null,
  status: 'BACKLOG',
  assigned_at: null,
  completed_at: null,
  rejection_reason: null,
  created_at: new Date(),
  updated_at: new Date(),
  request: {
    id: 10n,
    citizen_id: 1n,
    service_id: 2n,
    status: RequestStatus.SUBMITTED,
    payment_status: 'NOT_REQUIRED',
    current_task_id: 1n,
    submitted_at: new Date(),
    completed_at: null,
    is_deleted: false,
    created_at: new Date(),
    updated_at: new Date(),
    service_name: 'Permit',
  },
  sibling_tasks: [],
});

describe('AssignRequestTaskUseCase', () => {
  let useCase: AssignRequestTaskUseCase;
  let taskRepo: jest.Mocked<IRequestTaskRepository>;
  let requestRepo: jest.Mocked<IServiceRequestRepository>;
  let userRepo: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    taskRepo = {
      findById: jest.fn(),
      findByIdWithRequest: jest.fn(),
      findBySection: jest.fn(),
      update: jest.fn(),
      findNextTask: jest.fn(),
    };
    requestRepo = {
      createWithTasks: jest.fn(),
      findById: jest.fn(),
      findByIdWithTasks: jest.fn(),
      findByCitizen: jest.fn(),
      updateStatus: jest.fn(),
      countActiveByServiceId: jest.fn(),
      findActivities: jest.fn(),
      addActivity: jest.fn(),
    };
    userRepo = {
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
    };
    useCase = new AssignRequestTaskUseCase(
      taskRepo,
      requestRepo,
      userRepo,
      new RequestWorkflowService(),
    );
  });

  it('assigns backlog task and moves request to in progress', async () => {
    userRepo.findById.mockResolvedValue(makeUser());
    taskRepo.findByIdWithRequest.mockResolvedValue(makeTaskWithRequest());
    taskRepo.update.mockResolvedValue({
      ...makeTaskWithRequest(),
      status: 'IN_PROGRESS',
      assigned_employee_id: 5n,
      assigned_at: new Date(),
    });

    const result = await useCase.execute(5n, 1n);

    expect(requestRepo.updateStatus).toHaveBeenCalledWith(10n, {
      status: RequestStatus.IN_PROGRESS,
    });
    expect(requestRepo.addActivity).toHaveBeenCalled();
    expect(result.status).toBe('IN_PROGRESS');
  });

  it('throws when task not found', async () => {
    userRepo.findById.mockResolvedValue(makeUser());
    taskRepo.findByIdWithRequest.mockResolvedValue(null);

    await expect(useCase.execute(5n, 1n)).rejects.toThrow(NotFoundException);
  });
});
