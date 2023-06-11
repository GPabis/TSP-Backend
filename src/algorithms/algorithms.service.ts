import {Injectable} from "@nestjs/common";
import {AlgorithmRequest, AlgorithmResponse, Node as AntNodeType} from "./dto/antColonyAlgorithm.dto";
import {Colony} from "./colony";
import {BranchAndBoundAlgorithm} from "./branchAndBound";
import {LinKernighanAlgorithm, Tour} from "./linKernighanAlgorithm";

@Injectable()
export class AlgorithmsService {

    public runAntColonyAlgorithm = (nodes: AlgorithmRequest): AlgorithmResponse => {
        const colony = new Colony(nodes.nodes, 1, 0.1, 1000, 2, 3, 1, 50);
        colony.callIterations();
        return colony.returnResults();
    }

    public runBranchAndBoundAlgorithm = (nodes: AlgorithmRequest): AlgorithmResponse => {
        const branchAndBound = new BranchAndBoundAlgorithm(nodes.nodes, 0);
        branchAndBound.runAlgorithm();
        return branchAndBound.returnResults();
    }

    public runLinKernighanAlgorithm = (nodes: AlgorithmRequest): AlgorithmResponse => {
        const LKAlgorithm = new LinKernighanAlgorithm(nodes.nodes);
        LKAlgorithm.optimize();
        return LKAlgorithm.returnResult();
    }
}