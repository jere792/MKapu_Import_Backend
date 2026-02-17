// wastage-query.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { IWastageQueryPort } from '../../domain/ports/in/wastage.port.in';
import { IWastageRepositoryPort } from '../../domain/ports/out/wastage.port.out';
import { WastageResponseDto } from '../dto/out/wastage-response.dto';
import { WastagePaginatedResponseDto } from '../dto/out/wastage-response.dto';
import { WastageMapper } from '../mapper/wastage.mapper';

@Injectable()
export class WastageQueryService implements IWastageQueryPort {
  constructor(
    @Inject('IWastageRepositoryPort')
    private readonly repository: IWastageRepositoryPort,
  ) {}

  async findAll(): Promise<WastageResponseDto[]> {
    const wastages = await this.repository.findAll();
    return wastages.map(w => WastageMapper.toResponseDto(w));
  }

  async findAllPaginated(
    page: number = 1,
    limit: number = 10,
  ): Promise<WastagePaginatedResponseDto> {
    const skip = (page - 1) * limit;
    
    const [wastages, total] = await this.repository.findAndCount(skip, limit);
    
    return {
      data: wastages.map(w => WastageMapper.toResponseDto(w)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number): Promise<WastageResponseDto> {
    const wastage = await this.repository.findById(id);
    return WastageMapper.toResponseDto(wastage);
  }
}