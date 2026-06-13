import { Module } from '@nestjs/common';
import { IDamageAssessmentRepository } from '@damage-assessments/domain/repositories/damage-assessment-repository.interface';
import { PrismaDamageAssessmentRepository } from '@damage-assessments/infrastructure/prisma-damage-assessment.repository';
import { SubmitDamageAssessmentUseCase } from '@damage-assessments/application/submit-damage-assessment.use-case';
import { GetMyDamageAssessmentsUseCase } from '@damage-assessments/application/get-my-damage-assessments.use-case';
import { GetDamageAssessmentSubmissionStatusUseCase } from '@damage-assessments/application/get-damage-assessment-submission-status.use-case';
import { GetDamageAssessmentUseCase } from '@damage-assessments/application/get-damage-assessment.use-case';
import { GetAllDamageAssessmentsUseCase } from '@damage-assessments/application/get-all-damage-assessments.use-case';
import { GetDamageAssessmentAdminUseCase } from '@damage-assessments/application/get-damage-assessment-admin.use-case';
import { DamageAssessmentsController } from '@damage-assessments/presentation/damage-assessments.controller';
import { AdminDamageAssessmentsController } from '@damage-assessments/presentation/admin-damage-assessments.controller';

@Module({
  controllers: [DamageAssessmentsController, AdminDamageAssessmentsController],
  providers: [
    {
      provide: IDamageAssessmentRepository,
      useClass: PrismaDamageAssessmentRepository,
    },
    SubmitDamageAssessmentUseCase,
    GetMyDamageAssessmentsUseCase,
    GetDamageAssessmentSubmissionStatusUseCase,
    GetDamageAssessmentUseCase,
    GetAllDamageAssessmentsUseCase,
    GetDamageAssessmentAdminUseCase,
  ],
  exports: [IDamageAssessmentRepository],
})
export class DamageAssessmentsModule {}
