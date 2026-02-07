export interface RegisterClaimDto {
    id_comprobante: number;
    id_vendedor_ref: string;
    motivo: string;
    descripcion: string;
    detalles?: {
        tipo: string;
        descripcion: string;
    }[];
}