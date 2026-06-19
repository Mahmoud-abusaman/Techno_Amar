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
  ) {}

  async execute(
    citizenId: bigint,
    serviceId: bigint,
  ): Promise<PublicServiceRequestDetail> {
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
      activity: {
        actor_id: citizenId,
        action: RequestActivityAction.SUBMITTED,
        description: `Submitted request for service "${service.name}"`,
      },
    });

    return toPublicServiceRequestDetail(detail);
  }
}
