import { ServiceEntity } from './service.entity';
import { ServiceTaskSummaryEntity } from './service-task-summary.entity';

export class ServiceWithTasksEntity extends ServiceEntity {
  workflow_tasks: ServiceTaskSummaryEntity[];
}
