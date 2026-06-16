import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateInventoryItemDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  genericName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  category: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  unitOfMeasure?: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  minStockAlert?: number;

  @IsOptional()
  @IsBoolean()
  requiresPrescription?: boolean;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  // Optional: sell this item under an organisation (e.g. a pharmacy) the
  // provider belongs to. Omit / null = sell as an individual.
  @IsOptional()
  @IsString()
  healthcareEntityId?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
