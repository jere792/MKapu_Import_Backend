import { Inject, Injectable } from "@nestjs/common";
import { VOUCHER_REPOSITORY_PORT, VoucherRepositoryPort } from "../../domain/ports/out/voucher-repository.port";
import { GetVoucherFilterDto } from "../dto/in/get-voucher-filter.dto";
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';
import { HeadquarterVoucherProxy } from "../../infrastructure/adapters/out/tcp/headquarter-voucher.proxy";

@Injectable()
export class VoucherService {

    constructor(
        @Inject(VOUCHER_REPOSITORY_PORT)
        private readonly repository: VoucherRepositoryPort,
        private readonly administrationAdapter: HeadquarterVoucherProxy
    ) { }

    async findAll(filters: GetVoucherFilterDto) {
        const { data, total, summary } = await this.repository.findAll(filters);

        const sedeIds = [...new Set(data.map(v => v.id_sede))];
        const sedeMap = await this.administrationAdapter.getHeadquartersName(sedeIds);

        const enrichedData = data.map(v => ({
            ...v,
            nombre_sede: sedeMap[v.id_sede] ?? `Sede ${v.id_sede}`,
        }));

        return {
            data: enrichedData,
            total,
            page: filters.page,
            limit: filters.limit,
            summary,
        };
    }

    async exportExcel(filters: GetVoucherFilterDto): Promise<Buffer> {
        const data = await this.repository.findAllWithoutPagination(filters);

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Comprobantes');

        sheet.columns = [
            { header: 'N° Comprobante', key: 'numero', width: 18 },
            { header: 'Tipo', key: 'tipo', width: 18 },
            { header: 'Serie', key: 'serie', width: 10 },
            { header: 'Fecha Emisión', key: 'fecha_emision', width: 18 },
            { header: 'Vencimiento', key: 'fecha_venc', width: 18 },
            { header: 'Cliente', key: 'cliente', width: 30 },
            { header: 'RUC / DNI', key: 'ruc_dni', width: 15 },
            { header: 'Moneda', key: 'moneda', width: 10 },
            { header: 'Base Imponible', key: 'base_imponible', width: 15 },
            { header: 'IGV', key: 'igv', width: 10 },
            { header: 'Total', key: 'total', width: 12 },
            { header: 'Estado', key: 'estado', width: 12 },
        ];

        sheet.getRow(1).eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D6A4F' } };
            cell.alignment = { horizontal: 'center' };
        });

        data.forEach(v => {
            sheet.addRow({
                numero: `${v.serie}-${String(v.numero).padStart(8, '0')}`,
                tipo: v.tipo,
                serie: v.serie,
                fecha_emision: v.fecha_emision,
                fecha_venc: v.fecha_vencimiento,
                cliente: v.cliente,
                ruc_dni: v.ruc_dni,
                moneda: v.moneda,
                base_imponible: Number(v.base_imponible),
                igv: Number(v.igv),
                total: Number(v.total),
                estado: v.estado,
            });
        });

        const arrayBuffer = await workbook.xlsx.writeBuffer();

        return Buffer.from(arrayBuffer) as Buffer;
    }

    async exportPdf(filters: GetVoucherFilterDto): Promise<Buffer> {
        const data = await this.repository.findAllWithoutPagination(filters);

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'portrait' });
            const buffers: Buffer[] = [];

            doc.on('data', chunk => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // ── Constantes ────────────────────────────────────────
            const ORANGE = '#F5A623';
            const BLACK = '#1A1A1A';
            const WHITE = '#FFFFFF';
            const GRAY_BG = '#F5F5F5';
            const GRAY_LINE = '#DDDDDD';
            const PAGE_W = 595.28;
            const MARGIN = 30;
            const COL_W = PAGE_W - MARGIN * 2;

            const empresa = {
                nombre: process.env.COMPANY_NAME ?? 'MKAPU IMPORT S.A.C.',
                ruc: process.env.COMPANY_RUC ?? '20613016946',
                direccion: process.env.COMPANY_ADDRESS ?? 'AV. LAS FLORES DE LA PRIMAVERA NRO. 1838, SJL',
                telefono: process.env.EMPRESA_TELEFONO ?? '903019610',
                email: process.env.COMPANY_EMAIL ?? 'mkapu@gmail.com',
                logo: process.env.EMPRESA_LOGO_PATH ?? null,
            };

            // ── ENCABEZADO ────────────────────────────────────────
            // Logo naranja (izquierda)
            doc.rect(MARGIN, 30, 80, 60).fill(ORANGE);
            if (empresa.logo) {
                try {
                    doc.image(empresa.logo, MARGIN + 5, 35, { width: 70, height: 50 });
                } catch {
                    doc.fillColor(WHITE).fontSize(14).font('Helvetica-Bold')
                        .text('mkapu', MARGIN + 10, 52).fontSize(8).text('import', MARGIN + 22, 68);
                }
            } else {
                doc.fillColor(WHITE).fontSize(14).font('Helvetica-Bold')
                    .text('mkapu', MARGIN + 10, 52).fontSize(8).text('import', MARGIN + 22, 68);
            }

            // Título naranja (derecha)
            doc.rect(PAGE_W - MARGIN - 200, 30, 200, 28).fill(ORANGE);
            doc.fillColor(BLACK).fontSize(12).font('Helvetica-Bold')
                .text('REPORTE DE COMPROBANTES', PAGE_W - MARGIN - 200, 38, { width: 200, align: 'center' });

            // RUC
            doc.rect(PAGE_W - MARGIN - 200, 62, 200, 14).fill(WHITE).stroke(ORANGE);
            doc.fillColor(BLACK).fontSize(8).font('Helvetica')
                .text(`RUC ${empresa.ruc}`, PAGE_W - MARGIN - 200, 66, { width: 200, align: 'center' });

            // Rango de fechas como subtítulo
            const rangoTexto = filters.fecha_inicio && filters.fecha_fin
                ? `${filters.fecha_inicio}  al  ${filters.fecha_fin}`
                : 'Todos los registros';
            doc.rect(PAGE_W - MARGIN - 200, 80, 200, 14).fill(WHITE).stroke(ORANGE);
            doc.fillColor(BLACK).fontSize(8).font('Helvetica')
                .text(rangoTexto, PAGE_W - MARGIN - 200, 84, { width: 200, align: 'center' });

            // ── BLOQUE EMPRESA ────────────────────────────────────
            let yPos = 102;
            doc.rect(MARGIN, yPos, COL_W, 45).fill(WHITE).stroke(GRAY_LINE);
            doc.fillColor(BLACK).fontSize(9).font('Helvetica-Bold')
                .text(empresa.nombre, MARGIN + 8, yPos + 6);
            doc.fontSize(7).font('Helvetica')
                .text(`DIRECCIÓN FISCAL: ${empresa.direccion}`, MARGIN + 8, yPos + 18)
                .text(`TELÉFONO: ${empresa.telefono}    EMAIL: ${empresa.email}`, MARGIN + 8, yPos + 29);

            // ── FILTROS APLICADOS ─────────────────────────────────
            yPos = 155;
            doc.rect(MARGIN, yPos, COL_W, 18).fill(BLACK);
            doc.fillColor(ORANGE).fontSize(7).font('Helvetica-Bold')
                .text('FILTROS:', MARGIN + 8, yPos + 5);

            const filtrosTexto = [
                filters.cod_tipo ? `Tipo: ${filters.cod_tipo === '01' ? 'Factura' : filters.cod_tipo === '03' ? 'Boleta' : 'Nota Crédito'}` : null,
                filters.moneda ? `Moneda: ${filters.moneda}` : null,
                filters.estado ? `Estado: ${filters.estado}` : null,
                filters.id_sede ? `Sede: ${filters.id_sede}` : null,
                filters.search ? `Búsqueda: ${filters.search}` : null,
            ].filter(Boolean).join('   |   ');

            doc.fillColor(WHITE).fontSize(7).font('Helvetica')
                .text(filtrosTexto || 'Sin filtros adicionales', MARGIN + 55, yPos + 5);

            doc.fillColor(GRAY_LINE).fontSize(6)
                .text(`Generado: ${new Date().toLocaleString('es-PE')}`, MARGIN, yPos + 5, { width: COL_W - 8, align: 'right' });

            // ── CABECERA TABLA ────────────────────────────────────
            yPos = 181;
            const headers = ['N°', 'N° Comprobante', 'Tipo', 'F. Emisión', 'Cliente', 'Moneda', 'Base Imp.', 'IGV', 'Total', 'Estado'];
            const colWidths = [20, 95, 70, 60, 115, 35, 55, 50, 55, 80];

            doc.rect(MARGIN, yPos, COL_W, 16).fill(BLACK);
            doc.fillColor(ORANGE).fontSize(6.5).font('Helvetica-Bold');

            let xPos = MARGIN;
            headers.forEach((h, i) => {
                doc.text(h, xPos + 2, yPos + 5, { width: colWidths[i] - 3, align: i >= 6 ? 'right' : 'left' });
                xPos += colWidths[i];
            });

            // ── FILAS TABLA ───────────────────────────────────────
            yPos += 16;
            doc.font('Helvetica').fontSize(6);

            const addPageHeader = () => {
                doc.addPage({ size: 'A4', layout: 'portrait' });
                yPos = MARGIN;
                doc.rect(MARGIN, yPos, COL_W, 16).fill(BLACK);
                doc.fillColor(ORANGE).fontSize(6.5).font('Helvetica-Bold');
                xPos = MARGIN;
                headers.forEach((h, i) => {
                    doc.text(h, xPos + 2, yPos + 5, { width: colWidths[i] - 3, align: i >= 6 ? 'right' : 'left' });
                    xPos += colWidths[i];
                });
                yPos += 16;
                doc.font('Helvetica').fontSize(6);
            };

            data.forEach((v, idx) => {
                if (yPos > 740) addPageHeader();

                const rowColor = idx % 2 === 0 ? WHITE : GRAY_BG;
                doc.rect(MARGIN, yPos, COL_W, 14).fill(rowColor);
                doc.rect(MARGIN, yPos + 13, COL_W, 0.5).fill(GRAY_LINE);

                // Color estado
                const estadoColor = v.estado === 'EMITIDO' || v.estado === 'EMITIDA' ? '#2D6A4F'
                    : v.estado === 'ANULADO' ? '#CC0000'
                        : v.estado === 'PENDIENTE' ? '#CC6600' : BLACK;

                const cols = [
                    String(idx + 1),
                    `${v.serie}-${String(v.numero).padStart(8, '0')}`,
                    v.tipo,
                    new Date(v.fecha_emision).toLocaleDateString('es-PE'),
                    v.cliente?.length > 22 ? v.cliente.substring(0, 22) + '...' : v.cliente,
                    v.moneda,
                    `S/ ${Number(v.base_imponible).toFixed(2)}`,
                    `S/ ${Number(v.igv).toFixed(2)}`,
                    `S/ ${Number(v.total).toFixed(2)}`,
                    v.estado,
                ];

                xPos = MARGIN;
                cols.forEach((col, i) => {
                    if (i === 9) {
                        // Badge estado
                        doc.rect(xPos + 2, yPos + 3, colWidths[i] - 6, 9).fill(estadoColor);
                        doc.fillColor(WHITE).text(String(col), xPos + 2, yPos + 4, { width: colWidths[i] - 6, align: 'center' });
                    } else {
                        doc.fillColor(BLACK).text(String(col), xPos + 2, yPos + 4, {
                            width: colWidths[i] - 3,
                            align: i >= 6 ? 'right' : 'left',
                        });
                    }
                    xPos += colWidths[i];
                });

                yPos += 14;
            });

            // ── TOTALES ───────────────────────────────────────────
            yPos += 8;
            if (yPos > 700) { doc.addPage({ size: 'A4', layout: 'portrait' }); yPos = MARGIN; }

            const totalBase = data.reduce((s, v) => s + Number(v.base_imponible), 0);
            const totalIgv = data.reduce((s, v) => s + Number(v.igv), 0);
            const totalGeneral = data.reduce((s, v) => s + Number(v.total), 0);
            const totalBoletas = data.filter(v => v.cod_tipo === '03').length;
            const totalFacturas = data.filter(v => v.cod_tipo === '01').length;
            const totalNC = data.filter(v => v.cod_tipo === '07').length;

            // Fila subtotales
            doc.rect(MARGIN, yPos, COL_W, 14).fill(GRAY_BG).stroke(GRAY_LINE);
            doc.fillColor(BLACK).fontSize(7).font('Helvetica')
                .text(`Boletas: ${totalBoletas}   Facturas: ${totalFacturas}   Notas de Crédito: ${totalNC}   Total registros: ${data.length}`,
                    MARGIN + 8, yPos + 4);

            // Base imponible
            yPos += 14;
            doc.rect(MARGIN, yPos, COL_W, 13).fill(WHITE).stroke(GRAY_LINE);
            doc.fillColor(BLACK).fontSize(7).font('Helvetica')
                .text('Base imponible:', MARGIN + 8, yPos + 3)
                .text(`S/ ${totalBase.toFixed(2)}`, MARGIN, yPos + 3, { width: COL_W - 8, align: 'right' });

            // IGV
            yPos += 13;
            doc.rect(MARGIN, yPos, COL_W, 13).fill(WHITE).stroke(GRAY_LINE);
            doc.fillColor(BLACK).fontSize(7).font('Helvetica')
                .text('IGV (18%):', MARGIN + 8, yPos + 3)
                .text(`S/ ${totalIgv.toFixed(2)}`, MARGIN, yPos + 3, { width: COL_W - 8, align: 'right' });

            // TOTAL GENERAL — fila naranja
            yPos += 13;
            doc.rect(MARGIN, yPos, COL_W, 18).fill(ORANGE);
            doc.fillColor(BLACK).fontSize(9).font('Helvetica-Bold')
                .text('TOTAL GENERAL:', MARGIN + 8, yPos + 5)
                .text(`S/ ${totalGeneral.toFixed(2)}`, MARGIN, yPos + 5, { width: COL_W - 8, align: 'right' });

            // ── LÍNEA NARANJA PIE ─────────────────────────────────
            doc.rect(0, doc.page.height - 8, PAGE_W + 60, 8).fill(ORANGE);

            doc.end();
        });
    }
}