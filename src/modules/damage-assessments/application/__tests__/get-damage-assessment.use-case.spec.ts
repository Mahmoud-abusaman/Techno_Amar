import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { GetDamageAssessmentUseCase } from '../get-damage-assessment.use-case';
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
  damage_severity: DamageSeverity.MINOR,
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

describe('GetDamageAssessmentUseCase', () => {
  let useCase: GetDamageAssessmentUseCase;
  let repo: jest.Mocked<IDamageAssessmentRepository>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new GetDamageAssessmentUseCase(repo);
  });

  it('returns assessment when citizen is the owner', async () => {
    repo.findById.mockResolvedValue(makeAssessment({ citizen_id: 10n }));

    const result = await useCase.execute(10n, 1n);

    expect(result.id).toBe('1');
    expect(result.citizen_id).toBe('10');
  });

  it('throws NotFoundException when assessment does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute(10n, 99n)).rejects.toThrow(
      new NotFoundException('Damage assessment 99 not found'),
    );
  });

  it('throws ForbiddenException when citizen is not the owner', async () => {
    repo.findById.mockResolvedValue(makeAssessment({ citizen_id: 20n }));

    await expect(useCase.execute(10n, 1n)).rejects.toThrow(
      new ForbiddenException(
        'You do not have access to this damage assessment',
      ),
    );
  });
});
