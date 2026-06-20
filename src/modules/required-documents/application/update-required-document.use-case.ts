import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { IRequiredDocumentRepository } from '@required-documents/domain/repositories/required-document-repository.interface';
import { RequiredDocumentEntity } from '@required-documents/domain/entities/required-document.entity';
import { UpdateRequiredDocumentDto } from '@required-documents/presentation/dto/required-document.dto';

@Injectable()
export class UpdateRequiredDocumentUseCase {
  constructor(
    @Inject(IRequiredDocumentRepository)
    private readonly docRepo: IRequiredDocumentRepository,
  ) {}

  async execute(
    serviceId: bigint,
    documentId: bigint,
    data: UpdateRequiredDocumentDto,
  ): Promise<RequiredDocumentEntity> {
    const doc = await this.docRepo.findByIdForService(documentId, serviceId);
    if (!doc) {
      throw new NotFoundException(
        `Required document ${documentId} not found for service ${serviceId}`,
      );
    }
    if (!doc.is_active)
      throw new ConflictException('Required document is already inactive');

    return this.docRepo.update(documentId, {
      name: data.name,
      description: data.description,
      type: data.type,
    });
  }
}

@Injectable()
export class DeleteRequiredDocumentUseCase {
  constructor(
    @Inject(IRequiredDocumentRepository)
    private readonly docRepo: IRequiredDocumentRepository,
  ) {}

  async execute(serviceId: bigint, documentId: bigint): Promise<void> {
    const doc = await this.docRepo.findByIdForService(documentId, serviceId);
    if (!doc) {
      throw new NotFoundException(
        `Required document ${documentId} not found for service ${serviceId}`,
      );
    }
    if (!doc.is_active)
      throw new ConflictException('Required document is already inactive');

    await this.docRepo.delete(documentId);
  }
}
