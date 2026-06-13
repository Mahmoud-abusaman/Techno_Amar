import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ISectionRepository } from '@org/domain/repositories/section-repository.interface';
import { IDepartmentRepository } from '@org/domain/repositories/department-repository.interface';
import { SectionEntity } from '@org/domain/entities/section.entity';

@Injectable()
export class SectionAssignmentValidator {
  constructor(
    @Inject(ISectionRepository)
    private readonly sectionRepo: ISectionRepository,
    @Inject(IDepartmentRepository)
    private readonly deptRepo: IDepartmentRepository,
  ) {}

  async assertAssignable(sectionId: bigint): Promise<SectionEntity> {
    const section = await this.sectionRepo.findById(sectionId);
    if (!section) throw new NotFoundException('Section not found');
    if (!section.is_active) {
      throw new BadRequestException('Section is not active');
    }

    const dept = await this.deptRepo.findById(section.department_id);
    if (!dept) throw new NotFoundException('Department not found');
    if (!dept.is_active) {
      throw new BadRequestException('Department is not active');
    }

    return section;
  }
}
