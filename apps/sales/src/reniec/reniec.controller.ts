import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ReniecService, ReniecDniResponse } from './reniec.service';

@Controller('reniec')
export class ReniecController {
  constructor(private readonly reniecService: ReniecService) {}

  @Get('dni/:dni')
  async consultarDni(@Param('dni') dni: string): Promise<ReniecDniResponse> {
    if (!dni || !/^\d{8}$/.test(dni)) {
      throw new HttpException(
        { message: 'DNI inválido. Debe tener exactamente 8 dígitos.' },
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.reniecService.consultar(dni);
  }

  @Get('ruc/:ruc')
  async consultarRuc(@Param('ruc') ruc: string): Promise<ReniecDniResponse> {
    if (!ruc || !/^\d{11}$/.test(ruc)) {
      throw new HttpException(
        { message: 'RUC inválido. Debe tener exactamente 11 dígitos.' },
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.reniecService.consultar(ruc);
  }

  @Get('consultar/:numero')
  async consultar(@Param('numero') numero: string): Promise<ReniecDniResponse> {
    return this.reniecService.consultar(numero);
  }
}
