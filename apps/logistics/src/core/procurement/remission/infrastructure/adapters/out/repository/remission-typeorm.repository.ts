/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
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
  async findById(id: string): Promise<any | null> {
    return await this.repository.findOne({
      where: { id_guia: id },
    });
  }
  async findByRefId(idVenta: number): Promise<any> {
    return await this.repository.findOne({
      where: { id_comprobante_ref: idVenta },
    });
  }
}
