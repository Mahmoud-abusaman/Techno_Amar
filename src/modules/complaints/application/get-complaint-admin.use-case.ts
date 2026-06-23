import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IComplaintRepository } from '@complaints/domain/repositories/complaint-repository.interface';
import {
  AdminComplaint,
  toAdminComplaint,
} from '@complaints/application/complaint-response.mapper';

@Injectable()
export class GetComplaintAdminUseCase {
  constructor(
    @Inject(IComplaintRepository)
    private readonly repo: IComplaintRepository,
  ) {}

  async execute(complaintId: bigint): Promise<AdminComplaint> {
    const complaint = await this.repo.findByIdWithCitizen(complaintId);
    if (!complaint) {
      throw new NotFoundException(`Complaint ${complaintId} not found`);
    }

    return toAdminComplaint(complaint);
  }
}
