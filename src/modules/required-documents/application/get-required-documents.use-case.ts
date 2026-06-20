import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IRequiredDocumentRepository } from '@required-documents/domain/repositories/required-document-repository.interface';
import { RequiredDocumentEntity } from '@required-documents/domain/entities/required-document.entity';

@Injectable()
export class GetRequiredDocumentsUseCase {
  constructor(
    @Inject(IRequiredDocumentRepository)
    private readonly docRepo: IRequiredDocumentRepository,
  ) {}

  async execute(
    serviceId: bigint,
    activeOnly = false,
  ): Promise<RequiredDocumentEntity[]> {
    return this.docRepo.findByService(serviceId, activeOnly);
  }
}

@Injectable()
export class GetRequiredDocumentUseCase {
  constructor(
    @Inject(IRequiredDocumentRepository)
    private readonly docRepo: IRequiredDocumentRepository,
  ) {}

  async execute(
    serviceId: bigint,
    documentId: bigint,
  ): Promise<RequiredDocumentEntity> {
    const doc = await this.docRepo.findByIdForService(documentId, serviceId);
    if (!doc) {
      throw new NotFoundException(
        `Required document ${documentId} not found for service ${serviceId}`,
      );
    }
    return doc;
  }
}
