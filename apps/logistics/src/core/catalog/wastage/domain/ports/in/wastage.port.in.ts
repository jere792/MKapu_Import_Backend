import { CreateWastageDto } from '../../../application/dto/in/create-wastage.dto';
import { UpdateWastageDto } from '../../../application/dto/in/update-wastage.dto';
import { WastageResponseDto, WastagePaginatedResponseDto } from '../../../application/dto/out/wastage-response.dto';
import { WastageSuggestionDto } from '../../../application/dto/out/wastage-suggestion-response.dto';
export interface IWastageCommandPort {
  create(dto: CreateWastageDto): Promise<WastageResponseDto>;
  update(id: number, payload: { motivo?: string; id_tipo_merma?: number; observacion?: string }): Promise<WastageResponseDto>;
}

export interface IWastageQueryPort {
  findAll(): Promise<WastageResponseDto[]>;
  findAllPaginated(page: number, limit: number, id_sede?: number): Promise<WastagePaginatedResponseDto>;
  findById(id: number): Promise<WastageResponseDto>;
  search(q: string, id_sede?: number, limit?: number): Promise<WastageSuggestionDto[]>;
}

