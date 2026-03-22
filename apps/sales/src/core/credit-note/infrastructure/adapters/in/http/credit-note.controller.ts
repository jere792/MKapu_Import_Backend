/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import {
  IAnnulCreditNoteCommandPort,
  IRegisterCreditNoteCommandPort,
} from '../../../../domain/ports/in/credit-note-command.port';
import {
  IExportCreditNoteQueryPort,
  IGetCreditNoteDetailQueryPort,
  IListCreditNoteQueryPort,
} from '../../../../domain/ports/in/credit-note-query.port';
import { AnnulCreditNoteDto } from '../../../../application/dto/in/annul-credit-note.dto';
import { ListCreditNoteFilterDto } from '../../../../application/dto/in/list-credit-note-filter.dto';
import { CreateCreditNoteRequestDto } from '../../../../application/dto/in/create-credit-note-request.dto';
import { JwtAuthGuard } from '@app/common/infrastructure/guard/jwt-auth.guard';

@Controller('credit-note')
export class CreditNoteController {
  constructor(
    @Inject('IRegisterCreditNoteCommandPort')
    private readonly registerCreditNote: IRegisterCreditNoteCommandPort,

    @Inject('IAnnulCreditNoteCommandPort')
    private readonly annulCreditNote: IAnnulCreditNoteCommandPort,

    @Inject('IGetCreditNoteDetailQueryPort')
    private readonly getCreditNoteDetal: IGetCreditNoteDetailQueryPort,

    @Inject('IListCreditNoteQueryPort')
    private readonly listCreditNotes: IListCreditNoteQueryPort,

    @Inject('IExportCreditNoteQueryPort')
    private readonly exportCreditNotes: IExportCreditNoteQueryPort,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  //@UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateCreditNoteRequestDto, @Req() req: any) {
    dto.userRefId = req.user?.id || req.user?.id_usuario || 1;
    return this.registerCreditNote.execute(dto);
  }

  @Post(':id/annul')
  async annul(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AnnulCreditNoteDto,
  ) {
    dto.creditNoteId = id;
    return this.annulCreditNote.execute(dto);
  }

  @Get()
  async list(@Query() filters: ListCreditNoteFilterDto) {
    return this.listCreditNotes.execute(filters);
  }

  @Get('export')
  async export(
    @Query() filters: ListCreditNoteFilterDto,
    @Res() res: Response,
  ) {
    const buffer = await this.exportCreditNotes.execute(filters);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=Notas_Credito_${new Date().getTime()}.xlsx`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Get(':id')
  async detail(@Param('id', ParseIntPipe) id: number) {
    return this.getCreditNoteDetal.execute(id);
  }
}
