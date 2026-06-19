import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { GetSectionTaskBoardUseCase } from '../get-section-task-board.use-case';
import {
  makeEmployee,
  makeTask,
  makeTaskRepo,
  makeUserRepo,
} from './test-helpers';

describe('GetSectionTaskBoardUseCase', () => {
  let useCase: GetSectionTaskBoardUseCase;
  let taskRepo: ReturnType<typeof makeTaskRepo>;
  let userRepo: ReturnType<typeof makeUserRepo>;

  beforeEach(() => {
    taskRepo = makeTaskRepo();
    userRepo = makeUserRepo();
    useCase = new GetSectionTaskBoardUseCase(taskRepo, userRepo);
  });

  it('groups section tasks by status column', async () => {
    userRepo.findById.mockResolvedValue(makeEmployee());
    taskRepo.findBySection.mockResolvedValue([
      makeTask({ id: 1n, status: 'BACKLOG', assigned_employee_id: null }),
      makeTask({ id: 2n, status: 'IN_PROGRESS' }),
      makeTask({ id: 3n, status: 'COMPLETED' }),
      makeTask({ id: 4n, status: 'FAILED' }),
    ]);

    const result = await useCase.execute(5n);

    expect(taskRepo.findBySection).toHaveBeenCalledWith(3n);
    expect(result.backlog).toHaveLength(1);
    expect(result.in_progress).toHaveLength(1);
    expect(result.completed).toHaveLength(1);
    expect(result.failed).toHaveLength(1);
  });

  it('throws when user has no section', async () => {
    userRepo.findById.mockResolvedValue(makeEmployee({ section_id: null }));

    await expect(useCase.execute(5n)).rejects.toThrow(BadRequestException);
  });

  it('throws when user not found', async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(5n)).rejects.toThrow(NotFoundException);
  });
});
