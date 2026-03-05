import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export class ConfirmReceiptTransferDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  userId: number;
}
