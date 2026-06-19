import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { IServiceRequestRepository } from '@service-requests/domain/repositories/service-request-repository.interface';
import { IRequestTaskRepository } from '@service-requests/domain/repositories/request-task-repository.interface';
import { RequestWorkflowService } from '@service-requests/application/request-workflow.service';
import {
  RequestActivityAction,
  RequestStatus,
} from '@/generated/prisma/enums';
import {
  PublicRequestTask,
  toPublicRequestTask,
} from '@service-requests/application/service-request-response.mapper';

@Injectable()
export class CompleteRequestTaskUseCase {
  constructor(
    @Inject(IRequestTaskRepository)
    private readonly taskRepo: IRequestTaskRepository,
    @Inject(IServiceRequestRepository)
    private readonly requestRepo: IServiceRequestRepository,
    @Inject(IUserRepository)
    private readonly userRepo: IUserRepository,
    private readonly workflow: RequestWorkflowService,
  ) {}

  async execute(
    actorId: bigint,
    taskId: bigint,
  ): Promise<PublicRequestTask> {
    const actor = await this.userRepo.findById(actorId);
    if (!actor) throw new NotFoundException('User not found');
    if (!actor.section_id) {
      throw new BadRequestException('User is not assigned to a section');
    }

    const task = await this.taskRepo.findByIdWithRequest(taskId);
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);

    this.workflow.assertRequestNotTerminal(task.request.status);
    this.workflow.assertTaskActionable(task, actorId, actor.section_id);

    const now = new Date();
    const updatedTask = await this.taskRepo.update(taskId, {
      status: 'COMPLETED',
      completed_at: now,
    });

    const isLast = this.workflow.isLastTask(task, task.sibling_tasks);

    if (isLast) {
      await this.requestRepo.updateStatus(task.request_id, {
        status: RequestStatus.APPROVED,
        completed_at: now,
        current_task_id: taskId,
      });
      await this.requestRepo.addActivity({
        request_id: task.request_id,
        task_id: taskId,
        actor_id: actorId,
        action: RequestActivityAction.TASK_COMPLETED,
        description: `Task "${task.name}" completed`,
      });
      await this.requestRepo.addActivity({
        request_id: task.request_id,
        actor_id: actorId,
        action: RequestActivityAction.REQUEST_APPROVED,
        description: 'All workflow tasks completed; request approved',
      });
    } else {
      const nextTask = await this.taskRepo.findNextTask(
        task.request_id,
        task.task_order,
      );
      await this.requestRepo.updateStatus(task.request_id, {
        current_task_id: nextTask?.id ?? null,
      });
      await this.requestRepo.addActivity({
        request_id: task.request_id,
        task_id: taskId,
        actor_id: actorId,
        action: RequestActivityAction.TASK_COMPLETED,
        description: `Task "${task.name}" completed`,
      });
    }

    return toPublicRequestTask(updatedTask);
  }
}
