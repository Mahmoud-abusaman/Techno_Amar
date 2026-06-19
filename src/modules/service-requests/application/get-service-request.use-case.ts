import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { IServiceRequestRepository } from '@service-requests/domain/repositories/service-request-repository.interface';
import {
  PublicServiceRequestDetail,
  toPublicServiceRequestDetail,
} from '@service-requests/application/service-request-response.mapper';

@Injectable()
export class GetServiceRequestUseCase {
  constructor(
    @Inject(IServiceRequestRepository)
    private readonly requestRepo: IServiceRequestRepository,
  ) {}

  async execute(
    citizenId: bigint,
    requestId: bigint,
  ): Promise<PublicServiceRequestDetail> {
    const request = await this.requestRepo.findByIdWithTasks(requestId);
    if (!request) {
      throw new NotFoundException(`Request ${requestId} not found`);
    }
    if (request.citizen_id !== citizenId) {
      throw new ForbiddenException('You can only view your own requests');
    }

    return toPublicServiceRequestDetail(request);
  }
}
