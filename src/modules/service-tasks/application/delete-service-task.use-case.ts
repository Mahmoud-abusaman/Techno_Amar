import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { IServiceTaskRepository } from '@service-tasks/domain/repositories/service-task-repository.interface';
import { IServiceRepository } from '@services/domain/repositories/service-repository.interface';

@Injectable()
export class DeleteServiceTaskUseCase {
  constructor(
    @Inject(IServiceTaskRepository)
    private readonly taskRepo: IServiceTaskRepository,
    @Inject(IServiceRepository)
    private readonly serviceRepo: IServiceRepository,
  ) {}

  async execute(serviceId: bigint, taskId: bigint): Promise<void> {
    const service = await this.serviceRepo.findById(serviceId);
    if (!service) throw new NotFoundException(`Service ${serviceId} not found`);

    const task = await this.taskRepo.findByIdAndServiceId(taskId, serviceId);
    if (!task)
      throw new NotFoundException(
        `Workflow task ${taskId} not found for service ${serviceId}`,
      );
    if (!task.is_active)
      throw new ConflictException(
        `Workflow task ${taskId} is already inactive`,
      );

    await this.taskRepo.delete(taskId);
  }
}
