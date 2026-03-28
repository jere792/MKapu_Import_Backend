// infrastructure/adapters/in/controller/terminos-condiciones.controller.ts
import { Controller, Get, Post, Put, Patch, Delete,
         Param, Body, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { TerminosCondicionesQuery }   from '../../../../application/service/query/terminos-condiciones.query';
import { TerminosCondicionesCommand } from '../../../../application/service/command/terminos-condiciones.command';
import { CrearTerminosDto }           from '../../../../application/dto/in/crear-terminos.dto';
import { ActualizarTerminosDto }      from '../../../../application/dto/in/actualizar-terminos.dto';

@Controller('terminos-condiciones')
export class TerminosCondicionesController {

  constructor(
    private readonly query:   TerminosCondicionesQuery,
    private readonly command: TerminosCondicionesCommand,
  ) {}

  @Get('activo')
  getActivo() {
    return this.query.getActivo();
  }

  @Get()
  getAll() {
    return this.query.getAll();
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.query.getById(id);
  }

  @Post()
  crear(@Body() dto: CrearTerminosDto) {
    return this.command.crear(dto);
  }

  @Put(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarTerminosDto,
  ) {
    return this.command.actualizar(id, dto);
  }

  @Patch(':id/activar')
  @HttpCode(HttpStatus.NO_CONTENT)
  activar(@Param('id', ParseIntPipe) id: number) {
    return this.command.activar(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.command.eliminar(id);
  }
}