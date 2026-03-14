import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ITypeCreditNoteCommandPort } from "../../domain/ports/in/type-credit-note-port-in";
import { ITypeCreditNoteRepositoryPort } from "../../domain/ports/out/type-credit-note-port-out";
import { TypeCreditNoteWebSocketGateway } from "../../infrastructure/adapters/out/type-credit-note-websocket.gateway";
import { RegisterTypeCreditNoteDto } from "../dto/in/register-type-credit-note-dto";
import { TypeCreditResponseDto } from "../dto/out/type-credit-response-dto";
import { TypeCreditNoteMapper } from "../mapper/type-credit-note.mapper";
import { UpdateTypeCreditNoteDto } from "../dto/in/update-type-credit-note-dto";
import { TypeCreditNoteDeletedResponseDto } from "../dto/out/type-credit-note-deleted-response-dto";

@Injectable()
export class TypeCreditNoteCommandService implements ITypeCreditNoteCommandPort {
    constructor(
        @Inject('ITypeCreditNoteRepositoryPort')
        private readonly repository: ITypeCreditNoteRepositoryPort,
        private readonly typeNoteGateway: TypeCreditNoteWebSocketGateway,
    ) {}

    async registerTypeCreditNote(dto: RegisterTypeCreditNoteDto): Promise<TypeCreditResponseDto> {
        const existsByCode = await this.repository.findByCode(dto.codigo_sunat);
        
        if (existsByCode) {
            throw new ConflictException(`Ya existe un tipo de nota de crédito con el código SUNAT ${dto.codigo_sunat}`);
        }

        const typeCreditNote = TypeCreditNoteMapper.fromCreateDto(dto);
        const createdTypeCreditNote = await this.repository.save(typeCreditNote);
        const responseDto = TypeCreditNoteMapper.toResponseDto(createdTypeCreditNote);

        this.typeNoteGateway.notifyTypeCreditNoteCreated(responseDto);

        return responseDto;
    }

    async updateTypeCreditNote(dto: UpdateTypeCreditNoteDto): Promise<TypeCreditResponseDto> {
        const existingTypeCreditNote = await this.repository.findById(dto.id_nota);

        if (!existingTypeCreditNote) {
            throw new ConflictException(`No existe un tipo de nota de crédito con ID ${dto.id_nota}`);
        }

        const updatedTypeCreditNote = TypeCreditNoteMapper.fromUpdateDto(existingTypeCreditNote, dto);
        const savedTypeCreditNote = await this.repository.save(updatedTypeCreditNote);

        const responseDto = TypeCreditNoteMapper.toResponseDto(savedTypeCreditNote);
        this.typeNoteGateway.notifyTypeCreditNoteUpdated(responseDto);

        return responseDto;
    }

    async deleteTypeCreditNote(id: number): Promise<TypeCreditNoteDeletedResponseDto> {
        const existingTypeCreditNote = await this.repository.findById(id);  
        
        
        if (!existingTypeCreditNote) {
            throw new NotFoundException(`No existe un tipo de nota de crédito con ID ${id}`);
        }

        await this.repository.delete(id);

        const responseDto = TypeCreditNoteMapper.toDeletedResponseDto(id);
        this.typeNoteGateway.notifyTypeCreditNoteDeleted(id);
        
        return responseDto;
    }
}