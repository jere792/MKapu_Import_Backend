import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class ListTransferNotificationQueryDto {
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @IsNotEmpty()
  headquartersId: string;

  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @IsNotEmpty()
  role: string;
}
