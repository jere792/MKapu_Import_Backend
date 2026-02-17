import { CreateWastageDto } from '../../../application/dto/in/create-wastage.dto';
import { WastageResponseDto, WastagePaginatedResponseDto  } from '../../../application/dto/out/wastage-response.dto';

// Para el Command Service
export interface IWastageCommandPort {
  create(dto: CreateWastageDto): Promise<WastageResponseDto>;
}

export interface IWastageQueryPort {
  findAll(): Promise<WastageResponseDto[]>;
  findAllPaginated(page: number, limit: number): Promise<WastagePaginatedResponseDto>; 
  findById(id: number): Promise<WastageResponseDto>;
}