import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '@auth/presentation/decorators/roles.decorator';
import {
  UserRole,
  DamageAssessmentStatus,
  DamageSeverity,
} from '@/generated/prisma/enums';
import { DamageAssessmentFiltersDto } from './dto/damage-assessment.dto';
import { GetAllDamageAssessmentsUseCase } from '@damage-assessments/application/get-all-damage-assessments.use-case';
import { GetDamageAssessmentAdminUseCase } from '@damage-assessments/application/get-damage-assessment-admin.use-case';

@ApiTags('admin-damage-assessments')
@ApiBearerAuth()
@Controller('admin/damage-assessments')
@Roles(UserRole.ADMIN)
export class AdminDamageAssessmentsController {
  constructor(
    private readonly getAllDamageAssessments: GetAllDamageAssessmentsUseCase,
    private readonly getDamageAssessmentAdmin: GetDamageAssessmentAdminUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all damage assessments (Admin only)' })
  @ApiQuery({ name: 'status', required: false, enum: DamageAssessmentStatus })
  @ApiQuery({ name: 'damage_severity', required: false, enum: DamageSeverity })
  @ApiQuery({ name: 'location', required: false, type: String })
  findAll(@Query() filters: DamageAssessmentFiltersDto) {
    return this.getAllDamageAssessments.execute(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get damage assessment details (Admin only)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.getDamageAssessmentAdmin.execute(BigInt(id));
  }
}
