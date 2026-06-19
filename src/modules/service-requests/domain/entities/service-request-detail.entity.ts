import { ServiceRequestEntity } from './service-request.entity';
import { RequestTaskEntity } from './request-task.entity';

export class ServiceRequestDetailEntity extends ServiceRequestEntity {
  service_name: string;
  tasks: RequestTaskEntity[];
}
