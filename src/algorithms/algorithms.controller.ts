import {Body, Controller, Post, UseGuards} from '@nestjs/common';
import {AlgorithmsService} from "./algorithms.service";
import {AlgorithmRequest, AlgorithmResponse} from "./dto/antColonyAlgorithm.dto";
import JwtAuthGuard from "../auth/auth.guard";

@Controller('algorithms')
export class AlgorithmsController {

    constructor(private readonly antColonyService: AlgorithmsService) {}
    @UseGuards(JwtAuthGuard)
    @Post('I')
    public getAntColonyAlgorithm(@Body() nodes: AlgorithmRequest): AlgorithmResponse {
        return this.antColonyService.runAntColonyAlgorithm(nodes);
    }
    @UseGuards(JwtAuthGuard)
    @Post('branchAndBoundAlgorithm')
    public getBranchAndBoundAlgorithm(@Body() nodes: AlgorithmRequest): AlgorithmResponse {
        return this.antColonyService.runBranchAndBoundAlgorithm(nodes);
    }

    @UseGuards(JwtAuthGuard)
    @Post('linKernighanAlgorithm')
    public getLinKernighanAlgorithm(@Body() nodes: AlgorithmRequest): AlgorithmResponse {
        return this.antColonyService.runLinKernighanAlgorithm(nodes);
    }
}
