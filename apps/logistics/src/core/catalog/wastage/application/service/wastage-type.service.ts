// application/service/wastage-type.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WastageTypeOrmEntity } from '../../infrastructure/entity/wastage-type.orm.entity';
import { WastageTypeResponseDto } from '../dto/out/wastage-type-response.dto';

@Injectable()
export class WastageTypeService {
  constructor(
    @InjectRepository(WastageTypeOrmEntity)
    private readonly repo: Repository<WastageTypeOrmEntity>,
  ) {}

  async findAll(): Promise<WastageTypeResponseDto[]> {
    const tipos = await this.repo.find({
      where: { estado: true } as any,
      order: { tipo: 'ASC' },
    });

    return tipos.map(t => ({
      id_tipo:      t.id_tipo,
      tipo:         t.tipo,
      motivo_merma: t.motivo_merma,
      estado:       Boolean(t.estado),
    }));
  }
}