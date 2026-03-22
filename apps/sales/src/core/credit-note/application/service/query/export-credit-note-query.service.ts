import { Injectable, Inject } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import {
  IExportCreditNoteQueryPort,
  IListCreditNoteQueryPort,
} from '../../../domain/ports/in/credit-note-query.port';
import { ListCreditNoteFilterDto } from '../../dto/in/list-credit-note-filter.dto';

@Injectable()
export class ExportCreditNoteQueryService implements IExportCreditNoteQueryPort {
  constructor(
    @Inject('IListCreditNoteQueryPort')
    private readonly listCreditNotes: IListCreditNoteQueryPort,
  ) {}

  async execute(filters: ListCreditNoteFilterDto): Promise<Buffer> {
    const exportFilters = { ...filters, page: 1, limit: 10000 };

    const response = await this.listCreditNotes.execute(exportFilters);
    const data = response.data;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MKapu Import';
    const worksheet = workbook.addWorksheet('Notas de Crédito');

    worksheet.columns = [
      { header: 'Correlativo', key: 'correlative', width: 18 },
      { header: 'Cliente', key: 'customerName', width: 45 },
      { header: 'Documento', key: 'customerDocument', width: 18 },
      { header: 'Moneda', key: 'currency', width: 12 },
      { header: 'Total', key: 'totalAmount', width: 15 },
      { header: 'Fecha Emisión', key: 'emissionDate', width: 20 },
      { header: 'Estado', key: 'status', width: 15 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E78' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    data.forEach((note) => {
      worksheet.addRow({
        correlative: note.correlative,
        customerName: note.customerName,
        customerDocument: note.customerDocument,
        currency: note.currency,
        totalAmount: Number(note.totalAmount),
        emissionDate: new Date(note.emissionDate).toLocaleDateString('es-PE'),
        status: note.status,
      });
    });

    worksheet.getColumn('totalAmount').numFmt = '"S/ "#,##0.00';

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  }
}
