export interface RepositoryType<TModel> {
  findById(id: string): Promise<TModel | null>;
}
