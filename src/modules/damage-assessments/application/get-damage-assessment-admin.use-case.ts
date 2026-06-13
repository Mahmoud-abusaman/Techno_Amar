import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IDamageAssessmentRepository,
} from '@damage-assessments/domain/repositories/damage-assessment-repository.interface';
import {
  AdminDamageAssessment,
  toAdminDamageAssessment,
} from '@damage-assessments/application/damage-assessment-response.mapper';

@Injectable()
export class GetDamageAssessmentAdminUseCase {
  constructor(
    @Inject(IDamageAssessmentRepository)
    private readonly repo: IDamageAssessmentRepository,
  ) {}

  async execute(assessmentId: bigint): Promise<AdminDamageAssessment> {
    const assessment = await this.repo.findByIdWithCitizen(assessmentId);
    if (!assessment) {
      throw new NotFoundException(
        `Damage assessment ${assessmentId} not found`,
      );
    }

    return toAdminDamageAssessment(assessment);
  }
}
