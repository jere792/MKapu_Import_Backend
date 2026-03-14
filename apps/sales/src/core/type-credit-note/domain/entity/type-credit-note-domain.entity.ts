export interface TypeCreditNoteProps {
    id_tipo_nota?: number;
    codigo_sunat: string; // Catalogo SUNAT 09 - Anexo 3
    descripcion: string;
}

export class TypeCreditNote {
    private constructor(private readonly props: TypeCreditNoteProps) {}

    static create(props: TypeCreditNoteProps): TypeCreditNote {
        const { codigo_sunat, descripcion } = props;

        if (!codigo_sunat || codigo_sunat.length !== 2) {
            throw new Error("El código SUNAT debe tener exactamente 2 caracteres.");
        };

        if (!descripcion || descripcion.trim().length === 0) {
            throw new Error("La descripción es obligatoria.");
        }
        
        return new TypeCreditNote({
            ...props
        });
    }

    static rehydrate(props: TypeCreditNoteProps): TypeCreditNote {
        return new TypeCreditNote(props);
    }

    get id(): number | undefined {
        return this.props.id_tipo_nota;
    }

    get codigo(): string {
        return this.props.codigo_sunat;
    }

    get descripcion(): string {
        return this.props.descripcion;
    }
}