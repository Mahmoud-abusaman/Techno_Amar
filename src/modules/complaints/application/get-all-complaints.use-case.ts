import { Injectable, Inject } from '@nestjs/common';
import {
  IComplaintRepository,
  ComplaintFilters,
} from '@complaints/domain/repositories/complaint-repository.interface';
import {
  AdminComplaint,
  toAdminComplaint,
} from '@complaints/application/complaint-response.mapper';

@Injectable()
export class GetAllComplaintsUseCase {
  constructor(
    @Inject(IComplaintRepository)
    private readonly repo: IComplaintRepository,
  ) {}

  async execute(filters: ComplaintFilters = {}): Promise<AdminComplaint[]> {
    const complaints = await this.repo.findAll(filters);
    return complaints.map(toAdminComplaint);
  }
}
