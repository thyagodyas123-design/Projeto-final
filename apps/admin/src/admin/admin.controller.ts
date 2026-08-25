import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  health() {
    return { service: 'admin', status: 'ok' };
  }

  @Post('removal-requests')
  @HttpCode(HttpStatus.CREATED)
  async requestCourseRemoval(@Body() body: { courseId: string; requestedBy: string; actorRole: string }) {
    return this.adminService.requestCourseRemoval(body);
  }

  @Get('removal-requests')
  @HttpCode(HttpStatus.OK)
  async listCourseRemovals(@Query('status') status = '') {
    return this.adminService.listCourseRemovals(status);
  }

  @Patch('removal-requests/:id')
  @HttpCode(HttpStatus.OK)
  async decideCourseRemoval(@Param('id') id: string, @Body() body: { actorRole: string; status: string; reason?: string }) {
    return this.adminService.decideCourseRemoval({ requestId: id, ...body });
  }
}
