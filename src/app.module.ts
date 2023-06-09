import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule} from "@nestjs/config";
import configuration from "./config/configuration";
import {DatabaseModule} from "./database/database.module";
import { AlgorithmsController } from './algorithms/algorithms.controller';
import { AlgorithmsModule } from './algorithms/algorithms.module';

@Module({
  imports: [ConfigModule.forRoot({
    load: [configuration],
    envFilePath: '.env',
    isGlobal: true,
  }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    AlgorithmsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
