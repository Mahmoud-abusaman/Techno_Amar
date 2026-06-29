import { Injectable, Inject } from '@nestjs/common';
import { IDamageAssessmentRepository } from '@damage-assessments/domain/repositories/damage-assessment-repository.interface';
import {
  PublicDamageAssessment,
  toPublicDamageAssessment,
} from '@damage-assessments/application/damage-assessment-response.mapper';

@Injectable()
export class GetMyDamageAssessmentsUseCase {
  constructor(
    @Inject(IDamageAssessmentRepository)
    private readonly repo: IDamageAssessmentRepository,
  ) {}

  async execute(citizenId: bigint): Promise<PublicDamageAssessment[]> {
    const assessment = await this.repo.findByCitizenId(citizenId);
    return assessment ? [toPublicDamageAssessment(assessment)] : [];
  }
}
