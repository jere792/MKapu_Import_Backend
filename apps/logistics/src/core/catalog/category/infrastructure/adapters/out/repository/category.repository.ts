import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CategoryFindAllResult, ICategoryRepositoryPort } from '../../../../domain/ports/out/category-ports-out';
import { Category } from '../../../../domain/entity/category-domain-entity';
import { CategoryOrmEntity } from '../../../entity/category-orm.entity';
import { CategoryMapper } from '../../../../application/mapper/category.mapper';
import { ListCategoryFilterDto } from '../../../../application/dto/in';

@Injectable()
export class CategoryRepository implements ICategoryRepositoryPort {
  constructor(
    @InjectRepository(CategoryOrmEntity)
    private readonly categoryOrmRepository: Repository<CategoryOrmEntity>,
  ) {}

  async save(category: Category): Promise<Category> {
    const categoryOrm = CategoryMapper.toOrmEntity(category);
    const saved = await this.categoryOrmRepository.save(categoryOrm);
    return CategoryMapper.toDomainEntity(saved);
  }

  async update(category: Category): Promise<Category> {
    const categoryOrm = CategoryMapper.toOrmEntity(category);
    await this.categoryOrmRepository.update(
      category.id_categoria!,
      categoryOrm,
    );
    const updated = await this.categoryOrmRepository.findOne({
      where: { id_categoria: category.id_categoria },
    });
    return CategoryMapper.toDomainEntity(updated!);
  }

  async delete(id: number): Promise<void> {
    await this.categoryOrmRepository.delete(id);
  }

  async findById(id: number): Promise<Category | null> {
    const categoryOrm = await this.categoryOrmRepository.findOne({
      where: { id_categoria: id },
    });
    return categoryOrm ? CategoryMapper.toDomainEntity(categoryOrm) : null;
  }

  async findByName(nombre: string): Promise<Category | null> {
    const categoryOrm = await this.categoryOrmRepository.findOne({
      where: { nombre },
    });
    return categoryOrm ? CategoryMapper.toDomainEntity(categoryOrm) : null;
  }

  async findAll(filters?: ListCategoryFilterDto): Promise<CategoryFindAllResult> {
    const queryBuilder = this.categoryOrmRepository.createQueryBuilder('categoria');

    if (filters?.activo !== undefined) {
      queryBuilder.andWhere('categoria.activo = :activo', { activo: filters.activo });
    }
    if (filters?.search) {
      queryBuilder.andWhere(
        '(categoria.nombre LIKE :search OR categoria.descripcion LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Agregamos paginación
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 10;
    queryBuilder.skip((page - 1) * pageSize).take(pageSize);

    const [categoriesOrm, total] = await queryBuilder.getManyAndCount();
    const categories = categoriesOrm.map((catOrm) => CategoryMapper.toDomainEntity(catOrm));
    return { categories, total, page, pageSize };
  }

  async existsByName(nombre: string): Promise<boolean> {
    const count = await this.categoryOrmRepository.count({ where: { nombre } });
    return count > 0;
  }

  async existsByNameExcludingId(nombre: string, id: number): Promise<boolean> {
  const count = await this.categoryOrmRepository.count({
    where: { nombre, id_categoria: Not(id) },
  });
  return count > 0;
}
}