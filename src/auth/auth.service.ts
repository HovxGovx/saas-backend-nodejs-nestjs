import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService
    ) { }
    async validateUser(email: string, password: string) {
        const user = await this.prisma.user.findUnique({ 
            where: { email },
        });
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return user;
    }
    generateTokens(user: { id: number; email: string; role: string }) {
        const payload={
            sub: user.id,
            email: user.email,
            role: user.role,
        }
        const access_token= this.jwtService.sign(payload, {
            secret: process.env.JWT_ACCESS_SECRET,
            expiresIn: '15m',
        })
            return { access_token  };
      }
    async login(email: string, password: string) {
        const user = await this.validateUser(email, password);
        return this.generateTokens(user);
    }
}
