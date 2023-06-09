import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import {LinKernighanAlgorithm} from "./algorithms/linKernighanAlgorithm";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors();

  await app.listen(3000);
  const lin = new LinKernighanAlgorithm();
  lin.temporaryTest();
}
bootstrap()

