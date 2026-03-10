import { Injectable } from "@nestjs/common";
import { IHeadquartersRepositoryPort } from "../../../../domain/ports/out/headquarters-ports-out";
import { InjectRepository } from "@nestjs/typeorm";
import { HeadquartersOrmEntity } from "../../../entity/headquarters-orm.entity";
import { Repository } from "typeorm";
import { Headquarters } from "../../../../domain/entity/headquarters-domain-entity";
import { HeadquartersMapper } from "../../../../application/mapper/headquarters.mapper";

@Injectable()
export class HeadquarterRepository implements IHeadquartersRepositoryPort {
   constructor(
      @InjectRepository(HeadquartersOrmEntity)
      private readonly headquartersOrmRepository: Repository<HeadquartersOrmEntity>,
   ) {}

   async save(headquarter: Headquarters): Promise<Headquarters> {
      const headquarterOrm = HeadquartersMapper.toOrmEntity(headquarter);
      const saved = await this.headquartersOrmRepository.save(headquarterOrm);

      return HeadquartersMapper.toDomainEntity(saved);
   }

   async update(headquarter: Headquarters): Promise<Headquarters> {
      const headquarterOrm = HeadquartersMapper.toOrmEntity(headquarter);
      await this.headquartersOrmRepository.update(headquarter.id_sede!, headquarterOrm);
      
      const updated = await this.headquartersOrmRepository.findOne({
         where: { id_sede: headquarter.id_sede },
      });

      return HeadquartersMapper.toDomainEntity(updated!);
   }

   async delete(id: number): Promise<void> {
      await this.headquartersOrmRepository.delete(id);
   }

   async findById(id_sede: number): Promise<Headquarters | null> {
      const headquarterOrm = await this.headquartersOrmRepository.findOne({
         where: { id_sede },
      });

      return headquarterOrm ? HeadquartersMapper.toDomainEntity(headquarterOrm) : null;
   }

   async findByCode(code: string): Promise<Headquarters | null> {
      const headquarterOrm = await this.headquartersOrmRepository.findOne({
         where: { codigo: code },
      });   

      return headquarterOrm ? HeadquartersMapper.toDomainEntity(headquarterOrm) : null;
   }

   async findByName(name: string): Promise<Headquarters | null> {
      const headquarterOrm = await this.headquartersOrmRepository.findOne({
         where: { nombre: name },
      });

      return headquarterOrm ? HeadquartersMapper.toDomainEntity(headquarterOrm) : null;
   }

   async findAll(filters?: {
      activo?: boolean;
      search?: string;
   }): Promise<Headquarters[]> {
      const queryBuilder = this.headquartersOrmRepository.createQueryBuilder('sede');

      if (filters?.activo !== undefined) {
         queryBuilder.andWhere('sede.activo = :activo', { activo: filters.activo ? 1 : 0 });
      }

      if (filters?.search) {
         queryBuilder.andWhere(
            'sede.nombre LIKE :search OR sede.codigo LIKE :search OR sede.ciudad LIKE :search OR sede.departamento LIKE :search',
            { search: `%${filters.search}%` }
         );
      }

      const headquartersOrm = await queryBuilder.getMany();
      return headquartersOrm.map(ormEntity => HeadquartersMapper.toDomainEntity(ormEntity));
   }

   async existsByCode(code: string): Promise<boolean> {
      const count = await this.headquartersOrmRepository.count({
         where: { codigo: code },
      });
      return count > 0;
   } 

   async existsByName(name: string): Promise<boolean> {
      const count = await this.headquartersOrmRepository.count({
         where: { nombre: name },
      });
      return count > 0;
   }
}