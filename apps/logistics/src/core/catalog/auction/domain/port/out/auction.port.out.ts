import { Auction } from '../../entity/auction-domain-entity';
import { ListAuctionFilterDto } from '../../../application/dto/in/list-auction-filter.dto';

export interface AuctionAutocompleteItem {
  id_detalle_remate:   number;
  id_remate:           number;
  cod_remate:          string;
  id_producto:         number;
  codigo_producto:     string;
  nombre_producto:     string;
  descripcion_producto: string;
  descripcion_remate:  string;
  id_categoria:        number;
  familia:             string;
  pre_original:        number;
  pre_remate:          number;
  stock_remate:        number;
}

export interface IAuctionRepositoryPort {
  save(domain: Auction): Promise<Auction>;
  findById(id: number): Promise<Auction | null>;
  findPaged(filters: ListAuctionFilterDto): Promise<{ items: Auction[]; total: number }>;
  delete(id: number): Promise<void>;
  resolveSedeByAlmacen(id_almacen: number): Promise<number>;

  autocomplete(search: string, id_sede?: number): Promise<AuctionAutocompleteItem[]>;
}