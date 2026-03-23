import { Dispatch } from '../../entity/dispatch-domain-entity';
import { DispatchDetail } from '../../entity/dispatch-detail-domain-entity';

// Filtros definidos aquí para evitar dependencia circular con el service
export interface FindAllFilters {
  page?: number;
  limit?: number;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface IDispatchOutputPort {
  findById(id_despacho: number): Promise<Dispatch | null>;
  findDetailById(id_detalle_despacho: number): Promise<DispatchDetail | null>;
  findAll(filters?: FindAllFilters): Promise<{ data: Dispatch[]; total: number }>;
  findByVenta(id_venta_ref: number): Promise<Dispatch[]>;
  save(dispatch: Dispatch): Promise<Dispatch>;
  saveDetail(detail: DispatchDetail, id_despacho: number): Promise<DispatchDetail>;
  update(dispatch: Dispatch): Promise<Dispatch>;
  updateDetail(detail: DispatchDetail): Promise<DispatchDetail>;
}