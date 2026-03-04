import { Body, Controller, Get, Inject, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { IDispatchInputPort } from '../../../../domain/ports/in/dispatch-input.port';
import { IDispatchQueryPort } from '../../../../application/service/dispatch-query.service';
import {
  CancelarDespachoDto,
  ConfirmarEntregaDto,
  CreateDispatchDto,
  IniciarTransitoDto,
  MarcarDetalleDespachoadoDto,
  MarcarDetallePreparadoDto,
} from '../../../../application/dto/in/dispatch-input.dto';

@Controller('despachos')
export class DispatchRestController {
  constructor(
    @Inject('IDispatchInputPort')
    private readonly commandService: IDispatchInputPort,
    @Inject('IDispatchQueryPort')
    private readonly queryService: IDispatchQueryPort,
  ) {}

  @Get()
  findAll() {
    return this.queryService.findAll();
  }

  @Get('venta/:id_venta')
  findByVenta(@Param('id_venta', ParseIntPipe) id_venta: number) {
    return this.queryService.findByVenta(id_venta);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.queryService.findById(id);
  }

  @Post()
  crear(@Body() dto: CreateDispatchDto) {
    return this.commandService.crearDespacho(dto);
  }

  @Patch(':id/preparacion')
  iniciarPreparacion(@Param('id', ParseIntPipe) id: number) {
    return this.commandService.iniciarPreparacion({ id_despacho: id });
  }

  @Patch(':id/transito')
  iniciarTransito(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: IniciarTransitoDto,
  ) {
    return this.commandService.iniciarTransito({ ...dto, id_despacho: id });
  }

  @Patch(':id/entrega')
  confirmarEntrega(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmarEntregaDto,
  ) {
    return this.commandService.confirmarEntrega({ ...dto, id_despacho: id });
  }

  @Patch(':id/cancelar')
  cancelar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelarDespachoDto,
  ) {
    return this.commandService.cancelarDespacho({ ...dto, id_despacho: id });
  }

  @Patch('detalle/:id/preparado')
  marcarDetallePreparado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MarcarDetallePreparadoDto,
  ) {
    return this.commandService.marcarDetallePreparado({ ...dto, id_detalle_despacho: id });
  }

  @Patch('detalle/:id/despachado')
  marcarDetalleDespachado(@Param('id', ParseIntPipe) id: number) {
    return this.commandService.marcarDetalleDespachado({ id_detalle_despacho: id });
  }
}