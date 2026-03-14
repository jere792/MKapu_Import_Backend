import { Type } from "class-transformer";
import { IsDate, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { CreditNoteStatus } from "../../../domain/entity/credit-note.types";

export class ListCreditNoteFilterDto {

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    startDate?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    endDate?: Date;

    @IsOptional()
    @IsEnum(CreditNoteStatus)
    status?: CreditNoteStatus;

    @IsOptional()
    @IsString()
    customerDocument?: string;

    @IsOptional()
    @IsString()
    serie?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number;
}