import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { IServiceRequestRepository } from '@service-requests/domain/repositories/service-request-repository.interface';
import { IRequestTaskRepository } from '@service-requests/domain/repositories/request-task-repository.interface';
import { RequestWorkflowService } from '@service-requests/application/request-workflow.service';
import {
  PublicRequestDocument,
  toPublicRequestDocument,
} from '@service-requests/application/service-request-response.mapper';
import { AttachTaskDocumentDto } from '@service-requests/presentation/dto/attach-task-document.dto';
import { ImageKitFileValidator } from '@uploads/application/imagekit-file.validator';
import { validatePdfFile } from '@uploads/application/citizen-verification-file.validator';
import { RequestDocumentCategory } from '@/generated/prisma/enums';

@Injectable()
export class AttachTaskDocumentUseCase {
  constructor(
    @Inject(IRequestTaskRepository)
    private readonly taskRepo: IRequestTaskRepository,
    @Inject(IServiceRequestRepository)
    private readonly requestRepo: IServiceRequestRepository,
    @Inject(IUserRepository)
    private readonly userRepo: IUserRepository,
    private readonly workflow: RequestWorkflowService,
    private readonly fileValidator: ImageKitFileValidator,
  ) {}

  async execute(
    actorId: bigint,
    taskId: bigint,
    dto: AttachTaskDocumentDto,
  ): Promise<PublicRequestDocument> {
    const actor = await this.userRepo.findById(actorId);
    if (!actor) throw new NotFoundException('User not found');
    if (!actor.section_id) {
      throw new BadRequestException('User is not assigned to a section');
    }

    validatePdfFile(dto, this.fileValidator, 'Task document');

    const task = await this.taskRepo.findByIdWithRequest(taskId);
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);

    this.workflow.assertRequestNotTerminal(task.request.status);
    if (task.section_id !== actor.section_id) {
      throw new ForbiddenException('Task does not belong to your section');
    }

    const document = await this.requestRepo.addDocument(task.request_id, {
      task_id: taskId,
      name: dto.file_name,
      file_type: dto.file_type,
      file_url: dto.file_url,
      file_id: dto.file_id,
      file_path: dto.file_path ?? null,
      category: RequestDocumentCategory.INTERNAL,
      uploaded_by: actorId,
    });

    return toPublicRequestDocument(document);
  }
}
