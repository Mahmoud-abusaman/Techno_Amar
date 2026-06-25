import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { IServiceRepository } from '@services/domain/repositories/service-repository.interface';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { IServiceRequestRepository } from '@service-requests/domain/repositories/service-request-repository.interface';
import { IRequiredDocumentRepository } from '@required-documents/domain/repositories/required-document-repository.interface';
import { ImageKitFileValidator } from '@uploads/application/imagekit-file.validator';
import { SubmitServiceRequestDto } from '@service-requests/presentation/dto/submit-service-request.dto';
import {
  AccountStatus,
  RequestActivityAction,
  RequestPaymentStatus,
  ServiceStatus,
  UserRole,
} from '@/generated/prisma/enums';
import {
  PublicServiceRequestDetail,
  toPublicServiceRequestDetail,
} from '@service-requests/application/service-request-response.mapper';

@Injectable()
export class SubmitServiceRequestUseCase {
  constructor(
    @Inject(IServiceRequestRepository)
    private readonly requestRepo: IServiceRequestRepository,
    @Inject(IServiceRepository)
    private readonly serviceRepo: IServiceRepository,
    @Inject(IUserRepository)
    private readonly userRepo: IUserRepository,
    @Inject(IRequiredDocumentRepository)
    private readonly requiredDocRepo: IRequiredDocumentRepository,
    private readonly fileValidator: ImageKitFileValidator,
  ) {}

  async execute(
    citizenId: bigint,
    dto: SubmitServiceRequestDto,
  ): Promise<PublicServiceRequestDetail> {
    const serviceId = dto.service_id;

    const citizen = await this.userRepo.findById(citizenId);
    if (!citizen) throw new NotFoundException('User not found');
    if (citizen.role !== UserRole.CITIZEN) {
      throw new BadRequestException('Only citizens can submit service requests');
    }
    if (
      citizen.account_status !== AccountStatus.ACTIVE ||
      !citizen.is_verified
    ) {
      throw new BadRequestException(
        'Citizen account must be verified before submitting requests',
      );
    }

    const service = await this.serviceRepo.findByIdWithTasks(serviceId, {
      activeTasksOnly: true,
    });
    if (!service) throw new NotFoundException(`Service ${serviceId} not found`);
    if (service.status !== ServiceStatus.PUBLISHED || !service.is_active) {
      throw new BadRequestException('Service is not available for requests');
    }
    if (service.workflow_tasks.length < 1) {
      throw new ConflictException(
        'Service has no active workflow tasks configured',
      );
    }
    if (service.fee > 0) {
      throw new BadRequestException(
        'Paid services are not supported yet; only free services can be requested',
      );
    }

    const requiredDocs = await this.requiredDocRepo.findByService(
      serviceId,
      true,
    );
    const mandatoryDocs = requiredDocs.filter((doc) => doc.type === 'MANDATORY');
    const submittedDocs = dto.documents ?? [];

    if (mandatoryDocs.length > 0 && submittedDocs.length === 0) {
      throw new BadRequestException(
        'Mandatory documents must be uploaded before submitting this request',
      );
    }

    const requiredDocIds = new Set(requiredDocs.map((doc) => doc.id.toString()));
    const seenRequiredIds = new Set<string>();

    for (const doc of submittedDocs) {
      const requiredId = doc.required_document_id;
      const requiredIdKey = requiredId.toString();

      if (!requiredDocIds.has(requiredIdKey)) {
        throw new BadRequestException(
          `Required document ${doc.required_document_id} does not belong to this service`,
        );
      }
      if (seenRequiredIds.has(requiredIdKey)) {
        throw new BadRequestException(
          `Duplicate upload for required document ${doc.required_document_id}`,
        );
      }
      seenRequiredIds.add(requiredIdKey);

      if (!this.fileValidator.isValidFileUrl(doc.file_url)) {
        throw new BadRequestException(
          'Document file URL must be hosted on the configured ImageKit endpoint',
        );
      }
      if (!this.fileValidator.isAllowedMimeType(doc.file_type)) {
        throw new BadRequestException('Only PDF files are allowed');
      }
    }

    for (const mandatory of mandatoryDocs) {
      if (!seenRequiredIds.has(mandatory.id.toString())) {
        throw new BadRequestException(
          `Missing mandatory document: ${mandatory.name}`,
        );
      }
    }

    const detail = await this.requestRepo.createWithTasks({
      citizen_id: citizenId,
      service_id: serviceId,
      payment_status: RequestPaymentStatus.NOT_REQUIRED,
      tasks: service.workflow_tasks.map((task) => ({
        service_task_id: task.id,
        section_id: task.section_id,
        name: task.name,
        task_order: task.task_order,
        estimated_time_hours: task.estimated_time_hours,
      })),
      documents: submittedDocs.map((doc) => ({
        required_document_id: doc.required_document_id,
        name: doc.file_name,
        file_type: doc.file_type,
        file_url: doc.file_url,
        file_id: doc.file_id,
        file_path: doc.file_path ?? null,
        uploaded_by: citizenId,
      })),
      activity: {
        actor_id: citizenId,
        action: RequestActivityAction.SUBMITTED,
        description: `Submitted request for service "${service.name}"`,
      },
    });

    return toPublicServiceRequestDetail(detail);
  }
}
