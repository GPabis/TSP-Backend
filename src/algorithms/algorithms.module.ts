import { Module } from '@nestjs/common';
import {AlgorithmsController} from "./algorithms.controller";
import {AlgorithmsService} from "./algorithms.service";

@Module({
    controllers: [AlgorithmsController],
    providers: [AlgorithmsService],
})
export class AlgorithmsModule {}
