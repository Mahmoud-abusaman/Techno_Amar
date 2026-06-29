import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '@auth/presentation/decorators/roles.decorator';
import { ActiveUser } from '@auth/presentation/decorators/active-user.decorator';
import { UserRole } from '@/generated/prisma/enums';
import { RejectRequestTaskDto } from './dto/reject-request-task.dto';
import { AttachTaskDocumentDto } from './dto/attach-task-document.dto';
import { GetSectionTaskBoardUseCase } from '@service-requests/application/get-section-task-board.use-case';
import { GetRequestTaskUseCase } from '@service-requests/application/get-request-task.use-case';
import { AssignRequestTaskUseCase } from '@service-requests/application/assign-request-task.use-case';
import { CompleteRequestTaskUseCase } from '@service-requests/application/complete-request-task.use-case';
import { RejectRequestTaskUseCase } from '@service-requests/application/reject-request-task.use-case';
import { AttachTaskDocumentUseCase } from '@service-requests/application/attach-task-document.use-case';

@ApiTags('request-tasks')
@ApiBearerAuth()
@Controller('tasks')
@Roles(UserRole.EMPLOYEE, UserRole.DEPARTMENT_MANAGER)
export class RequestTasksController {
  constructor(
    private readonly getBoard: GetSectionTaskBoardUseCase,
    private readonly getTask: GetRequestTaskUseCase,
    private readonly assignTask: AssignRequestTaskUseCase,
    private readonly completeTask: CompleteRequestTaskUseCase,
    private readonly rejectTask: RejectRequestTaskUseCase,
    private readonly attachTaskDocument: AttachTaskDocumentUseCase,
  ) {}

  @Get('board')
  @ApiOperation({ summary: 'Get Kanban board for employee section' })
  board(@ActiveUser('sub') userId: string) {
    return this.getBoard.execute(BigInt(userId));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get request task details' })
  findOne(
    @ActiveUser('sub') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.getTask.execute(BigInt(userId), BigInt(id));
  }

  @Put(':id/assign')
  @ApiOperation({ summary: 'Assign task to self' })
  assign(
    @ActiveUser('sub') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.assignTask.execute(BigInt(userId), BigInt(id));
  }

  @Put(':id/complete')
  @ApiOperation({ summary: 'Complete task and advance workflow' })
  complete(
    @ActiveUser('sub') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.completeTask.execute(BigInt(userId), BigInt(id));
  }

  @Put(':id/reject')
  @ApiOperation({ summary: 'Reject task and fail the request' })
  reject(
    @ActiveUser('sub') userId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectRequestTaskDto,
  ) {
    return this.rejectTask.execute(
      BigInt(userId),
      BigInt(id),
      dto.rejection_reason,
    );
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Attach a document to the active task' })
  attachDocument(
    @ActiveUser('sub') userId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AttachTaskDocumentDto,
  ) {
    return this.attachTaskDocument.execute(BigInt(userId), BigInt(id), dto);
  }
}
