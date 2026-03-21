/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import * as PDFDocument from 'pdfkit';
import { SalesGatewayPortOut } from '../../domain/ports/out/sales-gateway-port-out';
import { SedeTcpProxy } from 'apps/logistics/src/core/catalog/product/infrastructure/adapters/out/TCP/sede-tcp.proxy';
import { UsuarioTcpProxy } from 'apps/logistics/src/core/warehouse/transfer/infrastructure/adapters/out/TCP/usuario-tcp.proxy';
import { join } from 'path/win32';
import { existsSync } from 'fs';
import { EmpresaTcpPortOut } from '../../domain/ports/out/empresa-tcp.port';

@Injectable()
export class RemissionQueryService implements RemissionQueryPortIn {
  constructor(
    @Inject('RemissionQueryPortOut')
    private readonly remissionRepository: RemissionPortOut,

    @Inject('SalesGatewayPortOut')
    private readonly salesGateway: SalesGatewayPortOut,
    private readonly sedeClient: SedeTcpProxy,
    private readonly userClient: UsuarioTcpProxy,

    @Inject('EmpresaTcpPortOut')
    private readonly empresaProxy: EmpresaTcpPortOut,
  ) {}

  async executeList(
    filter: ListRemissionFilterDto,
  ): Promise<RemissionListResponseDto> {
    const { data, total } = await this.remissionRepository.findAll(filter);

    const dtos = data.map((domain) => {
      const dto = new RemissionDetailResponseDto();
      dto.id_guia = domain.id_guia;
      dto.motivo_traslado = domain.motivo_traslado;
      dto.estado = domain.estado;
      dto.fecha_emision = domain.fecha_emision;
      dto.fecha_inicio = domain.fecha_inicio;
      dto.motivo_traslado = domain.motivo_traslado;
      dto.unidad_peso = domain.unidad_peso;
      dto.peso_total = domain.peso_total;
      dto.id_comprobante_ref = domain.id_comprobante_ref;
      dto.tipo_guia = domain.tipo_guia;
      dto.modalidad = domain.modalidad;
      dto.cantidad = domain.cantidad;

      // ✅ Se agrega la propiedad impreso al DTO de lista (Asegúrate de agregar 'impreso?: boolean' en tu DTO)
      (dto as any).impreso = (domain as any).impreso || false;

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

    let sedeData: any = null;
    const idSede =
      (domain as any).id_sede_ref ||
      (domain as any).idSedeRef ||
      (domain as any).id_sede;
    if (idSede) {
      try {
        const sedeResponse = await this.sedeClient.getSedeById(String(idSede));
        if (sedeResponse) sedeData = sedeResponse;
      } catch (error) {
        console.warn(`No se pudo obtener la sede ${idSede}`);
      }
    }

    let ventaData: any = null;
    let clienteData: any = null;
    const idVenta =
      (domain as any).id_comprobante_ref || (domain as any).idComprobanteRef;

    if (idVenta) {
      try {
        const responseVenta = await this.salesGateway.findSaleById(
          String(idVenta),
        );
        if (responseVenta) {
          ventaData = responseVenta.data || responseVenta;
          clienteData = ventaData.customer || ventaData.cliente || null;
        }
      } catch (error) {
        console.warn(`No se pudo obtener la venta ${idVenta}`);
      }
    }

    let usuarioData: any = null;
    const idUsuario =
      (domain as any).id_usuario_ref || (domain as any).idUsuarioRef;
    if (idUsuario) {
      try {
        const userResponse = await this.userClient.getUserById(
          Number(idUsuario),
        );
        if (userResponse) usuarioData = userResponse;
      } catch (error) {
        console.warn(`No se pudo obtener el usuario ${idUsuario}`);
      }
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

    // ✅ Se mapea el estado de impresión al DTO de detalle
    (dto as any).impreso = (domain as any).impreso || false;

    dto.items = domain.getDetalles().map((detalle) => ({
      id_producto: detalle.id_producto,
      cod_prod: detalle.cod_prod,
      cantidad: detalle.cantidad,
      peso_total: detalle.peso_total,
      peso_unitario: detalle.peso_unitario,
    }));

    (dto as any).sede = sedeData;
    (dto as any).cliente = clienteData;
    (dto as any).venta = ventaData;
    (dto as any).usuario = usuarioData;

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
    // 1. Obtener la remisión desde el repositorio
    const domain = await this.remissionRepository.findById(id);
    if (!domain) {
      throw new NotFoundException(
        `Guía de remisión con ID ${id} no encontrada`,
      );
    }

    const detalles = domain.getDetalles();
    let empresaData: any = null;

    try {
      empresaData = await this.empresaProxy.getEmpresaData();
    } catch (error) {
      console.error('Error al obtener datos de la empresa:', error);
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Guía de Remisión');

    // Estilos generales de columnas
    worksheet.columns = [
      { width: 20 },
      { width: 30 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
    ];

    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = empresaData?.razon_social || 'REPORTE DE REMISIÓN';
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };

    worksheet.addRow(['RUC Empresa:', empresaData?.ruc || 'N/A']);
    worksheet.addRow(['Guía de Remisión:', domain.id_guia]);
    worksheet.addRow(['Fecha de Emisión:', domain.fecha_emision]);
    worksheet.addRow(['Fecha de Inicio:', domain.fecha_inicio]);
    worksheet.addRow(['Motivo de Traslado:', domain.motivo_traslado]);
    worksheet.addRow(['Modalidad:', domain.modalidad]);
    worksheet.addRow([
      'Peso Total:',
      `${domain.peso_total} ${domain.unidad_peso}`,
    ]);

    // Si la guía está ligada a un comprobante, lo mostramos
    if (domain.id_comprobante_ref) {
      worksheet.addRow(['ID Comprobante Ref:', domain.id_comprobante_ref]);
    }

    worksheet.addRow([]); // Fila vacía para separación

    // 5. Generar la tabla de productos (Detalles)
    worksheet.addRow(['DETALLE DE PRODUCTOS']).font = { bold: true };

    const headerRow = worksheet.addRow([
      'CÓDIGO PROD.',
      'ID PRODUCTO',
      'CANTIDAD',
      'PESO UNIT.',
      'PESO TOTAL',
    ]);

    // Estilos de la cabecera de la tabla
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F81BD' }, // Color Azul
      };
      cell.alignment = { horizontal: 'center' };
    });

    // Iterar sobre los detalles extraídos con el método de dominio correcto
    if (detalles && detalles.length > 0) {
      detalles.forEach((item) => {
        worksheet.addRow([
          item.cod_prod,
          item.id_producto,
          item.cantidad,
          item.peso_unitario,
          item.peso_total,
        ]);
      });
    } else {
      worksheet.addRow(['No hay productos registrados en esta guía.']);
    }

    // 6. Enviar la respuesta como archivo adjunto
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Remision_${domain.id_guia}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  async exportPdf(id: string, res: Response): Promise<void> {
    const guia = (await this.remissionRepository.obtenerGuiaParaReporte(
      id,
    )) as any;
    if (!guia) throw new NotFoundException('Guía no encontrada');

    let sedeData: any = {};
    const idSede = guia.id_sede_ref || guia.idSedeRef;
    if (idSede) {
      try {
        const sedeResponse = await this.sedeClient.getSedeById(String(idSede));
        if (sedeResponse) sedeData = sedeResponse;
      } catch (error) {
        console.warn(`No se pudo obtener la sede ${idSede}`);
      }
    }

    let ventaData: any = {};
    let clienteData: any = {};

    const idVenta = guia.id_comprobante_ref || guia.idComprobanteRef;

    if (idVenta) {
      try {
        const responseVenta = await this.salesGateway.findSaleById(
          String(idVenta),
        );
        if (responseVenta) {
          ventaData = responseVenta.data || responseVenta;
          clienteData = ventaData.customer || ventaData.cliente || {};
        }
      } catch (error) {
        console.warn(`No se pudo obtener la venta ${idVenta}`);
      }
    }

    let usuarioData: any = {};
    const idUsuario = guia.id_usuario_ref || guia.idUsuarioRef;
    if (idUsuario) {
      try {
        const userResponse = await this.userClient.getUserById(
          Number(idUsuario),
        );
        if (userResponse) usuarioData = userResponse;
      } catch (error) {
        console.warn(`No se pudo obtener el usuario ${idUsuario}`);
      }
    }

    let empresaData: any = null;
    try {
      empresaData = await this.empresaProxy.getEmpresaData();
    } catch (error) {
      console.warn(
        'No se pudo obtener la data de la empresa desde Administración:',
        error,
      );
    }

    const empresaNombre = empresaData?.razonSocial || 'MKapu IMPORT S.A.C';
    const empresaRuc = empresaData?.ruc || '20000000000';
    const empresaDireccionPrincipal =
      empresaData?.direccion || 'Direccion Principal S/N';

    const doc = new PDFDocument({ margin: 10, size: [226, 1000] });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename=Guia_${guia.serie || ''}_${guia.numero || ''}.pdf`,
    });

    doc.pipe(res);

    const logoFileName = process.env.COMPANY_LOGO_FILENAME || 'logo.jpg';
    const logoPath = join(
      process.cwd(),
      'apps/logistics/src/assets',
      logoFileName,
    );

    try {
      if (existsSync(logoPath)) {
        const logoWidth = 100;

        doc.x = 226 / 2 - logoWidth / 2;

        doc.image(logoPath, { width: logoWidth });

        doc.x = 10;

        doc.moveDown(1);
      } else {
        console.warn(`Archivo de logo no encontrado en la ruta: ${logoPath}`);
      }
    } catch (error) {
      console.error('Error al intentar renderizar el logo en el PDF:', error);
    }

    const separator = '-'.repeat(38);
    const drawSeparator = () =>
      doc.font('Courier').fontSize(8).text(separator, { align: 'center' });

    const esCopia = guia.impreso === true || guia.impreso === 1;
    const textoCabecera = esCopia
      ? 'COPIA BOLETA ELECTRÓNICA'
      : 'BOLETA ELECTRÓNICA';
    drawSeparator();
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(textoCabecera, { align: 'center' });
    drawSeparator();
    doc.text('GUÍA ELECTRÓNICA - REMITENTE', { align: 'center' });
    drawSeparator();

    doc.fontSize(9).text(empresaNombre, { align: 'center' });
    doc
      .font('Helvetica')
      .fontSize(8)
      .text(`RUC: ${empresaRuc}`, { align: 'center' });
    doc.text(empresaDireccionPrincipal, { align: 'center' });
    drawSeparator();

    doc.font('Helvetica-Bold').text(empresaNombre, { align: 'center' });
    doc
      .font('Helvetica')
      .text(
        sedeData.direccion ||
          sedeData.address ||
          'Dirección de sede no disponible',
        { align: 'center' },
      );
    doc.text(`Telf: ${sedeData.telefono || 'Sin teléfono'}`, {
      align: 'center',
    });
    drawSeparator();

    const fechaCreacion = new Date(
      guia.fecha_emision || guia.fecha_inicio || Date.now(),
    ).toLocaleString('es-PE');
    doc.text(`Emisión: ${fechaCreacion}`, { align: 'center' });
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(`${guia.serie || '000'}-${guia.numero || '000'}`, {
        align: 'center',
      });
    drawSeparator();

    doc.font('Helvetica-Bold').fontSize(8).text('Docs Referenciados:');
    const serieVenta =
      ventaData.serie ||
      ventaData.serie_comprobante ||
      ventaData.serieComprobante;
    const numVenta =
      ventaData.numero ||
      ventaData.numero_comprobante ||
      ventaData.numeroComprobante ||
      ventaData.correlativo;
    doc
      .font('Helvetica')
      .text(
        `Doc. Venta: ${serieVenta && numVenta ? `${serieVenta}-${numVenta}` : 'N/A'}`,
      );
    drawSeparator();

    doc.font('Helvetica-Bold').text('Cliente:');

    const esEmpresa = !!(clienteData.razon_social || clienteData.razonSocial);

    if (esEmpresa) {
      doc
        .font('Helvetica')
        .text(`Nombre: ${clienteData.razon_social || clienteData.razonSocial}`);
    } else {
      doc
        .font('Helvetica')
        .text(
          `Nombre: ${clienteData.nombres || clienteData.nombre || 'Cliente Genérico'}`,
        );
      if (clienteData.apellidos) {
        doc.text(`Apellido: ${clienteData.apellidos}`);
      }
    }

    const docCli =
      clienteData.numero_documento ||
      clienteData.numeroDocumento ||
      clienteData.num_doc ||
      clienteData.ruc ||
      clienteData.dni ||
      'N/A';
    const dirCli =
      clienteData.direccion || clienteData.address || 'Sin dirección';

    doc.text(`Dirección: ${dirCli}`);
    doc.text(`RUC: ${docCli}`);
    drawSeparator();

    doc.font('Helvetica-Bold').text('Origen:');
    const dirOrigen =
      guia.transfer?.direccion_origen ||
      guia.transfer?.direccionOrigen ||
      sedeData.direccion ||
      'N/A';
    doc.font('Helvetica').text(dirOrigen);
    doc.moveDown(0.2);

    doc.font('Helvetica-Bold').text('Destino:');
    const dirDestino =
      guia.transfer?.direccion_destino ||
      guia.transfer?.direccionDestino ||
      dirCli ||
      'N/A';
    doc.font('Helvetica').text(dirDestino);
    drawSeparator();

    doc.font('Helvetica-Bold').text('Datos del Traslado:', { align: 'center' });
    drawSeparator();
    doc
      .font('Helvetica')
      .text(
        `Tipo Transporte : ${guia.modalidad == '1' ? '1 - Público' : '2 - Privado'}`,
      );
    doc.text(`Motivo          : ${guia.motivo_traslado || 'N/A'}`);
    doc.text(
      `Fecha Traslado  : ${guia.fecha_inicio ? new Date(guia.fecha_inicio).toLocaleDateString('es-PE') : 'N/A'}`,
    );
    doc.text(
      `Peso Total      : ${guia.peso_total || '0'} ${guia.unidad_peso || 'KGM'}`,
    );
    doc.text(`Nro. Bultos     : ${guia.transfer?.bultos || '1'}`);
    doc.text(`Ind. Envío SUNAT: ${guia.estado || '0'}`);
    drawSeparator();

    doc
      .font('Helvetica-Bold')
      .text('Datos de la Empresa Transportista:', { align: 'center' });
    drawSeparator();

    let rucEmpresa =
      guia.carrier?.ruc ||
      guia.carrier?.RUC ||
      guia.driver?.numero_documento ||
      guia.driver?.numeroDocumento ||
      'N/A';
    if (typeof rucEmpresa === 'string' && rucEmpresa.trim() === '') {
      rucEmpresa = 'N/A';
    }

    doc.font('Helvetica').text(`RUC       : ${rucEmpresa}`);

    const nombreEmpresaTransporte =
      guia.carrier?.razon_social ||
      guia.carrier?.razonSocial ||
      guia.driver?.nombre_completo ||
      guia.driver?.nombreCompleto ||
      'N/A';

    doc.text(`Conductor : ${nombreEmpresaTransporte}`);
    drawSeparator();

    doc.font('Helvetica-Bold').fontSize(7);
    const colDesc = { x: 10, w: 85 };
    const colCant = { x: 95, w: 25 };
    const colPeso = { x: 120, w: 30 };
    const colUnd = { x: 150, w: 25 };
    const colTot = { x: 175, w: 35 };

    let currentY = doc.y;

    doc.text('Desc', colDesc.x, currentY, { width: colDesc.w });
    doc.text('Cant', colCant.x, currentY, {
      width: colCant.w,
      align: 'center',
    });
    doc.text('Peso', colPeso.x, currentY, {
      width: colPeso.w,
      align: 'center',
    });
    doc.text('Und', colUnd.x, currentY, { width: colUnd.w, align: 'center' });
    doc.text('Peso T.', colTot.x, currentY, {
      align: 'right',
      width: colTot.w,
    });

    currentY += 12;

    doc.font('Helvetica');
    if (guia.details && guia.details.length > 0) {
      guia.details.forEach((item: any) => {
        const codigo = item.cod_prod || item.codProd || 'S/C';
        const desc =
          codigo.length > 18 ? codigo.substring(0, 18) + '...' : codigo;

        doc.text(desc, colDesc.x, currentY, { width: colDesc.w });
        doc.text(`${item.cantidad || '0'}`, colCant.x, currentY, {
          width: colCant.w,
          align: 'center',
        });
        doc.text(
          `${item.peso_unitario || item.pesoUnitario || '0'}`,
          colPeso.x,
          currentY,
          { width: colPeso.w, align: 'center' },
        );
        doc.text(guia.unidad_peso || 'KGM', colUnd.x, currentY, {
          width: colUnd.w,
          align: 'center',
        });
        doc.text(
          `${item.peso_total || item.pesoTotal || '0'}`,
          colTot.x,
          currentY,
          { align: 'right', width: colTot.w },
        );
        currentY += 10;
      });
    } else {
      doc.text('Sin productos', 10, currentY, { align: 'center', width: 206 });
      currentY += 10;
    }

    doc.y = currentY + 5;
    doc.x = 10;
    drawSeparator();

    const nomUsu = usuarioData.usu_nom || usuarioData.nombres || '';
    const apeUsu = usuarioData.ape_pat || usuarioData.apellidos || '';
    const nombreUsuarioFinal =
      `${nomUsu} ${apeUsu}`.trim() || 'Usuario Sistema';

    doc
      .font('Helvetica')
      .fontSize(8)
      .text(`Atendido por: ${nombreUsuarioFinal}`);
    drawSeparator();

    doc.moveDown(0.5);
    doc
      .font('Helvetica')
      .fontSize(7)
      .text('Representación impresa de', { align: 'center' });
    doc
      .font('Helvetica-Bold')
      .text('GUIA ELECTRÓNICA-REMITENTE', { align: 'center' });

    try {
      if (
        typeof (this.remissionRepository as any).markAsPrinted === 'function'
      ) {
        await (this.remissionRepository as any).markAsPrinted(id);
      } else {
        console.warn(
          'El método markAsPrinted no está implementado en RemissionPortOut',
        );
      }
    } catch (e) {
      console.error('Error marcando la guía como impresa:', e);
    }

    doc.end();
  }
}
