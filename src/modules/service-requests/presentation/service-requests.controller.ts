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
import { SubmitServiceRequestDto } from './dto/submit-service-request.dto';
import { SubmitServiceRequestUseCase } from '@service-requests/application/submit-service-request.use-case';
import { ListMyServiceRequestsUseCase } from '@service-requests/application/list-my-service-requests.use-case';
import { GetServiceRequestUseCase } from '@service-requests/application/get-service-request.use-case';
import { GetServiceRequestHistoryUseCase } from '@service-requests/application/get-service-request-history.use-case';
import { GetServiceRequestDocumentsUseCase } from '@service-requests/application/get-service-request-documents.use-case';

@ApiTags('service-requests')
@ApiBearerAuth()
@Controller('requests')
@Roles(UserRole.CITIZEN)
export class ServiceRequestsController {
  constructor(
    private readonly submitRequest: SubmitServiceRequestUseCase,
    private readonly listMyRequests: ListMyServiceRequestsUseCase,
    private readonly getRequest: GetServiceRequestUseCase,
    private readonly getRequestHistory: GetServiceRequestHistoryUseCase,
    private readonly getRequestDocuments: GetServiceRequestDocumentsUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a service request' })
  create(
    @ActiveUser('sub') userId: string,
    @Body() dto: SubmitServiceRequestDto,
  ) {
    return this.submitRequest.execute(BigInt(userId), dto);
  }

  @Get()
  @ApiOperation({ summary: 'List own service requests' })
  findAll(@ActiveUser('sub') userId: string) {
    return this.listMyRequests.execute(BigInt(userId));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service request details with task timeline' })
  findOne(
    @ActiveUser('sub') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.getRequest.execute(BigInt(userId), BigInt(id));
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Get uploaded documents for a service request' })
  documents(
    @ActiveUser('sub') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.getRequestDocuments.execute(BigInt(userId), BigInt(id));
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get service request activity history' })
  history(
    @ActiveUser('sub') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.getRequestHistory.execute(BigInt(userId), BigInt(id));
  }
}
