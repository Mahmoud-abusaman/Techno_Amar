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
import { SubmitComplaintDto } from './dto/complaint.dto';
import { SubmitComplaintUseCase } from '@complaints/application/submit-complaint.use-case';
import { GetMyComplaintsUseCase } from '@complaints/application/get-my-complaints.use-case';
import { GetComplaintUseCase } from '@complaints/application/get-complaint.use-case';

@ApiTags('complaints')
@ApiBearerAuth()
@Controller('complaints')
@Roles(UserRole.CITIZEN)
export class ComplaintsController {
  constructor(
    private readonly submitComplaint: SubmitComplaintUseCase,
    private readonly getMyComplaints: GetMyComplaintsUseCase,
    private readonly getComplaint: GetComplaintUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: "List citizen's complaints" })
  findAll(@ActiveUser('sub') userId: string) {
    return this.getMyComplaints.execute(BigInt(userId));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit a new complaint',
    description:
      'Citizens can submit unlimited complaints. Upload an optional photo to ImageKit first (GET /uploads/imagekit/auth).',
  })
  create(@ActiveUser('sub') userId: string, @Body() dto: SubmitComplaintDto) {
    return this.submitComplaint.execute(BigInt(userId), dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get complaint details' })
  findOne(
    @ActiveUser('sub') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.getComplaint.execute(BigInt(userId), BigInt(id));
  }
}
