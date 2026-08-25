import { Controller, Get, Post, Patch, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ProgressService } from './progress.service';

@Controller()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  health() {
    return { service: 'progress', status: 'ok' };
  }

  @Post('enrollments')
  @HttpCode(HttpStatus.CREATED)
  async enroll(@Body() body: { userId: string; courseId: string }) {
    return this.progressService.enroll(body);
  }

  @Get('enrollments/:userId/:courseId')
  @HttpCode(HttpStatus.OK)
  async getProgress(
    @Param('userId') userId: string,
    @Param('courseId') courseId: string,
    @Query('totalLessons') totalLessons: string,
  ) {
    return this.progressService.getProgress({ userId, courseId, totalLessons: Number(totalLessons ?? 0) });
  }

  @Patch('enrollments/:userId/:courseId/lessons/:lessonId')
  @HttpCode(HttpStatus.OK)
  async setLessonCompleted(
    @Param('userId') userId: string,
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() body: { completed: boolean; totalLessons?: number },
  ) {
    return this.progressService.setLessonCompleted({ userId, courseId, lessonId, ...body });
  }
}
