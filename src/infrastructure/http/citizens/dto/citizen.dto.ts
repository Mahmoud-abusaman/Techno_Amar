import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCitizenProfileDto {
  @ApiPropertyOptional({ example: 'Ahmed Al-Masri' })
  @IsString()
  @IsOptional()
  full_name?: string;

  @ApiPropertyOptional({ example: '+970591234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Al-Rimal, Gaza City' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  @IsDateString()
  @IsOptional()
  date_of_birth?: string;
}

export class RejectCitizenDto {
  @ApiProperty({ example: 'Document is unclear or does not match the provided information.' })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason!: string;
}

export class CitizenProfileResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() full_name: string;
  @ApiProperty() email: string;
  @ApiProperty() phone: string | null;
  @ApiProperty() address: string | null;
  @ApiProperty() city: string;
  @ApiProperty() account_status: string;
  @ApiProperty() is_verified: boolean;
  @ApiProperty() created_at: Date;
  @ApiPropertyOptional() date_of_birth?: Date | null;
  @ApiPropertyOptional() verification_document?: string | null;
  @ApiPropertyOptional() rejection_reason?: string | null;
  @ApiPropertyOptional() verified_at?: Date | null;
}
