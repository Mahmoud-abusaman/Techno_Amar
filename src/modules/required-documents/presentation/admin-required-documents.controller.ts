import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '@auth/presentation/decorators/roles.decorator';
import { UserRole } from '@/generated/prisma/enums';
import {
  CreateRequiredDocumentDto,
  UpdateRequiredDocumentDto,
} from './dto/required-document.dto';
import { CreateRequiredDocumentUseCase } from '@required-documents/application/create-required-document.use-case';
import {
  GetRequiredDocumentsUseCase,
  GetRequiredDocumentUseCase,
} from '@required-documents/application/get-required-documents.use-case';
import {
  UpdateRequiredDocumentUseCase,
  DeleteRequiredDocumentUseCase,
} from '@required-documents/application/update-required-document.use-case';

@ApiTags('admin-required-documents')
@ApiBearerAuth()
@Controller('admin/services/:serviceId/documents')
export class AdminRequiredDocumentsController {
  constructor(
    private readonly createDocument: CreateRequiredDocumentUseCase,
    private readonly getDocuments: GetRequiredDocumentsUseCase,
    private readonly getDocument: GetRequiredDocumentUseCase,
    private readonly updateDocument: UpdateRequiredDocumentUseCase,
    private readonly deleteDocument: DeleteRequiredDocumentUseCase,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List required documents for a service (Admin)' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  findAll(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.getDocuments.execute(BigInt(serviceId), activeOnly === 'true');
  }

  @Get(':documentId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a required document (Admin)' })
  findOne(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Param('documentId', ParseIntPipe) documentId: number,
  ) {
    return this.getDocument.execute(BigInt(serviceId), BigInt(documentId));
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Add a required document to a service (Admin)' })
  create(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Body() dto: CreateRequiredDocumentDto,
  ) {
    return this.createDocument.execute(BigInt(serviceId), dto);
  }

  @Patch(':documentId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a required document (Admin)' })
  update(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Param('documentId', ParseIntPipe) documentId: number,
    @Body() dto: UpdateRequiredDocumentDto,
  ) {
    return this.updateDocument.execute(
      BigInt(serviceId),
      BigInt(documentId),
      dto,
    );
  }

  @Delete(':documentId')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a required document (Admin)' })
  remove(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Param('documentId', ParseIntPipe) documentId: number,
  ) {
    return this.deleteDocument.execute(BigInt(serviceId), BigInt(documentId));
  }
}
