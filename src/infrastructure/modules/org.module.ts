import { Module } from '@nestjs/common';

import { AuthModule } from './auth.module';

// Domain — repository tokens
import { IDepartmentRepository } from '@domain/repositories/department-repository.interface';
import { ISectionRepository } from '@domain/repositories/section-repository.interface';

// Infrastructure — Prisma implementations
import { PrismaDepartmentRepository } from '@infrastructure/database/repositories/prisma-department.repository';
import { PrismaSectionRepository } from '@infrastructure/database/repositories/prisma-section.repository';

// Department use cases
import { CreateDepartmentUseCase } from '@usecases/org/department/create-department.use-case';
import { GetDepartmentsUseCase } from '@usecases/org/department/get-departments.use-case';
import { GetDepartmentUseCase } from '@usecases/org/department/get-department.use-case';
import { UpdateDepartmentUseCase } from '@usecases/org/department/update-department.use-case';
import { DeleteDepartmentUseCase } from '@usecases/org/department/delete-department.use-case';

// Section use cases
import { CreateSectionUseCase } from '@usecases/org/section/create-section.use-case';
import { GetSectionsUseCase } from '@usecases/org/section/get-sections.use-case';
import { GetSectionUseCase } from '@usecases/org/section/get-section.use-case';
import { UpdateSectionUseCase } from '@usecases/org/section/update-section.use-case';
import { DeleteSectionUseCase } from '@usecases/org/section/delete-section.use-case';

// Presentation
import { DepartmentsController } from '@infrastructure/http/org/departments.controller';
import { SectionsController } from '@infrastructure/http/org/sections.controller';

@Module({
  imports: [AuthModule],
  controllers: [DepartmentsController, SectionsController],
  providers: [
    // Repository bindings
    { provide: IDepartmentRepository, useClass: PrismaDepartmentRepository },
    { provide: ISectionRepository, useClass: PrismaSectionRepository },

    // Department use cases
    CreateDepartmentUseCase,
    GetDepartmentsUseCase,
    GetDepartmentUseCase,
    UpdateDepartmentUseCase,
    DeleteDepartmentUseCase,

    // Section use cases
    CreateSectionUseCase,
    GetSectionsUseCase,
    GetSectionUseCase,
    UpdateSectionUseCase,
    DeleteSectionUseCase,
  ],
  exports: [IDepartmentRepository, ISectionRepository],
})
export class OrgModule {}
