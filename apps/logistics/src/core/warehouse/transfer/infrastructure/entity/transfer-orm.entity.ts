import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { StoreOrmEntity } from '../../../store/infrastructure/entity/store-orm.entity';
import { TransferDetailOrmEntity } from './transfer-detail-orm.entity';

@Entity({ name: 'transferencia', schema: 'mkp_logistica' })
export class TransferOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_transferencia', type: 'int' })
  id: number;

  @Column({ name: 'id_almacen_origen', type: 'int' })
  originWarehouseId: number;

  @Column({ name: 'id_almacen_destino', type: 'int' })
  destinationWarehouseId: number;

  @Column({ name: 'fec_transf', type: 'datetime' })
  date: Date;

  @Column({ name: 'tipo_op', type: 'varchar', length: 50 })
  operationType: string;

  @Column({
    name: 'motivo_transf',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  motive: string;

  @Column({ name: 'estado', type: 'varchar', length: 50 })
  status: string;

  @Column({ name: 'doc_ref', type: 'varchar', length: 50, nullable: true })
  docRef: string;

  @Column({
    name: 'id_user_ref_origin',
    type: 'int',
    nullable: false,
  })
  userIdRefOrigin: number;

  @Column({
    name: 'id_user_ref_dest',
    type: 'int',
    nullable: true,
  })
  userIdRefDest: number | null;

  @ManyToOne(() => StoreOrmEntity)
  @JoinColumn({ name: 'id_almacen_origen' })
  originWarehouse: StoreOrmEntity;

  @ManyToOne(() => StoreOrmEntity)
  @JoinColumn({ name: 'id_almacen_destino' })
  destinationWarehouse: StoreOrmEntity;

  @OneToMany(() => TransferDetailOrmEntity, (detail) => detail.transfer, {
    cascade: true,
  })
  details: TransferDetailOrmEntity[];
}
