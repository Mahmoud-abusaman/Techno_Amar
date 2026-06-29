import { NotFoundException, ConflictException } from '@nestjs/common';
import { CreateSectionUseCase } from '../create-section.use-case';
import { ISectionRepository } from '@org/domain/repositories/section-repository.interface';
import { IDepartmentRepository } from '@org/domain/repositories/department-repository.interface';
import { SectionEntity } from '@org/domain/entities/section.entity';
import { DepartmentEntity } from '@org/domain/entities/department.entity';
import { CreateSectionDto } from '../../../presentation/dto/section.dto';

const makeSection = (
  overrides: Partial<SectionEntity> = {},
): SectionEntity => ({
  id: 1n,
  department_id: 10n,
  name: 'Road Maintenance',
  description: null,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

const makeDept = (
  overrides: Partial<DepartmentEntity> = {},
): DepartmentEntity => ({
  id: 10n,
  name: 'Civil Engineering',
  description: null,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

const makeSectionRepo = (): jest.Mocked<ISectionRepository> => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByNameInDepartment: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const makeDeptRepo = (): jest.Mocked<IDepartmentRepository> => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByName: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const dto: CreateSectionDto = {
  department_id: 10n,
  name: 'Road Maintenance',
  description: 'Road maintenance section',
};

describe('CreateSectionUseCase', () => {
  let useCase: CreateSectionUseCase;
  let sectionRepo: jest.Mocked<ISectionRepository>;
  let deptRepo: jest.Mocked<IDepartmentRepository>;

  beforeEach(() => {
    sectionRepo = makeSectionRepo();
    deptRepo = makeDeptRepo();
    useCase = new CreateSectionUseCase(sectionRepo, deptRepo);
  });

  it('creates section when valid data is provided', async () => {
    const section = makeSection();
    deptRepo.findById.mockResolvedValue(makeDept());
    sectionRepo.findByNameInDepartment.mockResolvedValue(null);
    sectionRepo.create.mockResolvedValue(section);

    const result = await useCase.execute(dto);

    expect(result).toBe(section);
    expect(sectionRepo.create).toHaveBeenCalledWith(dto);
  });

  it('throws NotFoundException when department does not exist', async () => {
    deptRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(dto)).rejects.toThrow(NotFoundException);
    expect(sectionRepo.create).not.toHaveBeenCalled();
  });

  it('throws ConflictException when department is inactive', async () => {
    deptRepo.findById.mockResolvedValue(makeDept({ is_active: false }));

    await expect(useCase.execute(dto)).rejects.toThrow(ConflictException);
    expect(sectionRepo.create).not.toHaveBeenCalled();
  });

  it('throws ConflictException when section name already exists in department', async () => {
    deptRepo.findById.mockResolvedValue(makeDept());
    sectionRepo.findByNameInDepartment.mockResolvedValue(makeSection());

    await expect(useCase.execute(dto)).rejects.toThrow(ConflictException);
    expect(sectionRepo.create).not.toHaveBeenCalled();
  });
});
