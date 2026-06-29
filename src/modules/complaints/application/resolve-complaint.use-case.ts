import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  IComplaintRepository,
} from '@complaints/domain/repositories/complaint-repository.interface';
import { ComplaintStatus } from '@/generated/prisma/enums';

export type ResolveComplaintInput = {
  id: bigint;
  status: ComplaintStatus;
  result?: string;
};

@Injectable()
export class ResolveComplaintUseCase {
  constructor(
    @Inject(IComplaintRepository)
    private readonly complaintRepo: IComplaintRepository,
  ) {}

  async execute(input: ResolveComplaintInput) {
    const complaint = await this.complaintRepo.findById(input.id);

    if (!complaint) {
      throw new NotFoundException(`Complaint #${input.id} not found`);
    }

    const allowedTransitions: ComplaintStatus[] = [
      ComplaintStatus.RESOLVED,
      ComplaintStatus.CLOSED,
    ];

    if (!allowedTransitions.includes(input.status)) {
      throw new BadRequestException(
        `Status must be RESOLVED or CLOSED. Provided: ${input.status}`,
      );
    }

    if (
      complaint.status === ComplaintStatus.RESOLVED ||
      complaint.status === ComplaintStatus.CLOSED
    ) {
      throw new BadRequestException(
        `Complaint is already ${complaint.status} and cannot be updated.`,
      );
    }

    const updated = await this.complaintRepo.updateComplaint(input.id, {
      status: input.status,
      adminResult: input.result,
    });

    return {
      id: updated.id.toString(),
      status: updated.status,
      admin_result: updated.admin_result ?? null,
      updated_at: updated.updated_at,
    };
  }
}
