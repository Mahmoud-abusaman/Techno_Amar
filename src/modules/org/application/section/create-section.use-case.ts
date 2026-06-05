import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  ISectionRepository,
  CreateSectionData,
} from '@org/domain/repositories/section-repository.interface';
import { IDepartmentRepository } from '@org/domain/repositories/department-repository.interface';
import { SectionEntity } from '@org/domain/entities/section.entity';
import { CreateSectionDto } from '../../presentation/dto/section.dto';



@Injectable()
export class CreateSectionUseCase {
  constructor(
    @Inject(ISectionRepository)
    private readonly sectionRepo: ISectionRepository,
    @Inject(IDepartmentRepository)
    private readonly deptRepo: IDepartmentRepository,
  ) {}

  async execute(
    data: CreateSectionDto,
  ): Promise<SectionEntity> {
    const dept = await this.deptRepo.findById(data.department_id);
    if (!dept)
      throw new NotFoundException(`Department ${data.department_id} not found`);
    if (!dept.is_active)
      throw new ConflictException(
        'Cannot add section to an inactive department',
      );

    const existing = await this.sectionRepo.findByNameInDepartment(
      data.name,
      data.department_id,
    );
    if (existing)
      throw new ConflictException(
        `Section "${data.name}" already exists in this department`,
      );

    return this.sectionRepo.create(data);
  }
}
