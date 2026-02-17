// domain/ports/out/auction.port.out.ts
import { Auction } from '../../entity/auction-domain-entity';
import { ListAuctionFilterDto } from '../../../application/dto/in/list-auction-filter.dto';

export interface IAuctionRepositoryPort {
  save(domain: Auction): Promise<Auction>;
  findById(id: number): Promise<Auction | null>;
  findPaged(filters: ListAuctionFilterDto): Promise<{ items: Auction[]; total: number }>;
  delete(id: number): Promise<void>;
}