import { GetSalesReportDto } from '../../../application/dto/in/get-sales-report.dto';
import { SalesReportRow } from '../../entity/sales-report-row.entity';

export interface IReportsRepositoryPort {
    getRecentSalesData(
      startDate: Date,
      endDate: Date,
      id_sede?: string,
    ): Promise<any[]>;

  getSalesDashboard(
    filters: GetSalesReportDto,
    idSede?: string,
  ): Promise<SalesReportRow[]>;
  getKpisData(
    startDate: Date,
    endDate: Date,
    idSede?: string,
  ): Promise<{ totalVentas: number; totalOrdenes: number }>;
  getTotalClientes(
    startDate: Date,
    endDate: Date,
    idSede?: string,
  ): Promise<number>;
  getSalesChartData(
    startDate: Date,
    endDate: Date,
    idSede?: string,
  ): Promise<any[]>;
  getTopProductsData(
    startDate: Date,
    endDate: Date,
    limit?: number,
    idSede?: string,
  ): Promise<any[]>;
  getTopSellersData(
    startDate: Date,
    endDate: Date,
    limit: number,
    idSede?: string,
  ): Promise<any[]>;
  getPaymentMethodsData(
    startDate: Date,
    endDate: Date,
    idSede?: string,
  ): Promise<any[]>;
  getSalesByDistrictData(
    startDate: Date,
    endDate: Date,
    limit?: number,
    idSede?: string,
  ): Promise<any[]>;
  getSalesByCategoryData(
    startDate: Date,
    endDate: Date,
    limit?: number,
    idSede?: string,
  ): Promise<any[]>;
  getSalesByHeadquarterData(
    startDate: Date,
    endDate: Date,
    idSede?: string,
  ): Promise<any[]>;
}
