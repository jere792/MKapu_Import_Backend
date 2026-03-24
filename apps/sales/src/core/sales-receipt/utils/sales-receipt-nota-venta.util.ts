import * as path from 'path';
import * as QRCode from 'qrcode';
import { IGV_DIVISOR } from '../constants/fiscal.constants';
import { SalesReceiptPdfData } from './sales-receipt-pdf.util';

export interface EmpresaPdfData {
  razon_social: string;
  nombre_comercial: string;
  ruc: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  email: string;
  logo_url?: string | null;
  sitio_web?: string | null;
}

const C = {
  yellow: '#F6AF33',
  black: '#1A1A1A',
  gray: '#555555',
  lgray: '#F4F4F4',
  white: '#FFFFFF',
  border: '#CCCCCC',
  rowAlt: '#FFFBF4',
  darkBg: '#2B2B2B',
  green: '#2D7A4F',
  red: '#C0392B',
  orange: '#E65100',
  orangeL: '#FFF3E0',
};

const LOGO_PATH = path.join(
  process.cwd(),
  'apps',
  'sales',
  'src',
  'assets',
  'logo.jpg',
);
const PW = 595.28;
const MAR = 28;
const INNER = PW - MAR * 2;

function box(
  doc: any,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { fill?: string; stroke?: string; radius?: number } = {},
): void {
  const r = opts.radius ?? 0;
  if (opts.fill) {
    r > 0
      ? doc.roundedRect(x, y, w, h, r).fill(opts.fill)
      : doc.rect(x, y, w, h).fill(opts.fill);
  }
  if (opts.stroke) {
    r > 0
      ? doc.roundedRect(x, y, w, h, r).stroke(opts.stroke)
      : doc.rect(x, y, w, h).stroke(opts.stroke);
  }
}

function hline(
  doc: any,
  x: number,
  y: number,
  w: number,
  color = C.border,
  lw = 0.5,
): void {
  doc
    .save()
    .strokeColor(color)
    .lineWidth(lw)
    .moveTo(x, y)
    .lineTo(x + w, y)
    .stroke()
    .restore();
}

function vline(
  doc: any,
  x: number,
  y1: number,
  y2: number,
  color = C.border,
  lw = 0.5,
): void {
  doc
    .save()
    .strokeColor(color)
    .lineWidth(lw)
    .moveTo(x, y1)
    .lineTo(x, y2)
    .stroke()
    .restore();
}

function labelCell(doc: any, text: string, x: number, y: number, w = 90): void {
  doc
    .fillColor(C.gray)
    .font('Helvetica')
    .fontSize(7.5)
    .text(text, x, y, { width: w });
}

function valueCell(
  doc: any,
  text: string,
  x: number,
  y: number,
  w = 140,
): void {
  doc
    .fillColor(C.black)
    .font('Helvetica')
    .fontSize(8)
    .text(text, x, y, { width: w, ellipsis: true });
}

function buildQrContent(
  data: SalesReceiptPdfData,
  empresa: EmpresaPdfData,
): string {
  const numero = String(data.numero).padStart(8, '0');
  return [
    `EMPRESA: ${empresa.nombre_comercial || empresa.razon_social}`,
    `RUC: ${empresa.ruc}`,
    `DOCUMENTO: NOTA DE VENTA ${data.serie}-${numero}`,
    `FECHA: ${new Date(data.fec_emision).toLocaleDateString('es-PE')}`,
    `CLIENTE: ${data.cliente.nombre}`,
    `DOC: ${data.cliente.documento}`,
    `TOTAL: PEN ${Number(data.total).toFixed(2)}`,
  ].join(' | ');
}

export async function buildNotaVentaPdf(
  data: SalesReceiptPdfData,
  empresa: EmpresaPdfData,
): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PDFDocument = require('pdfkit');
  const chunks: Buffer[] = [];

  const docRef = `${data.serie}-${String(data.numero).padStart(8, '0')}`;
  const tipoDoc = 'NOTA DE VENTA';

  const qrDataUrl = await QRCode.toDataURL(buildQrContent(data, empresa), {
    width: 120,
    margin: 1,
    color: { dark: C.black, light: C.white },
  });
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  const tipoPromo = (data.promocion?.tipo ?? '').toUpperCase();
  const promoMontoMap = new Map<string, number>();
  if (data.promocion) {
    const afectados = data.promocion.productos_afectados ?? [];
    if (afectados.length > 0) {
      for (const pa of afectados)
        promoMontoMap.set(pa.cod_prod, Number(pa.monto_descuento));
    } else {
      const m = Number(data.promocion.monto_descuento) / data.productos.length;
      for (const p of data.productos) promoMontoMap.set(p.cod_prod, m);
    }
  }

  function getDescCell(prod: SalesReceiptPdfData['productos'][0]): string {
    if (!data.promocion || !promoMontoMap.has(prod.cod_prod)) return '—';
    const montoItem = promoMontoMap.get(prod.cod_prod)!;
    if (tipoPromo === 'PORCENTAJE') {
      const pct = prod.descuento_porcentaje;
      if (pct != null && pct > 0) return `${Number(pct).toFixed(0)}%`;
      const base = Number(prod.precio_unit) * Number(prod.cantidad);
      if (base > 0 && montoItem > 0)
        return `${((montoItem / base) * 100).toFixed(0)}%`;
      return '—';
    }
    return montoItem > 0 ? `-S/ ${montoItem.toFixed(2)}` : '—';
  }

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: MAR, size: 'A4', bufferPages: true });
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ═══════════════════════════════════════════
    //  SELLO DIAGONAL "NOTA DE VENTA"
    // ═══════════════════════════════════════════
    doc.save();
    doc.opacity(0.07);
    doc.fillColor(C.orange);
    doc.font('Helvetica-Bold').fontSize(72);
    const cx = PW / 2;
    const cy = 420;
    doc
      .translate(cx, cy)
      .rotate(-35)
      .text('NOTA DE VENTA', -200, -36, { width: 400, align: 'center' });
    doc.restore();

    // ═══════════════════════════════════════════
    //  CABECERA
    // ═══════════════════════════════════════════
    const HDR_H = 88;
    const LW = 180;
    const RW = INNER - LW - 8;
    const xRight = MAR + LW + 8;

    try {
      doc.image(LOGO_PATH, MAR + 6, 10, {
        fit: [LW - 12, HDR_H - 20],
        align: 'left',
        valign: 'center',
      });
    } catch {
      doc
        .fillColor(C.yellow)
        .font('Helvetica-Bold')
        .fontSize(26)
        .text('mkapu', MAR + 10, 18);
      doc
        .fillColor(C.black)
        .font('Helvetica')
        .fontSize(12)
        .text('import', MAR + 10, 48);
    }

    const pillY = 10;
    box(doc, xRight, pillY, RW, 26, { fill: C.yellow, radius: 4 });
    doc
      .fillColor(C.white)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(tipoDoc, xRight, pillY + 8, { width: RW, align: 'center' });

    const rucY = pillY + 32;
    box(doc, xRight, rucY, RW, 20, { stroke: C.yellow, radius: 3 });
    doc
      .fillColor(C.black)
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .text(`RUC ${empresa.ruc}`, xRight, rucY + 6, {
        width: RW,
        align: 'center',
      });

    const numY = rucY + 26;
    box(doc, xRight, numY, RW, 20, { stroke: C.yellow, radius: 3 });
    doc
      .fillColor(C.black)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(docRef, xRight, numY + 6, { width: RW, align: 'center' });

    // Badge DOCUMENTO INTERNO (naranja) en lugar del estado
    const badgeY = numY + 26;
    box(doc, xRight, badgeY, RW, 18, { fill: C.orange, radius: 3 });
    doc
      .fillColor(C.white)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text('DOCUMENTO INTERNO', xRight, badgeY + 5, {
        width: RW,
        align: 'center',
      });

    // ═══════════════════════════════════════════
    //  EMPRESA
    // ═══════════════════════════════════════════
    let y = HDR_H + 4;
    const EH = 66;
    box(doc, MAR, y, INNER, EH, { fill: C.lgray, radius: 3 });
    box(doc, MAR, y, INNER, EH, { stroke: C.border, radius: 3 });
    const nombreMostrar =
      empresa.nombre_comercial?.trim() || empresa.razon_social;
    doc
      .fillColor(C.black)
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .text(nombreMostrar, MAR + 10, y + 7, { width: INNER - 20 });
    doc
      .fillColor(C.gray)
      .font('Helvetica')
      .fontSize(7.5)
      .text(`DIRECCIÓN FISCAL: ${empresa.direccion}`, MAR + 10, y + 21, {
        width: INNER - 20,
        lineBreak: true,
        lineGap: 1,
      });
    const afterDir = (doc as any).y;
    doc.text(empresa.ciudad, MAR + 10, afterDir + 1, { width: INNER - 20 });
    const afterCity = (doc as any).y;
    doc.text(
      `TELÉFONO: ${empresa.telefono}   EMAIL: ${empresa.email}`,
      MAR + 10,
      afterCity + 1,
      { width: INNER - 20 },
    );

    // ═══════════════════════════════════════════
    //  CLIENTE / INFO
    // ═══════════════════════════════════════════
    y += EH + 6;
    const B3H = 80;
    const CLW = INNER * 0.58;
    const FEW = INNER - CLW - 6;
    const xFec = MAR + CLW + 6;

    box(doc, MAR, y, CLW, B3H, { stroke: C.border, radius: 3 });
    box(doc, MAR, y, CLW, 16, { fill: C.yellow, radius: 3 });
    doc.rect(MAR, y + 8, CLW, 8).fill(C.yellow);
    doc
      .fillColor(C.white)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text('CLIENTE', MAR + 8, y + 4, { width: CLW - 16 });
    doc
      .fillColor(C.black)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(data.cliente.nombre, MAR + 8, y + 22, { width: CLW - 16 });
    doc
      .fillColor(C.gray)
      .font('Helvetica')
      .fontSize(8)
      .text(
        `${data.cliente.tipo_documento}: ${data.cliente.documento}`,
        MAR + 8,
        y + 36,
        { width: CLW - 16 },
      );
    if (data.cliente.direccion)
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(C.gray)
        .text(data.cliente.direccion, MAR + 8, y + 49, {
          width: CLW - 16,
          ellipsis: true,
        });
    if (data.cliente.email || data.cliente.telefono) {
      const contacto = [data.cliente.email, data.cliente.telefono]
        .filter(Boolean)
        .join('  |  ');
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor(C.gray)
        .text(contacto, MAR + 8, y + 62, { width: CLW - 16, ellipsis: true });
    }

    box(doc, xFec, y, FEW, B3H, { stroke: C.border, radius: 3 });
    box(doc, xFec, y, FEW, 16, { fill: C.yellow, radius: 3 });
    doc.rect(xFec, y + 8, FEW, 8).fill(C.yellow);
    doc
      .fillColor(C.white)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text('NOTA DE VENTA', xFec + 8, y + 4);

    const infoRows: [string, string][] = [
      [
        'Emisión:',
        new Date(data.fec_emision).toLocaleDateString('es-PE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
      ],
      [
        'Vencimiento:',
        data.fec_venc
          ? new Date(data.fec_venc).toLocaleDateString('es-PE')
          : '—',
      ],
      ['Responsable:', data.responsable.nombre],
      ['Sede:', data.responsable.nombreSede],
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
    doc
      .fillColor(C.yellow)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('MÉTODO DE PAGO:', MAR + 10, y + 8, { continued: true })
      .fillColor(C.white)
      .font('Helvetica')
      .fontSize(8)
      .text(`  ${data.metodo_pago}`, { continued: false });

    // ═══════════════════════════════════════════
    //  TABLA DE PRODUCTOS
    // ═══════════════════════════════════════════
    y += PBH + 8;

    const COLS = [26, 58, 168, 44, 66, 60, 56];
    const HEADS = [
      'N°',
      'CÓDIGO',
      'DESCRIPCIÓN',
      'CANT.',
      'P. UNIT.',
      'DESC.',
      'TOTAL',
    ];
    const TH = 18;

    box(doc, MAR, y, INNER, TH, { fill: C.darkBg, radius: 3 });
    doc.rect(MAR, y + 6, INNER, 12).fill(C.darkBg);

    let xc = MAR + 4;
    HEADS.forEach((h, i) => {
      const align = i >= 3 ? 'right' : i === 0 ? 'center' : 'left';
      doc
        .fillColor(C.yellow)
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .text(h, xc, y + 5, { width: COLS[i] - 4, align });
      xc += COLS[i];
    });
    y += TH;

    const tableTopY = y;

    data.productos.forEach((prod, idx) => {
      const esRemate = prod.remate != null;
      const descTxt = getDescCell(prod);
      const tieneDesc = descTxt !== '—';

      const bgColor = esRemate
        ? C.orangeL
        : tieneDesc
          ? '#EEF8F2'
          : idx % 2 === 0
            ? C.rowAlt
            : C.white;
      const rh = esRemate ? 30 : 20;

      box(doc, MAR, y, INNER, rh, { fill: bgColor });
      hline(doc, MAR, y + rh, INNER, C.border, 0.4);

      let xs = MAR;
      COLS.forEach((cw, ci) => {
        xs += cw;
        if (ci < COLS.length - 1) vline(doc, xs, y, y + rh, C.border, 0.3);
      });

      const descColW = COLS[2] - 6;
      xc = MAR + 4;

      const cells = [
        String(idx + 1),
        prod.cod_prod,
        prod.descripcion,
        String(prod.cantidad),
        `S/ ${Number(prod.precio_unit).toFixed(2)}`,
        descTxt,
        `S/ ${Number(prod.total).toFixed(2)}`,
      ];

      cells.forEach((cell, i) => {
        const align = i >= 3 ? 'right' : i === 0 ? 'center' : 'left';

        if (i === 2 && esRemate) {
          doc
            .fillColor(C.black)
            .font('Helvetica')
            .fontSize(7.8)
            .text(cell, xc, y + 4, { width: descColW - 36, ellipsis: true });
          const badgeX = xc + descColW - 34;
          box(doc, badgeX, y + 3, 32, 10, { fill: C.orange, radius: 2 });
          doc
            .fillColor(C.white)
            .font('Helvetica-Bold')
            .fontSize(6)
            .text('REMATE', badgeX + 1, y + 5, { width: 30, align: 'center' });
          const rem = prod.remate!;
          doc
            .fillColor(C.orange)
            .font('Helvetica-Bold')
            .fontSize(6.5)
            .text(rem.cod_remate, xc, y + 17, { width: 50 });
          doc
            .fillColor(C.gray)
            .font('Helvetica')
            .fontSize(6.5)
            .text(`Orig: S/${rem.pre_original.toFixed(2)}`, xc + 52, y + 17, {
              width: 55,
              strike: true,
            });
          doc
            .fillColor(C.orange)
            .font('Helvetica-Bold')
            .fontSize(6.5)
            .text(`S/${rem.pre_remate.toFixed(2)}`, xc + 110, y + 17, {
              width: 50,
            });
        } else {
          let color = C.black;
          let font = 'Helvetica';
          if (i === 5 && tieneDesc) {
            color = tipoPromo === 'PORCENTAJE' ? C.green : C.red;
            font = 'Helvetica-Bold';
          }
          const textY = esRemate ? y + 10 : y + 6;
          doc
            .fillColor(color)
            .font(font)
            .fontSize(7.8)
            .text(cell, xc, textY, {
              width: COLS[i] - 6,
              align,
              ellipsis: true,
            });
        }
        xc += COLS[i];
      });

      y += rh;
    });

    box(doc, MAR, tableTopY - TH, INNER, y - tableTopY + TH, {
      stroke: C.border,
      radius: 3,
    });

    // ═══════════════════════════════════════════
    //  TOTALES  +  QR  (sin desglose IGV)
    // ═══════════════════════════════════════════
    y += 8;

    const QR_SIZE = 80;
    const QR_BOX_W = QR_SIZE + 24;
    const totW = INNER - QR_BOX_W - 6;
    const totX = MAR;
    const qrBoxX = MAR + totW + 6;

    const montoPromoTotal = Number(data.promocion?.monto_descuento ?? 0);
    const subtotalBrutoConIgv = data.productos.reduce(
      (sum, p) =>
        sum +
        Number(
          (Number(p.precio_unit) * IGV_DIVISOR * Number(p.cantidad)).toFixed(2),
        ),
      0,
    );
    const descuentoConIgv = Number((montoPromoTotal * IGV_DIVISOR).toFixed(2));

    // Solo subtotal (si hay promo), descuento (si hay promo) y TOTAL — sin IGV ni base imponible
    const totales: [string, string, boolean][] = [
      ...(data.promocion && montoPromoTotal > 0
        ? ([
            [
              `Subtotal (antes dcto):`,
              `S/ ${subtotalBrutoConIgv.toFixed(2)}`,
              false,
            ],
            [
              `Descuento (${data.promocion.nombre}):`,
              `-S/ ${descuentoConIgv.toFixed(2)}`,
              false,
            ],
          ] as [string, string, boolean][])
        : []),
      [`TOTAL A PAGAR:`, `S/ ${Number(data.total).toFixed(2)}`, true],
    ];

    const startTotY = y;
    let ty = startTotY;

    totales.forEach(([lbl, val, highlight], i) => {
      const rh = highlight ? 22 : 17;
      if (highlight) {
        box(doc, totX, ty, totW, rh, { fill: C.yellow, radius: 3 });
      } else {
        box(doc, totX, ty, totW, rh, { fill: i % 2 === 0 ? C.lgray : C.white });
        hline(doc, totX, ty + rh, totW, C.border, 0.4);
      }
      const isDesc = lbl.startsWith('Descuento');
      const fc = highlight ? C.white : isDesc ? C.red : C.black;
      const font = highlight || isDesc ? 'Helvetica-Bold' : 'Helvetica';

      doc
        .fillColor(fc)
        .font(font)
        .fontSize(highlight ? 9 : 8.5)
        .text(lbl, totX + 8, ty + (highlight ? 7 : 4), { width: totW / 2 - 10 })
        .text(val, totX + totW / 2, ty + (highlight ? 7 : 4), {
          width: totW / 2 - 10,
          align: 'right',
        });
      ty += rh;
    });

    box(doc, totX, startTotY, totW, ty - startTotY, {
      stroke: C.border,
      radius: 3,
    });

    const qrBoxH = ty - startTotY;
    box(doc, qrBoxX, startTotY, QR_BOX_W, qrBoxH, {
      fill: C.lgray,
      stroke: C.border,
      radius: 3,
    });
    const qrImgX = qrBoxX + (QR_BOX_W - QR_SIZE) / 2;
    const qrImgY = startTotY + (qrBoxH - QR_SIZE - 12) / 2 + 4;
    doc.image(qrBuffer, qrImgX, qrImgY, { width: QR_SIZE, height: QR_SIZE });
    doc
      .fillColor(C.gray)
      .font('Helvetica')
      .fontSize(6)
      .text('Escanear para verificar', qrBoxX, qrImgY + QR_SIZE + 3, {
        width: QR_BOX_W,
        align: 'center',
      });

    // ═══════════════════════════════════════════
    //  NOTA LEGAL prominente al pie
    // ═══════════════════════════════════════════
    y = ty + 12;
    box(doc, MAR, y, INNER, 28, { fill: C.orange, radius: 4 });
    doc
      .fillColor(C.white)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text(
        'DOCUMENTO INTERNO — No tiene valor tributario ni reemplaza a un comprobante de pago autorizado por SUNAT.',
        MAR + 10,
        y + 9,
        { width: INNER - 20, align: 'center' },
      );

    y += 38;
    doc.rect(MAR, y, INNER, 3).fill(C.yellow);

    doc.end();
  });
}
