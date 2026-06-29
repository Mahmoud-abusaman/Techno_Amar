import { SubmitComplaintUseCase } from '../submit-complaint.use-case';
import { IComplaintRepository } from '@complaints/domain/repositories/complaint-repository.interface';
import { ComplaintEntity } from '@complaints/domain/entities/complaint.entity';
import {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from '@/generated/prisma/enums';
import { ImageKitFileValidator } from '@uploads/application/imagekit-file.validator';

const makeComplaint = (
  overrides: Partial<ComplaintEntity> = {},
): ComplaintEntity => ({
  id: 1n,
  citizen_id: 10n,
  title: 'Delayed service',
  category: ComplaintCategory.SERVICE_QUALITY,
  priority: ComplaintPriority.MEDIUM,
  location: 'Gaza City',
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

describe('SubmitComplaintUseCase', () => {
  let useCase: SubmitComplaintUseCase;
  let repo: jest.Mocked<IComplaintRepository>;
  let fileValidator: jest.Mocked<
    Pick<ImageKitFileValidator, 'isValidFileUrl' | 'isAllowedImageMimeType'>
  >;

  const dto = {
    title: 'Delayed service',
    category: ComplaintCategory.SERVICE_QUALITY,
    location: 'Gaza City',
    description: 'No response for 3 weeks',
  };

  beforeEach(() => {
    repo = makeRepo();
    fileValidator = {
      isValidFileUrl: jest.fn().mockReturnValue(true),
      isAllowedImageMimeType: jest.fn().mockReturnValue(true),
    };
    useCase = new SubmitComplaintUseCase(
      repo,
      fileValidator as unknown as ImageKitFileValidator,
    );
  });

  it('creates and returns a complaint without a photo', async () => {
    const complaint = makeComplaint();
    repo.create.mockResolvedValue(complaint);

    const result = await useCase.execute(10n, dto);

    expect(repo.create).toHaveBeenCalledWith({
      citizen_id: 10n,
      title: dto.title,
      category: dto.category,
      priority: ComplaintPriority.MEDIUM,
      location: dto.location,
      description: dto.description,
      photo_name: null,
      photo_file_type: null,
      photo_url: null,
      photo_file_id: null,
      photo_file_path: null,
    });
    expect(result.id).toBe('1');
    expect(result.photo).toBeNull();
  });

  it('allows multiple complaints from the same citizen', async () => {
    const complaint = makeComplaint({ id: 2n });
    repo.create.mockResolvedValue(complaint);

    const result = await useCase.execute(10n, dto);

    expect(result.id).toBe('2');
    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it('creates complaint with optional photo', async () => {
    const photo = {
      file_name: 'evidence.jpg',
      file_type: 'image/jpeg',
      file_url: 'https://ik.imagekit.io/TechnoAmar/complaints/evidence.jpg',
      file_id: 'file_evidence1',
    };
    const complaint = makeComplaint({
      photo_name: photo.file_name,
      photo_file_type: photo.file_type,
      photo_url: photo.file_url,
      photo_file_id: photo.file_id,
    });
    repo.create.mockResolvedValue(complaint);

    const result = await useCase.execute(10n, { ...dto, photo });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        photo_name: photo.file_name,
        photo_url: photo.file_url,
      }),
    );
    expect(result.photo?.file_url).toBe(photo.file_url);
  });
});
