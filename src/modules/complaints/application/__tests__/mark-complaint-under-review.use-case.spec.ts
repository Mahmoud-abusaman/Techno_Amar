import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MarkComplaintUnderReviewUseCase } from '../mark-complaint-under-review.use-case';
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
  updateComplaint: jest.fn(),
});

describe('MarkComplaintUnderReviewUseCase', () => {
  let useCase: MarkComplaintUnderReviewUseCase;
  let repo: jest.Mocked<IComplaintRepository>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new MarkComplaintUnderReviewUseCase(repo);
  });

  it('marks a submitted complaint as under review', async () => {
    const updated = makeComplaint({ status: ComplaintStatus.UNDER_REVIEW });
    repo.findById.mockResolvedValue(makeComplaint());
    repo.updateComplaint.mockResolvedValue(updated);

    const result = await useCase.execute(1n);

    expect(repo.updateComplaint).toHaveBeenCalledWith(1n, {
      status: ComplaintStatus.UNDER_REVIEW,
    });
    expect(result.status).toBe(ComplaintStatus.UNDER_REVIEW);
  });

  it('throws NotFoundException when complaint does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute(99n)).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when complaint is not submitted', async () => {
    repo.findById.mockResolvedValue(
      makeComplaint({ status: ComplaintStatus.RESOLVED }),
    );

    await expect(useCase.execute(1n)).rejects.toThrow(BadRequestException);
    expect(repo.updateComplaint).not.toHaveBeenCalled();
  });
});
