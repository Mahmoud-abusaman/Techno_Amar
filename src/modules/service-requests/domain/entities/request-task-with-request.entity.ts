import { RequestTaskEntity } from './request-task.entity';
import { ServiceRequestEntity } from './service-request.entity';
import { RequestDocumentEntity } from './request-document.entity';

export class RequestTaskWithRequestEntity extends RequestTaskEntity {
  request: ServiceRequestEntity & { service_name: string };
  sibling_tasks: RequestTaskEntity[];
  documents: RequestDocumentEntity[];
}
