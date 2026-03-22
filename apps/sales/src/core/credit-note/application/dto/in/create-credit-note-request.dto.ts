import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCreditNoteRequestItemDto {
  @IsNumber()
  itemId: number;

  @IsNumber()
  quantity: number;
}

export class CreateCreditNoteRequestDto {
  @IsNumber()
  salesReceiptId: number;

  @IsString()
  reasonCode: string;

  @IsString()
  reasonDescription: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCreditNoteRequestItemDto)
  items: CreateCreditNoteRequestItemDto[];

  userRefId?: number;
}
