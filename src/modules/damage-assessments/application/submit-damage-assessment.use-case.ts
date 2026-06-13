import {
  Injectable,
  Inject,
  ConflictException,
} from '@nestjs/common';
import {
  IDamageAssessmentRepository,
} from '@damage-assessments/domain/repositories/damage-assessment-repository.interface';
import { SubmitDamageAssessmentDto } from '@damage-assessments/presentation/dto/damage-assessment.dto';
import {
  PublicDamageAssessment,
  toPublicDamageAssessment,
} from '@damage-assessments/application/damage-assessment-response.mapper';

@Injectable()
export class SubmitDamageAssessmentUseCase {
  constructor(
    @Inject(IDamageAssessmentRepository)
    private readonly repo: IDamageAssessmentRepository,
  ) {}

  async execute(
    citizenId: bigint,
    data: SubmitDamageAssessmentDto,
  ): Promise<PublicDamageAssessment> {
    const existing = await this.repo.findByCitizenId(citizenId);
    if (existing) {
      throw new ConflictException(
        'You have already submitted a damage assessment',
      );
    }

    try {
      const assessment = await this.repo.create({
        citizen_id: citizenId,
        location: data.location,
        description: data.description,
        damage_severity: data.damage_severity,
      });

      return toPublicDamageAssessment(assessment);
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException(
          'You have already submitted a damage assessment',
        );
      }
      throw err;
    }
  }
}
