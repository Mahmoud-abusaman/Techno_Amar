import { ListMyServiceRequestsUseCase } from '../list-my-service-requests.use-case';
import { ServiceRequestEntity } from '@service-requests/domain/entities/service-request.entity';
import { ServiceEntity } from '@services/domain/entities/service.entity';
import { makeRequestRepo } from './test-helpers';
import { IServiceRepository } from '@services/domain/repositories/service-repository.interface';

const makeRequest = (
  overrides: Partial<ServiceRequestEntity> = {},
): ServiceRequestEntity => ({
  id: 100n,
  citizen_id: 1n,
  service_id: 2n,
  status: 'IN_PROGRESS',
  payment_status: 'NOT_REQUIRED',
  current_task_id: 200n,
  submitted_at: new Date(),
  completed_at: null,
  is_deleted: false,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

const makeService = (): ServiceEntity => ({
  id: 2n,
  name: 'Building Permit',
  description: null,
  department_id: 1n,
  fee: 0,
  estimated_processing_days: 14,
  status: 'PUBLISHED',
  created_by: 1n,
  published_at: new Date(),
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
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

describe('ListMyServiceRequestsUseCase', () => {
  let useCase: ListMyServiceRequestsUseCase;
  let requestRepo: ReturnType<typeof makeRequestRepo>;
  let serviceRepo: jest.Mocked<IServiceRepository>;

  beforeEach(() => {
    requestRepo = makeRequestRepo();
    serviceRepo = makeServiceRepo();
    useCase = new ListMyServiceRequestsUseCase(requestRepo, serviceRepo);
  });

  it('lists citizen requests with service names', async () => {
    requestRepo.findByCitizen.mockResolvedValue([
      makeRequest({ id: 100n }),
      makeRequest({ id: 101n, service_id: 3n }),
    ]);
    serviceRepo.findById.mockImplementation(async (id) =>
      id === 2n
        ? makeService()
        : { ...makeService(), id: 3n, name: 'Water Connection' },
    );

    const result = await useCase.execute(1n);

    expect(requestRepo.findByCitizen).toHaveBeenCalledWith(1n);
    expect(result).toHaveLength(2);
    expect(result[0].service_name).toBe('Building Permit');
    expect(result[1].service_name).toBe('Water Connection');
  });

  it('returns empty list when citizen has no requests', async () => {
    requestRepo.findByCitizen.mockResolvedValue([]);

    const result = await useCase.execute(1n);

    expect(result).toEqual([]);
    expect(serviceRepo.findById).not.toHaveBeenCalled();
  });
});
