import { IsNumber, IsPositive, IsString } from "class-validator";

export class RegisterCreditNoteItemDto {

    @IsNumber()
    itemId: number;

    @IsString()
    description: string;

    @IsNumber()
    @IsPositive()
    quantity: number;

    @IsNumber()
    unitPrice: number;

    @IsNumber()
    igv: number;

    @IsNumber()
    subtotal: number;

    @IsNumber()
    total: number;
}