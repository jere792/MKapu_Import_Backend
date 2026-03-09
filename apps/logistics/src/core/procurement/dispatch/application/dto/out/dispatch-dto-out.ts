import { DispatchStatus } from '../../../domain/entity/dispatch-domain-entity';

export class DispatchDtoOut {
  id_despacho: number;
  id_venta_ref: number;
  tipo_envio: string;
  estado: DispatchStatus;
  fecha_envio: Date;
}