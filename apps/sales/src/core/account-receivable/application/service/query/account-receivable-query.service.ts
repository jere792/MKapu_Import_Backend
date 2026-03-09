import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import * as nodemailer from 'nodemailer';
import { AccountReceivable } from '../../../domain/entity/account-receivable-domain-entity';
import {
  IAccountReceivableRepository,
  ACCOUNT_RECEIVABLE_REPOSITORY,
  PaginationOptions,
  PaginatedResult,
} from '../../../domain/ports/out/account-receivable-port-out';
import {
  IGetAccountReceivableByIdUseCase,
  IGetAllOpenAccountReceivablesUseCase,
} from '../../../domain/ports/in/account-receivable-port-in';
import { AccountReceivableOrmEntity } from '../../../infrastructure/entity/account-receivable-orm.entity';
import { buildAccountReceivablePdf } from '../../../utils/account-receivable-pdf.util';
import { getWhatsAppStatus, sendWhatsApp } from 'libs/whatsapp.util';

@Injectable()
export class AccountReceivableQueryService
  implements IGetAccountReceivableByIdUseCase, IGetAllOpenAccountReceivablesUseCase
{
  constructor(
    @Inject(ACCOUNT_RECEIVABLE_REPOSITORY)
    private readonly repository: IAccountReceivableRepository,

    @InjectRepository(AccountReceivableOrmEntity)
    private readonly ormRepo: Repository<AccountReceivableOrmEntity>,
  ) {}

  async getById(id: number): Promise<AccountReceivable> {
    const account = await this.repository.findById(id);
    if (!account) throw new NotFoundException(`AccountReceivable #${id} not found`);
    return account;
  }

  async getAllOpen(pagination: PaginationOptions): Promise<PaginatedResult<AccountReceivable>> {
    return this.repository.findAllOpen(pagination);
  }

  // ── Cargar entidad completa con relaciones para PDF ───────────────
  private async loadFull(id: number): Promise<AccountReceivableOrmEntity> {
    const entity = await this.ormRepo.findOne({
      where: { id },
      relations: [
        'salesReceipt',
        'salesReceipt.cliente',
        'salesReceipt.tipoComprobante',
        'salesReceipt.moneda',
        'salesReceipt.details',
        'paymentType',
        'currency',
      ],
    });
    if (!entity) throw new NotFoundException(`Cuenta por cobrar #${id} no encontrada`);
    return entity;
  }

  // ── Exportar PDF como descarga ────────────────────────────────────
  async exportPdf(id: number, res: Response): Promise<void> {
    const entity = await this.loadFull(id);
    const buffer = await buildAccountReceivablePdf(entity);

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename=CuentaPorCobrar_${entity.id}.pdf`,
      'Content-Length':      buffer.length,
    });
    res.end(buffer);
  }

  // ── Enviar PDF por email ──────────────────────────────────────────
  async sendByEmail(id: number): Promise<{ message: string; sentTo: string }> {
    const entity = await this.loadFull(id);

    const email = entity.salesReceipt?.cliente?.email;
    if (!email) throw new NotFoundException('El cliente no tiene email registrado');

    const cl = entity.salesReceipt?.cliente;
    const nombreCliente =
      cl?.razon_social ||
      `${cl?.nombres ?? ''} ${cl?.apellidos ?? ''}`.trim() ||
      'Cliente';

    const moneda = entity.currency?.codigo ?? entity.currencyCode ?? 'S/.';
    const saldo  = Number(entity.pendingBalance ?? 0).toFixed(2);
    const buffer = await buildAccountReceivablePdf(entity);

    const transporter = nodemailer.createTransport({
      host:   process.env.MAIL_HOST ?? 'smtp.gmail.com',
      port:   Number(process.env.MAIL_PORT ?? 587),
      secure: false,
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });

    await transporter.sendMail({
      from:    `"MKapu Import" <${process.env.MAIL_USER}>`,
      to:      email,
      subject: `Cuenta por Cobrar N° ${entity.id} - MKapu Import`,
      html: `
        <p>Estimado/a <strong>${nombreCliente}</strong>,</p>
        <p>Tiene una cuenta por cobrar pendiente:</p>
        <ul>
          <li><strong>N° Cuenta:</strong> ${entity.id}</li>
          <li><strong>Saldo Pendiente:</strong> ${moneda} ${saldo}</li>
          <li><strong>Vencimiento:</strong> ${new Date(entity.dueDate).toLocaleDateString('es-PE')}</li>
          <li><strong>Estado:</strong> ${entity.status}</li>
        </ul>
        <p>Adjuntamos el detalle en PDF.</p>
        <br/><p>Atentamente,<br/><strong>MKapu Import</strong></p>
      `,
      attachments: [{
        filename:    `CuentaPorCobrar_${entity.id}.pdf`,
        content:     buffer,
        contentType: 'application/pdf',
      }],
    });

    return { message: 'Email enviado correctamente', sentTo: email };
  }

  // ── Estado WhatsApp ───────────────────────────────────────────────
  async whatsAppStatus(): Promise<{ ready: boolean; qr: string | null }> {
    return getWhatsAppStatus();
  }

  // ── Enviar PDF por WhatsApp ───────────────────────────────────────
  async sendByWhatsApp(id: number): Promise<{ message: string; sentTo: string }> {
    const entity = await this.loadFull(id); // mismo loadFull que email

    const telefono = entity.salesReceipt?.cliente?.telefono;
    if (!telefono) throw new NotFoundException('El cliente no tiene teléfono registrado');

    const cl = entity.salesReceipt?.cliente;
    const nombreCliente =
      cl?.razon_social ||
      `${cl?.nombres ?? ''} ${cl?.apellidos ?? ''}`.trim() ||
      'Cliente';

    const moneda = entity.currency?.codigo ?? entity.currencyCode ?? 'PEN';
    const saldo  = Number(entity.pendingBalance ?? 0).toFixed(2);
    const venc   = new Date(entity.dueDate).toLocaleDateString('es-PE');
    const buffer = await buildAccountReceivablePdf(entity);

    const mensaje = [
      `📄 *Cuenta por Cobrar N° ${entity.id} - MKapu Import*`,
      ``,
      `Estimado/a *${nombreCliente}*,`,
      `Le recordamos que tiene una cuenta pendiente de pago:`,
      ``,
      `💰 *Saldo pendiente:* ${moneda} ${saldo}`,
      `📅 *Fecha de vencimiento:* ${venc}`,
      `📋 *Estado:* ${entity.status}`,
      ``,
      `Adjuntamos el detalle en PDF. Ante cualquier consulta, contáctenos. ✅`,
    ].join('\n');

    await sendWhatsApp(
      telefono,
      mensaje,
      buffer,
      `CuentaPorCobrar_${entity.id}.pdf`,
    );

    return { message: 'WhatsApp enviado correctamente', sentTo: telefono };
  }
}