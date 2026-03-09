import * as path from 'path';
import * as QRCode from 'qrcode';

const LOGO_PATH = path.join(process.cwd(), 'apps', 'sales', 'src', 'assets', 'logo.jpg');

const C = {
  yellow:  '#F6AF33',
  black:   '#1A1A1A',
  gray:    '#555555',
  lgray:   '#F4F4F4',
  white:   '#FFFFFF',
  border:  '#CCCCCC',
  rowAlt:  '#FFFBF4',
  darkBg:  '#2B2B2B',
};

const PW    = 595.28;
const MAR   = 28;
const INNER = PW - MAR * 2;

// ── Helpers ──────────────────────────────────────────────────────────

function box(
  doc: any,
  x: number, y: number, w: number, h: number,
  opts: { fill?: string; stroke?: string; radius?: number } = {},
): void {
  const r = opts.radius ?? 0;
  if (opts.fill) {
    if (r > 0) doc.roundedRect(x, y, w, h, r).fill(opts.fill);
    else        doc.rect(x, y, w, h).fill(opts.fill);
  }
  if (opts.stroke) {
    if (r > 0) doc.roundedRect(x, y, w, h, r).stroke(opts.stroke);
    else        doc.rect(x, y, w, h).stroke(opts.stroke);
  }
}

function hline(doc: any, x: number, y: number, w: number, color = C.border, lw = 0.5): void {
  doc.save().strokeColor(color).lineWidth(lw).moveTo(x, y).lineTo(x + w, y).stroke().restore();
}

function vline(doc: any, x: number, y1: number, y2: number, color = C.border, lw = 0.5): void {
  doc.save().strokeColor(color).lineWidth(lw).moveTo(x, y1).lineTo(x, y2).stroke().restore();
}

function labelCell(doc: any, text: string, x: number, y: number, w = 90): void {
  doc.fillColor(C.gray).font('Helvetica').fontSize(7.5).text(text, x, y, { width: w });
}

function valueCell(doc: any, text: string, x: number, y: number, w = 140): void {
  doc.fillColor(C.black).font('Helvetica').fontSize(8).text(text, x, y, { width: w, ellipsis: true });
}

// ════════════════════════════════════════════════════════════════════
//  FUNCIÓN PRINCIPAL
// ════════════════════════════════════════════════════════════════════
export async function buildQuotePdf(quote: any): Promise<Buffer> {
  const PDFDocument = require('pdfkit');
  const chunks: Buffer[] = [];

  // ── Datos base ────────────────────────────────────────────────────
  const cl     = quote.cliente;
  const codigo = quote.codigo ?? `COT-${String(quote.id_cotizacion).padStart(8, '0')}`;

  const nombreCliente =
    cl?.razon_social ||
    `${cl?.nombre_cliente ?? ''} ${cl?.apellidos_cliente ?? ''}`.trim() ||
    'Cliente';

  const empresa = {
    nombre:    process.env.COMPANY_NAME    ?? 'MKAPU IMPORT S.A.C.',
    ruc:       process.env.COMPANY_RUC     ?? '20613016946',
    direccion: process.env.COMPANY_ADDRESS ?? 'AV. LAS FLORES DE LA PRIMAVERA NRO. 1838',
    ciudad:    process.env.COMPANY_CITY    ?? 'San Juan de Lurigancho - Lima - Perú',
    email:     process.env.COMPANY_EMAIL   ?? 'mkapu@gmail.com',
    web:       process.env.COMPANY_WEB     ?? 'www.mkapu.com',
    telefono:  process.env.COMPANY_PHONE   ?? '903019610',
    banco:     process.env.COMPANY_BANK    ?? 'BCP - Cta. Cte. 123-456789-0-12',
  };

  // QR con datos de cotización
  const qrContent = [
    `EMPRESA: ${empresa.nombre}`,
    `RUC: ${empresa.ruc}`,
    `COTIZACIÓN: ${codigo}`,
    `FECHA: ${new Date(quote.fec_emision).toLocaleDateString('es-PE')}`,
    `VENCE: ${new Date(quote.fec_venc).toLocaleDateString('es-PE')}`,
    `TOTAL: S/ ${Number(quote.total).toFixed(2)}`,
    `ESTADO: ${quote.estado}`,
  ].join(' | ');

  const qrDataUrl = await QRCode.toDataURL(qrContent, {
    width: 120, margin: 1,
    color: { dark: C.black, light: C.white },
  });
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  const detalles: any[] = quote.detalles ?? [];

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: MAR, size: 'A4', bufferPages: true });
    doc.on('data',  (c: Buffer) => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 1 – CABECERA
    // ══════════════════════════════════════════════════════════════
    const HDR_H  = 88;
    const LW     = 180;
    const RW     = INNER - LW - 8;
    const xRight = MAR + LW + 8;

    vline(doc, MAR + LW + 4, 14, HDR_H - 14);

    // Logo
    try {
      doc.image(LOGO_PATH, MAR + 6, 10, { fit: [LW - 12, HDR_H - 20], align: 'left', valign: 'center' });
    } catch {
      doc.fillColor(C.yellow).font('Helvetica-Bold').fontSize(26).text('mkapu', MAR + 10, 18);
      doc.fillColor(C.black).font('Helvetica').fontSize(12).text('import', MAR + 10, 48);
    }

    // Pill tipo doc
    const pillY = 10;
    box(doc, xRight, pillY, RW, 26, { fill: C.yellow, radius: 4 });
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(12)
      .text('COTIZACIÓN', xRight, pillY + 7, { width: RW, align: 'center' });

    // Caja RUC
    const rucY = pillY + 32;
    box(doc, xRight, rucY, RW, 20, { stroke: C.yellow, radius: 3 });
    doc.fillColor(C.black).font('Helvetica-Bold').fontSize(8.5)
      .text(`RUC ${empresa.ruc}`, xRight, rucY + 6, { width: RW, align: 'center' });

    // Caja N° cotización
    const numY = rucY + 26;
    box(doc, xRight, numY, RW, 20, { stroke: C.yellow, radius: 3 });
    doc.fillColor(C.black).font('Helvetica-Bold').fontSize(9)
      .text(codigo, xRight, numY + 6, { width: RW, align: 'center' });

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 2 – DATOS EMPRESA
    // ══════════════════════════════════════════════════════════════
    let y = HDR_H + 4;
    const EH = 66;
    box(doc, MAR, y, INNER, EH, { fill: C.lgray, radius: 3 });
    box(doc, MAR, y, INNER, EH, { stroke: C.border, radius: 3 });

    doc.fillColor(C.black).font('Helvetica-Bold').fontSize(9.5)
      .text(empresa.nombre, MAR + 10, y + 7, { width: INNER - 20 });
    doc.fillColor(C.gray).font('Helvetica').fontSize(7.5)
      .text(`DIRECCIÓN FISCAL: ${empresa.direccion}`, MAR + 10, y + 21, { width: INNER - 20, lineBreak: true, lineGap: 1 });
    const afterDir = (doc as any).y;
    doc.text(`${empresa.ciudad}`, MAR + 10, afterDir + 1, { width: INNER - 20 });
    const afterCity = (doc as any).y;
    doc.text(`TELÉFONO: ${empresa.telefono}   EMAIL: ${empresa.email}   WEB: ${empresa.web}`, MAR + 10, afterCity + 1, { width: INNER - 20 });

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 3 – CLIENTE (60%) | FECHAS + ESTADO (40%)
    // ══════════════════════════════════════════════════════════════
    y += EH + 6;
    const B3H  = 96;
    const CLW  = INNER * 0.58;
    const FEW  = INNER - CLW - 6;
    const xFec = MAR + CLW + 6;

    // Caja cliente
    box(doc, MAR, y, CLW, B3H, { stroke: C.border, radius: 3 });
    box(doc, MAR, y, CLW, 16,  { fill: C.yellow, radius: 3 });
    doc.rect(MAR, y + 8, CLW, 8).fill(C.yellow);
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(7.5)
      .text('CLIENTE', MAR + 8, y + 4, { width: CLW - 16 });

    doc.fillColor(C.black).font('Helvetica-Bold').fontSize(9)
      .text(nombreCliente, MAR + 8, y + 22, { width: CLW - 16 });
    if (cl?.valor_doc)
      doc.font('Helvetica').fontSize(8).fillColor(C.black)
        .text(`Doc: ${cl.valor_doc}`, MAR + 8, y + 36, { width: CLW - 16 });
    if (cl?.telefono)
      doc.font('Helvetica').fontSize(7.5).fillColor(C.gray)
        .text(`Tel: ${cl.telefono}`, MAR + 8, y + 48, { width: CLW - 16 });
    if (cl?.email)
      doc.font('Helvetica').fontSize(7.5).fillColor(C.gray)
        .text(`Email: ${cl.email}`, MAR + 8, y + 58, { width: CLW - 16, ellipsis: true });
    if (cl?.direccion)
      doc.font('Helvetica').fontSize(7.5).fillColor(C.gray)
        .text(cl.direccion, MAR + 8, y + 68, { width: CLW - 16, ellipsis: true });

    // Caja fechas + estado
    box(doc, xFec, y, FEW, B3H, { stroke: C.border, radius: 3 });
    box(doc, xFec, y, FEW, 16,  { fill: C.yellow, radius: 3 });
    doc.rect(xFec, y + 8, FEW, 8).fill(C.yellow);
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(7.5)
      .text('FECHAS Y ESTADO', xFec + 8, y + 4);

    doc.fillColor(C.gray).font('Helvetica').fontSize(7.5).text('FECHA DE EMISIÓN', xFec + 8, y + 22);
    doc.fillColor(C.black).font('Helvetica').fontSize(8.5)
      .text(new Date(quote.fec_emision).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }), xFec + 8, y + 33, { width: FEW - 16 });

    hline(doc, xFec + 6, y + 46, FEW - 12);

    doc.fillColor(C.gray).font('Helvetica').fontSize(7.5).text('VÁLIDO HASTA', xFec + 8, y + 50);
    doc.fillColor(C.black).font('Helvetica').fontSize(8.5)
      .text(new Date(quote.fec_venc).toLocaleDateString('es-PE'), xFec + 8, y + 61, { width: FEW - 16 });

    hline(doc, xFec + 6, y + 72, FEW - 12);

    // Badge estado
    const estadoColor = quote.estado === 'APROBADA' ? '#27AE60' : quote.estado === 'VENCIDA' ? '#E74C3C' : C.yellow;
    box(doc, xFec + 6, y + B3H - 20, FEW - 12, 16, { fill: estadoColor, radius: 3 });
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(8)
      .text(quote.estado ?? 'PENDIENTE', xFec + 6, y + B3H - 14, { width: FEW - 12, align: 'center' });

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 4 – CONDICIONES DE PAGO (izq) | BANCO (der)
    // ══════════════════════════════════════════════════════════════
    y += B3H + 6;
    const B4H = 50;
    const HW  = (INNER - 6) / 2;
    const xB4R = MAR + HW + 6;

    // Condiciones de pago
    box(doc, MAR,  y, HW, B4H, { stroke: C.border, radius: 3 });
    box(doc, MAR,  y, HW, 16,  { fill: C.darkBg, radius: 3 });
    doc.rect(MAR, y + 8, HW, 8).fill(C.darkBg);
    doc.fillColor(C.yellow).font('Helvetica-Bold').fontSize(7.5)
      .text('CONDICIONES DE PAGO', MAR + 8, y + 4);

    const condRows: [string, string][] = [
      ['Forma de pago:', 'Transferencia / Depósito bancario'],
      ['Validez oferta:', `Hasta ${new Date(quote.fec_venc).toLocaleDateString('es-PE')}`],
    ];
    condRows.forEach(([lbl, val], i) => {
      const ry = y + 22 + i * 14;
      labelCell(doc, lbl, MAR + 8, ry, 82);
      valueCell(doc, val, MAR + 94, ry, HW - 102);
    });

    // Banco
    box(doc, xB4R, y, HW, B4H, { stroke: C.border, radius: 3 });
    box(doc, xB4R, y, HW, 16,  { fill: C.darkBg, radius: 3 });
    doc.rect(xB4R, y + 8, HW, 8).fill(C.darkBg);
    doc.fillColor(C.yellow).font('Helvetica-Bold').fontSize(7.5)
      .text('DATOS BANCARIOS', xB4R + 8, y + 4);

    doc.fillColor(C.gray).font('Helvetica').fontSize(7.5)
      .text('Banco / Cuenta:', xB4R + 8, y + 22);
    doc.fillColor(C.black).font('Helvetica').fontSize(8)
      .text(empresa.banco, xB4R + 8, y + 34, { width: HW - 16 });

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 5 – TABLA DE PRODUCTOS
    // ══════════════════════════════════════════════════════════════
    y += B4H + 8;

    const COLS  = [28, 70, 196, 40, 60, 70];
    const HEADS = ['N°', 'CÓDIGO', 'DESCRIPCIÓN', 'CANT.', 'P. UNIT.', 'IMPORTE'];
    const TH    = 18;

    box(doc, MAR, y, INNER, TH, { fill: C.darkBg, radius: 3 });
    doc.rect(MAR, y + 6, INNER, 12).fill(C.darkBg);

    let xc = MAR + 4;
    HEADS.forEach((h, i) => {
      const align = i >= 3 ? 'right' : (i === 0 ? 'center' : 'left');
      doc.fillColor(C.yellow).font('Helvetica-Bold').fontSize(7.5)
        .text(h, xc, y + 5, { width: COLS[i] - 4, align });
      xc += COLS[i];
    });

    const tableStartY = y;
    y += TH;

    const rows = detalles.length > 0
      ? detalles
      : [{ cod_prod: '—', descripcion: 'Sin productos registrados', cantidad: 0, precio: 0 }];

    rows.forEach((det, idx) => {
      const rh      = 20;
      const importe  = Number(det.cantidad ?? 0) * Number(det.precio ?? 0);

      box(doc, MAR, y, INNER, rh, { fill: idx % 2 === 0 ? C.rowAlt : C.white });
      hline(doc, MAR, y + rh, INNER, C.border, 0.4);

      let xs = MAR;
      COLS.forEach((cw, ci) => {
        xs += cw;
        if (ci < COLS.length - 1) vline(doc, xs, y, y + rh, C.border, 0.3);
      });

      const cells = [
        String(idx + 1),
        det.cod_prod ?? '—',
        det.descripcion ?? '—',
        String(det.cantidad ?? 0),
        `S/ ${Number(det.precio ?? 0).toFixed(2)}`,
        `S/ ${importe.toFixed(2)}`,
      ];

      xc = MAR + 4;
      cells.forEach((cell, i) => {
        const align = i >= 3 ? 'right' : (i === 0 ? 'center' : 'left');
        doc.fillColor(C.black).font('Helvetica').fontSize(7.8)
          .text(cell, xc, y + 6, { width: COLS[i] - 6, align, ellipsis: true });
        xc += COLS[i];
      });
      y += rh;
    });

    box(doc, MAR, tableStartY, INNER, y - tableStartY, { stroke: C.border, radius: 3 });

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 6 – OBSERVACIONES (izq) | TOTALES (der)
    // ══════════════════════════════════════════════════════════════
    y += 10;
    const totW   = 220;
    const totX   = PW - MAR - totW;
    const obsW   = totX - MAR - 8;

    // Totales
    const totales: [string, string, boolean][] = [
      ['Subtotal:',  `S/ ${Number(quote.subtotal).toFixed(2)}`, false],
      ['IGV (18%):', `S/ ${Number(quote.igv).toFixed(2)}`,      false],
      ['TOTAL:',     `S/ ${Number(quote.total).toFixed(2)}`,    true],
    ];

    const startTotY = y;
    totales.forEach(([lbl, val, highlight], i) => {
      const rh = highlight ? 22 : 17;
      if (highlight) {
        box(doc, totX, y, totW, rh, { fill: C.yellow, radius: 3 });
      } else {
        box(doc, totX, y, totW, rh, { fill: i % 2 === 0 ? C.lgray : C.white });
        hline(doc, totX, y + rh, totW, C.border, 0.4);
      }
      const fc   = highlight ? C.white  : C.black;
      const font = highlight ? 'Helvetica-Bold' : 'Helvetica';
      doc.fillColor(fc).font(font).fontSize(highlight ? 10 : 8.5)
        .text(lbl, totX + 8,  y + (highlight ? 6 : 4), { width: totW / 2 - 10 })
        .text(val, totX + totW / 2, y + (highlight ? 6 : 4), { width: totW / 2 - 10, align: 'right' });
      y += rh;
    });
    box(doc, totX, startTotY, totW, y - startTotY, { stroke: C.border, radius: 3 });

    // Observaciones (altura dinámica igual a bloque totales)
    const obsH = y - startTotY;
    box(doc, MAR, startTotY, obsW, obsH, { stroke: C.border, radius: 3 });
    box(doc, MAR, startTotY, obsW, 16,   { fill: C.darkBg, radius: 3 });
    doc.rect(MAR, startTotY + 8, obsW, 8).fill(C.darkBg);
    doc.fillColor(C.yellow).font('Helvetica-Bold').fontSize(7.5)
      .text('OBSERVACIONES', MAR + 8, startTotY + 4);
    doc.fillColor(C.gray).font('Helvetica').fontSize(8)
      .text(
        quote.observacion ?? 'Precios incluyen IGV. Cotización válida hasta la fecha de vencimiento indicada.',
        MAR + 8, startTotY + 22,
        { width: obsW - 16, lineBreak: true },
      );

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 7 – QR (izq) | Firma (centro) | Representación (der)
    // ══════════════════════════════════════════════════════════════
    y += 14;
    const pieH = 90;
    const TW3  = (INNER - 12) / 3;
    const xP2  = MAR + TW3 + 6;
    const xP3  = xP2 + TW3 + 6;

    box(doc, MAR, y, TW3, pieH, { fill: C.lgray, stroke: C.border, radius: 3 });
    box(doc, xP2, y, TW3, pieH, { fill: C.lgray, stroke: C.border, radius: 3 });
    box(doc, xP3, y, TW3, pieH, { fill: C.lgray, stroke: C.border, radius: 3 });

    // QR
    doc.image(qrBuffer, MAR + 8, y + 10, { width: 68, height: 68 });
    doc.fillColor(C.black).font('Helvetica-Bold').fontSize(7.5)
      .text('Escanea para verificar', MAR + 82, y + 14, { width: TW3 - 90 });
    doc.fillColor(C.gray).font('Helvetica').fontSize(6.5)
      .text('Este QR contiene los datos de la cotización.', MAR + 82, y + 27, { width: TW3 - 90 });

    // Firma / Sello
    hline(doc, xP2 + 16, y + 65, TW3 - 32, C.black, 0.8);
    doc.fillColor(C.black).font('Helvetica-Bold').fontSize(8)
      .text(empresa.nombre, xP2 + 8, y + 70, { width: TW3 - 16, align: 'center' });
    doc.fillColor(C.gray).font('Helvetica').fontSize(7)
      .text('Firma y Sello Autorizado', xP2 + 8, y + 81, { width: TW3 - 16, align: 'center' });

    // Representación impresa
    doc.fillColor(C.gray).font('Helvetica').fontSize(7.5)
      .text('Documento generado por', xP3 + 8, y + 14, { width: TW3 - 16, align: 'center' });
    doc.fillColor(C.yellow).font('Helvetica-Bold').fontSize(10)
      .text('COTIZACIÓN', xP3 + 8, y + 28, { width: TW3 - 16, align: 'center' });
    doc.fillColor(C.black).font('Helvetica-Bold').fontSize(8)
      .text(codigo, xP3 + 8, y + 46, { width: TW3 - 16, align: 'center' });
    doc.fillColor(C.gray).font('Helvetica').fontSize(7)
      .text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, xP3 + 8, y + 60, { width: TW3 - 16, align: 'center' })
      .text(`Estado: ${quote.estado}`, xP3 + 8, y + 72, { width: TW3 - 16, align: 'center' });

    // Línea final naranja
    y += pieH + 10;
    doc.rect(MAR, y, INNER, 3).fill(C.yellow);

    doc.end();
  });
}