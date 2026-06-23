import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { IComplaintRepository } from '@complaints/domain/repositories/complaint-repository.interface';
import {
  PublicComplaint,
  toPublicComplaint,
} from '@complaints/application/complaint-response.mapper';

@Injectable()
export class GetComplaintUseCase {
  constructor(
    @Inject(IComplaintRepository)
    private readonly repo: IComplaintRepository,
  ) {}

  async execute(
    citizenId: bigint,
    complaintId: bigint,
  ): Promise<PublicComplaint> {
    const complaint = await this.repo.findById(complaintId);
    if (!complaint) {
      throw new NotFoundException(`Complaint ${complaintId} not found`);
    }

    if (complaint.citizen_id !== citizenId) {
      throw new ForbiddenException('You do not have access to this complaint');
    }

    return toPublicComplaint(complaint);
  }
}
