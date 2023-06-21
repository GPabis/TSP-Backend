import {Injectable} from "@nestjs/common";
import {AlgorithmRequest, AlgorithmResponse, Node as AntNodeType} from "./dto/antColonyAlgorithm.dto";
import {Colony} from "./colony";
import {BranchAndBoundAlgorithm} from "./branchAndBound";
import {LKAlgorithm, LKNode} from "./linKernighanAlgorithm";
import {distanceToNode} from "./utils";

@Injectable()
export class AlgorithmsService {

    public runAntColonyAlgorithm = (nodes: AlgorithmRequest): AlgorithmResponse => {
        const colony = new Colony(nodes.nodes, 1, 0.1, 1000, 2, 3, 50);
        colony.callIterations();
        return colony.returnResults();
    }

    public runBranchAndBoundAlgorithm = (nodes: AlgorithmRequest): AlgorithmResponse => {
        const branchAndBound = new BranchAndBoundAlgorithm(nodes.nodes);
        branchAndBound.runAlgorithm();
        return branchAndBound.returnResults();
    }

    public runLinKernighanAlgorithm = (nodes: AlgorithmRequest): AlgorithmResponse => {
        const lkNodes = nodes.nodes.map(node => new LKNode(node.lat, node.lng));
        const tsp = new LKAlgorithm(lkNodes, distanceToNode, false, [5,5,5], 4, 4, 0);
        tsp.runAlgorithm(100);
        return tsp.returnResults();
    }
}