import { GetVoucherFilterDto } from "../../../application/dto/in/get-voucher-filter.dto";
import { VoucherRowEntity } from "../../entity/voucher-row.entity";

export interface VoucherSummaryItem {
    total_facturado: number;
    boletas: number;
    facturas: number;
    notas_credito: number;
}

export interface VoucherResponse {
    data: VoucherRowEntity[];
    total: number;
    summary: VoucherSummaryItem

}

export interface VoucherRepositoryPort {
    findAll(filters: GetVoucherFilterDto): Promise<VoucherResponse>;
    findAllWithoutPagination(filters: GetVoucherFilterDto): Promise<VoucherRowEntity[]>;
}

export const VOUCHER_REPOSITORY_PORT = 'VOUCHER_REPOSITORY_PORT';