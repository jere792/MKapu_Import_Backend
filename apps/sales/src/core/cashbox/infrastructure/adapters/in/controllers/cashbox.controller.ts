/* ============================================
   administration/src/core/cashbox/infrastructure/adapters/in/cashbox.controller.ts
   ============================================ */
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  Inject,
  Patch,
} from '@nestjs/common';
import {
  ICashboxCommandPort,
  ICashboxQueryPort,
} from '../../../../domain/ports/in/cashbox-ports-in';
import {
  OpenCashboxDto,
  CloseCashboxDto,
} from '../../../../application/dto/in';

@Controller('cashbox')
export class CashboxController {
  constructor(
    @Inject('ICashboxCommandPort')
    private readonly commandPort: ICashboxCommandPort,
    @Inject('ICashboxQueryPort')
    private readonly queryPort: ICashboxQueryPort,
  ) {}

  @Post('open')
  async open(@Body() dto: OpenCashboxDto) {
    return await this.commandPort.openCashbox(dto);
  }

  @Patch('close')
  async close(@Body() dto: CloseCashboxDto) {
    return await this.commandPort.closeCashbox(dto);
  }

  @Get('active/:idSede')
  async getActive(@Param('idSede', ParseIntPipe) idSede: number) {
    return await this.queryPort.findActiveBySede(idSede);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.queryPort.getById(id);
  }
}
