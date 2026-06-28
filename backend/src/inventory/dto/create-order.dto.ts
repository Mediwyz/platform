import { IsString, IsOptional, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsString()
  itemId: string;

  @IsNumber()
  quantity: number;
}

export class CreateOrderDto {
  @IsString()
  providerUserId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  deliveryMethod?: string;

  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  // 'wallet' (default) or 'pay_on_delivery' (settle on delivery/pickup, no
  // wallet pre-funding) — used by the in-chat buy flow.
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
