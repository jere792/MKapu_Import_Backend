import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ITypeCreditNoteQueryPort } from "../../domain/ports/in/type-credit-note-port-in";
import { ITypeCreditNoteRepositoryPort } from "../../domain/ports/out/type-credit-note-port-out";
import { TypeCreditNoteFilterDto } from "../dto/in/list-type-credit-note-filter-dto";
import { TypeCreditResponseDto } from "../dto/out/type-credit-response-dto";
import { TypeCreditNoteListResponse } from "../dto/out/type-credit-note-list-response";
import { TypeCreditNoteMapper } from "../mapper/type-credit-note.mapper";

@Injectable()
export class TypeCreditNoteQueryService implements ITypeCreditNoteQueryPort {
    constructor(
        @Inject('ITypeCreditNoteRepositoryPort')
        private readonly repository: ITypeCreditNoteRepositoryPort
    ) {}
    
    async listTypeCreditNotes(filters?: TypeCreditNoteFilterDto): Promise<TypeCreditNoteListResponse> {
        const typeCreditNotes = await this.repository.findAll(filters);

        return TypeCreditNoteMapper.toListResponse(typeCreditNotes);
    }

    async getTypeCreditNoteById(id: number): Promise<TypeCreditResponseDto | null> {
        const typeCreditNote = await this.repository.findById(id);

        if (!typeCreditNote) {
            throw new NotFoundException(`El tipo de nota con id ${id} no existe.`);
        }

        return TypeCreditNoteMapper.toResponseDto(typeCreditNote);
    }
    
    async getAllTypeCreditNotes(): Promise<TypeCreditResponseDto[]> {
        const typeCreditNotes = await this.repository.findAll();
        return typeCreditNotes.map(tc => TypeCreditNoteMapper.toResponseDto(tc));
    }
    
    async getTypeCreditNoteByCode(code: string): Promise<TypeCreditResponseDto | null> {
        const typeCreditNote = await this.repository.findByCode(code);

        if (!typeCreditNote) {
            return null;
        }

        return TypeCreditNoteMapper.toResponseDto(typeCreditNote);
    }

}