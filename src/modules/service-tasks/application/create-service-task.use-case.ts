import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { IServiceTaskRepository } from '@service-tasks/domain/repositories/service-task-repository.interface';
import { IServiceRepository } from '@services/domain/repositories/service-repository.interface';
import { ISectionRepository } from '@org/domain/repositories/section-repository.interface';
import { ServiceTaskEntity } from '@service-tasks/domain/entities/service-task.entity';
import { CreateServiceTaskDto } from '@service-tasks/presentation/dto/service-task.dto';

@Injectable()
export class CreateServiceTaskUseCase {
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
    data: CreateServiceTaskDto,
  ): Promise<ServiceTaskEntity> {
    const service = await this.serviceRepo.findById(serviceId);
    if (!service) throw new NotFoundException(`Service ${serviceId} not found`);
    if (!service.is_active)
      throw new ConflictException('Cannot add tasks to an inactive service');

    const section = await this.sectionRepo.findById(data.section_id);
    if (!section)
      throw new NotFoundException(`Section ${data.section_id} not found`);
    if (!section.is_active)
      throw new ConflictException('Cannot assign task to an inactive section');
    if (section.department_id !== service.department_id)
      throw new ConflictException(
        'Task section must belong to the same department as the service',
      );

    let taskOrder = data.task_order;
    if (taskOrder == null) {
      taskOrder = (await this.taskRepo.getMaxOrder(serviceId)) + 1;
    } else {
      await this.taskRepo.incrementOrdersFrom(serviceId, taskOrder);
    }

    return this.taskRepo.create({
      service_id: serviceId,
      section_id: data.section_id,
      name: data.name,
      description: data.description ?? null,
      task_order: taskOrder,
      estimated_time_hours: data.estimated_time_hours,
    });
  }
}
