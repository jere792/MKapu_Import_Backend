export enum ClaimStatus {
    REGISTRADO = 'REGISTRADO',
    EN_PROCESO = 'EN_PROCESO',
    RESUELTO = 'RESUELTO',
    RECHAZADO = 'RECHAZADO',
}

export interface ClaimDetailProps {
    tipo: string;
    descripcion: string;
    fecha?: Date;
}

export class ClaimDetail {
    private constructor (private readonly props: ClaimDetailProps) {

    }

    static create (props: ClaimDetailProps): ClaimDetail {
        const { tipo, descripcion } = props;

        if (!tipo || tipo.trim().length === 0) {
            throw new Error('El tipo de detalle de reclamo es obligatorio');
        }

        if (!descripcion || descripcion.trim().length === 0) {
            throw new Error('La descripción del detalle de reclamo es obligatoria');
        }

        return new ClaimDetail({
            ...props,
            fecha: props.fecha || new Date(),
        });
    }

    get tipo(): string {
        return this.props.tipo;
    }

    get descripcion(): string {
        return this.props.descripcion;
    }

    get fecha(): Date {
        return this.props.fecha!;
    }
}