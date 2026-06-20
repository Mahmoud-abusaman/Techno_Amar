import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { SubmitServiceRequestUseCase } from '../submit-service-request.use-case';
import { IServiceRequestRepository } from '@service-requests/domain/repositories/service-request-repository.interface';
import { IServiceRepository } from '@services/domain/repositories/service-repository.interface';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { IRequiredDocumentRepository } from '@required-documents/domain/repositories/required-document-repository.interface';
import { ImageKitFileValidator } from '@uploads/application/imagekit-file.validator';
import { ServiceRequestDetailEntity } from '@service-requests/domain/entities/service-request-detail.entity';
import { ServiceWithTasksEntity } from '@services/domain/entities/service-with-tasks.entity';
import { UserEntity } from '@users/domain/entities/user.entity';
import {
  AccountStatus,
  ServiceStatus,
  UserRole,
} from '@/generated/prisma/enums';

const makeUser = (overrides: Partial<UserEntity> = {}): UserEntity => ({
  id: 1n,
  full_name: 'Citizen',
  email: 'citizen@test.com',
  password_hash: 'hash',
  national_id: '123',
  employee_id: null,
  phone: null,
  address: null,
  city: 'GAZA',
  is_verified: true,
  role: UserRole.CITIZEN,
  section_id: null,
  account_status: AccountStatus.ACTIVE,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

const makeService = (
  overrides: Partial<ServiceWithTasksEntity> = {},
): ServiceWithTasksEntity => ({
  id: 1n,
  name: 'Building Permit',
  description: null,
  department_id: 1n,
  fee: 0,
  estimated_processing_days: 14,
  status: ServiceStatus.PUBLISHED,
  created_by: 2n,
  published_at: new Date(),
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  workflow_tasks: [
    {
      id: 10n,
      service_id: 1n,
      section_id: 3n,
      name: 'Review',
      description: null,
      task_order: 1,
      estimated_time_hours: 4,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ],
  ...overrides,
});

const makeDetail = (): ServiceRequestDetailEntity => ({
  id: 100n,
  citizen_id: 1n,
  service_id: 1n,
  status: 'SUBMITTED',
  payment_status: 'NOT_REQUIRED',
  current_task_id: 200n,
  submitted_at: new Date(),
  completed_at: null,
  is_deleted: false,
  created_at: new Date(),
  updated_at: new Date(),
  service_name: 'Building Permit',
  tasks: [
    {
      id: 200n,
      request_id: 100n,
      service_task_id: 10n,
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
    },
  ],
  documents: [],
});

const makeRequestRepo = (): jest.Mocked<IServiceRequestRepository> => ({
  createWithTasks: jest.fn(),
  findById: jest.fn(),
  findByIdWithTasks: jest.fn(),
  findByCitizen: jest.fn(),
  updateStatus: jest.fn(),
  countActiveByServiceId: jest.fn(),
  findActivities: jest.fn(),
  addActivity: jest.fn(),
  findDocuments: jest.fn(),
});

const makeServiceRepo = (): jest.Mocked<IServiceRepository> => ({
  create: jest.fn(),
  createWithTasks: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByIdWithTasks: jest.fn(),
  findByName: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  countActiveTasks: jest.fn(),
});

const makeUserRepo = (): jest.Mocked<IUserRepository> => ({
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

const makeRequiredDocRepo = (): jest.Mocked<IRequiredDocumentRepository> => ({
  create: jest.fn(),
  findByService: jest.fn(),
  findById: jest.fn(),
  findByIdForService: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const makeFileValidator = (): jest.Mocked<
  Pick<ImageKitFileValidator, 'isValidFileUrl' | 'isAllowedMimeType'>
> => ({
  isValidFileUrl: jest.fn().mockReturnValue(true),
  isAllowedMimeType: jest.fn().mockReturnValue(true),
});

describe('SubmitServiceRequestUseCase', () => {
  let useCase: SubmitServiceRequestUseCase;
  let requestRepo: jest.Mocked<IServiceRequestRepository>;
  let serviceRepo: jest.Mocked<IServiceRepository>;
  let userRepo: jest.Mocked<IUserRepository>;
  let requiredDocRepo: jest.Mocked<IRequiredDocumentRepository>;
  let fileValidator: ReturnType<typeof makeFileValidator>;

  beforeEach(() => {
    requestRepo = makeRequestRepo();
    serviceRepo = makeServiceRepo();
    userRepo = makeUserRepo();
    requiredDocRepo = makeRequiredDocRepo();
    fileValidator = makeFileValidator();
    useCase = new SubmitServiceRequestUseCase(
      requestRepo,
      serviceRepo,
      userRepo,
      requiredDocRepo,
      fileValidator as unknown as ImageKitFileValidator,
    );
  });

  it('submits request for verified citizen and published free service', async () => {
    const detail = makeDetail();
    userRepo.findById.mockResolvedValue(makeUser());
    serviceRepo.findByIdWithTasks.mockResolvedValue(makeService());
    requiredDocRepo.findByService.mockResolvedValue([]);
    requestRepo.createWithTasks.mockResolvedValue(detail);

    const result = await useCase.execute(1n, { service_id: 1 });

    expect(requestRepo.createWithTasks).toHaveBeenCalled();
    expect(result.id).toBe('100');
    expect(result.documents).toEqual([]);
  });

  it('submits request with validated ImageKit document metadata', async () => {
    const detail = makeDetail();
    userRepo.findById.mockResolvedValue(makeUser());
    serviceRepo.findByIdWithTasks.mockResolvedValue(makeService());
    requiredDocRepo.findByService.mockResolvedValue([
      {
        id: 5n,
        service_id: 1n,
        name: 'National ID',
        description: null,
        type: 'MANDATORY',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
    requestRepo.createWithTasks.mockResolvedValue(detail);

    await useCase.execute(1n, {
      service_id: 1,
      documents: [
        {
          required_document_id: 5,
          file_name: 'id.pdf',
          file_type: 'application/pdf',
          file_url: 'https://ik.imagekit.io/TechnoAmar/id.pdf',
          file_id: 'file_123',
        },
      ],
    });

    expect(fileValidator.isValidFileUrl).toHaveBeenCalled();
    expect(requestRepo.createWithTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        documents: [
          expect.objectContaining({
            required_document_id: 5n,
            file_id: 'file_123',
          }),
        ],
      }),
    );
  });

  it('throws when file type is not PDF', async () => {
    userRepo.findById.mockResolvedValue(makeUser());
    serviceRepo.findByIdWithTasks.mockResolvedValue(makeService());
    requiredDocRepo.findByService.mockResolvedValue([]);
    fileValidator.isAllowedMimeType.mockReturnValue(false);

    await expect(
      useCase.execute(1n, {
        service_id: 1,
        documents: [
          {
            required_document_id: 5,
            file_name: 'photo.png',
            file_type: 'image/png',
            file_url: 'https://ik.imagekit.io/TechnoAmar/photo.png',
            file_id: 'file_123',
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws when mandatory documents are missing', async () => {
    userRepo.findById.mockResolvedValue(makeUser());
    serviceRepo.findByIdWithTasks.mockResolvedValue(makeService());
    requiredDocRepo.findByService.mockResolvedValue([
      {
        id: 5n,
        service_id: 1n,
        name: 'National ID',
        description: null,
        type: 'MANDATORY',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await expect(useCase.execute(1n, { service_id: 1 })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws when citizen is not verified', async () => {
    userRepo.findById.mockResolvedValue(
      makeUser({ is_verified: false, account_status: AccountStatus.PENDING_VERIFICATION }),
    );

    await expect(useCase.execute(1n, { service_id: 1 })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws when service is not published', async () => {
    userRepo.findById.mockResolvedValue(makeUser());
    serviceRepo.findByIdWithTasks.mockResolvedValue(
      makeService({ status: ServiceStatus.DRAFT }),
    );

    await expect(useCase.execute(1n, { service_id: 1 })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws when service has a fee', async () => {
    userRepo.findById.mockResolvedValue(makeUser());
    serviceRepo.findByIdWithTasks.mockResolvedValue(makeService({ fee: 50 }));

    await expect(useCase.execute(1n, { service_id: 1 })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws when service has no workflow tasks', async () => {
    userRepo.findById.mockResolvedValue(makeUser());
    serviceRepo.findByIdWithTasks.mockResolvedValue(
      makeService({ workflow_tasks: [] }),
    );

    await expect(useCase.execute(1n, { service_id: 1 })).rejects.toThrow(
      ConflictException,
    );
  });

  it('throws when user is not a citizen', async () => {
    userRepo.findById.mockResolvedValue(makeUser({ role: UserRole.EMPLOYEE }));

    await expect(useCase.execute(1n, { service_id: 1 })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws when service not found', async () => {
    userRepo.findById.mockResolvedValue(makeUser());
    serviceRepo.findByIdWithTasks.mockResolvedValue(null);

    await expect(useCase.execute(1n, { service_id: 1 })).rejects.toThrow(
      NotFoundException,
    );
  });
});
