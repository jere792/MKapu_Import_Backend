import { Expose, Type } from 'class-transformer';

export class SalesBookRowDto {
  @Expose()
  issueDate: string;

  @Expose()
  receiptType: string;

  @Expose()
  series: string;

  @Expose()
  number: number;

  @Expose()
  fullSeriesNumber: string;

  @Expose()
  customerDocType: string;

  @Expose()
  customerDocNumber: string;

  @Expose()
  customerName: string;

  @Expose()
  currency: string;

  @Expose()
  base: number;

  @Expose()
  igv: number;

  @Expose()
  total: number;

  @Expose()
  status: string;

  @Expose()
  sunatStatus: string;
}

export class SalesBookTotalsDto {
  @Expose()
  totalBase: number;

  @Expose()
  totalIgv: number;

  @Expose()
  totalRevenue: number;

  @Expose()
  count: number;
}

export class SalesBookResponseDto {
  @Expose()
  period: string;

  @Expose()
  @Type(() => SalesBookTotalsDto)
  summary: SalesBookTotalsDto;

  @Expose()
  @Type(() => SalesBookRowDto)
  records: SalesBookRowDto[];
}
