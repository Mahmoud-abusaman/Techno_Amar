import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GetServiceRequestHistoryUseCase } from '../get-service-request-history.use-case';
import { ServiceRequestEntity } from '@service-requests/domain/entities/service-request.entity';
import { RequestActivityEntity } from '@service-requests/domain/entities/request-activity.entity';
import { makeRequestRepo } from './test-helpers';

const makeRequest = (
  overrides: Partial<ServiceRequestEntity> = {},
): ServiceRequestEntity => ({
  id: 100n,
  citizen_id: 1n,
  service_id: 2n,
  status: 'SUBMITTED',
  payment_status: 'NOT_REQUIRED',
  current_task_id: 200n,
  submitted_at: new Date(),
  completed_at: null,
  is_deleted: false,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

const makeActivity = (
  overrides: Partial<RequestActivityEntity> = {},
): RequestActivityEntity => ({
  id: 1n,
  request_id: 100n,
  task_id: 200n,
  actor_id: 1n,
  action: 'SUBMITTED',
  description: 'Submitted request',
  created_at: new Date(),
  ...overrides,
});

describe('GetServiceRequestHistoryUseCase', () => {
  let useCase: GetServiceRequestHistoryUseCase;
  let requestRepo: ReturnType<typeof makeRequestRepo>;

  beforeEach(() => {
    requestRepo = makeRequestRepo();
    useCase = new GetServiceRequestHistoryUseCase(requestRepo);
  });

  it('returns activity history for owning citizen', async () => {
    requestRepo.findById.mockResolvedValue(makeRequest());
    requestRepo.findActivities.mockResolvedValue([
      makeActivity(),
      makeActivity({ id: 2n, action: 'TASK_ASSIGNED' }),
    ]);

    const result = await useCase.execute(1n, 100n);

    expect(result).toHaveLength(2);
    expect(result[0].action).toBe('SUBMITTED');
    expect(result[1].action).toBe('TASK_ASSIGNED');
  });

  it('throws when citizen does not own request', async () => {
    requestRepo.findById.mockResolvedValue(makeRequest({ citizen_id: 99n }));

    await expect(useCase.execute(1n, 100n)).rejects.toThrow(ForbiddenException);
  });

  it('throws when request not found', async () => {
    requestRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(1n, 100n)).rejects.toThrow(NotFoundException);
  });
});
