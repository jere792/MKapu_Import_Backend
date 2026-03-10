import { IsString } from 'class-validator';
export class CloseCashboxDto {
  @IsString()
  id_caja: string;
}