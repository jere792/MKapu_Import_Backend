/* eslint-disable @typescript-eslint/no-var-requires */
const PDFDocument = require('pdfkit');

export interface CashboxResumen {
  totalVentas: number;
  totalMonto: number;
  ticketPromedio: number;
  gananciaBruta: number;
  cantProductos: number;
  montoInicial: number;
  dineroEnCaja: number;
  saldoVirtual: number;
  ventasPorHora: { hora: string; total: number }[];
}

const PAGE_W = 226;
const MARGIN = 8;
const W = PAGE_W - MARGIN * 2;
const YELLOW = '#F6AF33';
const BLACK = '#000000';
const GRAY = '#888888';

function fmt(n: number): string {
  return n.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function now(): string {
  return new Date().toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const BOTTOM_PADDING = 240;

function calcExactHeight(resumen: CashboxResumen): number {
  let y = MARGIN;
  y += 30;
  y += 6;
  y += 6 * (7 + 7);
  y += 6;
  y += 20;
  y += 7 + 7;
  y += 6;
  y += 13;
  y += 11;
  y += 6;
  const filas = resumen.ventasPorHora.filter(v => v.total > 0);
  y += filas.length > 0 ? filas.length * 14 : 16;
  y += 6;
  y += 4 + 6;
  y += 10;
  y += MARGIN + 4;
  return y + BOTTOM_PADDING;
}

export function buildCashboxThermalPdf(
  resumen: CashboxResumen,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: [PAGE_W, calcExactHeight(resumen)],
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      autoFirstPage: true,
      bufferPages: false,
    });

    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    let y = MARGIN;

    const solidLine = (lw = 0.5, color = BLACK) => {
      doc
        .save()
        .strokeColor(color)
        .lineWidth(lw)
        .moveTo(MARGIN, y)
        .lineTo(MARGIN + W, y)
        .stroke()
        .restore();
      y += 6;
    };

    const dashedLine = (lw = 0.4, color = BLACK) => {
      doc
        .save()
        .strokeColor(color)
        .lineWidth(lw)
        .dash(2, { space: 2 })
        .moveTo(MARGIN, y)
        .lineTo(MARGIN + W, y)
        .stroke()
        .undash()
        .restore();
      y += 6;
    };

    const cline = (
      text: string,
      opts: {
        size?: number;
        bold?: boolean;
        gap?: number;
        color?: string;
      } = {},
    ) => {
      doc
        .fontSize(opts.size ?? 7)
        .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fillColor(opts.color ?? BLACK)
        .text(text, MARGIN, y, { width: W, align: 'center', lineBreak: false });
      y += opts.gap ?? 10;
    };

    const twoCol = (
      left: string,
      right: string,
      opts: {
        bold?: boolean;
        size?: number;
        colorRight?: string;
        lw?: number;
      } = {},
    ) => {
      const sz = opts.size ?? 7;
      const lw = opts.lw ?? W * 0.6;
      doc
        .fontSize(sz)
        .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fillColor(BLACK)
        .text(left, MARGIN, y, { width: lw, lineBreak: false, align: 'left' });
      doc
        .fontSize(sz)
        .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fillColor(opts.colorRight ?? BLACK)
        .text(right, MARGIN + lw, y, {
          width: W - lw,
          lineBreak: false,
          align: 'right',
        });
      y += sz + 7;
    };

    doc.rect(MARGIN, y, W, 26).fill(YELLOW);
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor(BLACK)
      .text('RESUMEN DE CAJA', MARGIN, y + 5, {
        width: W,
        align: 'center',
        lineBreak: false,
      });
    doc
      .fontSize(6.5)
      .font('Helvetica')
      .fillColor(BLACK)
      .text(now(), MARGIN, y + 17, {
        width: W,
        align: 'center',
        lineBreak: false,
      });
    y += 30;

    dashedLine();

    twoCol('Monto inicial', `S/ ${fmt(resumen.montoInicial)}`);
    twoCol('Total ventas', String(resumen.totalVentas));
    twoCol('Total ingresos', `S/ ${fmt(resumen.totalMonto)}`);
    twoCol('Ticket promedio', `S/ ${fmt(resumen.ticketPromedio)}`);
    twoCol('Ganancia bruta', `S/ ${fmt(resumen.gananciaBruta)}`, {
      colorRight: YELLOW,
      bold: true,
    });
    twoCol('Cant. productos', String(resumen.cantProductos));

    dashedLine();

    doc.rect(MARGIN, y, W, 16).fill(YELLOW);
    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor(BLACK)
      .text('DINERO EN CAJA:', MARGIN + 4, y + 5, {
        width: W * 0.55,
        lineBreak: false,
      });
    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor(BLACK)
      .text(`S/ ${fmt(resumen.dineroEnCaja)}`, MARGIN, y + 5, {
        width: W - 4,
        align: 'right',
        lineBreak: false,
      });
    y += 20;

    twoCol(
      'Saldo virtual (transferencias):',
      `S/ ${fmt(resumen.saldoVirtual)}`,
      { size: 7 },
    );

    dashedLine();

    cline('VENTAS POR HORA', { bold: true, size: 7, gap: 13, color: YELLOW });

    doc
      .fontSize(6.5)
      .font('Helvetica-Bold')
      .fillColor(BLACK)
      .text('Hora', MARGIN, y, { width: 40, lineBreak: false })
      .text('Monto', MARGIN + 40, y, {
        width: W - 40,
        align: 'right',
        lineBreak: false,
      });
    y += 11;

    solidLine(0.8, YELLOW);

    const filas = resumen.ventasPorHora.filter((v) => v.total > 0);
    if (filas.length === 0) {
      doc
        .fontSize(6.5)
        .font('Helvetica')
        .fillColor(GRAY)
        .text('Sin movimientos registrados', MARGIN, y, {
          width: W,
          align: 'center',
          lineBreak: false,
        });
      y += 16;
    } else {
      for (const fila of filas) {
        doc
          .fontSize(6.5)
          .font('Helvetica')
          .fillColor(BLACK)
          .text(fila.hora, MARGIN, y, { width: 40, lineBreak: false })
          .text(`S/ ${fmt(fila.total)}`, MARGIN + 40, y, {
            width: W - 40,
            align: 'right',
            lineBreak: false,
          });
        y += 14;
      }
    }

    solidLine(0.8, YELLOW);

    y += 4;
    dashedLine();
    doc
      .fontSize(6)
      .font('Helvetica')
      .fillColor(GRAY)
      .text('MKapu Import — Sistema de Gestión', MARGIN, y, {
        width: W,
        align: 'center',
        lineBreak: false,
      });

    doc.end();
  });
}
