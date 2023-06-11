import {Body, Controller, Post} from '@nestjs/common';
import {AlgorithmsService} from "./algorithms.service";
import {AlgorithmRequest, AlgorithmResponse} from "./dto/antColonyAlgorithm.dto";

@Controller('algorithms')
export class AlgorithmsController {

    constructor(private readonly antColonyService: AlgorithmsService) {}
    @Post('antColonyAlgorithm')
    public getAntColonyAlgorithm(@Body() nodes: AlgorithmRequest): AlgorithmResponse {
        return this.antColonyService.runAntColonyAlgorithm(nodes);
    }

    @Post('branchAndBoundAlgorithm')
    public getBranchAndBoundAlgorithm(@Body() nodes: AlgorithmRequest): AlgorithmResponse {
        return this.antColonyService.runBranchAndBoundAlgorithm(nodes);
    }

    @Post('linKernighanAlgorithm')
    public getLinKernighanAlgorithm(@Body() nodes: AlgorithmRequest): AlgorithmResponse {
        return this.antColonyService.runLinKernighanAlgorithm(nodes);
    }
}
