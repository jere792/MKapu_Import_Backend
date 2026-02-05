import { Inject, Injectable } from '@nestjs/common';
import { IWarrantyQueryPort } from '../../domain/ports/in/warranty-ports-in';
import { ListWarrantyFilterDto } from '../dto/in/list-warranty-filter.dto';
import { WarrantyListResponse } from '../dto/out/warranty-list-response.dto';
import { WarrantyResponseDto } from '../dto/out/warranty-response.dto';
import { WarrantyMapper } from '../mapper/warranty.mapper';
import { IWarrantyRepositoryPort } from '../../domain/ports/out/warranty-ports-out';

@Injectable()
export class WarrantyQueryService implements IWarrantyQueryPort {
  constructor(
    @Inject('IWarrantyRepositoryPort')
    private readonly repository: IWarrantyRepositoryPort,
  ) {}
  async listWarranties(
    filters: ListWarrantyFilterDto,
  ): Promise<WarrantyListResponse> {
    const limit = filters.limit ? Number(filters.limit) : 10;
    const page = filters.page ? Number(filters.page) : 1;
    const [warranties, total] = await this.repository.findAll({
      page,
      limit,
      search: filters.search,
      id_estado: filters.id_estado,
    });
    return WarrantyMapper.toListResponse(warranties, total, page, limit);
  }
  async getWarrantyById(id: number): Promise<WarrantyResponseDto | null> {
    const warranty = await this.repository.findById(id);
    if (!warranty) return null;
    return WarrantyMapper.toResponseDto(warranty);
  }
  getWarrantiesByReceipt(
    idComprobante: number,
  ): Promise<WarrantyResponseDto[]> {
    const warrantiesPromise = this.repository.findByReceiptId(idComprobante);
    return warrantiesPromise.then((warranties) =>
      warranties.map((warranty) => WarrantyMapper.toResponseDto(warranty)),
    );
  }
}
