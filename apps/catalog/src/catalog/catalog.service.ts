import { Injectable } from '@nestjs/common';
import { CatalogRepository } from './catalog.repository';

@Injectable()
export class CatalogService {
  constructor(private readonly repository: CatalogRepository) {}

  async onModuleInit() {
    await this.repository.seed();
  }

  async listCourses(search = '', category = '') {
    return this.repository.listCourses({ search, category });
  }

  async findCourse(id: string) {
    return this.repository.findCourse(id);
  }
}
