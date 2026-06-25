import { Injectable, Inject } from '@nestjs/common';
import { IComplaintRepository } from '@complaints/domain/repositories/complaint-repository.interface';
import {
  PublicComplaint,
  toPublicComplaint,
} from '@complaints/application/complaint-response.mapper';

@Injectable()
export class GetMyComplaintsUseCase {
  constructor(
    @Inject(IComplaintRepository)
    private readonly repo: IComplaintRepository,
  ) {}

  async execute(citizenId: bigint): Promise<PublicComplaint[]> {
    const complaints = await this.repo.findByCitizenId(citizenId);
    return complaints.map(toPublicComplaint);
  }
}
