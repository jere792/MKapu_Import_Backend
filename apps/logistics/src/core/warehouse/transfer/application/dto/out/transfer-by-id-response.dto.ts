import { TransferStatus } from '../../../domain/entity/transfer-domain-entity';

export interface TransferByIdUserResponseDto {
  idUsuario: number;
  usuNom: string;
  apePat: string;
  apeMat?: string;
}

export interface TransferByIdProductResponseDto {
  id_producto: number;
  categoria: {
    id_categoria: number;
    nombre: string;
  } | null;
  codigo: string;
  nomProducto: string;
  descripcion: string;
}

export interface TransferByIdItemResponseDto {
  productId: number;
  series: string[];
  quantity: number;
  producto: TransferByIdProductResponseDto | null;
}

export interface TransferByIdResponseDto {
  id?: number;
  creatorUserId?: number;
  approveUserId?: number;
  originHeadquartersId: string;
  originWarehouseId: number;
  destinationHeadquartersId: string;
  destinationWarehouseId: number;
  approveUser: TransferByIdUserResponseDto | null;
  origin: {
    id_sede: string;
    nomSede: string;
  };
  originWarehouse: {
    id_almacen: number;
    nomAlm: string;
  };
  destination: {
    id_sede: string;
    nomSede: string;
  };
  destinationWarehouse: {
    id_almacen: number;
    nomAlm: string;
  };
  totalQuantity: number;
  status: TransferStatus;
  observation?: string;
  requestDate: Date;
  responseDate?: Date;
  completionDate?: Date;
  items: TransferByIdItemResponseDto[];
  creatorUser: TransferByIdUserResponseDto | null;
}
