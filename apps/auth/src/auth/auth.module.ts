import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { TokenService } from './auth.tokens';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, TokenService],
  exports: [AuthService, AuthRepository, TokenService],
})
export class AuthModule {}
