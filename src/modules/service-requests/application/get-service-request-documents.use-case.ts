import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { IServiceRequestRepository } from '@service-requests/domain/repositories/service-request-repository.interface';
import {
  PublicRequestDocument,
  toPublicRequestDocument,
} from '@service-requests/application/service-request-response.mapper';

@Injectable()
export class GetServiceRequestDocumentsUseCase {
  constructor(
    @Inject(IServiceRequestRepository)
    private readonly requestRepo: IServiceRequestRepository,
  ) {}

  async execute(
    citizenId: bigint,
    requestId: bigint,
  ): Promise<PublicRequestDocument[]> {
    const request = await this.requestRepo.findById(requestId);
    if (!request) {
      throw new NotFoundException(`Request ${requestId} not found`);
    }
    if (request.citizen_id !== citizenId) {
      throw new ForbiddenException('You can only view your own requests');
    }

    const documents = await this.requestRepo.findDocuments(requestId);
    return documents.map(toPublicRequestDocument);
  }
}
