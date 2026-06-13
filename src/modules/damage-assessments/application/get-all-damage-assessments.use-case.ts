import { Injectable, Inject } from '@nestjs/common';
import {
  IDamageAssessmentRepository,
  DamageAssessmentFilters,
} from '@damage-assessments/domain/repositories/damage-assessment-repository.interface';
import {
  AdminDamageAssessment,
  toAdminDamageAssessment,
} from '@damage-assessments/application/damage-assessment-response.mapper';

@Injectable()
export class GetAllDamageAssessmentsUseCase {
  constructor(
    @Inject(IDamageAssessmentRepository)
    private readonly repo: IDamageAssessmentRepository,
  ) {}

  async execute(
    filters: DamageAssessmentFilters = {},
  ): Promise<AdminDamageAssessment[]> {
    const assessments = await this.repo.findAll(filters);
    return assessments.map(toAdminDamageAssessment);
  }
}
