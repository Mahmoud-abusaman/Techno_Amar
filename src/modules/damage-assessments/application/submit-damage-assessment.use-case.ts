import {
  Injectable,
  Inject,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { IDamageAssessmentRepository } from '@damage-assessments/domain/repositories/damage-assessment-repository.interface';
import { SubmitDamageAssessmentDto } from '@damage-assessments/presentation/dto/damage-assessment.dto';
import {
  PublicDamageAssessment,
  toPublicDamageAssessment,
} from '@damage-assessments/application/damage-assessment-response.mapper';
import { ImageKitFileValidator } from '@uploads/application/imagekit-file.validator';
import { validateImageFile } from '@uploads/application/citizen-verification-file.validator';

@Injectable()
export class SubmitDamageAssessmentUseCase {
  constructor(
    @Inject(IDamageAssessmentRepository)
    private readonly repo: IDamageAssessmentRepository,
    private readonly fileValidator: ImageKitFileValidator,
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

    const images = data.images ?? [];
    if (images.length === 0) {
      throw new BadRequestException(
        'At least one damage photo must be uploaded',
      );
    }

    for (const image of images) {
      validateImageFile(image, this.fileValidator, 'Damage photo');
    }

    try {
      const assessment = await this.repo.create({
        citizen_id: citizenId,
        location: data.location,
        description: data.description,
        damage_severity: data.damage_severity,
        documents: images.map((image) => ({
          name: image.file_name,
          file_type: image.file_type,
          file_url: image.file_url,
          file_id: image.file_id,
          file_path: image.file_path ?? null,
        })),
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
