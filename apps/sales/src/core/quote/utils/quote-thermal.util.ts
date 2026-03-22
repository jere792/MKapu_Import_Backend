/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { QuoteResponseDto } from '../application/dto/out/quote-response.dto';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');

function calcHeight(quote: QuoteResponseDto): number {
  const detalles = quote.detalles ?? [];
  const emp = quote.empresa || ({} as any);
  let h = 10;

  // Header (Empresa)
  h += 12; // Nombre empresa
  if (emp.ruc) h += 9;
  if (emp.direccion || quote.sede?.direccion) h += 9;
  if (emp.telefono || quote.sede?.telefono) h += 9;
  h += 8;

  // Cotización Info
  h += 12 + 9 + 9 + 9;
  h += 8;

  // Cliente Info
  h += 10;
  h += 9;
  if (quote.cliente?.id_tipo_documento) h += 9;
  if (quote.cliente?.direccion) h += 9;
  if (quote.sede?.nombre_sede) h += 9;
  h += 8;

  // Table Headers
  h += 9 + 8;

  // Table Rows
  for (const item of detalles) {
    const desc = item.descripcion ?? '';
    const lines = Math.max(1, Math.ceil(desc.length / 18));
    h += lines * 9;
  }

  // Totals
  h += 8 + 10 + 10 + 10;
  h += 8;

  // Footer
  h += 2 + 9 + 9 + 10;

  h += 10;
  return h;
}

export function buildThermalPdf(quote: QuoteResponseDto): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const PAGE_W = 226;
    const MARGIN = 10;
    const W = PAGE_W - MARGIN * 2;

    const pageHeight = calcHeight(quote);

    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: [PAGE_W, pageHeight],
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      autoFirstPage: true,
      bufferPages: false,
    });

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    let y = MARGIN;

    const line = (
      txt: string,
      opts: {
        size?: number;
        bold?: boolean;
        align?: 'left' | 'center' | 'right';
        gap?: number;
      } = {},
    ) => {
      doc
        .fontSize(opts.size ?? 7)
        .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
        .text(txt, MARGIN, y, {
          width: W,
          align: opts.align ?? 'left',
          lineBreak: false,
        });
      y += opts.gap ?? 10;
    };

    const divider = (char = '-') => {
      const dash = char === '=' ? [3, 1] : [1, 2];
      const lineY = y + 3;
      doc
        .save()
        .moveTo(MARGIN, lineY)
        .lineTo(MARGIN + W, lineY)
        .dash(dash[0], { space: dash[1] })
        .lineWidth(0.5)
        .strokeColor('black')
        .stroke()
        .undash()
        .restore();
      y += 8;
    };

    const twoCol = (left: string, right: string, bold = false) => {
      doc
        .fontSize(7)
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .text(left, MARGIN, y, { width: 130 });
      doc
        .fontSize(7)
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .text(right, MARGIN + 130, y, { width: W - 130, align: 'right' });
      y += 10;
    };

    // ── Extracción de datos de la empresa ───────────────────────────────────
    const emp = quote.empresa || ({} as any);
    const nombreEmpresa = emp.razon_social || 'MKAPU IMPORT S.A.C.';
    const rucEmpresa = emp.ruc ? `RUC: ${emp.ruc}` : null;
    const direccionEmpresa = emp.direccion || quote.sede?.direccion;
    const telefonoEmpresa = emp.telefono || quote.sede?.telefono;

    // ── Encabezado ──────────────────────────────────────────────────────────
    line(nombreEmpresa, { bold: true, size: 9, align: 'center', gap: 12 });

    if (rucEmpresa) line(rucEmpresa, { size: 7, align: 'center', gap: 10 });
    if (direccionEmpresa)
      line(direccionEmpresa, { size: 6, align: 'center', gap: 9 });
    if (telefonoEmpresa)
      line(`Cel: ${telefonoEmpresa}`, { size: 6, align: 'center', gap: 9 });

    divider('-');

    // ── Nro cotización ──────────────────────────────────────────────────────
    const codigo =
      (quote as any).codigo ??
      `COT-${String(quote.id_cotizacion).padStart(6, '0')}`;
    line(`COTIZACIÓN N° ${codigo}`, {
      bold: true,
      size: 8,
      align: 'center',
      gap: 12,
    });
    line(
      `Emisión: ${new Date(quote.fec_emision).toLocaleDateString('es-PE')}`,
      { size: 6, align: 'center', gap: 9 },
    );
    line(`Vence:   ${new Date(quote.fec_venc).toLocaleDateString('es-PE')}`, {
      size: 6,
      align: 'center',
      gap: 9,
    });
    line(`Estado: ${quote.estado}`, { size: 6, align: 'center', gap: 9 });

    divider('-');

    // ── Cliente ─────────────────────────────────────────────────────────────
    line('CLIENTE', { bold: true, size: 7, gap: 10 });

    const nombreCliente =
      quote.cliente?.razon_social ||
      `${quote.cliente?.nombre_cliente ?? ''} ${quote.cliente?.apellidos_cliente ?? ''}`.trim();

    line(nombreCliente || 'Público en General', { size: 7, gap: 9 });

    if (quote.cliente?.id_tipo_documento && quote.cliente?.valor_doc)
      line(`${quote.cliente.id_tipo_documento}: ${quote.cliente.valor_doc}`, {
        size: 6,
        gap: 9,
      });
    if (quote.cliente?.direccion)
      line(quote.cliente.direccion, { size: 6, gap: 9 });
    if (quote.sede?.nombre_sede)
      line(`Sede: ${quote.sede.nombre_sede} — ${quote.sede.ciudad}`, {
        size: 6,
        gap: 9,
      });

    divider('-');

    // ── Tabla: cabecera ─────────────────────────────────────────────────────
    doc.fontSize(6).font('Helvetica-Bold');
    doc.text('CANT', MARGIN, y, { width: 20 });
    doc.text('COD', MARGIN + 20, y, { width: 36 });
    doc.text('DESCRIPCIÓN', MARGIN + 56, y, { width: 82 });
    doc.text('P.U.', MARGIN + 138, y, { width: 30, align: 'right' });
    doc.text('IMPORTE', MARGIN + 168, y, { width: 38, align: 'right' });
    y += 9;

    divider('=');

    // ── Tabla: filas ────────────────────────────────────────────────────────
    for (const item of quote.detalles ?? []) {
      const desc = item.descripcion ?? '';
      const pu = `S/${Number(item.precio).toFixed(2)}`;
      const importe = `S/${(Number(item.cantidad) * Number(item.precio)).toFixed(2)}`;
      const rowH = Math.max(1, Math.ceil(desc.length / 18)) * 9;

      doc.fontSize(6).font('Helvetica');
      doc.text(String(item.cantidad), MARGIN, y, { width: 20 });
      doc.text(item.cod_prod ?? '', MARGIN + 20, y, { width: 36 });
      doc.text(desc, MARGIN + 56, y, { width: 82 });
      doc.text(pu, MARGIN + 138, y, { width: 30, align: 'right' });
      doc.text(importe, MARGIN + 168, y, { width: 38, align: 'right' });
      y += rowH;
    }

    divider('=');

    // ── Totales ─────────────────────────────────────────────────────────────
    twoCol('Subtotal:', `S/ ${Number(quote.subtotal).toFixed(2)}`);
    twoCol('IGV (18%):', `S/ ${Number(quote.igv).toFixed(2)}`);
    twoCol('TOTAL:', `S/ ${Number(quote.total).toFixed(2)}`, true);

    divider('-');

    // ── Pie ─────────────────────────────────────────────────────────────────
    y += 2;
    // Fallback al website de la empresa si existe
    const web = emp.web || 'https://mkapu.com';
    line('Consulte su comprobante en:', { size: 6, align: 'center', gap: 9 });
    line(web, { size: 6, align: 'center', gap: 9 });
    line('** GRACIAS POR SU PREFERENCIA **', {
      bold: true,
      size: 7,
      align: 'center',
      gap: 10,
    });

    doc.end();
  });
}
