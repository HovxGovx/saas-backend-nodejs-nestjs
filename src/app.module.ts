import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [ 
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
    UsersModule, PrismaModule, AuthModule],
})
export class AppModule {}
