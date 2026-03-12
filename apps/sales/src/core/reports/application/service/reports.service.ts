/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Inject, Injectable } from '@nestjs/common';
import { IReportsUseCase } from '../../domain/ports/in/reports-use-case';
import { SalesReportRow } from '../../domain/entity/sales-report-row.entity';
import { GetSalesReportDto } from '../dto/in/get-sales-report.dto';
import { IReportsRepositoryPort } from '../../domain/ports/out/reports-repository.port';
import { GetDashboardFilterDto } from '../dto/in/get-dashboard-filter.dto';

@Injectable()
export class ReportsService implements IReportsUseCase {
  constructor(
    @Inject('IReportsRepositoryPort')
    private readonly reportsRepository: IReportsRepositoryPort,
  ) {}
  
  async getRecentSales(filters: GetDashboardFilterDto) {
    const { startDate, endDate } = this.calculateDates(filters.periodo);

    return await this.reportsRepository.getRecentSalesData(
      startDate,
      endDate,
      filters.id_sede,
    );
  }

  async generateSalesReport(
    filters: GetSalesReportDto,
  ): Promise<SalesReportRow[]> {
    return await this.reportsRepository.getSalesDashboard(filters);
  }
  async getKpis(filters: GetDashboardFilterDto) {
    const { startDate, endDate, prevStartDate, prevEndDate } =
      this.calculateDates(filters.periodo);
    const sedeFilter = filters.id_sede || undefined;
    const currentKpis = await this.reportsRepository.getKpisData(
      startDate,
      endDate,
      sedeFilter,
    );
    const currentClientes = await this.reportsRepository.getTotalClientes(
      startDate,
      endDate,
      sedeFilter,
    );
    const prevKpis = await this.reportsRepository.getKpisData(
      prevStartDate,
      prevEndDate,
      sedeFilter,
    );
    const prevClientes = await this.reportsRepository.getTotalClientes(
      prevStartDate,
      prevEndDate,
      sedeFilter,
    );
    const ticketPromedio =
      currentKpis.totalOrdenes > 0
        ? currentKpis.totalVentas / currentKpis.totalOrdenes
        : 0;
    const prevTicketPromedio =
      prevKpis.totalOrdenes > 0
        ? prevKpis.totalVentas / prevKpis.totalOrdenes
        : 0;

    return {
      totalVentas: currentKpis.totalVentas,
      totalOrdenes: currentKpis.totalOrdenes,
      ticketPromedio: ticketPromedio,
      nuevosClientes: currentClientes,
      variaciones: {
        ventas: await this.calculatePercentage(
          currentKpis.totalVentas,
          prevKpis.totalVentas,
        ),
        ordenes: await this.calculatePercentage(
          currentKpis.totalOrdenes,
          prevKpis.totalOrdenes,
        ),
        ticket: await this.calculatePercentage(
          ticketPromedio,
          prevTicketPromedio,
        ),
        clientes: await this.calculatePercentage(currentClientes, prevClientes),
      },
    };
  }

  async calculatePercentage(
    current: number,
    previous: number,
  ): Promise<number> {
    if (previous === 0) return Promise.resolve(current > 0 ? 100 : 0);
    return Promise.resolve(
      parseFloat((((current - previous) / previous) * 100).toFixed(2)),
    );
  }

  private calculateDates(periodo: string) {
    const endDate = new Date();
    const startDate = new Date();
    const prevEndDate = new Date();
    const prevStartDate = new Date();

    if (periodo === 'semana') {
      startDate.setDate(endDate.getDate() - 7);
      prevEndDate.setDate(startDate.getDate() - 1);
      prevStartDate.setDate(prevEndDate.getDate() - 7);
    } else if (periodo === 'mes') {
      startDate.setMonth(endDate.getMonth() - 1);
      prevEndDate.setDate(startDate.getDate() - 1);
      prevStartDate.setMonth(prevEndDate.getMonth() - 1);
    } else if (periodo === 'trimestre') {
      startDate.setMonth(endDate.getMonth() - 3);
      prevEndDate.setDate(startDate.getDate() - 1);
      prevStartDate.setMonth(prevEndDate.getMonth() - 3);
    } else if (periodo === 'anio') {
      startDate.setFullYear(endDate.getFullYear(), 0, 1);
      prevEndDate.setFullYear(endDate.getFullYear() - 1, 11, 31);
      prevStartDate.setFullYear(endDate.getFullYear() - 1, 0, 1);
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    prevStartDate.setHours(0, 0, 0, 0);
    prevEndDate.setHours(23, 59, 59, 999);

    return { startDate, endDate, prevStartDate, prevEndDate };
  }

  async getSalesChart(filters: GetDashboardFilterDto) {
    const { startDate, endDate } = this.calculateDates(filters.periodo);
    const rawData = await this.reportsRepository.getSalesChartData(
      startDate,
      endDate,
      filters.id_sede, // 🚀 Añadido
    );
    const labels: string[] = [];
    const values: number[] = [];
    rawData.forEach((row) => {
      const date = new Date(row.fecha);
      const dia = `${String(date.getDate()).padStart(2, '0')} ${date.toLocaleDateString('es-PE', { month: 'short' })}`;

      labels.push(dia);
      values.push(parseFloat(row.total));
    });

    return { labels, values };
  }

  async getTopProducts(filters: GetDashboardFilterDto) {
    const { startDate, endDate } = this.calculateDates(filters.periodo);

    const rawData = await this.reportsRepository.getTopProductsData(
      startDate,
      endDate,
      5,
      filters.id_sede, // 🚀 Añadido
    );
    return rawData.map((item) => ({
      nombre: item.nombre,
      ventas: parseInt(item.ventas, 10),
      ingresos: `S/ ${parseFloat(item.ingresos).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
    }));
  }

  async getTopSellers(filters: GetDashboardFilterDto) {
    const { startDate, endDate } = this.calculateDates(filters.periodo);

    const rawData = await this.reportsRepository.getTopSellersData(
      startDate,
      endDate,
      5,
      filters.id_sede, // 🚀 Añadido
    );

    return rawData.map((item) => {
      const monto = parseFloat(item.montoTotal || '0');
      const ventas = parseInt(item.totalVentas || '0', 10);

      return {
        nombre: `${item.nombres} ${item.ape_pat} ${item.ape_mat}`.trim(),
        totalVentas: ventas,
        montoTotal: `S/ ${monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
        ticketPromedio: `S/ ${(ventas > 0 ? monto / ventas : 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
        sede: item.nombre_sede || 'Sede Central',
        foto: null,
      };
    });
  }

  async getPaymentMethods(filters: GetDashboardFilterDto) {
    const { startDate, endDate } = this.calculateDates(filters.periodo);
    const rawData = await this.reportsRepository.getPaymentMethodsData(
      startDate,
      endDate,
      filters.id_sede,
    );

    const labels: string[] = [];
    const values: number[] = [];

    rawData.forEach((item) => {
      const labelTexto = item.metodo ? String(item.metodo).trim() : 'Otros';
      const valorNumerico = parseFloat(item.total || '0');

      if (valorNumerico > 0) {
        labels.push(labelTexto);
        values.push(valorNumerico);
      }
    });

    return {
      labels: labels.length > 0 ? labels : ['Sin datos en este periodo'],
      values: values.length > 0 ? values : [0],
    };
  }

  async getSalesByDistrict(filters: GetDashboardFilterDto) {
    const { startDate, endDate } = this.calculateDates(filters.periodo);

    const rawData = await this.reportsRepository.getSalesByDistrictData(
      startDate,
      endDate,
      5,
      filters.id_sede, // 🚀 Añadido
    );

    const labels: string[] = [];
    const values: number[] = [];

    rawData.forEach((item) => {
      const distritoLabel =
        item.distrito && item.distrito !== '' ? item.distrito : 'Sin Distrito';

      labels.push(distritoLabel);
      values.push(parseFloat(item.total || '0'));
    });

    return { labels, values };
  }

  async getSalesByCategory(filters: GetDashboardFilterDto) {
    const { startDate, endDate } = this.calculateDates(filters.periodo);

    const rawData = await this.reportsRepository.getSalesByCategoryData(
      startDate,
      endDate,
      5,
      filters.id_sede, // 🚀 Ya lo tenía
    );

    const labels: string[] = [];
    const values: number[] = [];

    rawData.forEach((item) => {
      const categoriaLabel = item.categoria ? item.categoria : 'Sin Categoría';

      labels.push(categoriaLabel);
      values.push(parseFloat(item.total || '0'));
    });

    return { labels, values };
  }

  async getSalesByHeadquarters(filters: GetDashboardFilterDto) {
    const { startDate, endDate } = this.calculateDates(filters.periodo);
    const rawData = await this.reportsRepository.getSalesByHeadquarterData(
      startDate,
      endDate,
      filters.id_sede, // 🚀 Añadido
    );
    const sedesMap: { [key: string]: string } = {
      SEDE001: 'Las Flores',
      SEDE002: 'Lurín',
      SEDE003: 'VES',
    };

    const labels: string[] = [];
    const values: number[] = [];

    rawData.forEach((item) => {
      const sedeLabel = sedesMap[item.sede] || item.sede || 'Sin Sede';
      labels.push(sedeLabel);
      values.push(parseFloat(item.total || '0'));
    });

    return { labels, values };
  }
}
