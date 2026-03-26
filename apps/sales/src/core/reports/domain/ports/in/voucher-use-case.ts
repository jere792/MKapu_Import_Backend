import { GetVoucherFilterDto } from "../../../application/dto/in/get-voucher-filter.dto";

export interface VoucherResponseDetail {
    data: any[];
    total: number;
    page: number;
    limit: number;
    summary: {
        total_facturado: number;
        boletas: number;
        facturas: number;
        notas_credito: number;
    };
}

export interface ManageVoucherUseCase {
    findAll(filters: GetVoucherFilterDto): Promise<VoucherResponseDetail>;
    exportExcel(filters: GetVoucherFilterDto): Promise<Buffer>;
    exportPdf(filters: GetVoucherFilterDto): Promise<Buffer>;
}

export const VOUCHER_USE_CASE = 'VOUCHER_USE_CASE';