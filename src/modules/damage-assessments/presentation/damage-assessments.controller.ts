import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '@auth/presentation/decorators/roles.decorator';
import { ActiveUser } from '@auth/presentation/decorators/active-user.decorator';
import { UserRole } from '@/generated/prisma/enums';
import { SubmitDamageAssessmentDto } from './dto/damage-assessment.dto';
import { SubmitDamageAssessmentUseCase } from '@damage-assessments/application/submit-damage-assessment.use-case';
import { GetMyDamageAssessmentsUseCase } from '@damage-assessments/application/get-my-damage-assessments.use-case';
import { GetDamageAssessmentSubmissionStatusUseCase } from '@damage-assessments/application/get-damage-assessment-submission-status.use-case';
import { GetDamageAssessmentUseCase } from '@damage-assessments/application/get-damage-assessment.use-case';

@ApiTags('damage-assessments')
@ApiBearerAuth()
@Controller('damage-assessments')
@Roles(UserRole.CITIZEN)
export class DamageAssessmentsController {
  constructor(
    private readonly submitDamageAssessment: SubmitDamageAssessmentUseCase,
    private readonly getMyDamageAssessments: GetMyDamageAssessmentsUseCase,
    private readonly getSubmissionStatus: GetDamageAssessmentSubmissionStatusUseCase,
    private readonly getDamageAssessment: GetDamageAssessmentUseCase,
  ) {}

  @Get('submission-status')
  @ApiOperation({
    summary: 'Check if citizen has submitted a damage assessment',
  })
  getSubmissionStatusEndpoint(@ActiveUser('sub') userId: string) {
    return this.getSubmissionStatus.execute(BigInt(userId));
  }

  @Get()
  @ApiOperation({ summary: "List citizen's damage assessments" })
  findAll(@ActiveUser('sub') userId: string) {
    return this.getMyDamageAssessments.execute(BigInt(userId));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit a damage assessment (one per citizen)',
    description:
      'Upload damage photos to ImageKit first (GET /uploads/imagekit/auth), then include image metadata in the images array.',
  })
  create(
    @ActiveUser('sub') userId: string,
    @Body() dto: SubmitDamageAssessmentDto,
  ) {
    return this.submitDamageAssessment.execute(BigInt(userId), dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get damage assessment details' })
  findOne(
    @ActiveUser('sub') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.getDamageAssessment.execute(BigInt(userId), BigInt(id));
  }
}
