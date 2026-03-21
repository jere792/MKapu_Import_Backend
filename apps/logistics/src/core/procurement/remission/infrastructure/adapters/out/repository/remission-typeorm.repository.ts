/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { RemissionPortOut } from '../../../../domain/ports/out/remission-port-out';
import {
  RemissionOrmEntity,
  TransportMode,
} from '../../../entity/remission-orm.entity';
import { DataSource, Repository } from 'typeorm';
import { Remission } from '../../../../domain/entity/remission-domain-entity';
import { CarrierOrmEntity } from '../../../entity/carrier-orm.entity';
import { DriverOrmEntity } from '../../../entity/driver-orm.entity';
import { RemissionDetailOrmEntity } from '../../../entity/remission-detail-orm.entity';
import { GuideTransferOrm } from '../../../entity/transport_guide-orm.entity';
import { VehiculoOrmEntity } from '../../../entity/vehicle-orm.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RemissionMapper } from '../../../../application/mapper/remission.mapper';

@Injectable()
export class RemissionTypeormRepository implements RemissionPortOut {
  constructor(
    @InjectRepository(RemissionOrmEntity)
    private readonly repository: Repository<RemissionOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}
  async getNextCorrelative(): Promise<number> {
    const last = await this.dataSource.manager.find(RemissionOrmEntity, {
      order: { numero: 'DESC' },
      take: 1,
    });
    return last.length > 0 ? last[0].numero + 1 : 1;
  }
  async save(remission: Remission): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const ormEntity = new RemissionOrmEntity();
      if (remission.id_guia) ormEntity.id_guia = remission.id_guia;
      ormEntity.serie = remission.serie;
      ormEntity.numero = remission.numero;
      ormEntity.tipo_guia = remission.tipo_guia;
      ormEntity.fecha_emision = remission.fecha_emision;
      ormEntity.fecha_inicio = remission.fecha_inicio;
      ormEntity.motivo_traslado = remission.motivo_traslado;
      ormEntity.modalidad = remission.modalidad;
      ormEntity.peso_total = remission.peso_total;
      ormEntity.unidad_peso = remission.unidad_peso;
      ormEntity.cantidad = remission.cantidad;
      ormEntity.estado = remission.estado;
      ormEntity.observaciones = remission.observaciones;
      ormEntity.id_almacen_origen = remission.id_almacen_origen;
      ormEntity.id_comprobante_ref = remission.id_comprobante_ref;
      ormEntity.id_usuario_ref = remission.id_usuario_ref;
      ormEntity.id_sede_ref = remission.id_sede_ref.toString();

      const savedGuia = await queryRunner.manager.save(ormEntity);

      const detallesOrm = remission.getDetalles().map((det) => {
        const detOrm = new RemissionDetailOrmEntity();
        detOrm.guia = savedGuia;
        detOrm.id_producto = det.id_producto;
        detOrm.cod_prod = det.cod_prod;
        detOrm.cantidad = det.cantidad;
        detOrm.peso_total = det.peso_total;
        detOrm.peso_unitario = det.peso_unitario;
        return detOrm;
      });
      await queryRunner.manager.save(detallesOrm);

      if (remission.datos_traslado) {
        const transfer = new GuideTransferOrm();
        transfer.guia = savedGuia;
        transfer.direccion_origen = remission.datos_traslado.direccion_origen;
        transfer.ubigeo_origen = remission.datos_traslado.ubigeo_origen;
        transfer.direccion_destino = remission.datos_traslado.direccion_destino;
        transfer.ubigeo_destino = remission.datos_traslado.ubigeo_destino;
        await queryRunner.manager.save(transfer);
      }

      if (remission.datos_transporte) {
        if (remission.modalidad === TransportMode.PRIVADO) {
          const driver = new DriverOrmEntity();
          driver.guia = savedGuia;
          driver.nombre_completo = remission.datos_transporte.nombre_completo;
          driver.tipo_documento = remission.datos_transporte.tipo_documento;
          driver.numero_documento = remission.datos_transporte.numero_documento;
          driver.licencia = remission.datos_transporte.licencia;
          await queryRunner.manager.save(driver);

          const vehicle = new VehiculoOrmEntity();
          vehicle.guia = savedGuia;
          vehicle.placa = remission.datos_transporte.placa;
          await queryRunner.manager.save(vehicle);
        } else {
          const carrier = new CarrierOrmEntity();
          carrier.guia = savedGuia;
          carrier.ruc = remission.datos_transporte.ruc;
          carrier.razon_social = remission.datos_transporte.razon_social;
          await queryRunner.manager.save(carrier);
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error en Repositorio al guardar Guía de Remisión:', error);
      throw new InternalServerErrorException(
        'Error de persistencia en BD al emitir guía',
      );
    } finally {
      await queryRunner.release();
    }
  }
  async findById(id: string): Promise<Remission | null> {
    const ormEntity = await this.repository.findOne({
      where: { id_guia: id },
      relations: ['details'],
    });
    if (!ormEntity) {
      return null;
    }
    return RemissionMapper.toDomain(ormEntity, ormEntity.details);
  }
  async findByRefId(idVenta: number): Promise<any> {
    return await this.repository.findOne({
      where: { id_comprobante_ref: idVenta },
    });
  }
  async findAll(filter: any): Promise<{ data: any[]; total: number }> {
    const { page = 1, limit = 10, search, estado, startDate, endDate } = filter;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder('remission');

    if (search) {
      queryBuilder.andWhere(
        '(remission.motivo_traslado LIKE :search OR remission.numero LIKE :search OR remission.serie LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (estado !== undefined && estado !== null) {
      queryBuilder.andWhere('remission.estado = :estado', { estado });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'remission.fecha_emision BETWEEN :startDate AND :endDate',
        {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
      );
    }

    const total = await queryBuilder.getCount();

    queryBuilder
      .orderBy('remission.fecha_emision', 'DESC')
      .skip(skip)
      .take(limit);

    // 3. Obtenemos solo los datos de la página actual
    const ormEntities = await queryBuilder.getMany();

    return {
      data: ormEntities.map((entity) => RemissionMapper.toDomain(entity)),
      total, // Ahora sí devolverá 4 (o el número real que haya en la BD)
    };
  }

  async getSummaryInfo(startDate: Date, endDate: Date): Promise<any> {
    const qb = this.repository
      .createQueryBuilder('remission')
      .select('COUNT(remission.id_guia)', 'totalMes')
      .addSelect(
        `SUM(CASE WHEN remission.estado = 'EMITIDO' THEN 1 ELSE 0 END)`,
        'enTransito',
      )
      .addSelect(
        `SUM(CASE WHEN remission.estado = 'PROCESADO' THEN 1 ELSE 0 END)`,
        'entregadas',
      )
      .addSelect(
        `SUM(CASE WHEN remission.estado = 'ANULADO' THEN 1 ELSE 0 END)`,
        'observadas',
      )
      .where('remission.fecha_emision >= :startDate', { startDate })
      .andWhere('remission.fecha_emision <= :endDate', { endDate });

    const rawData = await qb.getRawOne();

    return {
      totalMes: Number(rawData.totalMes || 0),
      enTransito: Number(rawData.enTransito || 0),
      entregadas: Number(rawData.entregadas || 0),
      observadas: Number(rawData.observadas || 0),
    };
  }
  async obtenerGuiaParaReporte(id: string): Promise<any> {
    return await this.repository
      .createQueryBuilder('guia')
      .leftJoinAndSelect('guia.details', 'details')
      .leftJoinAndMapOne(
        'guia.transfer',
        GuideTransferOrm,
        'transfer',
        'transfer.id_guia = guia.id_guia',
      )
      .leftJoinAndMapOne(
        'guia.driver',
        DriverOrmEntity,
        'driver',
        'driver.id_guia = guia.id_guia',
      )
      .leftJoinAndMapOne(
        'guia.vehicle',
        VehiculoOrmEntity,
        'vehicle',
        'vehicle.id_guia = guia.id_guia',
      )
      .leftJoinAndMapOne(
        'guia.carrier',
        CarrierOrmEntity,
        'carrier',
        'carrier.id_guia = guia.id_guia',
      )
      .where('guia.id_guia = :id', { id })
      .getOne();
  }
  async markAsPrinted(id: string): Promise<void> {
    await this.repository.update(id, { impreso: true });
  }
}
