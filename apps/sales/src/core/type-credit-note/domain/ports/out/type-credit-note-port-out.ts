import { TypeCreditNote } from "../../entity/type-credit-note-domain.entity";

export interface ITypeCreditNoteRepositoryPort {
    save(typeCreditNote: TypeCreditNote): Promise<TypeCreditNote>;
    update(typeCreditNote: TypeCreditNote): Promise<TypeCreditNote>;
    delete(id: number): Promise<void>;
    findById(id: number): Promise<TypeCreditNote | null>;
    findByCode(code: string): Promise<TypeCreditNote | null>;
    findAll(filters?: { codigo_sunat?: string }): Promise<TypeCreditNote[]>;
}