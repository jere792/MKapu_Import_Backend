/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
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
    const fullUpdateDto: UpdateCustomerDto = {
      ...updateDto,
      customerId: id,
    };
    return this.customerCommandService.updateCustomer(fullUpdateDto);
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  async changeCustomerStatus(
    @Param('id') id: string,
    @Body() statusDto: { status: boolean },
  ): Promise<CustomerResponseDto> {
    const changeStatusDto: ChangeCustomerStatusDto = {
      customerId: id,
      status: statusDto.status,
    };
    return this.customerCommandService.changeCustomerStatus(changeStatusDto);
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
    @Query() filters: ListCustomerFilterDto,
  ): Promise<CustomerListResponse> {
    return this.customerQueryService.listCustomers(filters);
  }

  @Get(':id')
  async getCustomer(
    @Param('id') id: string,
  ): Promise<CustomerResponseDto | null> {
    return this.customerQueryService.getCustomerById(id);
  }
}
