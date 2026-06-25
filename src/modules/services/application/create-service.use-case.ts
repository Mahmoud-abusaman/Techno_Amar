import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  IServiceRepository,
} from '@services/domain/repositories/service-repository.interface';
import { IDepartmentRepository } from '@org/domain/repositories/department-repository.interface';
import { ISectionRepository } from '@org/domain/repositories/section-repository.interface';
import { ServiceWithTasksEntity } from '@services/domain/entities/service-with-tasks.entity';
import { CreateServiceDto } from '@services/presentation/dto/service.dto';

@Injectable()
export class CreateServiceUseCase {
  constructor(
    @Inject(IServiceRepository)
    private readonly serviceRepo: IServiceRepository,
    @Inject(IDepartmentRepository)
    private readonly deptRepo: IDepartmentRepository,
    @Inject(ISectionRepository)
    private readonly sectionRepo: ISectionRepository,
  ) {}

  async execute(
    data: CreateServiceDto,
    createdBy: bigint,
  ): Promise<ServiceWithTasksEntity> {
    const existing = await this.serviceRepo.findByName(data.name);
    if (existing)
      throw new ConflictException(`Service "${data.name}" already exists`);

    const dept = await this.deptRepo.findById(data.department_id);

    if (!dept)
      throw new NotFoundException(`Department ${data.department_id} not found`);
    if (!dept.is_active)
      throw new ConflictException(
        'Cannot assign service to an inactive department',
      );

    const workflowTasks = data.workflow_tasks.map((task, index) => ({
      section_id: task.section_id,
      name: task.name,
      description: task.description ?? null,
      task_order: index + 1,
      estimated_time_hours: task.estimated_time_hours,
    }));

    for (const task of workflowTasks) {
      const section = await this.sectionRepo.findById(task.section_id);
      if (!section)
        throw new NotFoundException(`Section ${task.section_id} not found`);
      if (!section.is_active)
        throw new ConflictException(
          'Cannot assign task to an inactive section',
        );
      if (section.department_id !== data.department_id)
        throw new ConflictException(
          'Task section must belong to the same department as the service',
        );
    }

    return this.serviceRepo.createWithTasks({
      name: data.name,
      description: data.description ?? null,
      department_id: data.department_id,
      fee: data.fee,
      estimated_processing_days: data.estimated_processing_days,
      created_by: createdBy,
      workflow_tasks: workflowTasks,
    });
  }
}
