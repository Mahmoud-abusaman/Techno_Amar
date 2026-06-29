import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { IRequiredDocumentRepository } from '@required-documents/domain/repositories/required-document-repository.interface';
import { IServiceRepository } from '@services/domain/repositories/service-repository.interface';
import { RequiredDocumentEntity } from '@required-documents/domain/entities/required-document.entity';
import { CreateRequiredDocumentDto } from '@required-documents/presentation/dto/required-document.dto';

@Injectable()
export class CreateRequiredDocumentUseCase {
  constructor(
    @Inject(IRequiredDocumentRepository)
    private readonly docRepo: IRequiredDocumentRepository,
    @Inject(IServiceRepository)
    private readonly serviceRepo: IServiceRepository,
  ) {}

  async execute(
    serviceId: bigint,
    data: CreateRequiredDocumentDto,
  ): Promise<RequiredDocumentEntity> {
    const service = await this.serviceRepo.findById(serviceId);
    if (!service) throw new NotFoundException(`Service ${serviceId} not found`);
    if (!service.is_active)
      throw new ConflictException(
        'Cannot add documents to an inactive service',
      );

    return this.docRepo.create({
      service_id: serviceId,
      name: data.name,
      description: data.description ?? null,
      type: data.type,
    });
  }
}
