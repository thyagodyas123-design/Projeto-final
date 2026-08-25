import { Controller, Get, Query, Param, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  health() {
    return { service: 'catalog', status: 'ok' };
  }

  @Get('courses')
  @HttpCode(HttpStatus.OK)
  async listCourses(
    @Query('search') search = '',
    @Query('category') category = '',
  ) {
    return this.catalogService.listCourses(search, category);
  }

  @Get('courses/:id')
  @HttpCode(HttpStatus.OK)
  async findCourse(@Param('id') id: string) {
    const course = await this.catalogService.findCourse(id);
    if (!course) {
      throw new NotFoundException('curso não encontrado');
    }
    return course;
  }
}
