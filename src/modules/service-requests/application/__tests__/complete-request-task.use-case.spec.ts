import { NotFoundException } from '@nestjs/common';
import { CompleteRequestTaskUseCase } from '../complete-request-task.use-case';
import { RequestWorkflowService } from '../request-workflow.service';
import { RequestStatus } from '@/generated/prisma/enums';
import {
  makeEmployee,
  makeRequest,
  makeTask,
  makeTaskRepo,
  makeTaskWithRequest,
  makeRequestRepo,
  makeUserRepo,
} from './test-helpers';

describe('CompleteRequestTaskUseCase', () => {
  let useCase: CompleteRequestTaskUseCase;
  let taskRepo: ReturnType<typeof makeTaskRepo>;
  let requestRepo: ReturnType<typeof makeRequestRepo>;
  let userRepo: ReturnType<typeof makeUserRepo>;

  beforeEach(() => {
    taskRepo = makeTaskRepo();
    requestRepo = makeRequestRepo();
    userRepo = makeUserRepo();
    useCase = new CompleteRequestTaskUseCase(
      taskRepo,
      requestRepo,
      userRepo,
      new RequestWorkflowService(),
    );
  });

  it('completes middle task and advances current_task_id', async () => {
    const siblingTasks = [
      makeTask({ id: 1n, task_order: 1 }),
      makeTask({ id: 2n, task_order: 2, status: 'BACKLOG' }),
    ];
    const task = makeTaskWithRequest({ sibling_tasks: siblingTasks });
    const nextTask = siblingTasks[1];

    userRepo.findById.mockResolvedValue(makeEmployee());
    taskRepo.findByIdWithRequest.mockResolvedValue(task);
    taskRepo.update.mockResolvedValue({ ...task, status: 'COMPLETED', completed_at: new Date() });
    taskRepo.findNextTask.mockResolvedValue(nextTask);

    const result = await useCase.execute(5n, 1n);

    expect(requestRepo.updateStatus).toHaveBeenCalledWith(10n, {
      current_task_id: 2n,
    });
    expect(requestRepo.addActivity).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('COMPLETED');
  });

  it('approves request when completing the last task', async () => {
    const siblingTasks = [
      makeTask({ id: 1n, task_order: 1, status: 'COMPLETED' }),
      makeTask({ id: 2n, task_order: 2, status: 'IN_PROGRESS' }),
    ];
    const task = makeTaskWithRequest({
      id: 2n,
      task_order: 2,
      sibling_tasks: siblingTasks,
      request: makeRequest({ status: RequestStatus.IN_PROGRESS }),
    });

    userRepo.findById.mockResolvedValue(makeEmployee());
    taskRepo.findByIdWithRequest.mockResolvedValue(task);
    taskRepo.update.mockResolvedValue({ ...task, status: 'COMPLETED', completed_at: new Date() });

    const result = await useCase.execute(5n, 2n);

    expect(requestRepo.updateStatus).toHaveBeenCalledWith(10n, {
      status: RequestStatus.APPROVED,
      completed_at: expect.any(Date),
      current_task_id: 2n,
    });
    expect(requestRepo.addActivity).toHaveBeenCalledTimes(2);
    expect(result.status).toBe('COMPLETED');
  });

  it('throws when task not found', async () => {
    userRepo.findById.mockResolvedValue(makeEmployee());
    taskRepo.findByIdWithRequest.mockResolvedValue(null);

    await expect(useCase.execute(5n, 99n)).rejects.toThrow(NotFoundException);
  });
});
