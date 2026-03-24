export class UserQuoteItemDto {
  codigo: string;
  cliente: string;
  fecha: Date;
  total: number;
  estado: string;
}

export class UserQuotesResponseDto {
  cotizaciones: UserQuoteItemDto[];
  totalCotizaciones: number;
  page: number;
  limit: number;
  totalPages: number;
}
