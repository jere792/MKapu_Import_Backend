import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export class ApproveTransferDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  userId: number;
}
