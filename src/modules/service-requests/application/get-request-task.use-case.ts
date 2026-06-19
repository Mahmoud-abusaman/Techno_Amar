import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { IRequestTaskRepository } from '@service-requests/domain/repositories/request-task-repository.interface';
import {
  PublicRequestTaskDetail,
  toPublicRequestTaskDetail,
} from '@service-requests/application/service-request-response.mapper';

@Injectable()
export class GetRequestTaskUseCase {
  constructor(
    @Inject(IRequestTaskRepository)
    private readonly taskRepo: IRequestTaskRepository,
    @Inject(IUserRepository)
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(
    actorId: bigint,
    taskId: bigint,
  ): Promise<PublicRequestTaskDetail> {
    const actor = await this.userRepo.findById(actorId);
    if (!actor) throw new NotFoundException('User not found');
    if (!actor.section_id) {
      throw new BadRequestException('User is not assigned to a section');
    }

    const task = await this.taskRepo.findByIdWithRequest(taskId);
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);
    if (task.section_id !== actor.section_id) {
      throw new ForbiddenException('Task does not belong to your section');
    }

    return toPublicRequestTaskDetail(task);
  }
}
