import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { IDamageAssessmentRepository } from '@damage-assessments/domain/repositories/damage-assessment-repository.interface';
import {
  PublicDamageAssessment,
  toPublicDamageAssessment,
} from '@damage-assessments/application/damage-assessment-response.mapper';

@Injectable()
export class GetDamageAssessmentUseCase {
  constructor(
    @Inject(IDamageAssessmentRepository)
    private readonly repo: IDamageAssessmentRepository,
  ) {}

  async execute(
    citizenId: bigint,
    assessmentId: bigint,
  ): Promise<PublicDamageAssessment> {
    const assessment = await this.repo.findById(assessmentId);
    if (!assessment) {
      throw new NotFoundException(
        `Damage assessment ${assessmentId} not found`,
      );
    }

    if (assessment.citizen_id !== citizenId) {
      throw new ForbiddenException(
        'You do not have access to this damage assessment',
      );
    }

    return toPublicDamageAssessment(assessment);
  }
}
