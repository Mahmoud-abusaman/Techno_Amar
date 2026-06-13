import { Injectable, Inject } from '@nestjs/common';
import {
  IDamageAssessmentRepository,
} from '@damage-assessments/domain/repositories/damage-assessment-repository.interface';
import { DamageAssessmentSubmissionStatus } from '@damage-assessments/application/damage-assessment-response.mapper';

@Injectable()
export class GetDamageAssessmentSubmissionStatusUseCase {
  constructor(
    @Inject(IDamageAssessmentRepository)
    private readonly repo: IDamageAssessmentRepository,
  ) {}

  async execute(citizenId: bigint): Promise<DamageAssessmentSubmissionStatus> {
    const assessment = await this.repo.findByCitizenId(citizenId);

    if (!assessment) {
      return { has_submitted: false };
    }

    return {
      has_submitted: true,
      assessment_id: assessment.id.toString(),
    };
  }
}
