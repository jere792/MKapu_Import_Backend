export class EmployeeQuoteItemDto {
  codigo: string;
  cliente: string;
  fecha: Date;
  total: number;
  estado: string;
}

export class EmployeeQuotesListResponseDto {
  cotizaciones: EmployeeQuoteItemDto[];
  totalCotizaciones: number;
  page: number;
  limit: number;
  totalPages: number;
}
