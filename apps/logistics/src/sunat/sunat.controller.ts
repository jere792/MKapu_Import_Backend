import { Controller, Get, Param } from '@nestjs/common';
import { SunatService } from './sunat.service';

@Controller('api/consultas')
export class SunatController {
  constructor(private readonly sunatService: SunatService) {}

  @Get('ruc/:numero')
  async consultarRuc(@Param('numero') numero: string) {
    return await this.sunatService.consultarRuc(numero);
  }
}
