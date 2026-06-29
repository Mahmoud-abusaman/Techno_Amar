import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ComplaintStatus } from '@/generated/prisma/enums';

export class ResolveComplaintDto {
  @ApiProperty({ enum: ComplaintStatus, description: 'RESOLVED or REJECTED' })
  @IsEnum(ComplaintStatus)
  status: ComplaintStatus;

  @ApiPropertyOptional({ description: 'Admin result / comment' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  result?: string;
}
