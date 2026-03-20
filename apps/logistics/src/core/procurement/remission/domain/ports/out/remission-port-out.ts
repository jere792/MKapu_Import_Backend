import { Remission } from '../../entity/remission-domain-entity';

export interface RemissionPortOut {
  getNextCorrelative(): Promise<number>;
  save(remission: Remission): Promise<void>;
  findAll(filter: any): Promise<{ data: Remission[]; total: number }>;
  findById(id: string): Promise<Remission | null>;
  findByRefId(idVenta: number): Promise<any>;
  getSummaryInfo(startDate: Date, endDate: Date): Promise<any>;
  obtenerGuiaParaReporte(id: string): Promise<any>;
  markAsPrinted(id: string): Promise<void>;
}
