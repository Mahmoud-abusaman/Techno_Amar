import { NotFoundException } from '@nestjs/common';
import { RejectRequestTaskUseCase } from '../reject-request-task.use-case';
import { RequestWorkflowService } from '../request-workflow.service';
import { RequestStatus } from '@/generated/prisma/enums';
import {
  makeEmployee,
  makeTaskRepo,
  makeTaskWithRequest,
  makeRequestRepo,
  makeUserRepo,
} from './test-helpers';

describe('RejectRequestTaskUseCase', () => {
  let useCase: RejectRequestTaskUseCase;
  let taskRepo: ReturnType<typeof makeTaskRepo>;
  let requestRepo: ReturnType<typeof makeRequestRepo>;
  let userRepo: ReturnType<typeof makeUserRepo>;

  beforeEach(() => {
    taskRepo = makeTaskRepo();
    requestRepo = makeRequestRepo();
    userRepo = makeUserRepo();
    useCase = new RejectRequestTaskUseCase(
      taskRepo,
      requestRepo,
      userRepo,
      new RequestWorkflowService(),
    );
  });

  it('rejects task and marks request as rejected', async () => {
    const task = makeTaskWithRequest();
    const reason = 'Invalid documents';

    userRepo.findById.mockResolvedValue(makeEmployee());
    taskRepo.findByIdWithRequest.mockResolvedValue(task);
    taskRepo.update.mockResolvedValue({
      ...task,
      status: 'FAILED',
      completed_at: new Date(),
      rejection_reason: reason,
    });

    const result = await useCase.execute(5n, 1n, reason);

    expect(requestRepo.updateStatus).toHaveBeenCalledWith(10n, {
      status: RequestStatus.REJECTED,
      completed_at: expect.any(Date),
    });
    expect(requestRepo.addActivity).toHaveBeenCalledTimes(2);
    expect(result.status).toBe('FAILED');
    expect(result.rejection_reason).toBe(reason);
  });

  it('throws when task not found', async () => {
    userRepo.findById.mockResolvedValue(makeEmployee());
    taskRepo.findByIdWithRequest.mockResolvedValue(null);

    await expect(useCase.execute(5n, 1n, 'reason')).rejects.toThrow(
      NotFoundException,
    );
  });
});
