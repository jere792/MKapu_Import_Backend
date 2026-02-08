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
  // DOCUMENT TYPES
  // ===============================

  @Get('document-types')
  @HttpCode(HttpStatus.OK)
  async getDocumentTypes(): Promise<DocumentTypeResponseDto[]> {
    return this.customerQueryService.getDocumentTypes();
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
    @Body() updateDto: Omit<UpdateCustomerDto, 'customerId'>, // ✅ customerId en inglés
  ): Promise<CustomerResponseDto> {
    const fullUpdateDto: UpdateCustomerDto = {
      ...updateDto,
      customerId: id, // ✅ customerId en inglés
    };
    return this.customerCommandService.updateCustomer(fullUpdateDto);
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  async changeCustomerStatus(
    @Param('id') id: string,
    @Body() statusDto: { status: boolean }, // ✅ status en inglés
  ): Promise<CustomerResponseDto> {
    const changeStatusDto: ChangeCustomerStatusDto = {
      customerId: id, // ✅ customerId en inglés
      status: statusDto.status, // ✅ status en inglés
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

  @Get('document/:documentValue') // ✅ documentValue en inglés
  async getCustomerByDocument(
    @Param('documentValue') documentValue: string, // ✅ documentValue en inglés
  ): Promise<CustomerResponseDto | null> {
    return this.customerQueryService.getCustomerByDocument(documentValue);
  }
}
