import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  IServiceTaskRepository,
  UpdateServiceTaskData,
} from '@service-tasks/domain/repositories/service-task-repository.interface';
import { IServiceRepository } from '@services/domain/repositories/service-repository.interface';
import { ISectionRepository } from '@org/domain/repositories/section-repository.interface';
import { ServiceTaskEntity } from '@service-tasks/domain/entities/service-task.entity';

@Injectable()
export class UpdateServiceTaskUseCase {
  constructor(
    @Inject(IServiceTaskRepository)
    private readonly taskRepo: IServiceTaskRepository,
    @Inject(IServiceRepository)
    private readonly serviceRepo: IServiceRepository,
    @Inject(ISectionRepository)
    private readonly sectionRepo: ISectionRepository,
  ) {}

  async execute(
    serviceId: bigint,
    taskId: bigint,
    data: UpdateServiceTaskData,
  ): Promise<ServiceTaskEntity> {
    const service = await this.serviceRepo.findById(serviceId);
    if (!service) throw new NotFoundException(`Service ${serviceId} not found`);

    const task = await this.taskRepo.findByIdAndServiceId(taskId, serviceId);
    if (!task)
      throw new NotFoundException(
        `Workflow task ${taskId} not found for service ${serviceId}`,
      );

    if (data.section_id && data.section_id !== task.section_id) {
      const section = await this.sectionRepo.findById(data.section_id);
      if (!section)
        throw new NotFoundException(`Section ${data.section_id} not found`);
      if (!section.is_active)
        throw new ConflictException('Cannot assign task to an inactive section');
      if (section.department_id !== service.department_id)
        throw new ConflictException(
          'Task section must belong to the same department as the service',
        );
    }

    const updateData = { ...data };
    let reordered = false;

    if (data.task_order != null && data.task_order !== task.task_order) {
      await this.taskRepo.reorderTask(
        serviceId,
        taskId,
        task.task_order,
        data.task_order,
      );
      delete updateData.task_order;
      reordered = true;
    }

    if (Object.keys(updateData).length === 0) {
      if (reordered) {
        const updated = await this.taskRepo.findById(taskId);
        if (!updated)
          throw new NotFoundException(
            `Workflow task ${taskId} not found for service ${serviceId}`,
          );
        return updated;
      }
      return task;
    }

    return this.taskRepo.update(taskId, updateData);
  }
}
