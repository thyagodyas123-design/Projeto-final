import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { TokenService } from './auth.tokens';

const accessCookie = (token: string) => `access_token=${token}; HttpOnly; Path=/; SameSite=Lax`;

function readCookie(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return null;
}

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokens: TokenService,
  ) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  health() {
    return { service: 'auth', status: 'ok' };
  }

  @Post('auth/register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: any, @Res({ passthrough: true }) res: any) {
    try {
      const user = await this.authService.registerStudent(body);
      const token = this.tokens.createAccessToken({ sub: user.id, role: user.role });
      res.header('set-cookie', accessCookie(token));
      return { user: { id: user.id, email: user.email, role: user.role } };
    } catch (error) {
      this.mapError(error);
    }
  }

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any, @Res({ passthrough: true }) res: any) {
    try {
      const user = await this.authService.authenticate(body);
      const token = this.tokens.createAccessToken({ sub: user.id, role: user.role });
      res.header('set-cookie', accessCookie(token));
      return { user };
    } catch (error) {
      this.mapError(error);
    }
  }

  @Get('auth/me')
  @HttpCode(HttpStatus.OK)
  async me(@Headers('cookie') cookieHeader: string) {
    const token = readCookie(cookieHeader, 'access_token');
    if (!token) throw new UnauthorizedException('não autenticado');
    try {
      const { sub } = this.tokens.verifyAccessToken(token);
      const user = await this.authService.getUserById(sub);
      if (!user) throw new UnauthorizedException('não autenticado');
      return { user };
    } catch {
      throw new UnauthorizedException('não autenticado');
    }
  }

  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: any) {
    res.header('set-cookie', 'access_token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
    return { ok: true };
  }

  private mapError(error: any): never {
    if (/credenciais inválidas/.test(error?.message ?? '')) {
      throw new UnauthorizedException('credenciais inválidas');
    }
    throw new BadRequestException(error?.message ?? 'erro');
  }
}
