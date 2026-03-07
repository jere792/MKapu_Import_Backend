/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RemissionPortOut } from '../../domain/ports/out/remission-port-out';
import { ListRemissionFilterDto } from '../dto/in/list-remission-filter.dto';
import {
  RemissionListResponseDto,
  RemissionResponseDto,
} from '../dto/out/remission-response.dto';
import {
  RemissionDetailResponseDto,
  RemissionItemResponseDto,
} from '../dto/out/remission-detail-response.dto';
import { RemissionSummaryResponseDto } from '../dto/out/remission-summary-response.dto';
import { RemissionQueryPortIn } from '../../domain/ports/in/remission-query-port-in';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import { Buffer } from 'buffer';
@Injectable()
export class RemissionQueryService implements RemissionQueryPortIn {
  constructor(
    @Inject('RemissionPortOut')
    private readonly remissionRepository: RemissionPortOut,
  ) {}

  async executeList(
    filter: ListRemissionFilterDto,
  ): Promise<RemissionListResponseDto> {
    const { data, total } = await this.remissionRepository.findAll(filter);

    const dtos = data.map((domain) => {
      const dto = new RemissionDetailResponseDto();
      dto.id_guia = domain.id_guia;
      dto.motivo_traslado = domain.motivo_traslado;
      ((dto.estado = domain.estado),
        (dto.fecha_emision = domain.fecha_emision),
        (dto.fecha_inicio = domain.fecha_inicio),
        (dto.motivo_traslado = domain.motivo_traslado),
        (dto.unidad_peso = domain.unidad_peso),
        (dto.peso_total = domain.peso_total),
        (dto.id_comprobante_ref = domain.id_comprobante_ref),
        (dto.tipo_guia = domain.tipo_guia),
        (dto.modalidad = domain.modalidad),
        (dto.cantidad = domain.cantidad));
      dto.items = domain.getDetalles().map((detalle) => {
        const itemDto = new RemissionItemResponseDto();
        itemDto.id_producto = detalle.id_producto;
        itemDto.cod_prod = detalle.cod_prod;
        itemDto.cantidad = detalle.cantidad;
        itemDto.peso_total = detalle.peso_total;
        itemDto.peso_unitario = detalle.peso_unitario;
        return itemDto;
      });
      return dto;
    });

    return {
      data: dtos,
      total,
    };
  }

  async executeFindById(id: string): Promise<RemissionResponseDto> {
    const domain = await this.remissionRepository.findById(id);

    if (!domain) {
      throw new NotFoundException(`Remission con ID ${id} no encontrada`);
    }

    const dto = new RemissionResponseDto();
    dto.id_guia = domain.id_guia;
    dto.serie = domain.serie;
    dto.numero = domain.numero;
    dto.estado = domain.estado;
    dto.tipo_guia = domain.tipo_guia;
    dto.fecha_emision = domain.fecha_emision;
    dto.fecha_inicio = domain.fecha_inicio;
    dto.motivo_traslado = domain.motivo_traslado;
    dto.peso_total = domain.peso_total;
    dto.unidad_peso = domain.unidad_peso;
    dto.cantidad = domain.cantidad;
    dto.items = domain.getDetalles().map((detalle) => {
      return {
        id_producto: detalle.id_producto,
        cod_prod: detalle.cod_prod,
        cantidad: detalle.cantidad,
        peso_total: detalle.peso_total,
        peso_unitario: detalle.peso_unitario,
      };
    });
    return dto;
  }
  async executeGetSummary(): Promise<RemissionSummaryResponseDto> {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const summary = await this.remissionRepository.getSummaryInfo(
      firstDay,
      lastDay,
    );

    const dto = new RemissionSummaryResponseDto();
    dto.totalMes = summary.totalMes;
    dto.enTransito = summary.enTransito;
    dto.entregadas = summary.entregadas;
    dto.observadas = summary.observadas;

    return dto;
  }
  async exportExcel(id: string, res: Response): Promise<void> {
    const guia = await this.remissionRepository.obtenerGuiaParaReporte(id);
    if (!guia) throw new NotFoundException('Guía no encontrada');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Guía de Remisión');

    // Estilo y contenido similar a InventoryCount
    worksheet.mergeCells('A1:F1');
    const titulo = worksheet.getCell('A1');
    titulo.value = `GUÍA DE REMISIÓN ELECTRÓNICA - ${guia.serie}-${guia.numero}`;
    titulo.font = { size: 14, bold: true };
    titulo.alignment = { horizontal: 'center' };

    worksheet.addRow(['Motivo:', guia.motivo_traslado, 'Estado:', guia.estado]);
    worksheet.addRow([
      'Fecha Emisión:',
      guia.fecha_emision,
      'Inicio Traslado:',
      guia.fecha_inicio,
    ]);
    worksheet.addRow([
      'Punto Partida:',
      guia.transfer?.direccion_origen || '-',
      'Ubigeo:',
      guia.transfer?.ubigeo_origen || '-',
    ]);
    worksheet.addRow([
      'Punto Llegada:',
      guia.transfer?.direccion_destino || '-',
      'Ubigeo:',
      guia.transfer?.ubigeo_destino || '-',
    ]);
    worksheet.addRow([]);

    const headerRow = worksheet.addRow([
      'CÓDIGO',
      'PRODUCTO',
      'CANTIDAD',
      'PESO UNIT',
      'PESO TOTAL',
    ]);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF000000' },
      };
    });

    guia.details.forEach((det) => {
      worksheet.addRow([
        det.cod_prod,
        'Producto',
        det.cantidad,
        det.peso_unitario,
        det.peso_total,
      ]);
    });

    const buffer = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=Guia_${guia.serie}_${guia.numero}.xlsx`,
      'Content-Length': buffer.byteLength,
    });
    res.end(buffer);
  }

  async exportPdf(id: string, res: Response): Promise<void> {
    const guia = await this.remissionRepository.obtenerGuiaParaReporte(id);
    if (!guia) throw new NotFoundException('Guía no encontrada');

    const PDFDocument = require('pdfkit-table');
    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=Guia_${guia.serie}_${guia.numero}.pdf`,
    });

    doc.pipe(res);

    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .text('GUÍA DE REMISIÓN ELECTRÓNICA', { align: 'center' });
    doc.fontSize(12).text(`${guia.serie}-${guia.numero}`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(10).font('Helvetica-Bold').text('INFORMACIÓN DEL TRASLADO');
    doc.font('Helvetica').text(`Motivo: ${guia.motivo_traslado}`);
    doc.text(
      `Fecha Inicio: ${new Date(guia.fecha_inicio).toLocaleDateString()}`,
    );
    doc.text(
      `Punto de Llegada: ${guia.transfer?.direccion_destino || 'No especificado'}`,
    );
    doc.moveDown();

    const table = {
      headers: ['CÓDIGO', 'CANTIDAD', 'PESO UNIT.', 'PESO TOTAL'],
      rows: guia.details.map((d) => [
        d.cod_prod,
        d.cantidad,
        d.peso_unitario,
        d.peso_total,
      ]),
    };

    await doc.table(table, {
      prepareHeader: () => doc.font('Helvetica-Bold').fontSize(9),
    });

    doc.end();
  }
}
