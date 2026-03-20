/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { AccountReceivableOrmEntity } from '../infrastructure/entity/account-receivable-orm.entity';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');

function calcHeight(
  entity: AccountReceivableOrmEntity,
  empresaData?: any,
): number {
  const detalles = entity.salesReceipt?.details ?? [];
  let h = 10;

  // Encabezado empresa (Nombre + RUC + Dirección + Teléfono + divider)
  h += 12 + 10 + 9 + 9 + 8;

  // Identificación (titulo + nro + emision + venc + estado + tipopago + divider)
  h += 12 + 12 + 9 + 9 + 9 + 9 + 8;

  // Cliente (label + nombre + doc? + dir?)
  h += 10 + 9;
  const cl = entity.salesReceipt?.cliente;
  if (cl?.id_tipo_documento && cl?.valor_doc) h += 9;
  if (cl?.direccion) h += 9;
  h += 8;

  // Tabla cabecera + divider
  h += 9 + 8;

  // Filas detalle
  for (const item of detalles) {
    const desc = item.descripcion ?? (item as any).description ?? '';
    h += Math.max(1, Math.ceil(desc.length / 18)) * 9;
  }
  h += 8; // divider cierre tabla

  // Totales: subtotal + igv + total + pagado(opcional) + saldo + divider
  h += 10 + 10 + 10 + 12 + 8;
  if (Number(entity.paidAmount ?? 0) > 0) h += 10;

  // Observación
  if (entity.observation) h += 9 + 8;

  // Pie (3 líneas)
  h += 2 + 9 + 9 + 10;
  h += 20; // margin bottom extra por seguridad
  return h;
}

export function buildAccountReceivableThermalPdf(
  entity: AccountReceivableOrmEntity,
  empresaData?: any, // <-- Nuevo parámetro inyectado
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const PAGE_W = 226;
    const MARGIN = 10;
    const W = PAGE_W - MARGIN * 2;

    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: [PAGE_W, calcHeight(entity, empresaData)],
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

    const divider = (double = false) => {
      const lineY = y + 3;
      doc
        .save()
        .moveTo(MARGIN, lineY)
        .lineTo(MARGIN + W, lineY)
        .dash(double ? 3 : 1, { space: double ? 1 : 2 })
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
      y += bold ? 12 : 10;
    };

    // ── Helpers ─────────────────────────────────────────────────────────────
    const cl = entity.salesReceipt?.cliente;
    const receipt = entity.salesReceipt;
    const moneda = entity.currency?.codigo ?? entity.currencyCode ?? 'PEN';

    const nombreCliente =
      cl?.razon_social ||
      `${cl?.nombres ?? ''} ${cl?.apellidos ?? ''}`.trim() ||
      'Cliente';

    // Rellenamos los datos de la empresa desde el parámetro inyectado
    const empresa = {
      nombre: empresaData?.razon_social ?? 'MKAPU IMPORT S.A.C.',
      ruc: empresaData?.ruc ?? '20613016946',
      direccion:
        empresaData?.direccion ?? 'AV. LAS FLORES DE LA PRIMAVERA 1836',
      telefono: empresaData?.telefono ?? '903019610',
      web: empresaData?.website ?? 'www.mkapu.com',
    };

    // ── Encabezado empresa ──────────────────────────────────────────────────
    line(empresa.nombre, { bold: true, size: 9, align: 'center', gap: 12 });
    line(`RUC: ${empresa.ruc}`, { size: 7, align: 'center', gap: 10 });
    line(empresa.direccion, { size: 6, align: 'center', gap: 9 });
    line(`Cel: ${empresa.telefono}`, { size: 6, align: 'center', gap: 9 });

    divider();

    // ── Identificación ──────────────────────────────────────────────────────
    line('CUENTA POR COBRAR', {
      bold: true,
      size: 8,
      align: 'center',
      gap: 12,
    });
    line(`N° ${String(entity.id).padStart(6, '0')}`, {
      bold: true,
      size: 8,
      align: 'center',
      gap: 12,
    });

    const fecEmision = new Date(entity.issueDate).toLocaleDateString('es-PE');
    const fecVenc = new Date(entity.dueDate).toLocaleDateString('es-PE');

    line(`Emisión:     ${fecEmision}`, { size: 6, align: 'center', gap: 9 });
    line(`Vencimiento: ${fecVenc}`, { size: 6, align: 'center', gap: 9 });
    line(`Estado: ${entity.status}`, { size: 6, align: 'center', gap: 9 });
    line(`Tipo pago: ${entity.paymentType?.descripcion ?? '—'}`, {
      size: 6,
      align: 'center',
      gap: 9,
    });

    divider();

    // ── Cliente ─────────────────────────────────────────────────────────────
    line('CLIENTE', { bold: true, size: 7, gap: 10 });
    line(nombreCliente, { size: 7, gap: 9 });

    if (cl?.id_tipo_documento && cl?.valor_doc)
      line(`${cl.id_tipo_documento}: ${cl.valor_doc}`, { size: 6, gap: 9 });
    if (cl?.direccion) line(cl.direccion, { size: 6, gap: 9 });

    divider();

    // ── Tabla cabecera ──────────────────────────────────────────────────────
    doc.fontSize(6).font('Helvetica-Bold');
    doc.text('CANT', MARGIN, y, { width: 20 });
    doc.text('COD', MARGIN + 20, y, { width: 36 });
    doc.text('DESCRIPCIÓN', MARGIN + 56, y, { width: 82 });
    doc.text('P.U.', MARGIN + 138, y, { width: 30, align: 'right' });
    doc.text('IMPORTE', MARGIN + 168, y, { width: 38, align: 'right' });
    y += 9;

    divider(true);

    // ── Tabla filas ─────────────────────────────────────────────────────────
    const detalles: any[] = receipt?.details ?? [];

    for (const item of detalles) {
      const desc = item.descripcion ?? item.description ?? '';
      const cod = item.cod_prod ?? item.codProd ?? '';
      const cant = Number(item.cantidad ?? item.quantity ?? 1);
      const precio = Number(item.precio ?? item.price ?? 0);
      const pu = `${moneda} ${precio.toFixed(2)}`;
      const importe = `${moneda} ${(cant * precio).toFixed(2)}`;
      const rowH = Math.max(1, Math.ceil(desc.length / 18)) * 9;

      doc.fontSize(6).font('Helvetica');
      doc.text(String(cant), MARGIN, y, { width: 20 });
      doc.text(cod, MARGIN + 20, y, { width: 36 });
      doc.text(desc, MARGIN + 56, y, { width: 82 });
      doc.text(pu, MARGIN + 138, y, { width: 30, align: 'right' });
      doc.text(importe, MARGIN + 168, y, { width: 38, align: 'right' });
      y += rowH;
    }

    divider(true);

    // ── Totales ─────────────────────────────────────────────────────────────
    const subtotal = Number(receipt?.subtotal ?? 0);
    const igv = Number(receipt?.igv ?? 0);
    const total = Number(entity.totalAmount ?? 0);
    const pagado = Number(entity.paidAmount ?? 0);
    const pendiente = Number(entity.pendingBalance ?? 0);

    twoCol('Subtotal:', `${moneda} ${subtotal.toFixed(2)}`);
    twoCol('IGV (18%):', `${moneda} ${igv.toFixed(2)}`);
    twoCol('Total:', `${moneda} ${total.toFixed(2)}`);
    if (pagado > 0) twoCol('A cuenta:', `${moneda} ${pagado.toFixed(2)}`);
    twoCol('SALDO PENDIENTE:', `${moneda} ${pendiente.toFixed(2)}`, true);

    divider();

    // ── Observación ─────────────────────────────────────────────────────────
    if (entity.observation) {
      line(`Obs: ${entity.observation}`, { size: 6, gap: 9 });
      divider();
    }

    // ── Pie ─────────────────────────────────────────────────────────────────
    y += 2;
    line('Consulte su comprobante en:', { size: 6, align: 'center', gap: 9 });
    line(empresa.web, { size: 6, align: 'center', gap: 9 });
    line('** GRACIAS POR SU PREFERENCIA **', {
      bold: true,
      size: 7,
      align: 'center',
      gap: 10,
    });

    doc.end();
  });
}
