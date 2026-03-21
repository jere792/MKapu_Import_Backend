export enum AuctionStatus {
  ACTIVO     = 'ACTIVO',
  FINALIZADO = 'FINALIZADO',
  CANCELADO  = 'CANCELADO',
}

export interface AuctionDetailRef {
  id_detalle_remate?: number;
  productId:     number;
  originalPrice: number;
  auctionPrice:  number;
  auctionStock:  number;
  observacion?:  string;
}

export class Auction {
  id?:            number;
  code:           string;
  description:    string;
  status:         AuctionStatus;
  details:        AuctionDetailRef[] = [];
  warehouseRefId: number;
  sedeRefId:      number;  
  constructor(
    code:           string,
    description:    string,
    status:         AuctionStatus = AuctionStatus.ACTIVO,
    id?:            number,
    details?:       AuctionDetailRef[],
    warehouseRefId: number = 0,
    sedeRefId:      number = 0, 
  ) {
    this.id             = id;
    this.code           = code;
    this.description    = description;
    this.status         = status;
    this.warehouseRefId = warehouseRefId;
    this.sedeRefId      = sedeRefId; 
    if (details) this.details = details.map(d => ({ ...d }));
  }

  isActive():    boolean { return this.status === AuctionStatus.ACTIVO; }
  isFinalized(): boolean { return this.status === AuctionStatus.FINALIZADO; }
  isCancelled(): boolean { return this.status === AuctionStatus.CANCELADO; }

  finalize(): void {
    if (this.status === AuctionStatus.CANCELADO)  throw new Error('No se puede finalizar un remate cancelado.');
    if (this.status === AuctionStatus.FINALIZADO) throw new Error('El remate ya está finalizado.');
    this.status = AuctionStatus.FINALIZADO;
  }

  cancel(): void {
    if (this.status === AuctionStatus.CANCELADO)  throw new Error('El remate ya está cancelado.');
    if (this.status === AuctionStatus.FINALIZADO) throw new Error('No se puede cancelar un remate ya finalizado.');
    this.status = AuctionStatus.CANCELADO;
  }

  reactivate(): void { this.status = AuctionStatus.ACTIVO; }

  addDetail(detail: AuctionDetailRef): void {
    if (!this.isActive()) throw new Error('No se pueden agregar detalles a una subasta no activa.');
    if (this.details.some(d => d.productId === detail.productId))
      throw new Error(`El producto ${detail.productId} ya está agregado en la subasta.`);
    if (detail.auctionStock <= 0)  throw new Error('El stock del detalle debe ser mayor que 0.');
    if (detail.auctionPrice <= 0 || detail.originalPrice <= 0)
      throw new Error('Los precios deben ser mayores que 0.');
    this.details.push({ ...detail });
  }

  removeDetailByProductId(productId: number): void {
    if (!this.isActive()) throw new Error('No se pueden eliminar detalles de una subasta no activa.');
    const before = this.details.length;
    this.details = this.details.filter(d => d.productId !== productId);
    if (this.details.length === before)
      throw new Error(`No se encontró detalle con productId ${productId} en la subasta.`);
  }

  updateDetail(productId: number, patch: Partial<AuctionDetailRef>): void {
    if (!this.isActive()) throw new Error('No se pueden actualizar detalles de una subasta no activa.');
    const idx = this.details.findIndex(d => d.productId === productId);
    if (idx === -1) throw new Error(`Detalle del producto ${productId} no encontrado.`);
    const updated = { ...this.details[idx], ...patch };
    if (updated.auctionStock <= 0)  throw new Error('El stock del detalle debe ser mayor que 0.');
    if (updated.auctionPrice <= 0 || updated.originalPrice <= 0)
      throw new Error('Los precios deben ser mayores que 0.');
    this.details[idx] = updated;
  }

  totalItems(): number {
    return this.details.reduce((acc, d) => acc + (Number(d.auctionStock) || 0), 0);
  }
}