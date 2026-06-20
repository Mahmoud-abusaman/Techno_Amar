import { Module, forwardRef } from '@nestjs/common';
import { ServicesModule } from '@services/services.module';
import { IRequiredDocumentRepository } from '@required-documents/domain/repositories/required-document-repository.interface';
import { PrismaRequiredDocumentRepository } from '@required-documents/infrastructure/prisma-required-document.repository';
import { CreateRequiredDocumentUseCase } from '@required-documents/application/create-required-document.use-case';
import {
  GetRequiredDocumentsUseCase,
  GetRequiredDocumentUseCase,
} from '@required-documents/application/get-required-documents.use-case';
import {
  UpdateRequiredDocumentUseCase,
  DeleteRequiredDocumentUseCase,
} from '@required-documents/application/update-required-document.use-case';
import { AdminRequiredDocumentsController } from '@required-documents/presentation/admin-required-documents.controller';

@Module({
  imports: [forwardRef(() => ServicesModule)],
  controllers: [AdminRequiredDocumentsController],
  providers: [
    {
      provide: IRequiredDocumentRepository,
      useClass: PrismaRequiredDocumentRepository,
    },
    CreateRequiredDocumentUseCase,
    GetRequiredDocumentsUseCase,
    GetRequiredDocumentUseCase,
    UpdateRequiredDocumentUseCase,
    DeleteRequiredDocumentUseCase,
  ],
  exports: [IRequiredDocumentRepository, GetRequiredDocumentsUseCase],
})
export class RequiredDocumentsModule {}
