import { Module } from '@nestjs/common';

import { AuthModule } from './auth.module';
import { OrgModule } from './org.module';

// Domain — repository tokens
import { IUserRepository } from '@domain/repositories/user-repository.interface';

// Infrastructure — Prisma implementations
import { PrismaUserRepository } from '@infrastructure/database/repositories/prisma-user.repository';

// Use cases
import { CreateEmployeeUseCase } from '@usecases/employees/create-employee.use-case';
import { ListEmployeesUseCase } from '@usecases/employees/list-employees.use-case';
import { GetEmployeeUseCase } from '@usecases/employees/get-employee.use-case';
import { UpdateEmployeeUseCase } from '@usecases/employees/update-employee.use-case';
import { DeactivateEmployeeUseCase } from '@usecases/employees/deactivate-employee.use-case';

// Presentation
import { EmployeesController } from '@infrastructure/http/employees/employees.controller';

@Module({
  imports: [AuthModule, OrgModule],
  controllers: [EmployeesController],
  providers: [
    { provide: IUserRepository, useClass: PrismaUserRepository },

    CreateEmployeeUseCase,
    ListEmployeesUseCase,
    GetEmployeeUseCase,
    UpdateEmployeeUseCase,
    DeactivateEmployeeUseCase,
  ],
  exports: [IUserRepository],
})
export class EmployeesModule {}
