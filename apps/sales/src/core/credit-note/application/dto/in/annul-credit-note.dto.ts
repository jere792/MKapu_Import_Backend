import { IsNumber, IsOptional, IsString } from "class-validator";

export class AnnulCreditNoteDto {

    @IsNumber()
    creditNoteId: number;

    @IsString()
    reason: string;
}