import { ConflictException } from '@nestjs/common';
import { SubmitDamageAssessmentUseCase } from '../submit-damage-assessment.use-case';
import { IDamageAssessmentRepository } from '@damage-assessments/domain/repositories/damage-assessment-repository.interface';
import { DamageAssessmentEntity } from '@damage-assessments/domain/entities/damage-assessment.entity';
import {
  DamageAssessmentStatus,
  DamageSeverity,
} from '@/generated/prisma/enums';

const makeAssessment = (
  overrides: Partial<DamageAssessmentEntity> = {},
): DamageAssessmentEntity => ({
  id: 1n,
  citizen_id: 10n,
  location: 'Al-Rimal Street',
  description: 'Roof damage',
  damage_severity: DamageSeverity.MODERATE,
  status: DamageAssessmentStatus.SUBMITTED,
  submitted_at: new Date('2026-06-13'),
  created_at: new Date('2026-06-13'),
  updated_at: new Date('2026-06-13'),
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

  const dto = {
    location: 'Al-Rimal Street',
    description: 'Roof damage',
    damage_severity: DamageSeverity.MODERATE,
  };

  beforeEach(() => {
    repo = makeRepo();
    useCase = new SubmitDamageAssessmentUseCase(repo);
  });

  it('creates and returns assessment on first submission', async () => {
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
    });
    expect(result.id).toBe('1');
    expect(result.citizen_id).toBe('10');
    expect(result.damage_severity).toBe(DamageSeverity.MODERATE);
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
