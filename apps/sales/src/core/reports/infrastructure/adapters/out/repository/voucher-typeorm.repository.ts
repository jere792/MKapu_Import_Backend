import { Injectable } from "@nestjs/common";
import { VoucherRepositoryPort } from "../../../../domain/ports/out/voucher-repository.port";
import { InjectRepository } from "@nestjs/typeorm";
import { VoucherRowEntity } from "../../../../domain/entity/voucher-row.entity";
import { Repository } from "typeorm";
import { GetVoucherFilterDto } from "../../../../application/dto/in/get-voucher-filter.dto";

@Injectable()
export class VoucherTypeormRepository implements VoucherRepositoryPort {

    constructor(
        @InjectRepository(VoucherRowEntity)
        private readonly repository: Repository<VoucherRowEntity>
    ) { }

    private buildQuery(filters: GetVoucherFilterDto) {
        const query = this.repository.createQueryBuilder('v');

        if (filters.cod_tipo) {
            query.andWhere('v.cod_tipo = :cod_tipo', { cod_tipo: filters.cod_tipo });
        }

        if (filters.search) {
            query.andWhere(
                '(v.cliente LIKE :search OR v.ruc_dni LIKE :search)',
                { search: `%${filters.search}%` }
            );
        }

        if (filters.fecha_inicio && filters.fecha_fin) {
            query.andWhere(
                'v.fecha_emision BETWEEN :inicio AND :fin',
                { inicio: filters.fecha_inicio, fin: filters.fecha_fin + ' 23:59:59' }
            );
        }

        if (filters.moneda) {
            query.andWhere('v.moneda = :moneda', { moneda: filters.moneda });
        }

        if (filters.estado) {
            query.andWhere('v.estado = :estado', { estado: filters.estado });
        }

        if (filters.periodo) {
            query.andWhere('v.periodo = :periodo', { periodo: filters.periodo });
        }

        if (filters.id_sede) {
            query.andWhere('v.id_sede = :id_sede', { id_sede: filters.id_sede });
        }

        return query.orderBy('v.fecha_emision', 'DESC');
    }

    async findAll(filters: GetVoucherFilterDto) {
        const query = this.buildQuery(filters);

        const summaryData = await this.buildQuery(filters)
            .select([
                'SUM(v.total) AS total_facturado',
                'SUM(CASE WHEN v.cod_tipo = :boleta THEN 1 ELSE 0 END) AS boletas',
                'SUM(CASE WHEN v.cod_tipo = :factura THEN 1 ELSE 0 END) AS facturas',
                'SUM(CASE WHEN v.cod_tipo = :nota THEN 1 ELSE 0 END) AS notas_credito',
            ])
            .setParameters({ boleta: '03', factura: '01', nota: '07' })
            .getRawOne();

        const total = await query.getCount();
        const data = await query
            .skip((filters.page - 1) * filters.limit)
            .take(filters.limit)
            .getMany();

        return {
            data,
            total,
            summary: {
                total_facturado: Number(summaryData?.total_facturado ?? 0),
                boletas: Number(summaryData?.boletas ?? 0),
                facturas: Number(summaryData?.facturas ?? 0),
                notas_credito: Number(summaryData?.notas_credito ?? 0),
            },
        };
    }

    async findAllWithoutPagination(filters: GetVoucherFilterDto) {
        return this.buildQuery(filters).getMany();
    }
}