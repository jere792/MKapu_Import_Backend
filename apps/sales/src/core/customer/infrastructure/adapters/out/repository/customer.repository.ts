import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICustomerRepositoryPort } from '../../../../domain/ports/out/customer-port-out';
import { Customer } from '../../../../domain/entity/customer-domain-entity';
import { CustomerOrmEntity } from '../../../entity/customer-orm.entity';
import { CustomerMapper } from '../../../../application/mapper/customer.mapper';

@Injectable()
export class CustomerRepository implements ICustomerRepositoryPort {
  constructor(
    @InjectRepository(CustomerOrmEntity)
    private readonly customerOrmRepository: Repository<CustomerOrmEntity>,
  ) {}

  async save(customer: Customer): Promise<Customer> {
    const customerOrm = CustomerMapper.toOrmEntity(customer);
    const saved = await this.customerOrmRepository.save(customerOrm);
    return CustomerMapper.toDomainEntity(saved);
  }

  async update(customer: Customer): Promise<Customer> {
    const customerOrm = CustomerMapper.toOrmEntity(customer);
    await this.customerOrmRepository.update(customer.id_cliente!, customerOrm);
    const updated = await this.customerOrmRepository.findOne({
      where: { id_cliente: customer.id_cliente },
      relations: ['tipoDocumento'],
    });
    return CustomerMapper.toDomainEntity(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.customerOrmRepository.delete(id);
  }

  async findById(id: string): Promise<Customer | null> {
    const customerOrm = await this.customerOrmRepository.findOne({
      where: { id_cliente: id },
      relations: ['tipoDocumento'],
    });
    return customerOrm ? CustomerMapper.toDomainEntity(customerOrm) : null;
  }

  async findByDocument(valor_doc: string): Promise<Customer | null> {
    const customerOrm = await this.customerOrmRepository.findOne({
      where: { valor_doc },
      relations: ['tipoDocumento'],
    });
    return customerOrm ? CustomerMapper.toDomainEntity(customerOrm) : null;
  }

  async existsByDocument(valor_doc: string): Promise<boolean> {
    const count = await this.customerOrmRepository.count({
      where: { valor_doc },
    });
    return count > 0;
  }

  private parseBoolean(value: any): boolean | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === '1' || value === 1) return true;
    if (value === 'false' || value === '0' || value === 0) return false;
    return undefined;
  }

  async findAll(filters?: {
    estado?: boolean | string;
    search?: string;
    id_tipo_documento?: number;
    page?: number;
    limit?: number;
  }): Promise<{ customers: Customer[]; total: number }> {
    const queryBuilder = this.customerOrmRepository
      .createQueryBuilder('cliente')
      .leftJoinAndSelect('cliente.tipoDocumento', 'tipoDocumento');

    const estadoBoolean = this.parseBoolean(filters?.estado);
    if (estadoBoolean !== undefined) {
      queryBuilder.andWhere('cliente.estado = :estado', {
        estado: estadoBoolean ? 1 : 0,
      });
    }

    if (filters?.id_tipo_documento) {
      queryBuilder.andWhere('cliente.id_tipo_documento = :id_tipo_documento', {
        id_tipo_documento: filters.id_tipo_documento,
      });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        `(
      cliente.valor_doc    LIKE :search OR
      cliente.nombres      LIKE :search OR
      cliente.apellidos    LIKE :search OR
      cliente.razon_social LIKE :search OR
      cliente.email        LIKE :search OR
      CONCAT(
        COALESCE(cliente.nombres,  ''), ' ',
        COALESCE(cliente.apellidos,'')
      ) LIKE :search
    )`,
        { search: `%${filters.search}%` },
      );
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);
    queryBuilder.orderBy('cliente.nombres', 'ASC');

    const [customersOrm, total] = await queryBuilder.getManyAndCount();

    return {
      customers: customersOrm.map((c) => CustomerMapper.toDomainEntity(c)),
      total,
    };
  }
}
