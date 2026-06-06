import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  ISectionRepository,
  UpdateSectionData,
} from '@org/domain/repositories/section-repository.interface';
import { SectionEntity } from '@org/domain/entities/section.entity';

@Injectable()
export class UpdateSectionUseCase {
  constructor(
    @Inject(ISectionRepository)
    private readonly sectionRepo: ISectionRepository,
  ) {}

  async execute(
    id: bigint,
    data: UpdateSectionData,
  ): Promise<SectionEntity> {
    const section = await this.sectionRepo.findById(id);
    if (!section) throw new NotFoundException(`Section ${id} not found`);

    if (data.name && data.name !== section.name) {
      const conflict = await this.sectionRepo.findByNameInDepartment(
        data.name,
        section.department_id,
      );
      if (conflict)
        throw new ConflictException(
          `Section "${data.name}" already exists in this department`,
        );
    }

    return this.sectionRepo.update(id, data);
  }
}
