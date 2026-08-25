import { All, Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import * as http from 'node:http';
import * as https from 'node:https';

@Controller()
export class GatewayController {
  private targets: Record<string, string>;

  constructor() {
    this.targets = {
      auth: process.env.AUTH_URL ?? 'http://auth:4001',
      admin: process.env.ADMIN_URL ?? 'http://admin:4002',
      catalog: process.env.CATALOG_URL ?? 'http://catalog:4003',
      progress: process.env.PROGRESS_URL ?? 'http://progress:4004',
      files: process.env.FILES_URL ?? 'http://files:4005',
    };
  }

  @Get('health')
  health() {
    return { service: 'gateway', status: 'ok' };
  }

  @All('*')
  proxy(@Req() req: Request, @Res() res: Response) {
    const match = (req.url ?? '').match(/^\/api\/([^/]+)(\/.*)?$/);
    const target = match ? this.targets[match[1]] : null;
    if (!target) {
      return res.status(404).json({ error: 'rota não encontrada' });
    }

    const path = match[2] ?? '/';
    const upstreamPath = match[1] === 'auth' && !path.startsWith('/auth/') ? `/auth${path}` : path;
    const upstream = new URL(upstreamPath, target);

    const client = upstream.protocol === 'https:' ? https : http;
    const upstreamReq = client.request(
      upstream,
      {
        method: req.method,
        headers: { ...req.headers, host: upstream.host },
      },
      (upstreamRes) => {
        res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
        upstreamRes.pipe(res);
      },
    );

    upstreamReq.on('error', () => {
      if (!res.headersSent) res.status(502).json({ error: 'serviço indisponível' });
      else res.destroy();
    });

    req.pipe(upstreamReq);
  }
}
