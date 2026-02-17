// domain/entity/auction-domain.entity.ts
export enum AuctionStatus {
  ACTIVO = 'ACTIVO',
  FINALIZADO = 'FINALIZADO',
}

export interface AuctionDetailRef {
  id_detalle_remate?: number;
  productId: number;      // id_producto
  originalPrice: number;  // pre_original
  auctionPrice: number;   // pre_remate
  auctionStock: number;   // stock_remate
  observacion?: string;
}

export class Auction {
  id?: number;               // id_remate
  code: string;              // cod_remate
  description: string;       // descripcion
  startAt: Date;             // fec_inicio
  endAt: Date;               // fec_fin
  status: AuctionStatus;     // estado
  details: AuctionDetailRef[] = [];

  constructor(
    code: string,
    description: string,
    endAt: Date,
    startAt?: Date,
    status: AuctionStatus = AuctionStatus.ACTIVO,
    id?: number,
    details?: AuctionDetailRef[],
  ) {
    this.id = id;
    this.code = code;
    this.description = description;
    this.startAt = startAt ?? new Date();
    this.endAt = endAt;
    this.status = status;

    if (details) {
      this.details = details.map(d => ({ ...d }));
    }

    if (this.endAt.getTime() < Date.now()) {
      this.status = AuctionStatus.FINALIZADO;
    }
  }

  isActive(): boolean {
    if (this.status !== AuctionStatus.ACTIVO) return false;
    const now = Date.now();
    return this.startAt.getTime() <= now && now <= this.endAt.getTime();
  }

  isFinalized(): boolean {
    if (this.status === AuctionStatus.FINALIZADO) return true;
    return Date.now() > this.endAt.getTime();
  }

  extendEndDate(newEndAt: Date): void {
    if (this.isFinalized()) {
      throw new Error(`No se puede extender una subasta finalizada (id: ${this.id ?? 'n/a'}).`);
    }
    if (newEndAt.getTime() <= this.endAt.getTime()) {
      throw new Error('La nueva fecha de fin debe ser posterior a la fecha de fin actual.');
    }
    this.endAt = newEndAt;
  }

  finalize(): void {
    if (this.isFinalized()) {
      this.status = AuctionStatus.FINALIZADO;
      return;
    }
    this.status = AuctionStatus.FINALIZADO;
    this.endAt = new Date();
  }

  reactivate(newEndAt?: Date): void {
    if (this.status === AuctionStatus.ACTIVO && !newEndAt) return;
    if (newEndAt && newEndAt.getTime() <= Date.now()) {
      throw new Error('La nueva fecha de fin debe ser en el futuro para reactivar la subasta.');
    }
    this.status = AuctionStatus.ACTIVO;
    if (newEndAt) this.endAt = newEndAt;
  }

  addDetail(detail: AuctionDetailRef): void {
    if (this.isFinalized()) {
      throw new Error('No se pueden agregar detalles a una subasta finalizada.');
    }
    const exists = this.details.some(d => d.productId === detail.productId);
    if (exists) {
      throw new Error(`El producto ${detail.productId} ya está agregado en la subasta.`);
    }
    if (detail.auctionStock <= 0) throw new Error('El stock del detalle debe ser mayor que 0.');
    if (detail.auctionPrice <= 0 || detail.originalPrice <= 0) throw new Error('Los precios deben ser mayores que 0.');
    this.details.push({ ...detail });
  }

  removeDetailByProductId(productId: number): void {
    if (this.isFinalized()) {
      throw new Error('No se pueden eliminar detalles de una subasta finalizada.');
    }
    const before = this.details.length;
    this.details = this.details.filter(d => d.productId !== productId);
    if (this.details.length === before) {
      throw new Error(`No se encontró detalle con productId ${productId} en la subasta.`);
    }
  }

  updateDetail(productId: number, patch: Partial<AuctionDetailRef>): void {
    if (this.isFinalized()) throw new Error('No se pueden actualizar detalles de una subasta finalizada.');
    const idx = this.details.findIndex(d => d.productId === productId);
    if (idx === -1) throw new Error(`Detalle del producto ${productId} no encontrado.`);
    const updated = { ...this.details[idx], ...patch };
    if (updated.auctionStock <= 0) throw new Error('El stock del detalle debe ser mayor que 0.');
    if (updated.auctionPrice <= 0 || updated.originalPrice <= 0) throw new Error('Los precios deben ser mayores que 0.');
    this.details[idx] = updated;
  }

  totalItems(): number {
    return this.details.reduce((acc, d) => acc + (Number(d.auctionStock) || 0), 0);
  }
}