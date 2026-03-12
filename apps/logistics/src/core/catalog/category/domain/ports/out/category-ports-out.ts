  import { Category } from '../../entity/category-domain-entity';
  import { ListCategoryFilterDto } from '../../../application/dto/in/list-category-filter-dto'; 

  export interface CategoryFindAllResult {
    categories: Category[];
    total: number;
    page: number;
    pageSize: number;
  }

  export interface ICategoryRepositoryPort {
    save(category: Category): Promise<Category>;
    update(category: Category): Promise<Category>;
    delete(id: number): Promise<void>;
    findById(id: number): Promise<Category | null>;
    findByName(nombre: string): Promise<Category | null>;
    findAll(filters?: ListCategoryFilterDto): Promise<CategoryFindAllResult>;
    existsByName(nombre: string): Promise<boolean>;
    existsByNameExcludingId(nombre: string, id: number): Promise<boolean>;
  }