import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifyPaymentDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  approve: boolean;

  @ApiPropertyOptional({ example: 'Receipt image is blurry' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejection_reason?: string;
}
