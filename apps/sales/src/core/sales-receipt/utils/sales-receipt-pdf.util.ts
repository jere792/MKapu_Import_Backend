import * as path from 'path';
import * as QRCode from 'qrcode';

const LOGO_PATH = path.join(
  process.cwd(),
  'apps',
  'sales',
  'src',
  'assets',
  'logo.jpg',
);

// ── Paleta ───────────────────────────────────────────────────────────
const C = {
  yellow: '#F6AF33',
  black:  '#1A1A1A',
  gray:   '#555555',
  lgray:  '#F4F4F4',
  white:  '#FFFFFF',
  border: '#CCCCCC',
  rowAlt: '#FFFBF4',
  darkBg: '#2B2B2B',
  green:  '#2D7A4F',
  red:    '#C0392B',
};

// ── Medidas A4 ───────────────────────────────────────────────────────
const PW    = 595.28;
const MAR   = 28;
const INNER = PW - MAR * 2;

// ── Helpers ──────────────────────────────────────────────────────────
function box(
  doc: any, x: number, y: number, w: number, h: number,
  opts: { fill?: string; stroke?: string; radius?: number } = {},
): void {
  const r = opts.radius ?? 0;
  if (opts.fill)   { r > 0 ? doc.roundedRect(x,y,w,h,r).fill(opts.fill)     : doc.rect(x,y,w,h).fill(opts.fill); }
  if (opts.stroke) { r > 0 ? doc.roundedRect(x,y,w,h,r).stroke(opts.stroke) : doc.rect(x,y,w,h).stroke(opts.stroke); }
}

function hline(doc: any, x: number, y: number, w: number, color = C.border, lw = 0.5): void {
  doc.save().strokeColor(color).lineWidth(lw).moveTo(x,y).lineTo(x+w,y).stroke().restore();
}

function vline(doc: any, x: number, y1: number, y2: number, color = C.border, lw = 0.5): void {
  doc.save().strokeColor(color).lineWidth(lw).moveTo(x,y1).lineTo(x,y2).stroke().restore();
}

function labelCell(doc: any, text: string, x: number, y: number, w = 90): void {
  doc.fillColor(C.gray).font('Helvetica').fontSize(7.5).text(text, x, y, { width: w });
}

function valueCell(doc: any, text: string, x: number, y: number, w = 140): void {
  doc.fillColor(C.black).font('Helvetica').fontSize(8).text(text, x, y, { width: w, ellipsis: true });
}

// ── Tipos ────────────────────────────────────────────────────────────
export interface SalesReceiptPdfData {
  id_comprobante:   number;
  serie:            string;
  numero:           number;
  tipo_comprobante: string;
  fec_emision:      string | Date;
  fec_venc?:        string | Date | null;
  estado:           string;
  subtotal:         number;
  igv:              number;
  total:            number;
  metodo_pago:      string;

  cliente: {
    nombre:         string;
    documento:      string;
    tipo_documento: string;
    direccion?:     string;
    email?:         string;
    telefono?:      string;
  };

  responsable: {
    nombre:     string;
    nombreSede: string;
  };

  productos: {
    cod_prod:              string;
    descripcion:           string;
    cantidad:              number;
    precio_unit:           number;
    total:                 number;
    descuento_nombre?:     string | null;
    descuento_porcentaje?: number | null;
  }[];

  promocion?: {
    nombre:          string;
    tipo:            string;
    monto_descuento: number;
    productos_afectados?: {
      cod_prod:        string;
      descripcion:     string;
      monto_descuento: number;
    }[];
  } | null;
}

// ── QR content ───────────────────────────────────────────────────────
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

function estadoColor(estado: string): string {
  switch (estado.toUpperCase()) {
    case 'EMITIDO':   return C.green;
    case 'ANULADO':   return C.red;
    case 'RECHAZADO': return '#E67E22';
    default:          return C.gray;
  }
}

// ════════════════════════════════════════════════════════════════════
//  FUNCIÓN PRINCIPAL
// ════════════════════════════════════════════════════════════════════
export async function buildSalesReceiptPdf(data: SalesReceiptPdfData): Promise<Buffer> {
  const PDFDocument = require('pdfkit');
  const chunks: Buffer[] = [];

  const empresa = {
    nombre:    process.env.COMPANY_NAME    ?? 'MKAPU IMPORT S.A.C.',
    ruc:       process.env.COMPANY_RUC     ?? '20613016946',
    direccion: process.env.COMPANY_ADDRESS ?? 'AV. LAS FLORES DE LA PRIMAVERA 1836',
    ciudad:    process.env.COMPANY_CITY    ?? 'San Juan de Lurigancho - Lima - Perú',
    email:     process.env.COMPANY_EMAIL   ?? 'mkapu@gmail.com',
    telefono:  process.env.COMPANY_PHONE   ?? '903019610',
  };

  const docRef  = `${data.serie}-${String(data.numero).padStart(8, '0')}`;
  const tipoDoc = data.tipo_comprobante.toUpperCase();

  const qrDataUrl = await QRCode.toDataURL(buildQrContent(data), {
    width: 120, margin: 1, color: { dark: C.black, light: C.white },
  });
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  // ── Mapa de descuento por producto ──────────────────────────────
  // Usamos productos_afectados como fuente de verdad para el monto real por item.
  // El tipo de promoción determina cómo se muestra en la columna DESC:
  //   PORCENTAJE → calculamos % = (monto_item / precio_base) * 100  → "X%"
  //   MONTO_FIJO → mostramos el monto directamente                  → "-S/ X.XX"
  const tipoPromo = (data.promocion?.tipo ?? '').toUpperCase();

  // cod_prod → monto_descuento del item específico
  const promoMontoMap = new Map<string, number>();
  if (data.promocion) {
    const afectados = data.promocion.productos_afectados ?? [];
    if (afectados.length > 0) {
      for (const pa of afectados) {
        promoMontoMap.set(pa.cod_prod, Number(pa.monto_descuento));
      }
    } else {
      // Sin lista específica: aplica a todos, monto prorrateado igual
      const montoPorProd = Number(data.promocion.monto_descuento) / data.productos.length;
      for (const p of data.productos) promoMontoMap.set(p.cod_prod, montoPorProd);
    }
  }

  /** Devuelve el texto para la columna DESC de un producto */
  function getDescCell(prod: SalesReceiptPdfData['productos'][0]): string {
    if (!data.promocion || !promoMontoMap.has(prod.cod_prod)) return '—';

    const montoItem = promoMontoMap.get(prod.cod_prod)!;

    if (tipoPromo === 'PORCENTAJE') {
      // Primero intentar campo ya calculado por el backend
      const pct = prod.descuento_porcentaje;
      if (pct != null && pct > 0) return `${Number(pct).toFixed(0)}%`;

      // Calcular desde monto_item / base
      const base = Number(prod.precio_unit) * Number(prod.cantidad);
      if (base > 0 && montoItem > 0) {
        return `${((montoItem / base) * 100).toFixed(0)}%`;
      }
      return '—';
    }

    // MONTO_FIJO u otro: mostrar monto en soles
    return montoItem > 0 ? `-S/ ${montoItem.toFixed(2)}` : '—';
  }

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: MAR, size: 'A4', bufferPages: true });
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ═══════════════════════════════════════════
    //  CABECERA
    // ═══════════════════════════════════════════
    const HDR_H  = 88;
    const LW     = 180;
    const RW     = INNER - LW - 8;
    const xRight = MAR + LW + 8;

    try {
      doc.image(LOGO_PATH, MAR + 6, 10, { fit: [LW - 12, HDR_H - 20], align: 'left', valign: 'center' });
    } catch {
      doc.fillColor(C.yellow).font('Helvetica-Bold').fontSize(26).text('mkapu', MAR + 10, 18);
      doc.fillColor(C.black).font('Helvetica').fontSize(12).text('import', MAR + 10, 48);
    }

    const pillY = 10;
    box(doc, xRight, pillY, RW, 26, { fill: C.yellow, radius: 4 });
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(12)
       .text(tipoDoc, xRight, pillY + 7, { width: RW, align: 'center' });

    const rucY = pillY + 32;
    box(doc, xRight, rucY, RW, 20, { stroke: C.yellow, radius: 3 });
    doc.fillColor(C.black).font('Helvetica-Bold').fontSize(8.5)
       .text(`RUC ${empresa.ruc}`, xRight, rucY + 6, { width: RW, align: 'center' });

    const numY = rucY + 26;
    box(doc, xRight, numY, RW, 20, { stroke: C.yellow, radius: 3 });
    doc.fillColor(C.black).font('Helvetica-Bold').fontSize(9)
       .text(docRef, xRight, numY + 6, { width: RW, align: 'center' });

    const badgeY = numY + 26;
    box(doc, xRight, badgeY, RW, 18, { fill: estadoColor(data.estado), radius: 3 });
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(8)
       .text(data.estado, xRight, badgeY + 5, { width: RW, align: 'center' });

    // ═══════════════════════════════════════════
    //  EMPRESA
    // ═══════════════════════════════════════════
    let y = HDR_H + 4;
    const EH = 66;
    box(doc, MAR, y, INNER, EH, { fill: C.lgray, radius: 3 });
    box(doc, MAR, y, INNER, EH, { stroke: C.border, radius: 3 });
    doc.fillColor(C.black).font('Helvetica-Bold').fontSize(9.5)
       .text(empresa.nombre, MAR + 10, y + 7, { width: INNER - 20 });
    doc.fillColor(C.gray).font('Helvetica').fontSize(7.5)
       .text(`DIRECCIÓN FISCAL: ${empresa.direccion}`, MAR + 10, y + 21, { width: INNER - 20, lineBreak: true, lineGap: 1 });
    const afterDir  = (doc as any).y;
    doc.text(empresa.ciudad, MAR + 10, afterDir + 1, { width: INNER - 20 });
    const afterCity = (doc as any).y;
    doc.text(`TELÉFONO: ${empresa.telefono}   EMAIL: ${empresa.email}`, MAR + 10, afterCity + 1, { width: INNER - 20 });

    // ═══════════════════════════════════════════
    //  CLIENTE / COMPROBANTE
    // ═══════════════════════════════════════════
    y += EH + 6;
    const B3H  = 80;
    const CLW  = INNER * 0.58;
    const FEW  = INNER - CLW - 6;
    const xFec = MAR + CLW + 6;

    // — Cliente —
    box(doc, MAR, y, CLW, B3H, { stroke: C.border, radius: 3 });
    box(doc, MAR, y, CLW, 16,  { fill: C.yellow, radius: 3 });
    doc.rect(MAR, y + 8, CLW, 8).fill(C.yellow);
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(7.5).text('CLIENTE', MAR + 8, y + 4, { width: CLW - 16 });
    doc.fillColor(C.black).font('Helvetica-Bold').fontSize(9).text(data.cliente.nombre, MAR + 8, y + 22, { width: CLW - 16 });
    doc.fillColor(C.gray).font('Helvetica').fontSize(8)
       .text(`${data.cliente.tipo_documento}: ${data.cliente.documento}`, MAR + 8, y + 36, { width: CLW - 16 });
    if (data.cliente.direccion)
      doc.font('Helvetica').fontSize(7.5).fillColor(C.gray).text(data.cliente.direccion, MAR + 8, y + 49, { width: CLW - 16, ellipsis: true });
    if (data.cliente.email || data.cliente.telefono) {
      const contacto = [data.cliente.email, data.cliente.telefono].filter(Boolean).join('  |  ');
      doc.font('Helvetica').fontSize(7).fillColor(C.gray).text(contacto, MAR + 8, y + 62, { width: CLW - 16, ellipsis: true });
    }

    // — Comprobante —
    box(doc, xFec, y, FEW, B3H, { stroke: C.border, radius: 3 });
    box(doc, xFec, y, FEW, 16,  { fill: C.yellow, radius: 3 });
    doc.rect(xFec, y + 8, FEW, 8).fill(C.yellow);
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(7.5).text('COMPROBANTE', xFec + 8, y + 4);

    const infoRows: [string, string][] = [
      ['Emisión:',      new Date(data.fec_emision).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })],
      ['Vencimiento:',  data.fec_venc ? new Date(data.fec_venc).toLocaleDateString('es-PE') : '—'],
      ['Responsable:',  data.responsable.nombre],
      ['Sede:',         data.responsable.nombreSede],
    ];
    infoRows.forEach(([lbl, val], i) => {
      const ry = y + 22 + i * 14;
      labelCell(doc, lbl, xFec + 8, ry, 62);
      valueCell(doc, val, xFec + 72, ry, FEW - 80);
      if (i < infoRows.length - 1) hline(doc, xFec + 6, ry + 11, FEW - 12);
    });

    // ═══════════════════════════════════════════
    //  MÉTODO DE PAGO
    // ═══════════════════════════════════════════
    y += B3H + 6;
    const PBH = 24;
    box(doc, MAR, y, INNER, PBH, { fill: C.darkBg, radius: 3 });
    doc.fillColor(C.yellow).font('Helvetica-Bold').fontSize(8)
       .text('MÉTODO DE PAGO:', MAR + 10, y + 8, { continued: true })
       .fillColor(C.white).font('Helvetica').fontSize(8)
       .text(`  ${data.metodo_pago}`, { continued: false });

    // ═══════════════════════════════════════════
    //  TABLA DE PRODUCTOS  (única tabla)
    // ═══════════════════════════════════════════
    y += PBH + 8;

    // Columnas: N° | CÓDIGO | DESCRIPCIÓN | CANT. | P.UNIT. | DESC. | TOTAL
    // DESC. = ahorro real del item (% o -S/) si tiene promo, o '—'
    const COLS  = [26, 58, 168, 44, 66, 60, 56];
    const HEADS = ['N°', 'CÓDIGO', 'DESCRIPCIÓN', 'CANT.', 'P. UNIT.', 'DESC.', 'TOTAL'];
    const TH    = 18;

    box(doc, MAR, y, INNER, TH, { fill: C.darkBg, radius: 3 });
    doc.rect(MAR, y + 6, INNER, 12).fill(C.darkBg);

    let xc = MAR + 4;
    HEADS.forEach((h, i) => {
      const align = i >= 3 ? 'right' : i === 0 ? 'center' : 'left';
      doc.fillColor(C.yellow).font('Helvetica-Bold').fontSize(7.5)
         .text(h, xc, y + 5, { width: COLS[i] - 4, align });
      xc += COLS[i];
    });
    y += TH;

    const tableTopY = y;

    data.productos.forEach((prod, idx) => {
      const rh      = 20;
      const descTxt = getDescCell(prod);
      const tieneDesc = descTxt !== '—';

      const bgColor = tieneDesc ? '#EEF8F2' : idx % 2 === 0 ? C.rowAlt : C.white;
      box(doc, MAR, y, INNER, rh, { fill: bgColor });
      hline(doc, MAR, y + rh, INNER, C.border, 0.4);

      let xs = MAR;
      COLS.forEach((cw, ci) => {
        xs += cw;
        if (ci < COLS.length - 1) vline(doc, xs, y, y + rh, C.border, 0.3);
      });

      const cells = [
        String(idx + 1),
        prod.cod_prod,
        prod.descripcion,
        String(prod.cantidad),
        `S/ ${Number(prod.precio_unit).toFixed(2)}`,
        descTxt,
        `S/ ${Number(prod.total).toFixed(2)}`,
      ];

      xc = MAR + 4;
      cells.forEach((cell, i) => {
        const align = i >= 3 ? 'right' : i === 0 ? 'center' : 'left';

        // Columna DESC (i=5): verde si %, rojo si monto fijo
        let color = C.black;
        let font  = 'Helvetica';
        if (i === 5 && tieneDesc) {
          color = tipoPromo === 'PORCENTAJE' ? C.green : C.red;
          font  = 'Helvetica-Bold';
        }

        doc.fillColor(color).font(font).fontSize(7.8)
           .text(cell, xc, y + 6, { width: COLS[i] - 6, align, ellipsis: true });
        xc += COLS[i];
      });

      y += rh;
    });

    // Borde exterior tabla
    box(doc, MAR, tableTopY - TH, INNER, y - tableTopY + TH, { stroke: C.border, radius: 3 });

    // ═══════════════════════════════════════════
    //  NOTA PROMO (si aplica) — línea discreta bajo la tabla
    // ══════════════════════════════════════════

    // ═══════════════════════════════════════════
    //  TOTALES  +  QR  (lado a lado)
    // ═══════════════════════════════════════════
    y += 8;

    const QR_SIZE  = 80;
    const QR_BOX_W = QR_SIZE + 24;
    const totW     = INNER - QR_BOX_W - 6;
    const totX     = MAR;
    const qrBoxX   = MAR + totW + 6;

    const montoPromoTotal = Number(data.promocion?.monto_descuento ?? 0);
    const subtotalBruto   = data.promocion
      ? Number((data.subtotal + montoPromoTotal).toFixed(2))
      : data.subtotal;

    const totales: [string, string, boolean][] = [
      [`Subtotal (antes dcto):`, `S/ ${subtotalBruto.toFixed(2)}`, false],
      ...(data.promocion && montoPromoTotal > 0
        ? ([[`Descuento:`, `-S/ ${montoPromoTotal.toFixed(2)}`, false]] as [string, string, boolean][])
        : []),
      [`Base imponible:`, `S/ ${Number(data.subtotal).toFixed(2)}`, false],
      [`IGV (18%):`,      `S/ ${Number(data.igv).toFixed(2)}`,      false],
      [`TOTAL A PAGAR:`,  `S/ ${Number(data.total).toFixed(2)}`,     true],
    ];

    const startTotY = y;
    let ty          = startTotY;

    totales.forEach(([lbl, val, highlight], i) => {
      const rh = highlight ? 22 : 17;
      if (highlight) {
        box(doc, totX, ty, totW, rh, { fill: C.yellow, radius: 3 });
      } else {
        box(doc, totX, ty, totW, rh, { fill: i % 2 === 0 ? C.lgray : C.white });
        hline(doc, totX, ty + rh, totW, C.border, 0.4);
      }
      const isDesc = lbl.startsWith('Descuento');
      const fc     = highlight ? C.white : isDesc ? C.red : C.black;
      const font   = highlight || isDesc ? 'Helvetica-Bold' : 'Helvetica';

      doc.fillColor(fc).font(font).fontSize(highlight ? 9 : 8.5)
         .text(lbl, totX + 8, ty + (highlight ? 7 : 4), { width: totW / 2 - 10 })
         .text(val, totX + totW / 2, ty + (highlight ? 7 : 4), { width: totW / 2 - 10, align: 'right' });
      ty += rh;
    });

    box(doc, totX, startTotY, totW, ty - startTotY, { stroke: C.border, radius: 3 });

    // ── QR a la derecha de los totales ──
    const qrBoxH = ty - startTotY;
    box(doc, qrBoxX, startTotY, QR_BOX_W, qrBoxH, { fill: C.lgray, stroke: C.border, radius: 3 });
    const qrImgX = qrBoxX + (QR_BOX_W - QR_SIZE) / 2;
    const qrImgY = startTotY + (qrBoxH - QR_SIZE - 12) / 2 + 4;
    doc.image(qrBuffer, qrImgX, qrImgY, { width: QR_SIZE, height: QR_SIZE });
    doc.fillColor(C.gray).font('Helvetica').fontSize(6)
       .text('Escanear para verificar', qrBoxX, qrImgY + QR_SIZE + 3, { width: QR_BOX_W, align: 'center' });

    // ═══════════════════════════════════════════
    //  LÍNEA FINAL
    // ═══════════════════════════════════════════
    y = ty + 14;
    doc.rect(MAR, y, INNER, 3).fill(C.yellow);

    doc.end();
  });
}