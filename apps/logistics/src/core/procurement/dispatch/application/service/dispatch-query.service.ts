import { Injectable, Inject } from '@nestjs/common';
import { DispatchMapper } from '../mapper/dispatch.mapper';
import { DispatchOutputDto } from '../dto/out/dispatch-output.dto';
import { IDispatchOutputPort } from '../../domain/ports/out/dispatch-output.port';

export interface IDispatchQueryPort {
  findById(id_despacho: number): Promise<DispatchOutputDto>;
  findAll(): Promise<DispatchOutputDto[]>;
  findByVenta(id_venta_ref: number): Promise<DispatchOutputDto[]>;
}

@Injectable()
export class DispatchQueryService implements IDispatchQueryPort {
  constructor(
    @Inject('IDispatchOutputPort')
    private readonly repository: IDispatchOutputPort,
  ) {}

  async findById(id_despacho: number): Promise<DispatchOutputDto> {
    const dispatch = await this.repository.findById(id_despacho);
    if (!dispatch) throw new Error(`Despacho ${id_despacho} no encontrado`);
    return DispatchMapper.toOutputDto(dispatch);
  }

  async findAll(): Promise<DispatchOutputDto[]> {
    const dispatches = await this.repository.findAll();
    return dispatches.map(DispatchMapper.toOutputDto);
  }

  async findByVenta(id_venta_ref: number): Promise<DispatchOutputDto[]> {
    const dispatches = await this.repository.findByVenta(id_venta_ref);
    return dispatches.map(DispatchMapper.toOutputDto);
  }
}