/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import * as path from 'path';
import * as QRCode from 'qrcode';
import { AccountReceivableOrmEntity } from '../infrastructure/entity/account-receivable-orm.entity';

const LOGO_PATH = path.join(
  process.cwd(),
  'apps',
  'sales',
  'src',
  'assets',
  'logo.jpg',
);

const C = {
  yellow: '#F6AF33',
  black: '#1A1A1A',
  gray: '#555555',
  lgray: '#F4F4F4',
  white: '#FFFFFF',
  border: '#CCCCCC',
  rowAlt: '#FFFBF4',
  darkBg: '#2B2B2B',
};

// ── Medidas A4 ───────────────────────────────────────────────────────
const PW = 595.28;
const MAR = 28;
const INNER = PW - MAR * 2;

// ── Helpers ──────────────────────────────────────────────────────────

/** Rectángulo con relleno y/o borde, con esquinas redondeadas opcionales */
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
    if (r > 0) doc.roundedRect(x, y, w, h, r).fill(opts.fill);
    else doc.rect(x, y, w, h).fill(opts.fill);
  }
  if (opts.stroke) {
    if (r > 0) doc.roundedRect(x, y, w, h, r).stroke(opts.stroke);
    else doc.rect(x, y, w, h).stroke(opts.stroke);
  }
}

/** Línea horizontal */
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

/** Línea vertical */
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

// ── QR content ───────────────────────────────────────────────────────
function buildQrContent(entity: AccountReceivableOrmEntity): string {
  const ruc = process.env.COMPANY_RUC ?? '20000000000';
  const comp = entity.salesReceipt;
  const moneda = entity.currency?.codigo ?? entity.currencyCode ?? 'PEN';
  const tipo = comp?.tipoComprobante?.descripcion ?? 'CUENTA POR COBRAR';
  const serie = comp?.serie ?? '—';
  const numero = comp
    ? String(comp.numero).padStart(8, '0')
    : String(entity.id).padStart(8, '0');
  return [
    `EMPRESA: ${process.env.COMPANY_NAME ?? 'MKAPU IMPORT S.A.C.'}`,
    `RUC: ${ruc}`,
    `DOCUMENTO: ${tipo} ${serie}-${numero}`,
    `FECHA: ${new Date(entity.issueDate).toLocaleDateString('es-PE')}`,
    `VENCIMIENTO: ${new Date(entity.dueDate).toLocaleDateString('es-PE')}`,
    `TOTAL: ${moneda} ${Number(entity.totalAmount).toFixed(2)}`,
    `SALDO: ${moneda} ${Number(entity.pendingBalance ?? 0).toFixed(2)}`,
    `ESTADO: ${entity.status}`,
  ].join(' | ');
}

// ════════════════════════════════════════════════════════════════════
//  FUNCIÓN PRINCIPAL
// ════════════════════════════════════════════════════════════════════
export async function buildAccountReceivablePdf(
  entity: AccountReceivableOrmEntity,
): Promise<Buffer> {
  const PDFDocument = require('pdfkit');
  const chunks: Buffer[] = [];

  const cl = entity.salesReceipt?.cliente;
  const comp = entity.salesReceipt;
  const moneda = entity.currency?.codigo ?? entity.currencyCode ?? 'PEN';

  const nombreCliente =
    cl?.razon_social ||
    `${cl?.nombres ?? ''} ${cl?.apellidos ?? ''}`.trim() ||
    'Cliente';

  const tipoDoc = comp?.tipoComprobante?.descripcion ?? 'CUENTA POR COBRAR';
  const serie = comp?.serie ?? '—';
  const numero = comp
    ? String(comp.numero).padStart(8, '0')
    : String(entity.id).padStart(8, '0');
  const docRef = `${serie}-${numero}`;

  const empresa = {
    nombre: process.env.COMPANY_NAME ?? 'MKAPU IMPORT S.A.C.',
    ruc: process.env.COMPANY_RUC ?? '20613016946',
    direccion:
      process.env.COMPANY_ADDRESS ?? 'AV. LAS FLORES DE LA PRIMAVERA 1836',
    ciudad: process.env.COMPANY_CITY ?? 'San Juan de Lurigancho - Lima - Perú',
    email: process.env.COMPANY_EMAIL ?? 'mkapu@gmail.com',
    web: process.env.COMPANY_WEB ?? 'www.mkapu.com',
    telefono: process.env.COMPANY_PHONE ?? '903019610',
  };

  const qrDataUrl = await QRCode.toDataURL(buildQrContent(entity), {
    width: 120,
    margin: 1,
    color: { dark: C.black, light: C.white },
  });
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  const details = comp?.details ?? [];

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: MAR, size: 'A4', bufferPages: true });
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 1 – CABECERA  (igual a guía: logo izq | caja doc der)
    //  Left col: logo grande
    //  Right col: pill con tipo doc, luego RUC en caja separada, luego N°
    // ══════════════════════════════════════════════════════════════
    const HDR_H = 88;
    const LW = 180; // ancho columna logo
    const RW = INNER - LW - 8;
    const xRight = MAR + LW + 8;

    // Logo
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

    // Caja tipo documento (naranja, con radius)
    const pillY = 10;
    box(doc, xRight, pillY, RW, 26, { fill: C.yellow, radius: 4 });
    doc
      .fillColor(C.white)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(tipoDoc.toUpperCase(), xRight, pillY + 7, {
        width: RW,
        align: 'center',
      });

    // Caja RUC
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

    // Caja N° documento
    const numY = rucY + 26;
    box(doc, xRight, numY, RW, 20, { stroke: C.yellow, radius: 3 });
    doc
      .fillColor(C.black)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(docRef, xRight, numY + 6, { width: RW, align: 'center' });

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 2 – DATOS EMPRESA  (franja debajo de cabecera)
    // ══════════════════════════════════════════════════════════════
    let y = HDR_H + 4;
    const EH = 66;
    box(doc, MAR, y, INNER, EH, { fill: C.lgray, radius: 3 });
    box(doc, MAR, y, INNER, EH, { stroke: C.border, radius: 3 });

    doc
      .fillColor(C.black)
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .text(empresa.nombre, MAR + 10, y + 7, { width: INNER - 20 });
    // Dirección en dos líneas con lineBreak automático
    doc
      .fillColor(C.gray)
      .font('Helvetica')
      .fontSize(7.5)
      .text(`DIRECCIÓN FISCAL: ${empresa.direccion}`, MAR + 10, y + 21, {
        width: INNER - 20,
        lineBreak: true,
        lineGap: 1,
      });
    // Ciudad debajo (posición dinámica según texto anterior)
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const afterDir = (doc as any).y;
    doc.text(`${empresa.ciudad}`, MAR + 10, afterDir + 1, {
      width: INNER - 20,
    });
    const afterCity = (doc as any).y;
    doc.text(
      `TELÉFONO: ${empresa.telefono}   EMAIL: ${empresa.email}   WEB: ${empresa.web}`,
      MAR + 10,
      afterCity + 1,
      { width: INNER - 20 },
    );

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 3 – CLIENTE (izq, 60%) | FECHAS (der, 40%)
    // ══════════════════════════════════════════════════════════════
    y += EH + 6;
    const B3H = 70;
    const CLW = INNER * 0.58;
    const FEW = INNER - CLW - 6;
    const xFec = MAR + CLW + 6;

    // Caja cliente
    box(doc, MAR, y, CLW, B3H, { stroke: C.border, radius: 3 });
    // Header "CLIENTE"
    box(doc, MAR, y, CLW, 16, { fill: C.yellow, radius: 3 });
    // Fix: redraw bottom of pill as square so it merges with content
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
      .text(nombreCliente, MAR + 8, y + 22, { width: CLW - 16 });
    if (cl?.valor_doc)
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(C.black)
        .text(`Doc: ${cl.valor_doc}`, MAR + 8, y + 36, { width: CLW - 16 });
    if (cl?.direccion)
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(C.gray)
        .text(cl.direccion, MAR + 8, y + 48, {
          width: CLW - 16,
          ellipsis: true,
        });

    // Caja fechas
    box(doc, xFec, y, FEW, B3H, { stroke: C.border, radius: 3 });
    box(doc, xFec, y, FEW, 16, { fill: C.yellow, radius: 3 });
    doc.rect(xFec, y + 8, FEW, 8).fill(C.yellow);
    doc
      .fillColor(C.white)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text('FECHAS', xFec + 8, y + 4);

    doc
      .fillColor(C.gray)
      .font('Helvetica')
      .fontSize(7.5)
      .text('FECHA DE EMISIÓN', xFec + 8, y + 22);
    doc
      .fillColor(C.black)
      .font('Helvetica')
      .fontSize(8.5)
      .text(
        new Date(entity.issueDate).toLocaleDateString('es-PE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        xFec + 8,
        y + 33,
        { width: FEW - 16 },
      );
    hline(doc, xFec + 6, y + 46, FEW - 12);
    doc
      .fillColor(C.gray)
      .font('Helvetica')
      .fontSize(7.5)
      .text('FECHA VENCIMIENTO', xFec + 8, y + 50);
    doc
      .fillColor(C.black)
      .font('Helvetica')
      .fontSize(8.5)
      .text(
        new Date(entity.dueDate).toLocaleDateString('es-PE'),
        xFec + 8,
        y + 61,
        { width: FEW - 16 },
      );

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 4 – COMPROBANTE (izq) | ESTADO & PAGO (der)
    // ══════════════════════════════════════════════════════════════
    y += B3H + 6;
    const B4H = 72;
    const HW = (INNER - 6) / 2;
    const xB4R = MAR + HW + 6;

    // Caja izq: datos comprobante
    box(doc, MAR, y, HW, B4H, { stroke: C.border, radius: 3 });
    box(doc, MAR, y, HW, 16, { fill: C.darkBg, radius: 3 });
    doc.rect(MAR, y + 8, HW, 8).fill(C.darkBg);
    doc
      .fillColor(C.yellow)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text('DATOS DEL COMPROBANTE', MAR + 8, y + 4);

    const rows4L: [string, string][] = [
      ['Tipo comprobante:', tipoDoc],
      ['Serie - Número:', docRef],
      ['Observación:', entity.observation ?? '—'],
    ];
    rows4L.forEach(([lbl, val], i) => {
      const ry = y + 22 + i * 16;
      labelCell(doc, lbl, MAR + 8, ry, 90);
      valueCell(doc, val, MAR + 100, ry, HW - 108);
      if (i < rows4L.length - 1) hline(doc, MAR + 6, ry + 12, HW - 12);
    });

    // Caja der: estado y pago
    box(doc, xB4R, y, HW, B4H, { stroke: C.border, radius: 3 });
    box(doc, xB4R, y, HW, 16, { fill: C.darkBg, radius: 3 });
    doc.rect(xB4R, y + 8, HW, 8).fill(C.darkBg);
    doc
      .fillColor(C.yellow)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text('ESTADO Y PAGO', xB4R + 8, y + 4);

    const rows4R: [string, string][] = [
      ['Estado:', entity.status ?? '—'],
      ['Tipo Pago:', entity.paymentType?.codSunat ?? '—'],
      ['Moneda:', moneda],
    ];
    rows4R.forEach(([lbl, val], i) => {
      const ry = y + 22 + i * 16;
      labelCell(doc, lbl, xB4R + 8, ry, 68);
      valueCell(doc, val, xB4R + 78, ry, HW - 86);
      if (i < rows4R.length - 1) hline(doc, xB4R + 6, ry + 12, HW - 12);
    });

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 5 – TABLA DE PRODUCTOS
    // ══════════════════════════════════════════════════════════════
    y += B4H + 8;

    // Widths: N°, Código, Descripción, U.M., Cant, P.Unit, Total
    const COLS = [28, 60, 168, 38, 48, 66, 66];
    const HEADS = [
      'N°',
      'CÓDIGO',
      'DESCRIPCIÓN',
      'U.M.',
      'CANT.',
      'P. UNIT.',
      'TOTAL',
    ];
    const TH = 18;

    box(doc, MAR, y, INNER, TH, { fill: C.darkBg, radius: 3 });
    doc.rect(MAR, y + 6, INNER, 12).fill(C.darkBg); // flatten bottom corners

    let xc = MAR + 4;
    HEADS.forEach((h, i) => {
      const align = i >= 4 ? 'right' : i === 0 ? 'center' : 'left';
      doc
        .fillColor(C.yellow)
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .text(h, xc, y + 5, { width: COLS[i] - 4, align });
      xc += COLS[i];
    });
    y += TH;

    const rows =
      details.length > 0
        ? details
        : [
            {
              cod_prod: '—',
              descripcion: 'Servicio/Producto según comprobante',
              cantidad: 1,
              pre_uni: entity.totalAmount,
              valor_uni: entity.totalAmount,
              igv: 0,
            },
          ];

    rows.forEach((det, idx) => {
      const rh = 20;
      const subtotal = Number(det.cantidad ?? 1) * Number(det.pre_uni ?? 0);
      const bgColor = idx % 2 === 0 ? C.rowAlt : C.white;

      box(doc, MAR, y, INNER, rh, { fill: bgColor });
      hline(doc, MAR, y + rh, INNER, C.border, 0.4);

      // column separators
      let xs = MAR;
      COLS.forEach((cw, ci) => {
        xs += cw;
        if (ci < COLS.length - 1) vline(doc, xs, y, y + rh, C.border, 0.3);
      });

      const cells = [
        String(idx + 1),
        det.cod_prod ?? '—',
        det.descripcion ?? '—',
        'NIU',
        String(det.cantidad ?? 1),
        `${moneda} ${Number(det.pre_uni ?? 0).toFixed(2)}`,
        `${moneda} ${subtotal.toFixed(2)}`,
      ];

      xc = MAR + 4;
      cells.forEach((cell, i) => {
        const align = i >= 4 ? 'right' : i === 0 ? 'center' : 'left';
        doc
          .fillColor(C.black)
          .font('Helvetica')
          .fontSize(7.8)
          .text(cell, xc, y + 6, { width: COLS[i] - 6, align, ellipsis: true });
        xc += COLS[i];
      });
      y += rh;
    });

    // Borde exterior tabla
    box(doc, MAR, y - rows.length * 20 - TH, INNER, rows.length * 20 + TH, {
      stroke: C.border,
      radius: 3,
    });

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 6 – TOTALES (columna derecha)
    // ══════════════════════════════════════════════════════════════
    y += 10;
    const totW = 220;
    const totX = PW - MAR - totW;

    const totales: [string, string, boolean][] = [
      [
        'Subtotal:',
        `${moneda} ${Number(comp?.subtotal ?? entity.totalAmount).toFixed(2)}`,
        false,
      ],
      ['IGV (18%):', `${moneda} ${Number(comp?.igv ?? 0).toFixed(2)}`, false],
      [
        'MONTO TOTAL:',
        `${moneda} ${Number(entity.totalAmount).toFixed(2)}`,
        false,
      ],
      [
        'MONTO PAGADO:',
        `${moneda} ${Number(entity.paidAmount).toFixed(2)}`,
        false,
      ],
      [
        'SALDO PENDIENTE:',
        `${moneda} ${Number(entity.pendingBalance ?? 0).toFixed(2)}`,
        true,
      ],
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
      const fc = highlight ? C.white : C.black;
      const font = highlight ? 'Helvetica-Bold' : 'Helvetica';
      doc
        .fillColor(fc)
        .font(font)
        .fontSize(highlight ? 9 : 8.5)
        .text(lbl, totX + 8, y + (highlight ? 7 : 4), { width: totW / 2 - 10 })
        .text(val, totX + totW / 2, y + (highlight ? 7 : 4), {
          width: totW / 2 - 10,
          align: 'right',
        });
      y += rh;
    });

    // Borde caja totales
    box(doc, totX, startTotY, totW, y - startTotY, {
      stroke: C.border,
      radius: 3,
    });

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 7 – PIE: QR (izq) | Representación impresa (der)
    // ══════════════════════════════════════════════════════════════
    y = Math.max(y, startTotY + 10) + 14;
    const pieH = 90;
    const PQW = (INNER - 6) / 2;
    const xPR = MAR + PQW + 6;

    box(doc, MAR, y, PQW, pieH, { fill: C.lgray, stroke: C.border, radius: 3 });
    box(doc, xPR, y, PQW, pieH, { fill: C.lgray, stroke: C.border, radius: 3 });

    // QR
    doc.image(qrBuffer, MAR + 8, y + 10, { width: 70, height: 70 });
    doc
      .fillColor(C.black)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('Escanea para verificar', MAR + 84, y + 12, { width: PQW - 92 });
    doc
      .fillColor(C.gray)
      .font('Helvetica')
      .fontSize(7)
      .text(
        'Este código QR contiene los datos clave del documento para verificación rápida.',
        MAR + 84,
        y + 26,
        { width: PQW - 92 },
      );

    // Representación impresa
    doc
      .fillColor(C.gray)
      .font('Helvetica')
      .fontSize(7.5)
      .text('Representación impresa de', xPR + 8, y + 14, {
        width: PQW - 16,
        align: 'center',
      });
    doc
      .fillColor(C.yellow)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(tipoDoc.toUpperCase(), xPR + 8, y + 28, {
        width: PQW - 16,
        align: 'center',
      });
    doc
      .fillColor(C.black)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text(`N° ${docRef}`, xPR + 8, y + 46, {
        width: PQW - 16,
        align: 'center',
      });
    doc
      .fillColor(C.gray)
      .font('Helvetica')
      .fontSize(7)
      .text(
        `Generado: ${new Date().toLocaleDateString('es-PE')}`,
        xPR + 8,
        y + 60,
        { width: PQW - 16, align: 'center' },
      )
      .text(`Estado: ${entity.status}`, xPR + 8, y + 72, {
        width: PQW - 16,
        align: 'center',
      });

    // Línea final naranja
    y += pieH + 10;
    doc.rect(MAR, y, INNER, 3).fill(C.yellow);

    doc.end();
  });
}
