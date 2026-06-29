import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GetRequestTaskUseCase } from '../get-request-task.use-case';
import {
  makeEmployee,
  makeTaskRepo,
  makeTaskWithRequest,
  makeUserRepo,
} from './test-helpers';

describe('GetRequestTaskUseCase', () => {
  let useCase: GetRequestTaskUseCase;
  let taskRepo: ReturnType<typeof makeTaskRepo>;
  let userRepo: ReturnType<typeof makeUserRepo>;

  beforeEach(() => {
    taskRepo = makeTaskRepo();
    userRepo = makeUserRepo();
    useCase = new GetRequestTaskUseCase(taskRepo, userRepo);
  });

  it('returns task detail for employee section', async () => {
    userRepo.findById.mockResolvedValue(makeEmployee());
    taskRepo.findByIdWithRequest.mockResolvedValue(makeTaskWithRequest());

    const result = await useCase.execute(5n, 1n);

    expect(result.id).toBe('1');
    expect(result.request.service_name).toBe('Permit');
    expect(result.sibling_tasks).toHaveLength(1);
    expect(result.documents).toHaveLength(1);
    expect(result.documents[0]).toEqual(
      expect.objectContaining({
        id: '50',
        request_id: '10',
        file_url: 'https://ik.imagekit.io/TechnoAmar/requests/national-id.jpg',
      }),
    );
  });

  it('throws when task is outside employee section', async () => {
    userRepo.findById.mockResolvedValue(makeEmployee());
    taskRepo.findByIdWithRequest.mockResolvedValue(
      makeTaskWithRequest({ section_id: 99n }),
    );

    await expect(useCase.execute(5n, 1n)).rejects.toThrow(ForbiddenException);
  });

  it('throws when task not found', async () => {
    userRepo.findById.mockResolvedValue(makeEmployee());
    taskRepo.findByIdWithRequest.mockResolvedValue(null);

    await expect(useCase.execute(5n, 1n)).rejects.toThrow(NotFoundException);
  });
});
