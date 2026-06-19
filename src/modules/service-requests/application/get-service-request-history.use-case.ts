import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { IServiceRequestRepository } from '@service-requests/domain/repositories/service-request-repository.interface';
import {
  PublicRequestActivity,
  toPublicRequestActivity,
} from '@service-requests/application/service-request-response.mapper';

@Injectable()
export class GetServiceRequestHistoryUseCase {
  constructor(
    @Inject(IServiceRequestRepository)
    private readonly requestRepo: IServiceRequestRepository,
  ) {}

  async execute(
    citizenId: bigint,
    requestId: bigint,
  ): Promise<PublicRequestActivity[]> {
    const request = await this.requestRepo.findById(requestId);
    if (!request) {
      throw new NotFoundException(`Request ${requestId} not found`);
    }
    if (request.citizen_id !== citizenId) {
      throw new ForbiddenException('You can only view your own requests');
    }

    const activities = await this.requestRepo.findActivities(requestId);
    return activities.map(toPublicRequestActivity);
  }
}
