import { IsNotEmpty, IsString } from "class-validator";

export class RegisterTypeCreditNoteDto {
    
    @IsString()
    @IsNotEmpty()
    codigo_sunat: string; // Catalogo SUNAT 09 - Anexo 3

    @IsString()
    @IsNotEmpty()
    descripcion: string;
}