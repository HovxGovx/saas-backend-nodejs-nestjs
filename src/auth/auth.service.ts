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
    async refreshTokens(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET,
            });
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });
            if (!user) throw new UnauthorizedException('User not found');
            if (!user.refreshToken) {
                throw new UnauthorizedException('Invalid refresh token');
            }
            const isRefreshTokenValid = await bcrypt.compare(
                refreshToken,
                user.refreshToken
            );
            if (!isRefreshTokenValid) {
                throw new UnauthorizedException('Invalid refresh token');
            }
            const hashedRefreshToken = await bcrypt.hash(user.refreshToken, 10);
            await this.prisma.user.update({
              where: { id: user.id },
              data: { refreshToken: hashedRefreshToken },
            });

            return this.generateTokens(user);
        } catch (err) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    generateTokens(user: { id: number; email: string; role: string }) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        }
        const access_token = this.jwtService.sign(payload, {
            secret: process.env.JWT_ACCESS_SECRET,
            expiresIn: '15m',
        }),
        refreshToken = this.jwtService.sign(payload, {
                secret: process.env.JWT_REFRESH_SECRET,
                expiresIn: '7d',
            });
        return { access_token, refreshToken };
    }
    async login(email: string, password: string) {
        const user = await this.validateUser(email, password);
        const tokens = this.generateTokens(user);
        const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: hashedRefreshToken },
        });
        return tokens;
    }
}
