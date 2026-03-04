import {
  CancelarDespachoDto,
  ConfirmarEntregaDto,
  CreateDispatchDto,
  IniciarPreparacionDto,
  IniciarTransitoDto,
  MarcarDetalleDespachoadoDto,
  MarcarDetallePreparadoDto,
} from '../../../application/dto/in/dispatch-input.dto';
import { DispatchOutputDto } from '../../../application/dto/out/dispatch-output.dto';

export interface IDispatchInputPort {
  crearDespacho(dto: CreateDispatchDto): Promise<DispatchOutputDto>;
  iniciarPreparacion(dto: IniciarPreparacionDto): Promise<DispatchOutputDto>;
  iniciarTransito(dto: IniciarTransitoDto): Promise<DispatchOutputDto>;
  confirmarEntrega(dto: ConfirmarEntregaDto): Promise<DispatchOutputDto>;
  cancelarDespacho(dto: CancelarDespachoDto): Promise<DispatchOutputDto>;
  marcarDetallePreparado(dto: MarcarDetallePreparadoDto): Promise<DispatchOutputDto>;
  marcarDetalleDespachado(dto: MarcarDetalleDespachoadoDto): Promise<DispatchOutputDto>;
}