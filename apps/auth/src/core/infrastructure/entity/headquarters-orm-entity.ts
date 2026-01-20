/* auth/src/core/infrastructure/entity/headquarters-orm-entity.ts */
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('sedes')
export class HeadQuartersOrmEntity {
  @PrimaryColumn()
  id_sede: number;
  @Column()
  nombre_sede: string;
}
