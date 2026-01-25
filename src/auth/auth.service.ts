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
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (user && await bcrypt.compare(password, user.password)) {
            return user;
        }
        return null;
    }
    generateTokens(user: { id: number; email: string }) {
        const payload = {
          sub: user.id,
          email: user.email,
        };
      
        return {
          access_token: this.jwtService.sign(payload, {
            secret: process.env.JWT_ACCESS_SECRET,
            expiresIn: '15m',
          }),
          refresh_token: this.jwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: '7d',
          }),
        };
      }
    async login(email: string, password: string) {
        const user = await this.validateUser(email, password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const tokens = this.generateTokens(user);
        return {
            user: {
                id: user.id,
                email: user.email,
            },
            ...tokens,
        };

    } 
    async refreshToken(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET,
            });
            const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
            if (!user) {
                throw new UnauthorizedException('User not found');
            }
            const tokens = this.generateTokens(user);
            return {
                user: {
                    id: user.id,
                    email: user.email,
                },
                ...tokens,
            };
        } catch (e) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }
      
      

}
