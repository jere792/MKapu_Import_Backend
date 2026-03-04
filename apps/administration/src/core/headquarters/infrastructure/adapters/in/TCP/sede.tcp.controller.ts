  /* eslint-disable prettier/prettier */
  import { Controller, Inject, Logger } from '@nestjs/common';
  import { MessagePattern, Payload } from '@nestjs/microservices';
  import { SedeAlmacenOrmEntity } from '../../../../../sede-almacen/infrastructure/entity/sede-almacen-orm.entity'; 
  import { IHeadquartersQueryPort } from '../../../../domain/ports/in/headquarters-ports-in';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository, In } from 'typeorm';
  import { HeadquartersOrmEntity } from '../../../entity/headquarters-orm.entity';

  type GetSedeByIdPayload = {
    id_sede: string | number;
  };

  @Controller()
  export class SedeTcpController {
    private readonly logger = new Logger(SedeTcpController.name);

    constructor(
      @Inject('IHeadquartersQueryPort')
      private readonly headquartersQueryPort: IHeadquartersQueryPort,
      @InjectRepository(HeadquartersOrmEntity)
      private readonly sedeRepo: Repository<HeadquartersOrmEntity>,
      @InjectRepository(SedeAlmacenOrmEntity)
      private readonly sedeAlmacenRepo: Repository<SedeAlmacenOrmEntity>
    ) {}

    @MessagePattern('get_sede_by_id')
    async getSedeById(@Payload() payload: GetSedeByIdPayload) {
      const idStr = String(payload?.id_sede ?? '').trim();

      this.logger.log(
        `📡 [TCP] get_sede_by_id payload: ${JSON.stringify(payload)}`,
      );

      if (!idStr) {
        return { ok: false, message: 'id_sede es obligatorio', data: null };
      }

      const id = Number(idStr);
      if (Number.isNaN(id)) {
        return { ok: false, message: 'id_sede debe ser numérico', data: null };
      }

      const sedeDto = await this.headquartersQueryPort.getHeadquarterById(id);

      if (!sedeDto) {
        return { ok: true, data: null };
      }

      return {
        ok: true,
        data: {
          id_sede: sedeDto.id_sede,
          nombre: sedeDto.nombre,
        },
      };
    }

    @MessagePattern('get_sedes_nombres')
    async getNamesByIds(
      @Payload() ids: number[],
    ): Promise<Record<number, string>> {
      if (!ids || ids.length === 0) return {};

      const sedes = await this.sedeRepo.find({
        where: { id_sede: In(ids) },
        select: ['id_sede', 'nombre'],
      });

      return sedes.reduce<Record<number, string>>((acc, sede) => {
        acc[sede.id_sede] = sede.nombre;
        return acc;
      }, {});
    }

    @MessagePattern('get_almacen_by_sede')
    async getAlmacenBySede(@Payload() id_sede: number) {
      this.logger.log(`📡 [TCP] get_almacen_by_sede id_sede: ${id_sede}`);

      const rows = await this.sedeAlmacenRepo.query(
        'SELECT id_almacen_ref FROM mkp_administracion.sede_almacen WHERE id_sede = ? LIMIT 1',
        [id_sede],
      );
      this.logger.log('Resultado crudo de sedeAlmacenRepo.query:', JSON.stringify(rows));

      function getAlmacenValue(obj: any): number | null {
        const key = Object.keys(obj).find(k => k.toLowerCase().includes('almacen'));
        if (!key) return null;
        const num = Number(obj[key]);
        return Number.isFinite(num) && num > 0 ? num : null;
      }

      const almacenValue = rows.length > 0 ? getAlmacenValue(rows[0]) : null;

      if (!almacenValue) {
        this.logger.warn(`⚠️ No hay almacén asignado para sede ${id_sede} -- Valor obtenido: ${JSON.stringify(rows[0])}`);
        return { id_almacen: null };
      }

      this.logger.log(`✅ Sede ${id_sede} → Almacén ${almacenValue}`);
      return { id_almacen: almacenValue };
    }

    @MessagePattern('get_sede_by_id_full')
    async getSedeByIdFull(@Payload() payload: GetSedeByIdPayload) {
      const idStr = String(payload?.id_sede ?? '').trim();

      this.logger.log(
        `📡 [TCP] get_sede_by_id_full payload: ${JSON.stringify(payload)}`,
      );

      if (!idStr) {
        return { ok: false, message: 'id_sede es obligatorio', data: null };
      }

      const id = Number(idStr);
      if (Number.isNaN(id)) {
        return { ok: false, message: 'id_sede debe ser numérico', data: null };
      }

      const sedeDto = await this.headquartersQueryPort.getHeadquarterById(id);

      if (!sedeDto) {
        return { ok: true, data: null };
      }

      return {
        ok: true,
        data: {
          id_sede: sedeDto.id_sede,
          nombre: sedeDto.nombre,
          codigo: sedeDto.codigo,
          ciudad: sedeDto.ciudad,
          departamento: sedeDto.departamento,
          direccion: sedeDto.direccion,
          telefono: sedeDto.telefono,
        },
      };
    }
  }