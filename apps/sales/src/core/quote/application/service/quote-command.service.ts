import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IQuoteCommandPort } from '../../domain/ports/in/quote-ports-in';
import { IQuoteRepositoryPort } from '../../domain/ports/out/quote-ports-out';
import { CustomerRepository } from '../../../customer/infrastructure/adapters/out/repository/customer.repository'; // Importa el puerto de clientes
import { CreateQuoteDto } from '../dto/in/create-quote.dto';
import { QuoteResponseDto } from '../dto/out/quote-response.dto';
import { QuoteMapper } from '../mapper/quote.mapper';
import { Quote } from '../../domain/entity/quote-domain-entity';

@Injectable()
export class QuoteCommandService implements IQuoteCommandPort {
  constructor(
    @Inject('IQuoteRepositoryPort')
    private readonly repository: IQuoteRepositoryPort,
    
    @Inject('ICustomerRepositoryPort') // Inyectamos el repo de clientes
    private readonly customerRepository: CustomerRepository,
  ) {}

  async create(dto: CreateQuoteDto): Promise<QuoteResponseDto> {
    // 1. Buscar cliente por documento (DNI/RUC)
    const customer = await this.customerRepository.findByDocument(dto.documento_cliente);
    
    if (!customer) {
      throw new NotFoundException(`Cliente con documento ${dto.documento_cliente} no encontrado`);
    }

    // 2. Crear instancia de dominio usando el UUID del cliente encontrado
    const domain = new Quote(
      null, 
      customer.id_cliente, // Aquí ya viaja el UUID: 'e123f048...'
      dto.subtotal,
      dto.igv,
      dto.total,
      'PENDIENTE',
      new Date(),
      dto.fec_venc
    );

    const savedQuote = await this.repository.save(domain);
    return QuoteMapper.toResponseDto(savedQuote);
  }

  async approve(id: number): Promise<QuoteResponseDto> {
    const domain = await this.repository.findById(id);
    if (!domain) throw new NotFoundException(`Cotización ${id} no encontrada`);

    domain.aprobar();

    const updatedQuote = await this.repository.update(domain);
    return QuoteMapper.toResponseDto(updatedQuote);
  }
}