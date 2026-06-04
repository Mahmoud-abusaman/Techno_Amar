import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '@auth/auth.module';

import { IDepartmentRepository } from '@org/domain/repositories/department-repository.interface';
import { ISectionRepository } from '@org/domain/repositories/section-repository.interface';

import { PrismaDepartmentRepository } from '@org/infrastructure/prisma-department.repository';
import { PrismaSectionRepository } from '@org/infrastructure/prisma-section.repository';

import { CreateDepartmentUseCase } from '@org/application/department/create-department.use-case';
import { GetDepartmentsUseCase } from '@org/application/department/get-departments.use-case';
import { GetDepartmentUseCase } from '@org/application/department/get-department.use-case';
import { UpdateDepartmentUseCase } from '@org/application/department/update-department.use-case';
import { DeleteDepartmentUseCase } from '@org/application/department/delete-department.use-case';

import { CreateSectionUseCase } from '@org/application/section/create-section.use-case';
import { GetSectionsUseCase } from '@org/application/section/get-sections.use-case';
import { GetSectionUseCase } from '@org/application/section/get-section.use-case';
import { UpdateSectionUseCase } from '@org/application/section/update-section.use-case';
import { DeleteSectionUseCase } from '@org/application/section/delete-section.use-case';
import { SectionAssignmentValidator } from '@org/application/section-assignment.validator';

import { DepartmentsController } from '@org/presentation/departments.controller';
import { SectionsController } from '@org/presentation/sections.controller';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [DepartmentsController, SectionsController],
  providers: [
    { provide: IDepartmentRepository, useClass: PrismaDepartmentRepository },
    { provide: ISectionRepository, useClass: PrismaSectionRepository },

    CreateDepartmentUseCase,
    GetDepartmentsUseCase,
    GetDepartmentUseCase,
    UpdateDepartmentUseCase,
    DeleteDepartmentUseCase,

    CreateSectionUseCase,
    GetSectionsUseCase,
    GetSectionUseCase,
    UpdateSectionUseCase,
    DeleteSectionUseCase,
    SectionAssignmentValidator,
  ],
  exports: [IDepartmentRepository, ISectionRepository, SectionAssignmentValidator],
})
export class OrgModule {}
