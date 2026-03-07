import { Injectable, Inject } from '@nestjs/common';
import { DispatchMapper } from '../mapper/dispatch.mapper';
import { DispatchOutputDto } from '../dto/out/dispatch-output.dto';
import {
  CancelarDespachoDto,
  ConfirmarEntregaDto,
  CreateDispatchDto,
  IniciarPreparacionDto,
  IniciarTransitoDto,
  MarcarDetalleDespachoadoDto,
  MarcarDetallePreparadoDto,
} from '../dto/in/dispatch-input.dto';
import { IDispatchInputPort } from '../../domain/ports/in/dispatch-input.port';
import { IDispatchOutputPort } from '../../domain/ports/out/dispatch-output.port';
import { DispatchDetail } from '../../domain/entity/dispatch-detail-domain-entity';
import { Dispatch } from '../../domain/entity/dispatch-domain-entity';

@Injectable()
export class DispatchCommandService implements IDispatchInputPort {
  constructor(
    @Inject('IDispatchOutputPort')
    private readonly repository: IDispatchOutputPort,
  ) {}

  async crearDespacho(dto: CreateDispatchDto): Promise<DispatchOutputDto> {
    const detalles = dto.detalles.map(d => DispatchDetail.create(d));
    const dispatch = Dispatch.create({ ...dto, detalles });
    const saved = await this.repository.save(dispatch);
    return DispatchMapper.toOutputDto(saved);
  }

  async iniciarPreparacion(dto: IniciarPreparacionDto): Promise<DispatchOutputDto> {
    const dispatch = await this.findOrFail(dto.id_despacho);
    dispatch.iniciarPreparacion();
    const updated = await this.repository.update(dispatch);
    return DispatchMapper.toOutputDto(updated);
  }

  async iniciarTransito(dto: IniciarTransitoDto): Promise<DispatchOutputDto> {
    const dispatch = await this.findOrFail(dto.id_despacho);
    dispatch.iniciarTransito(dto.fecha_salida);
    const updated = await this.repository.update(dispatch);
    return DispatchMapper.toOutputDto(updated);
  }

  async confirmarEntrega(dto: ConfirmarEntregaDto): Promise<DispatchOutputDto> {
    const dispatch = await this.findOrFail(dto.id_despacho);
    dispatch.confirmarEntrega(dto.fecha_entrega);
    const updated = await this.repository.update(dispatch);
    return DispatchMapper.toOutputDto(updated);
  }

  async cancelarDespacho(dto: CancelarDespachoDto): Promise<DispatchOutputDto> {
    const dispatch = await this.findOrFail(dto.id_despacho);
    dispatch.cancelar(dto.motivo);
    const updated = await this.repository.update(dispatch);
    return DispatchMapper.toOutputDto(updated);
  }

  async marcarDetallePreparado(dto: MarcarDetallePreparadoDto): Promise<DispatchOutputDto> {
    const detail = await this.findDetailOrFail(dto.id_detalle_despacho);
    detail.marcarPreparado(dto.cantidad_despachada);
    const updated = await this.repository.updateDetail(detail);
    const dispatch = await this.findOrFail(updated.id_despacho);
    return DispatchMapper.toOutputDto(dispatch);
  }

  async marcarDetalleDespachado(dto: MarcarDetalleDespachoadoDto): Promise<DispatchOutputDto> {
    const detail = await this.findDetailOrFail(dto.id_detalle_despacho);
    detail.marcarDespachado();
    const updated = await this.repository.updateDetail(detail);
    const dispatch = await this.findOrFail(updated.id_despacho);
    return DispatchMapper.toOutputDto(dispatch);
  }

  private async findOrFail(id: number): Promise<Dispatch> {
    const dispatch = await this.repository.findById(id);
    if (!dispatch) throw new Error(`Despacho ${id} no encontrado`);
    return dispatch;
  }

  private async findDetailOrFail(id: number): Promise<DispatchDetail> {
    const detail = await this.repository.findDetailById(id);
    if (!detail) throw new Error(`Detalle ${id} no encontrado`);
    return detail;
  }
}