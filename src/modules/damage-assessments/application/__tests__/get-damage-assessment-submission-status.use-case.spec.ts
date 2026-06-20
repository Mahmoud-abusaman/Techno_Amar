import { GetDamageAssessmentSubmissionStatusUseCase } from '../get-damage-assessment-submission-status.use-case';
import { IDamageAssessmentRepository } from '@damage-assessments/domain/repositories/damage-assessment-repository.interface';
import { DamageAssessmentEntity } from '@damage-assessments/domain/entities/damage-assessment.entity';
import {
  DamageAssessmentStatus,
  DamageSeverity,
} from '@/generated/prisma/enums';

const makeAssessment = (
  overrides: Partial<DamageAssessmentEntity> = {},
): DamageAssessmentEntity => ({
  id: 5n,
  citizen_id: 10n,
  location: 'Al-Rimal Street',
  description: 'Roof damage',
  damage_severity: DamageSeverity.SEVERE,
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

describe('GetDamageAssessmentSubmissionStatusUseCase', () => {
  let useCase: GetDamageAssessmentSubmissionStatusUseCase;
  let repo: jest.Mocked<IDamageAssessmentRepository>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new GetDamageAssessmentSubmissionStatusUseCase(repo);
  });

  it('returns has_submitted false when no assessment exists', async () => {
    repo.findByCitizenId.mockResolvedValue(null);

    const result = await useCase.execute(10n);

    expect(result).toEqual({ has_submitted: false });
  });

  it('returns has_submitted true with assessment_id when assessment exists', async () => {
    repo.findByCitizenId.mockResolvedValue({
      ...makeAssessment({ id: 5n }),
      documents: [],
    });

    const result = await useCase.execute(10n);

    expect(result).toEqual({
      has_submitted: true,
      assessment_id: '5',
    });
  });
});
