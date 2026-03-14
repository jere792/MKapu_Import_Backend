import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Post, Query } from "@nestjs/common";
import { IAnnulCreditNoteCommandPort, IRegisterCreditNoteCommandPort } from "../../../../domain/ports/in/credit-note-command.port";
import { IGetCreditNoteDetailQueryPort, IListCreditNoteQueryPort } from "../../../../domain/ports/in/credit-note-query.port";
import { RegisterCreditNoteDto } from "../../../../application/dto/in/register-credit-note.dto";
import { AnnulCreditNoteDto } from "../../../../application/dto/in/annul-credit-note.dto";
import { ListCreditNoteFilterDto } from "../../../../application/dto/in/list-credit-note-filter.dto";

@Controller('credit-notes')
export class CreditNoteController {
    
    constructor(
        @Inject('IRegisterCreditNoteCommandPort')
        private readonly registerCreditNote: IRegisterCreditNoteCommandPort,

        @Inject('IAnnulCreditNoteCommandPort')
        private readonly annulCreditNote: IAnnulCreditNoteCommandPort,

        @Inject('IGetCreditNoteDetailQueryPort')
        private readonly getCreditNoteDetal: IGetCreditNoteDetailQueryPort,

        @Inject('IListCreditNoteQueryPort')
        private readonly listCreditNotes: IListCreditNoteQueryPort
    ) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: RegisterCreditNoteDto) {
        return this.registerCreditNote.execute(dto);
    }

    @Post(':id/annul')
    async annul(@Param('id', ParseIntPipe) id: number, @Body() dto: AnnulCreditNoteDto) {
        dto.creditNoteId = id;
        return this.annulCreditNote.execute(dto);
    }

    @Get()
    async list(@Query() filters: ListCreditNoteFilterDto) {
        return this.listCreditNotes.execute(filters);
    }

    @Get(':id')
    async detail(@Param('id', ParseIntPipe) id: number) {
        return this.getCreditNoteDetal.execute(id);
    }
}