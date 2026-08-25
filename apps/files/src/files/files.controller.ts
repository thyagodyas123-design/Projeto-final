import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { FilesService } from './files.service';

interface UploadBody {
  filename?: string;
  mimeType?: string;
  contentBase64?: string;
}

@Controller()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  health() {
    return { service: 'files', status: 'ok' };
  }

  @Post('files')
  @HttpCode(HttpStatus.CREATED)
  async upload(@Body() body: UploadBody) {
    const { filename, mimeType, contentBase64 } = body ?? {};
    return this.filesService.upload({
      filename,
      mimeType,
      content: Buffer.from(contentBase64 ?? '', 'base64'),
    });
  }

  @Get('files/:id')
  @HttpCode(HttpStatus.OK)
  async download(@Param('id') id: string, @Res({ passthrough: true }) reply: FastifyReply) {
    const file = await this.filesService.download(id);
    reply.header('content-type', file.mimeType);
    reply.header('content-length', String(file.size));
    reply.header('content-disposition', `attachment; filename="${file.filename.replaceAll('"', '')}"`);
    return file.content;
  }
}
