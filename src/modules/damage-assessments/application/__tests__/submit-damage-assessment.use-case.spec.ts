import { ConflictException, BadRequestException } from '@nestjs/common';
import { SubmitDamageAssessmentUseCase } from '../submit-damage-assessment.use-case';
import { IDamageAssessmentRepository } from '@damage-assessments/domain/repositories/damage-assessment-repository.interface';
import {
  DamageAssessmentEntity,
  DamageAssessmentDocumentEntity,
} from '@damage-assessments/domain/entities/damage-assessment.entity';
import {
  DamageAssessmentStatus,
  DamageSeverity,
} from '@/generated/prisma/enums';
import { ImageKitFileValidator } from '@uploads/application/imagekit-file.validator';

const makeAssessment = (
  overrides: Partial<DamageAssessmentEntity> = {},
): DamageAssessmentEntity & { documents: DamageAssessmentDocumentEntity[] } => ({
  id: 1n,
  citizen_id: 10n,
  location: 'Al-Rimal Street',
  description: 'Roof damage',
  damage_severity: DamageSeverity.MODERATE,
  status: DamageAssessmentStatus.SUBMITTED,
  submitted_at: new Date('2026-06-13'),
  created_at: new Date('2026-06-13'),
  updated_at: new Date('2026-06-13'),
  documents: [
    {
      id: 1n,
      assessment_id: 1n,
      name: 'damage.jpg',
      file_type: 'image/jpeg',
      file_url: 'https://ik.imagekit.io/TechnoAmar/damage/damage.jpg',
      file_id: 'file_damage1',
      file_path: null,
      uploaded_at: new Date('2026-06-13'),
      created_at: new Date('2026-06-13'),
    },
  ],
  ...overrides,
});

const makeRepo = (): jest.Mocked<IDamageAssessmentRepository> => ({
  create: jest.fn(),
  findByCitizenId: jest.fn(),
  findById: jest.fn(),
  findByIdWithCitizen: jest.fn(),
  findAll: jest.fn(),
});

describe('SubmitDamageAssessmentUseCase', () => {
  let useCase: SubmitDamageAssessmentUseCase;
  let repo: jest.Mocked<IDamageAssessmentRepository>;
  let fileValidator: jest.Mocked<
    Pick<ImageKitFileValidator, 'isValidFileUrl' | 'isAllowedImageMimeType'>
  >;

  const dto = {
    location: 'Al-Rimal Street',
    description: 'Roof damage',
    damage_severity: DamageSeverity.MODERATE,
    images: [
      {
        file_name: 'damage.jpg',
        file_type: 'image/jpeg',
        file_url: 'https://ik.imagekit.io/TechnoAmar/damage/damage.jpg',
        file_id: 'file_damage1',
      },
    ],
  };

  beforeEach(() => {
    repo = makeRepo();
    fileValidator = {
      isValidFileUrl: jest.fn().mockReturnValue(true),
      isAllowedImageMimeType: jest.fn().mockReturnValue(true),
    };
    useCase = new SubmitDamageAssessmentUseCase(
      repo,
      fileValidator as unknown as ImageKitFileValidator,
    );
  });

  it('creates and returns assessment with images on first submission', async () => {
    const assessment = makeAssessment();
    repo.findByCitizenId.mockResolvedValue(null);
    repo.create.mockResolvedValue(assessment);

    const result = await useCase.execute(10n, dto);

    expect(repo.findByCitizenId).toHaveBeenCalledWith(10n);
    expect(repo.create).toHaveBeenCalledWith({
      citizen_id: 10n,
      location: dto.location,
      description: dto.description,
      damage_severity: dto.damage_severity,
      documents: [
        {
          name: dto.images[0].file_name,
          file_type: dto.images[0].file_type,
          file_url: dto.images[0].file_url,
          file_id: dto.images[0].file_id,
          file_path: null,
        },
      ],
    });
    expect(result.id).toBe('1');
    expect(result.images).toHaveLength(1);
    expect(result.images[0].file_url).toBe(dto.images[0].file_url);
  });

  it('throws BadRequestException when no images are provided', async () => {
    repo.findByCitizenId.mockResolvedValue(null);

    await expect(
      useCase.execute(10n, { ...dto, images: [] }),
    ).rejects.toThrow(BadRequestException);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('throws ConflictException when citizen already submitted', async () => {
    repo.findByCitizenId.mockResolvedValue(makeAssessment());

    await expect(useCase.execute(10n, dto)).rejects.toThrow(
      new ConflictException('You have already submitted a damage assessment'),
    );
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('throws ConflictException on Prisma P2002 unique violation', async () => {
    repo.findByCitizenId.mockResolvedValue(null);
    repo.create.mockRejectedValue({ code: 'P2002', meta: { target: ['citizen_id'] } });

    await expect(useCase.execute(10n, dto)).rejects.toThrow(
      new ConflictException('You have already submitted a damage assessment'),
    );
  });
});
