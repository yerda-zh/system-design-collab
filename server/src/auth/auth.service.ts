import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private jwtService: JwtService,
    ) {}

    async register(dto: RegisterDto) {
        const existing = await this.usersRepository.findOne({
            where: { email: dto.email },
        });

        if (existing) {
            throw new ConflictException('Email already in use');
        }

        // bcrypt.hash hashes the password with a "salt rounds" value of 12
        const passwordHash = await bcrypt.hash(dto.password, 12);

        const user = this.usersRepository.create({
            email: dto.email,
            displayName: dto.displayName,
            passwordHash,
        });

        await this.usersRepository.save(user);
        
        return { message: 'Registered successfully' };
    }

    async login(dto: LoginDto) {
        const user = await this.usersRepository.findOne({
            where: { email: dto.email },
        });

        // We give the same error whether the email doesn't exist OR
        // the password is wrong — this prevents attackers from knowing
        // which emails are registered (user enumeration attack)
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

        if (!passwordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // The JWT payload contains the user's ID and email
        const payload = { sub: user.id, email: user.email };
        const accessToken = this.jwtService.sign(payload);

        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
            },
        };
    }
}