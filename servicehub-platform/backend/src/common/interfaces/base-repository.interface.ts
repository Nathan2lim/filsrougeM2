/**
 * Interface générique pour les opérations CRUD de base
 * Permet de découpler la couche métier de l'implémentation de stockage
 */
export interface IBaseRepository<T, CreateDto, UpdateDto = Partial<CreateDto>> {
  create(data: CreateDto): Promise<T>;
  findById(id: string): Promise<T | null>;
  findMany(options: FindManyOptions): Promise<T[]>;
  count(where?: Record<string, unknown>): Promise<number>;
  update(id: string, data: UpdateDto): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface FindManyOptions {
  where?: Record<string, unknown>;
  skip?: number;
  take?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

/**
 * Interface pour les repositories supportant la recherche par référence
 */
export interface IRepositoryWithReference<T> {
  findByReference(reference: string): Promise<T | null>;
}

/**
 * Interface pour les repositories supportant le comptage journalier
 */
export interface IRepositoryWithDailyCount {
  countToday(): Promise<number>;
}

/**
 * Type utilitaire pour un repository complet
 */
export type IFullRepository<T, CreateDto, UpdateDto = Partial<CreateDto>> =
  IBaseRepository<T, CreateDto, UpdateDto> &
  IRepositoryWithReference<T> &
  IRepositoryWithDailyCount;
