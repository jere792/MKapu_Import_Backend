import { ProductOrmEntity } from 'apps/logistics/src/core/catalog/product/infrastructure/entity/product-orm.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { TransferOrmEntity } from './transfer-orm.entity';

@Entity({ name: 'detalle_transferencia' })
export class TransferDetailOrmEntity {
  @PrimaryColumn({ name: 'id_detalle', type: 'varchar', length: 255 })
  serialNumber: string;

  @PrimaryColumn({ name: 'id_producto', type: 'int' })
  productId: number;

  @PrimaryColumn({ name: 'id_transferencia', type: 'int' })
  transferId: number;

  @Column({ name: 'cantidad', type: 'int' })
  quantity: number;

  @ManyToOne(() => TransferOrmEntity, (t) => t.details)
  @JoinColumn({ name: 'id_transferencia' })
  transfer: TransferOrmEntity;

  @ManyToOne(() => ProductOrmEntity)
  @JoinColumn({ name: 'id_producto' })
  product: ProductOrmEntity;
}
