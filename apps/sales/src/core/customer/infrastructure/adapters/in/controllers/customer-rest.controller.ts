/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslnat/no-unsafe-return */
import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Inject,
  Get,
  Query,
} from '@nestjs/common';
import {
  ICustomerCommandPort,
  ICustomerQueryPort,
} from '../../../../domain/ports/in/cunstomer-port-in';
import {
  RegisterCustomerDto,
  UpdateCustomerDto,
  ChangeCustomerStatusDto,
  ListCustomerFilterDto,
} from '../../../../application/dto/in';
import {
  CustomerResponseDto,
  CustomerListResponse,
  CustomerDeletedResponseDto,
  DocumentTypeResponseDto,
} from '../../../../application/dto/out';

@Controller('customers')
export class CustomerRestController {
  constructor(
    @Inject('ICustomerQueryPort')
    private readonly customerQueryService: ICustomerQueryPort,
    @Inject('ICustomerCommandPort')
    private readonly customerCommandService: ICustomerCommandPort,
  ) {}

  @Get('document-types')
  @HttpCode(HttpStatus.OK)
  async getDocumentTypes(): Promise<DocumentTypeResponseDto[]> {
    return this.customerQueryService.getDocumentTypes();
  }

  @Get('document/:documentValue')
  @HttpCode(HttpStatus.OK)
  async getCustomerByDocument(
    @Param('documentValue') documentValue: string,
  ): Promise<CustomerResponseDto | null> {
    return this.customerQueryService.getCustomerByDocument(documentValue);
  }

  @Get('suggest')
  @HttpCode(HttpStatus.OK)
  async suggest(
    @Query('q') q?: string,
    @Query('limit') limit = 5,
  ): Promise<CustomerResponseDto[]> {
    const filters: ListCustomerFilterDto = {
      page: 1,
      limit: Number(limit),
      search: q ?? undefined,
    };
    const list: CustomerListResponse =
      await this.customerQueryService.listCustomers(filters);
    const items = (list as any).customers ?? [];
    return Array.isArray(items) ? items.slice(0, Number(limit)) : [];
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerCustomer(
    @Body() registerDto: RegisterCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customerCommandService.registerCustomer(registerDto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateCustomer(
    @Param('id') id: string,
    @Body() updateDto: Omit<UpdateCustomerDto, 'customerId'>,
  ): Promise<CustomerResponseDto> {
    return this.customerCommandService.updateCustomer({ ...updateDto, customerId: id });
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  async changeCustomerStatus(
    @Param('id') id: string,
    @Body() statusDto: { status: boolean },
  ): Promise<CustomerResponseDto> {
    return this.customerCommandService.changeCustomerStatus({
      customerId: id,
      status: statusDto.status,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteCustomer(
    @Param('id') id: string,
  ): Promise<CustomerDeletedResponseDto> {
    return this.customerCommandService.deleteCustomer(id);
  }

  @Get()
  async listCustomers(
    @Query('page')   page?: string,
    @Query('limit')  limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('tipo')   tipo?: string,
  ): Promise<CustomerListResponse> {

    let estadoBoolean: boolean | undefined = undefined;
    if (status === 'true')  estadoBoolean = true;
    if (status === 'false') estadoBoolean = false;

    let documentTypeId: number | undefined = undefined;
    if (tipo === 'juridica') documentTypeId = 4;
    if (tipo === 'natural')  documentTypeId = 2;

    const filters: ListCustomerFilterDto = {
      page:           page  ? Number(page)  : 1,
      limit:          limit ? Number(limit) : 10,
      search:         search || undefined,
      status:         estadoBoolean,
      documentTypeId: documentTypeId,
    };

    return this.customerQueryService.listCustomers(filters);
  }

  @Get(':id')
  async getCustomer(
    @Param('id') id: string,
  ): Promise<CustomerResponseDto | null> {
    return this.customerQueryService.getCustomerById(id);
  }
}