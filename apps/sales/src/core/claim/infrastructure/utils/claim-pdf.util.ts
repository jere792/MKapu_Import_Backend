/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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

const C = {
  yellow: '#F6AF33',
  black: '#1A1A1A',
  gray: '#555555',
  lgray: '#F4F4F4',
  white: '#FFFFFF',
  border: '#CCCCCC',
  rowAlt: '#FFFBF4',
  darkBg: '#2B2B2B',
  success: '#27AE60',
  danger: '#E74C3C',
  warning: '#F39C12',
  info: '#3498DB',
};

const PW = 595.28;
const MAR = 28;
const INNER = PW - MAR * 2;

// ── Helpers ──────────────────────────────────────────────────────────

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

// ════════════════════════════════════════════════════════════════════
//  FUNCIÓN PRINCIPAL
// ════════════════════════════════════════════════════════════════════
export async function buildClaimPdf(
  claim: any, // Usamos any o Claim asegurándonos de mapear sus propiedades reales
  empresaData: any,
): Promise<Buffer> {
  const PDFDocument = require('pdfkit');
  const chunks: Buffer[] = [];

  // ── Datos base ────────────────────────────────────────────────────
  const emp = empresaData || {};
  const empresa = {
    nombre: emp.razon_social || 'MKAPU IMPORT S.A.C.',
    ruc: emp.ruc || '20613016946',
    direccion: emp.direccion || 'AV. LAS FLORES DE LA PRIMAVERA NRO. 1838',
    ciudad: emp.ciudad || 'San Juan de Lurigancho - Lima - Perú',
    email: emp.email || 'mkapu@gmail.com',
    web: emp.web || 'www.mkapu.com',
    telefono: emp.telefono || '903019610',
  };

  const idReclamo = claim.id_reclamo || claim.id || 0;
  const codigo = `REC-${String(idReclamo).padStart(8, '0')}`;
  const fReg = claim.fec_registro || claim.createdAt || new Date();
  const estadoStr = claim.estado || 'REGISTRADO';

  // QR con datos de reclamo
  const qrContent = [
    `EMPRESA: ${empresa.nombre}`,
    `RUC: ${empresa.ruc}`,
    `RECLAMO: ${codigo}`,
    `COMPROBANTE: ${claim.id_comprobante || claim.saleReceiptId || '-'}`,
    `FECHA: ${new Date(fReg).toLocaleDateString('es-PE')}`,
    `ESTADO: ${estadoStr}`,
  ].join(' | ');

  const qrDataUrl = await QRCode.toDataURL(qrContent, {
    width: 120,
    margin: 1,
    color: { dark: C.black, light: C.white },
  });
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: MAR, size: 'A4', bufferPages: true });
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 1 – CABECERA
    // ══════════════════════════════════════════════════════════════
    const HDR_H = 88;
    const LW = 180;
    const RW = INNER - LW - 8;
    const xRight = MAR + LW + 8;

    vline(doc, MAR + LW + 4, 14, HDR_H - 14);

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

    // Pill tipo doc
    const pillY = 10;
    box(doc, xRight, pillY, RW, 26, { fill: C.danger, radius: 4 }); // Rojo para reclamos
    doc
      .fillColor(C.white)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('HOJA DE RECLAMACIÓN', xRight, pillY + 7, {
        width: RW,
        align: 'center',
      });

    // Caja RUC
    const rucY = pillY + 32;
    box(doc, xRight, rucY, RW, 20, { stroke: C.danger, radius: 3 });
    doc
      .fillColor(C.black)
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .text(`RUC ${empresa.ruc}`, xRight, rucY + 6, {
        width: RW,
        align: 'center',
      });

    // Caja N° Reclamo
    const numY = rucY + 26;
    box(doc, xRight, numY, RW, 20, { stroke: C.danger, radius: 3 });
    doc
      .fillColor(C.black)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(codigo, xRight, numY + 6, { width: RW, align: 'center' });

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 2 – DATOS EMPRESA
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
    //  BLOQUE 3 – DATOS DEL RECLAMO Y ESTADO
    // ══════════════════════════════════════════════════════════════
    y += EH + 6;
    const B3H = 80;
    const HW = (INNER - 6) / 2;
    const xRInfo = MAR + HW + 6;

    // Caja Datos Base
    box(doc, MAR, y, HW, B3H, { stroke: C.border, radius: 3 });
    box(doc, MAR, y, HW, 16, { fill: C.darkBg, radius: 3 });
    doc.rect(MAR, y + 8, HW, 8).fill(C.darkBg);
    doc
      .fillColor(C.yellow)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text('DATOS DE LA VENTA', MAR + 8, y + 4);

    doc
      .fillColor(C.gray)
      .font('Helvetica')
      .fontSize(7.5)
      .text('Comprobante Asociado:', MAR + 8, y + 24);
    doc
      .fillColor(C.black)
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .text(
        String(claim.id_comprobante || claim.saleReceiptId || '—'),
        MAR + 8,
        y + 36,
      );

    doc
      .fillColor(C.gray)
      .font('Helvetica')
      .fontSize(7.5)
      .text('Motivo del Reclamo:', MAR + 8, y + 52);
    doc
      .fillColor(C.black)
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .text(claim.motivo || claim.reason || '—', MAR + 8, y + 64);

    // Caja Estado y Fecha
    box(doc, xRInfo, y, HW, B3H, { stroke: C.border, radius: 3 });
    box(doc, xRInfo, y, HW, 16, { fill: C.darkBg, radius: 3 });
    doc.rect(xRInfo, y + 8, HW, 8).fill(C.darkBg);
    doc
      .fillColor(C.yellow)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text('SEGUIMIENTO', xRInfo + 8, y + 4);

    doc
      .fillColor(C.gray)
      .font('Helvetica')
      .fontSize(7.5)
      .text('Fecha de Registro:', xRInfo + 8, y + 24);
    doc
      .fillColor(C.black)
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .text(new Date(fReg).toLocaleDateString('es-PE'), xRInfo + 8, y + 36);

    // Color según el estado
    const badgeColor =
      estadoStr === 'RESUELTO'
        ? C.success
        : estadoStr === 'RECHAZADO'
          ? C.danger
          : estadoStr === 'EN_PROCESO'
            ? C.warning
            : C.info; // Default info (REGISTRADO)

    box(doc, xRInfo + 8, y + 50, HW - 16, 20, { fill: badgeColor, radius: 3 });
    doc
      .fillColor(C.white)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(estadoStr, xRInfo + 8, y + 56, {
        width: HW - 16,
        align: 'center',
      });

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 4 – DESCRIPCIÓN DEL CLIENTE
    // ══════════════════════════════════════════════════════════════
    y += B3H + 8;
    const descText =
      claim.descripcion ||
      claim.description ||
      'Sin descripción detallada por el cliente.';

    doc.font('Helvetica').fontSize(8);
    const textHeight = doc.heightOfString(descText, { width: INNER - 16 }) + 30;
    const B4H = Math.max(50, textHeight);

    box(doc, MAR, y, INNER, B4H, { stroke: C.border, radius: 3 });
    box(doc, MAR, y, INNER, 16, { fill: C.rowAlt, radius: 3 });
    doc.rect(MAR, y + 8, INNER, 8).fill(C.rowAlt);

    doc
      .fillColor(C.danger)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text('DESCRIPCIÓN DEL RECLAMO / INCONFORMIDAD', MAR + 8, y + 4);

    doc
      .fillColor(C.black)
      .font('Helvetica')
      .fontSize(8)
      .text(descText, MAR + 8, y + 22, { width: INNER - 16, lineBreak: true });

    y += B4H + 8;

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 5 – RESPUESTA DE LA EMPRESA (OPCIONAL)
    // ══════════════════════════════════════════════════════════════
    if (claim.respuesta) {
      doc.font('Helvetica').fontSize(8);
      const respHeight =
        doc.heightOfString(claim.respuesta, { width: INNER - 16 }) + 30;
      const B5H = Math.max(50, respHeight);

      box(doc, MAR, y, INNER, B5H, { stroke: C.border, radius: 3 });
      box(doc, MAR, y, INNER, 16, { fill: C.success, radius: 3 });
      doc.rect(MAR, y + 8, INNER, 8).fill(C.success);

      doc
        .fillColor(C.white)
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .text('RESOLUCIÓN / RESPUESTA DE LA EMPRESA', MAR + 8, y + 4);

      doc
        .fillColor(C.black)
        .font('Helvetica')
        .fontSize(8)
        .text(claim.respuesta, MAR + 8, y + 22, {
          width: INNER - 16,
          lineBreak: true,
        });

      y += B5H + 8;
    }

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 6 – QR (izq) | Firmas (centro y der)
    // ══════════════════════════════════════════════════════════════
    // Forzamos salto de página si estamos muy abajo (ej. y > 650)
    if (y > PW + 80) {
      doc.addPage();
      y = MAR;
    } else {
      y += 14;
    }

    const pieH = 90;
    const TW3 = (INNER - 12) / 3;
    const xP2 = MAR + TW3 + 6;
    const xP3 = xP2 + TW3 + 6;

    box(doc, MAR, y, TW3, pieH, { fill: C.lgray, stroke: C.border, radius: 3 });
    box(doc, xP2, y, TW3, pieH, { fill: C.lgray, stroke: C.border, radius: 3 });
    box(doc, xP3, y, TW3, pieH, { fill: C.lgray, stroke: C.border, radius: 3 });

    // QR
    doc.image(qrBuffer, MAR + 8, y + 10, { width: 68, height: 68 });
    doc
      .fillColor(C.black)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text('Escanea para verificar', MAR + 82, y + 14, { width: TW3 - 90 });
    doc
      .fillColor(C.gray)
      .font('Helvetica')
      .fontSize(6.5)
      .text(
        'Contiene el estado actualizado de tu solicitud.',
        MAR + 82,
        y + 27,
        {
          width: TW3 - 90,
        },
      );

    // Firma Empresa
    hline(doc, xP2 + 16, y + 65, TW3 - 32, C.black, 0.8);
    doc
      .fillColor(C.black)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text(empresa.nombre, xP2 + 8, y + 70, {
        width: TW3 - 16,
        align: 'center',
      });
    doc
      .fillColor(C.gray)
      .font('Helvetica')
      .fontSize(7)
      .text('Responsable de Atención', xP2 + 8, y + 81, {
        width: TW3 - 16,
        align: 'center',
      });

    // Firma Cliente
    hline(doc, xP3 + 16, y + 65, TW3 - 32, C.black, 0.8);
    doc
      .fillColor(C.black)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('Firma del Cliente', xP3 + 8, y + 70, {
        width: TW3 - 16,
        align: 'center',
      });
    doc
      .fillColor(C.gray)
      .font('Helvetica')
      .fontSize(7)
      .text('Conforme con el registro', xP3 + 8, y + 81, {
        width: TW3 - 16,
        align: 'center',
      });

    // Línea final
    y += pieH + 10;
    doc.rect(MAR, y, INNER, 3).fill(C.danger); // Línea final roja

    doc.end();
  });
}
