import { ViewColumn, ViewEntity } from "typeorm";

@ViewEntity({ name: "v_vouchers" })
export class VoucherRowEntity {

    @ViewColumn()
    id: number;

    @ViewColumn()
    tipo: string;
    cod_tipo: string;

    @ViewColumn()
    serie: string;

    @ViewColumn()
    numero: number;

    @ViewColumn()
    fecha_emision: Date;

    @ViewColumn()
    fecha_vencimiento: Date;

    @ViewColumn()
    cliente: string;

    @ViewColumn()
    ruc_dni: string;

    @ViewColumn()
    moneda: string;

    @ViewColumn({
        transformer: {
            from: (value: string) => parseFloat(value ?? '0'),
            to: (value: number) => value
        }
    })
    base_imponible: number;

    @ViewColumn({
        transformer: {
            from: (value: string) => parseFloat(value ?? '0'),
            to: (value: number) => value
        }
    })
    igv: number;

    @ViewColumn({
        transformer: {
            from: (value: string) => parseFloat(value ?? '0'),
            to: (value: number) => value
        }
    })
    total: number;

    @ViewColumn()
    estado: string;

    @ViewColumn()
    periodo: string;

    @ViewColumn()
    id_sede: number;
}