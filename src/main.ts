import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import {LinKernighanAlgorithm} from "./algorithms/linKernighanAlgorithm";

const exampleNoeds = [
  {
    nodeIndex: 0,
    lat: 12,
    lng: 13
  },
  {
    nodeIndex: 1,
    lat: 13,
    lng: 14
  }
]

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors();

  await app.listen(3000);
  const lin = new LinKernighanAlgorithm(exampleNoeds);

}
bootstrap()

