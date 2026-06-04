import { Injectable, Inject } from '@nestjs/common';
import { ISectionRepository } from '@domain/repositories/section-repository.interface';
import { SectionEntity } from '@domain/entities/section.entity';

@Injectable()
export class GetSectionsUseCase {
  constructor(
    @Inject(ISectionRepository) private readonly sectionRepo: ISectionRepository,
  ) {}

  execute(departmentId?: bigint, activeOnly = false): Promise<SectionEntity[]> {
    return this.sectionRepo.findAll(departmentId, activeOnly);
  }
}
