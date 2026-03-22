import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('banco')
export class BankOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_banco' })
  id_banco: number;

  @Column({ name: 'nombre_banco', type: 'varchar', length: 150 })
  nombre_banco: string;
}