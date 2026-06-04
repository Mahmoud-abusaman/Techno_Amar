import { Injectable, Inject } from '@nestjs/common';
import { ISectionRepository } from '@org/domain/repositories/section-repository.interface';
import { SectionEntity } from '@org/domain/entities/section.entity';

@Injectable()
export class GetSectionsUseCase {
  constructor(
    @Inject(ISectionRepository)
    private readonly sectionRepo: ISectionRepository,
  ) {}

  execute(departmentId?: bigint, activeOnly = false): Promise<SectionEntity[]> {
    return this.sectionRepo.findAll(departmentId, activeOnly);
  }
}
