import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Post, Put, Query } from "@nestjs/common";
import { ITypeCreditNoteCommandPort, ITypeCreditNoteQueryPort } from "../../../../domain/ports/in/type-credit-note-port-in";
import { TypeCreditNoteWebSocketGateway } from "../../out/type-credit-note-websocket.gateway";
import { RegisterTypeCreditNoteDto } from "../../../../application/dto/in/register-type-credit-note-dto";
import { TypeCreditResponseDto } from "../../../../application/dto/out/type-credit-response-dto";
import { UpdateTypeCreditNoteDto } from "../../../../application/dto/in/update-type-credit-note-dto";
import { TypeCreditNoteDeletedResponseDto } from "../../../../application/dto/out/type-credit-note-deleted-response-dto";
import { TypeCreditNoteFilterDto } from "../../../../application/dto/in/list-type-credit-note-filter-dto";
import { TypeCreditNoteListResponse } from "../../../../application/dto/out/type-credit-note-list-response";

@Controller('type-credit-notes')
export class TypeCreditRestController {
    constructor(
        @Inject('ITypeCreditNoteQueryPort')
        private readonly typeCreditNoteQueryService: ITypeCreditNoteQueryPort,
        @Inject('ITypeCreditNoteCommandPort')
        private readonly typeCreditNoteCommandService: ITypeCreditNoteCommandPort,
        private readonly typeNoteGateway: TypeCreditNoteWebSocketGateway
    ) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async registerTypeCreditNote(
        @Body() registerDto: RegisterTypeCreditNoteDto
    ): Promise<TypeCreditResponseDto> {
        const newTypeCreditNote = await this.typeCreditNoteCommandService.registerTypeCreditNote(registerDto);
        
        return newTypeCreditNote;
    }

    @Put(':id')
    @HttpCode(HttpStatus.OK)
    async updateTypeCreditNote(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: Omit<UpdateTypeCreditNoteDto, 'id_nota'> 
    ): Promise<TypeCreditResponseDto> {
        const fullUpdateDto: UpdateTypeCreditNoteDto = {
            ...updateDto,
            id_nota: id
        };

        const updatedTypeCreditNote = await this.typeCreditNoteCommandService.updateTypeCreditNote(fullUpdateDto);
        this.typeNoteGateway.notifyTypeCreditNoteUpdated(updatedTypeCreditNote);

        return updatedTypeCreditNote;
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async deleteTypeCreditNote(
        @Param('id', ParseIntPipe) id: number
    ): Promise<TypeCreditNoteDeletedResponseDto> {
        const deletedTypeCreditNote = await this.typeCreditNoteCommandService.deleteTypeCreditNote(id);
        this.typeNoteGateway.notifyTypeCreditNoteDeleted(id);

        return deletedTypeCreditNote;
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    async listTypeCreditNotes(@Query() filters: TypeCreditNoteFilterDto): Promise<TypeCreditNoteListResponse> {
        return this.typeCreditNoteQueryService.listTypeCreditNotes(filters);
    }

    @Get('all')
    async getAllTypeCreditNotes(): Promise<TypeCreditResponseDto[]> {
        return this.typeCreditNoteQueryService.getAllTypeCreditNotes();
    }

    @Get(':id')
    async getTypeCreditNoteById(@Param('id', ParseIntPipe) id: number): Promise<TypeCreditResponseDto> {
        const updatedTypeCreditNote = await this.typeCreditNoteQueryService.getTypeCreditNoteById(id);

        return updatedTypeCreditNote;
    }
}