import { Controller, Post, Body, HttpCode, UseGuards } from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    // POST /auth/register
    @Post('register')
    register(@Body() dto: RegisterDto) {
        // @Body() extracts the request body and validates it against RegisterDto
        return this.authService.register(dto);
    }

    // POST /auth/login — stricter throttle: 5 per minute (overrides global 10)
    @Post('login')
    @HttpCode(200)
    @Throttle({ global: { ttl: 60000, limit: 5 } })
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }
}