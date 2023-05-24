import {Controller, Get, UseGuards} from '@nestjs/common';
import { AppService } from './app.service';
import {ConfigService} from "@nestjs/config";
import JwtAuthGuard from "./auth/auth.guard";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private configService: ConfigService) {}

  @Get('hello')
  @UseGuards(JwtAuthGuard)
  getHello(): string {
    return this.appService.getHello();
  }
}
