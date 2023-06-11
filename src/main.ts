import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import {LinKernighanAlgorithm} from "./algorithms/linKernighanAlgorithm";

const exampleNoeds = [
    {
        "nodeIndex": 1,
        "lat": 50.17689812200107,
        "lng": 19.91134643554688
    },
    {
        "nodeIndex": 2,
        "lat": 50.127621728300475,
        "lng": 19.80972290039063
    },
    {
        "nodeIndex": 3,
        "lat": 49.94061518401988,
        "lng": 19.85366821289063
    },
    {
        "nodeIndex": 4,
        "lat": 50.00156047113755,
        "lng": 19.97177124023438
    },
    {
        "nodeIndex": 5,
        "lat": 50.027152124306234,
        "lng": 20.27114868164063
    },
    {
        "nodeIndex": 6,
        "lat": 50.1038453216394,
        "lng": 20.234069824218754
    },
    {
        "nodeIndex": 7,
        "lat": 50.162824333817284,
        "lng": 20.120086669921875
    },
    {
        "nodeIndex": 8,
        "lat": 50.12938247393472,
        "lng": 20.02670288085938
    },
    {
        "nodeIndex": 9,
        "lat": 50.05978375775201,
        "lng": 20.093994140625004
    },
    {
        "nodeIndex": 10,
        "lat": 49.9538707250323,
        "lng": 20.21896362304688
    },
    {
        "nodeIndex": 11,
        "lat": 49.88932609842728,
        "lng": 20.08712768554688
    }
];

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors();
  await app.listen(3000);
}
bootstrap()

