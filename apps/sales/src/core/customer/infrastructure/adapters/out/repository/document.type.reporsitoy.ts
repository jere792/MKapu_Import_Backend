
/* ============================================
   sales/src/core/customer/infrastructure/adapters/out/repository/tipo-document.repository.ts
     ============================================ */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IDocumentTypeRepositoryPort } from '../../../../domain/ports/out/customer-port-out';  
import { DocumentType } from '../../../../domain/entity/document-type-domain-entity';  
import { DocumentTypeOrmEntity } from '../../../entity/document-type-orm.entity';
import { CustomerMapper } from '../../../../application/mapper/customer.mapper';

@Injectable()
export class DocumentTypeRepository implements IDocumentTypeRepositoryPort {  
  constructor(
    @InjectRepository(DocumentTypeOrmEntity)
    private readonly repository: Repository<DocumentTypeOrmEntity>,
  ) {}

  async findAll(): Promise<DocumentType[]> {
    const documentTypesOrm = await this.repository.find();
    return documentTypesOrm.map((t) => CustomerMapper.documentTypeToDomain(t));
  }

  async findById(id: number): Promise<DocumentType | null> {
    const documentTypeOrm = await this.repository.findOne({
      where: { id_tipo_documento: id },
    });
    return documentTypeOrm ? CustomerMapper.documentTypeToDomain(documentTypeOrm) : null;
  }

  async findBySunatCode(cod_sunat: string): Promise<DocumentType | null> {  
    const documentTypeOrm = await this.repository.findOne({
      where: { cod_sunat },
    });
    return documentTypeOrm ? CustomerMapper.documentTypeToDomain(documentTypeOrm) : null;
  }
}
