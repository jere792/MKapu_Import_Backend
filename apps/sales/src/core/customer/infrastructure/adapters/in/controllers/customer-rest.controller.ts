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

  // ===============================
  // FIX: RUTAS ESPECÍFICAS PRIMERO
  // ===============================

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

  // ===============================
  // COMMANDS
  // ===============================

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

  // ===============================
  // QUERIES
  // ===============================

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