import { IsArray, IsDate, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { RegisterCreditNoteItemDto } from "./register-credit-note-item.dto";
import { Type } from "class-transformer";
import { CreditNoteBusinessType, CreditNoteStatus } from "../../../domain/entity/credit-note.types";

export class RegisterCreditNoteDto {

    @IsNumber()
    receiptIdRef: number;

    @IsString()
    serieRef: string;

    @IsNumber()
    numberDocRef: number;

    @IsString()
    serie: string;

    @IsNumber()
    numberDoc: number;

    @IsDate()
    @Type(() => Date)
    issueDate: Date;

    @IsNumber()
    clientId: number;

    @IsString()
    clientName: string;

    @IsString()
    currency: string;

    @IsString()
    correlative: string;

    @IsNumber()
    typeNoteId: number;

    @IsNumber()
    saleValue: number;

    @IsNumber()
    isc: number;

    @IsNumber()
    igv: number;

    @IsNumber()
    totalAmount: number;

    @IsString()
    businessType: CreditNoteBusinessType;

    @IsString()
    status: CreditNoteStatus;

    @IsNumber()
    userRefId: number;

    @IsString()
    userRefName: string;

    @IsNumber()
    headquarterId: number;

    @IsString()
    headquarterName: string;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    createdAt?: Date;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RegisterCreditNoteItemDto)
    items: RegisterCreditNoteItemDto[];
}