import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { RequestStatus } from '@service-requests/domain/entities/service-request.entity';
import { RequestTaskEntity } from '@service-requests/domain/entities/request-task.entity';

@Injectable()
export class RequestWorkflowService {
  assertRequestNotTerminal(status: RequestStatus): void {
    if (status === 'APPROVED' || status === 'REJECTED') {
      throw new BadRequestException('Request is already in a terminal state');
    }
  }

  assertTaskAssignable(
    task: RequestTaskEntity,
    actorSectionId: bigint,
  ): void {
    if (task.status !== 'BACKLOG') {
      throw new BadRequestException('Task is not available for assignment');
    }
    if (task.section_id !== actorSectionId) {
      throw new ForbiddenException(
        'Task does not belong to your section',
      );
    }
  }

  assertTaskActionable(
    task: RequestTaskEntity,
    actorId: bigint,
    actorSectionId: bigint,
  ): void {
    if (task.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Task is not in progress');
    }
    if (task.section_id !== actorSectionId) {
      throw new ForbiddenException(
        'Task does not belong to your section',
      );
    }
    if (
      task.assigned_employee_id != null &&
      task.assigned_employee_id !== actorId
    ) {
      throw new ForbiddenException('Task is assigned to another employee');
    }
  }

  isLastTask(
    task: RequestTaskEntity,
    allTasks: RequestTaskEntity[],
  ): boolean {
    const maxOrder = Math.max(...allTasks.map((t) => t.task_order));
    return task.task_order === maxOrder;
  }
}
