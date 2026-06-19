import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { IRequestTaskRepository } from '@service-requests/domain/repositories/request-task-repository.interface';
import {
  TaskBoardResponse,
  toTaskBoard,
} from '@service-requests/application/service-request-response.mapper';

@Injectable()
export class GetSectionTaskBoardUseCase {
  constructor(
    @Inject(IRequestTaskRepository)
    private readonly taskRepo: IRequestTaskRepository,
    @Inject(IUserRepository)
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(actorId: bigint): Promise<TaskBoardResponse> {
    const actor = await this.userRepo.findById(actorId);
    if (!actor) throw new NotFoundException('User not found');
    if (!actor.section_id) {
      throw new BadRequestException('User is not assigned to a section');
    }

    const tasks = await this.taskRepo.findBySection(actor.section_id);
    return toTaskBoard(tasks);
  }
}
