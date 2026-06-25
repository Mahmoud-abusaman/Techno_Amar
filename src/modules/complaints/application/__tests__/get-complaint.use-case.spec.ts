import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { GetComplaintUseCase } from '../get-complaint.use-case';
import { IComplaintRepository } from '@complaints/domain/repositories/complaint-repository.interface';
import { ComplaintEntity } from '@complaints/domain/entities/complaint.entity';
import {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from '@/generated/prisma/enums';

const makeComplaint = (
  overrides: Partial<ComplaintEntity> = {},
): ComplaintEntity => ({
  id: 1n,
  citizen_id: 10n,
  title: 'Delayed service',
  category: ComplaintCategory.SERVICE_QUALITY,
  priority: ComplaintPriority.MEDIUM,
  location: null,
  description: 'No response for 3 weeks',
  photo_name: null,
  photo_file_type: null,
  photo_url: null,
  photo_file_id: null,
  photo_file_path: null,
  status: ComplaintStatus.SUBMITTED,
  submitted_at: new Date('2026-06-23'),
  created_at: new Date('2026-06-23'),
  updated_at: new Date('2026-06-23'),
  ...overrides,
});

const makeRepo = (): jest.Mocked<IComplaintRepository> => ({
  create: jest.fn(),
  findByCitizenId: jest.fn(),
  findById: jest.fn(),
  findByIdWithCitizen: jest.fn(),
  findAll: jest.fn(),
});

describe('GetComplaintUseCase', () => {
  let useCase: GetComplaintUseCase;
  let repo: jest.Mocked<IComplaintRepository>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new GetComplaintUseCase(repo);
  });

  it('returns complaint for the owning citizen', async () => {
    repo.findById.mockResolvedValue(makeComplaint());

    const result = await useCase.execute(10n, 1n);

    expect(result.id).toBe('1');
    expect(result.title).toBe('Delayed service');
  });

  it('throws NotFoundException when complaint does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute(10n, 99n)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws ForbiddenException when citizen does not own the complaint', async () => {
    repo.findById.mockResolvedValue(makeComplaint({ citizen_id: 20n }));

    await expect(useCase.execute(10n, 1n)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
