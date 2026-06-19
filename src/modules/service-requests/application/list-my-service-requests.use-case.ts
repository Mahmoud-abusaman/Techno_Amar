import { Injectable, Inject } from '@nestjs/common';
import { IServiceRequestRepository } from '@service-requests/domain/repositories/service-request-repository.interface';
import { IServiceRepository } from '@services/domain/repositories/service-repository.interface';
import {
  PublicServiceRequest,
  toPublicServiceRequest,
} from '@service-requests/application/service-request-response.mapper';

@Injectable()
export class ListMyServiceRequestsUseCase {
  constructor(
    @Inject(IServiceRequestRepository)
    private readonly requestRepo: IServiceRequestRepository,
    @Inject(IServiceRepository)
    private readonly serviceRepo: IServiceRepository,
  ) {}

  async execute(citizenId: bigint): Promise<PublicServiceRequest[]> {
    const requests = await this.requestRepo.findByCitizen(citizenId);

    return Promise.all(
      requests.map(async (request) => {
        const service = await this.serviceRepo.findById(request.service_id);
        return toPublicServiceRequest(request, service?.name);
      }),
    );
  }
}
