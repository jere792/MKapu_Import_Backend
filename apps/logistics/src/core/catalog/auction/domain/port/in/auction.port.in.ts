// domain/ports/in/auction.port.in.ts
import { CreateAuctionDto } from '../../../application/dto/in/create-auction.dto';
import { ListAuctionFilterDto } from '../../../application/dto/in/list-auction-filter.dto';
import { AuctionResponseDto } from '../../../application/dto/out/auction-response.dto';

export interface IAuctionCommandPort {
  create(dto: CreateAuctionDto): Promise<AuctionResponseDto>;
  update(id: number, dto: CreateAuctionDto): Promise<AuctionResponseDto>;
  finalize(id: number): Promise<AuctionResponseDto>;
  delete(id: number): Promise<void>;
}

export interface IAuctionQueryPort {
  findById(id: number): Promise<AuctionResponseDto | null>;
  list(filters: ListAuctionFilterDto): Promise<{ items: AuctionResponseDto[]; total: number }>;
}