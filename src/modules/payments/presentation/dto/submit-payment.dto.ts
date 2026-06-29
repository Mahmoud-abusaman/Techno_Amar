import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class SubmitPaymentDto {
  @ApiProperty({ example: 'TXN123456789' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serial_number: string;

  @ApiProperty({ example: 'Jawwal Pay' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  provider: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  @IsNotEmpty()
  file_type: string;

  @ApiProperty({
    example: 'https://ik.imagekit.io/TechnoAmar/receipts/proof.jpg',
  })
  @IsUrl()
  @MaxLength(2000)
  file_url: string;

  @ApiProperty({ example: 'receipt_abc123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  file_id: string;

  @ApiPropertyOptional({ example: '/payments/proof.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  file_path?: string;
}
