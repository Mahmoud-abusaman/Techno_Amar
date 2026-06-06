import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ISectionRepository } from '@org/domain/repositories/section-repository.interface';
import { SectionEntity } from '@org/domain/entities/section.entity';

@Injectable()
export class GetSectionUseCase {
  constructor(
    @Inject(ISectionRepository)
    private readonly sectionRepo: ISectionRepository,
  ) {}

  async execute(id: bigint): Promise<SectionEntity> {
    const section = await this.sectionRepo.findById(id);
    if (!section) throw new NotFoundException(`Section ${id} not found`);
    return section;
  }
}
