import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { TokenService } from './auth.tokens';

const accessCookie = (token: string) => `access_token=${token}; HttpOnly; Path=/; SameSite=Lax`;

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

  private mapError(error: any): never {
    if (/credenciais inválidas/.test(error?.message ?? '')) {
      throw new UnauthorizedException('credenciais inválidas');
    }
    throw new BadRequestException(error?.message ?? 'erro');
  }
}
