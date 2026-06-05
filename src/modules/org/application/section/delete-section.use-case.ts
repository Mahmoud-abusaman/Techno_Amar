import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ISectionRepository } from '@org/domain/repositories/section-repository.interface';

@Injectable()
export class DeleteSectionUseCase {
  constructor(
    @Inject(ISectionRepository)
    private readonly sectionRepo: ISectionRepository,
  ) {}

  async execute(id: bigint): Promise<void> {
    const section = await this.sectionRepo.findById(id);
    if (!section) throw new NotFoundException(`Section ${id} not found`);

    await this.sectionRepo.delete(id);
  }
}
