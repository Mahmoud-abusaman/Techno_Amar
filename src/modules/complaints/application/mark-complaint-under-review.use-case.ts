import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IComplaintRepository } from '@complaints/domain/repositories/complaint-repository.interface';
import { ComplaintStatus } from '@/generated/prisma/enums';

@Injectable()
export class MarkComplaintUnderReviewUseCase {
  constructor(
    @Inject(IComplaintRepository)
    private readonly complaintRepo: IComplaintRepository,
  ) {}

  async execute(id: bigint) {
    const complaint = await this.complaintRepo.findById(id);

    if (!complaint) {
      throw new NotFoundException(`Complaint #${id} not found`);
    }

    if (complaint.status !== ComplaintStatus.SUBMITTED) {
      throw new BadRequestException(
        `Only SUBMITTED complaints can be marked UNDER_REVIEW. Current status: ${complaint.status}`,
      );
    }

    const updated = await this.complaintRepo.updateComplaint(id, {
      status: ComplaintStatus.UNDER_REVIEW,
    });

    return {
      id: updated.id.toString(),
      status: updated.status,
      admin_result: updated.admin_result ?? null,
      updated_at: updated.updated_at,
    };
  }
}
