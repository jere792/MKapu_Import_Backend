// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');
import * as QRCode from 'qrcode';
import * as path from 'path';
import { SalesReceiptPdfData } from './sales-receipt-pdf.util';

const LOGO_PATH = path.join(
  process.cwd(),
  'apps', 'sales', 'src', 'assets', 'logo.jpg',
);

const PAGE_W = 226;
const MARGIN  = 8;
const W       = PAGE_W - MARGIN * 2;

function calcHeight(data: SalesReceiptPdfData): number {
  const esBoleta = data.tipo_comprobante.toUpperCase().includes('BOLETA') ||
                   data.tipo_comprobante === '03';
  let h = MARGIN;
  h += 38;
  h += 9;          // divider
  h += 8 + 8 + 8 + 8 + 8; // empresa
  h += 9;          // divider
  h += 11 + 11;    // tipo + numero
  h += 9;          // divider
  h += 8 * 5;      // emision, responsable, sede, pago, estado
  if (!esBoleta) h += 8; // vencimiento solo facturas
  h += 9;          // divider
  h += 9 + 8;      // cliente nombre + doc
  if (data.cliente.direccion) h += 8;
  if (data.cliente.email)     h += 8;
  if (data.cliente.telefono)  h += 8;
  h += 9;          // divider
  h += 10 + 6;     // cabecera tabla
  for (const p of data.productos) {
    h += 8;
    const descLines = Math.max(1, Math.ceil(p.descripcion.length / 24));
    h += descLines * 8 + 8 + 5;
  }
  h += 7;
  h += 9;          // divider
  h += 8 * 3;      // subtotal, base, igv
  if (data.promocion && Number(data.promocion.monto_descuento) > 0) h += 8;
  h += 16;         // TOTAL
  h += 9;          // divider
  h += 8 * 3;      // atendido, nro atencion, turno
  h += 9;          // divider
  h += 72 + 8 + 9; // QR
  h += 9;          // divider
  h += 8 * 5;      // pie
  h += 9;          // divider
  h += 14;         // copia + gracias
  h += MARGIN;
  return h;
}

export async function buildSalesReceiptThermalPdf(
  data: SalesReceiptPdfData,
  esCopia = false,
): Promise<Buffer> {

  const qrDataUrl = await QRCode.toDataURL(buildQrContent(data), { width: 120, margin: 1 });
  const qrBuffer  = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  const tipoPromo     = (data.promocion?.tipo ?? '').toUpperCase();
  const promoMontoMap = new Map<string, number>();
  if (data.promocion) {
    const afectados = data.promocion.productos_afectados ?? [];
    if (afectados.length > 0) {
      for (const pa of afectados) promoMontoMap.set(pa.cod_prod, Number(pa.monto_descuento));
    } else {
      const m = Number(data.promocion.monto_descuento) / data.productos.length;
      for (const p of data.productos) promoMontoMap.set(p.cod_prod, m);
    }
  }

  function getPromoTxt(prod: SalesReceiptPdfData['productos'][0]): string | null {
    if (!data.promocion || !promoMontoMap.has(prod.cod_prod)) return null;
    const m = promoMontoMap.get(prod.cod_prod)!;
    if (tipoPromo === 'PORCENTAJE') {
      const pct = prod.descuento_porcentaje;
      if (pct != null && pct > 0) return `  Descuento: ${Number(pct).toFixed(0)}%`;
      const base = Number(prod.precio_unit) * Number(prod.cantidad);
      if (base > 0 && m > 0) return `  Descuento: ${((m / base) * 100).toFixed(0)}%`;
    }
    return m > 0 ? `  Descuento: -S/ ${m.toFixed(2)}` : null;
  }

  const esBoleta = data.tipo_comprobante.toUpperCase().includes('BOLETA') ||
                   data.tipo_comprobante === '03';

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size:    [PAGE_W, calcHeight(data)],
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      autoFirstPage: true,
      bufferPages:   false,
    });

    doc.on('data',  (c: Buffer) => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    let y = MARGIN;

    // ── Helpers ──────────────────────────────────────────────────────

    /** Línea sólida de borde a borde */
    const solidLine = (lw = 0.5, color = '#000000') => {
      doc.save()
         .strokeColor(color)
         .lineWidth(lw)
         .moveTo(MARGIN, y)
         .lineTo(MARGIN + W, y)
         .stroke()
         .restore();
      y += 5;
    };

    /** Línea punteada de borde a borde */
    const dashedLine = (lw = 0.4, color = '#000000') => {
      doc.save()
         .strokeColor(color)
         .lineWidth(lw)
         .dash(2, { space: 2 })
         .moveTo(MARGIN, y)
         .lineTo(MARGIN + W, y)
         .stroke()
         .undash()
         .restore();
      y += 5;
    };

    const cline = (
      text: string,
      opts: { size?: number; bold?: boolean; gap?: number; color?: string } = {},
    ) => {
      doc.fontSize(opts.size ?? 7)
         .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
         .fillColor(opts.color ?? '#000000')
         .text(text, MARGIN, y, { width: W, align: 'center', lineBreak: false });
      y += opts.gap ?? 9;
    };

    const lline = (
      text: string,
      opts: { size?: number; bold?: boolean; gap?: number; color?: string } = {},
    ) => {
      doc.fontSize(opts.size ?? 7)
         .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
         .fillColor(opts.color ?? '#000000')
         .text(text, MARGIN, y, { width: W, align: 'left', lineBreak: false });
      y += opts.gap ?? 9;
    };

    const twoCol = (
      left: string,
      right: string,
      opts: { bold?: boolean; size?: number; colorRight?: string; lw?: number } = {},
    ) => {
      const sz = opts.size ?? 7;
      const lw = opts.lw ?? W * 0.48;
      doc.fontSize(sz).font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
         .fillColor('#000000')
         .text(left, MARGIN, y, { width: lw, lineBreak: false, align: 'left' });
      doc.fontSize(sz).font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
         .fillColor(opts.colorRight ?? '#000000')
         .text(right, MARGIN + lw, y, { width: W - lw, lineBreak: false, align: 'right' });
      y += sz + 3;
    };

    // ════════════════════════════════════════════
    //  LOGO
    // ════════════════════════════════════════════
    const LOGO_H = 32;
    try {
      doc.image(LOGO_PATH, MARGIN + (W - 80) / 2, y, { fit: [80, LOGO_H], align: 'center' });
    } catch {
      doc.fontSize(15).font('Helvetica-Bold').fillColor('#000000')
         .text('mkapu', MARGIN, y, { width: W, align: 'center', lineBreak: false });
      y += 16;
      doc.fontSize(9).font('Helvetica').fillColor('#000000')
         .text('import', MARGIN, y, { width: W, align: 'center', lineBreak: false });
    }
    y += LOGO_H + 4;

    dashedLine();

    // ════════════════════════════════════════════
    //  EMPRESA
    // ════════════════════════════════════════════
    cline('MKAPU IMPORT S.A.C.',                    { bold: true, size: 8, gap: 9 });
    cline(process.env.COMPANY_RUC ?? '20613016946', { size: 7, gap: 8 });
    cline('AV. LAS FLORES DE LA PRIMAVERA 1838',    { size: 6, gap: 7 });
    cline('Paradero 15 - San Juan de Lurigancho',   { size: 6, gap: 7 });
    cline(`celular: ${process.env.COMPANY_PHONE ?? '903019610'}`, { size: 6, gap: 8 });

    dashedLine();

    // ════════════════════════════════════════════
    //  TIPO Y NÚMERO
    // ════════════════════════════════════════════
    const tipoDoc = data.tipo_comprobante.toUpperCase();
    const docRef  = `${data.serie}-${String(data.numero).padStart(8, '0')}`;

    cline(tipoDoc, { bold: true, size: 9, gap: 11 });
    cline(docRef,  { bold: true, size: 8, gap: 10 });

    dashedLine();

    // ════════════════════════════════════════════
    //  INFO COMPROBANTE
    // ════════════════════════════════════════════
    const fechaHora = new Date(data.fec_emision).toLocaleString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    twoCol('Emisión:',     fechaHora);

    // Vencimiento solo para facturas / documentos que no sean boleta
    if (!esBoleta && data.fec_venc) {
      const fecVenc = new Date(data.fec_venc).toLocaleDateString('es-PE');
      twoCol('Vencimiento:', fecVenc);
    }

    twoCol('Responsable:', data.responsable.nombre);
    twoCol('Sede:',        data.responsable.nombreSede);
    twoCol('Pago:',        data.metodo_pago);
    twoCol('Estado:',      data.estado, { bold: true });

    dashedLine();

    // ════════════════════════════════════════════
    //  CLIENTE
    // ════════════════════════════════════════════
    lline(data.cliente.nombre, { bold: true, size: 7, gap: 9 });
    lline(
      `${data.cliente.tipo_documento}: ${data.cliente.documento}`,
      { size: 6, gap: 8 },
    );
    if (data.cliente.direccion) lline(data.cliente.direccion, { size: 6, gap: 8 });
    if (data.cliente.email)     lline(`Email: ${data.cliente.email}`, { size: 6, gap: 8 });
    if (data.cliente.telefono)  lline(`Tel: ${data.cliente.telefono}`, { size: 6, gap: 8 });

    dashedLine();

    // ════════════════════════════════════════════
    //  TABLA PRODUCTOS
    // ════════════════════════════════════════════
    doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#000000');
    doc.text('#',           MARGIN,       y, { width: 12,      lineBreak: false });
    doc.text('DESCRIPCIÓN', MARGIN + 12,  y, { width: 88,      lineBreak: false });
    doc.text('CANT',        MARGIN + 100, y, { width: 28,      align: 'center', lineBreak: false });
    doc.text('P.U.',        MARGIN + 128, y, { width: 32,      align: 'right',  lineBreak: false });
    doc.text('TOTAL',       MARGIN + 160, y, { width: W - 160, align: 'right',  lineBreak: false });
    y += 9;

    solidLine(0.8);

    data.productos.forEach((prod, idx) => {
      // línea 1: índice + código
      doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#000000')
         .text(`${idx + 1} ${prod.cod_prod}`, MARGIN, y, { width: W, lineBreak: false });
      y += 8;

      // descripción multilínea
      doc.fontSize(6.5).font('Helvetica').fillColor('#000000')
         .text(prod.descripcion, MARGIN + 4, y, { width: 96, lineBreak: true });
      const afterDesc = (doc as any).y;

      // cant / pu / total
      const midY = y + ((afterDesc - y) - 7) / 2;
      doc.fontSize(6.5).font('Helvetica').fillColor('#000000')
         .text(String(prod.cantidad),                      MARGIN + 100, midY, { width: 28,      align: 'center', lineBreak: false });
      doc.text(`S/${Number(prod.precio_unit).toFixed(2)}`, MARGIN + 128, midY, { width: 32,      align: 'right',  lineBreak: false });
      doc.text(`S/${Number(prod.total).toFixed(2)}`,        MARGIN + 160, midY, { width: W - 160, align: 'right',  lineBreak: false });

      y = afterDesc + 1;

      const promoTxt = getPromoTxt(prod);
      if (promoTxt) {
        doc.fontSize(6).font('Helvetica-Bold').fillColor('#C0392B')
           .text(promoTxt, MARGIN + 4, y, { width: W - 4, align: 'left', lineBreak: false });
        y += 7;
      }

      // separador entre items
      dashedLine(0.3, '#888888');
    });

    solidLine(0.8);

    // ════════════════════════════════════════════
    //  TOTALES
    // ════════════════════════════════════════════
    const montoPromo    = Number(data.promocion?.monto_descuento ?? 0);
    const subtotalBruto = data.promocion
      ? Number((data.subtotal + montoPromo).toFixed(2))
      : data.subtotal;

    twoCol('Subtotal:',       `S/ ${subtotalBruto.toFixed(2)}`);
    if (data.promocion && montoPromo > 0) {
      twoCol('Descuento:', `-S/ ${montoPromo.toFixed(2)}`, { colorRight: '#C0392B', bold: true });
    }
    twoCol('Base imponible:', `S/ ${Number(data.subtotal).toFixed(2)}`);
    twoCol('IGV (18%):',      `S/ ${Number(data.igv).toFixed(2)}`);

    y += 2;
    doc.rect(MARGIN, y, W, 15).fill('#000000');
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF')
       .text('TOTAL A PAGAR:', MARGIN + 4, y + 4, { width: W * 0.5, lineBreak: false });
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF')
       .text(`S/ ${Number(data.total).toFixed(2)}`, MARGIN, y + 4, {
         width: W - 4, align: 'right', lineBreak: false,
       });
    y += 18;

    dashedLine();

    // ════════════════════════════════════════════
    //  ATENDIDO POR
    // ════════════════════════════════════════════
    const nroAtencion = String(data.id_comprobante).padStart(6, '0');
    const hora        = new Date(data.fec_emision).getHours();
    const turno       = hora < 13 ? 'Turno: Mañana' : hora < 18 ? 'Turno: Tarde' : 'Turno: Noche';

    cline(`Atendido por: ${data.responsable.nombre}`, { size: 7, bold: true, gap: 8 });
    cline(`N° Atención: ${nroAtencion}`,               { size: 6, gap: 8 });
    cline(turno,                                       { size: 6, gap: 8 });

    dashedLine();

    // ════════════════════════════════════════════
    //  QR
    // ════════════════════════════════════════════
    const QR_SIZE = 68;
    doc.image(qrBuffer, MARGIN + (W - QR_SIZE) / 2, y, { width: QR_SIZE, height: QR_SIZE });
    y += QR_SIZE + 4;
    cline('Escanee para verificar el comprobante', { size: 5.5, gap: 9 });

    dashedLine();

    // ════════════════════════════════════════════
    //  PIE
    // ════════════════════════════════════════════
    cline('Representacion impresa de',                        { size: 5.5, gap: 7 });
    cline(tipoDoc,                                            { size: 5.5, bold: true, gap: 7 });
    cline('Autorizado mediante Resolucion de Intendencia',    { size: 5.5, gap: 7 });
    cline('Consulte su comprobante en:',                      { size: 5.5, gap: 7 });
    cline('https://fe.tumi-soft.com',                         { size: 5.5, gap: 8 });

    solidLine(0.8);

    cline(esCopia ? 'Copia' : 'Original', { size: 6, bold: true, gap: 8 });
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#000000')
       .text('** GRACIAS POR SU PREFERENCIA **', MARGIN, y, {
         width: W, align: 'center', lineBreak: false,
       });

    doc.end();
  });
}

function buildQrContent(data: SalesReceiptPdfData): string {
  const ruc    = process.env.COMPANY_RUC ?? '20613016946';
  const numero = String(data.numero).padStart(8, '0');
  return [
    `EMPRESA: ${process.env.COMPANY_NAME ?? 'MKAPU IMPORT S.A.C.'}`,
    `RUC: ${ruc}`,
    `DOCUMENTO: ${data.tipo_comprobante} ${data.serie}-${numero}`,
    `FECHA: ${new Date(data.fec_emision).toLocaleDateString('es-PE')}`,
    `CLIENTE: ${data.cliente.nombre}`,
    `DOC: ${data.cliente.documento}`,
    `TOTAL: PEN ${Number(data.total).toFixed(2)}`,
    `ESTADO: ${data.estado}`,
  ].join(' | ');
}