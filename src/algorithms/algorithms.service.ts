import {Injectable} from "@nestjs/common";
import {AlgorithmRequest, AlgorithmResponse, Node as AntNodeType} from "./dto/antColonyAlgorithm.dto";
import {Colony} from "./colony";
import {BranchAndBoundAlgorithm} from "./branchAndBound";
import {LKAlgorithm, LKNode} from "./linKernighanAlgorithm";
import {distanceToNode} from "./utils";

@Injectable()
export class AlgorithmsService {

    public runAntColonyAlgorithm = (nodes: AlgorithmRequest): AlgorithmResponse => {
        const colony = new Colony(nodes.nodes, 1, 0.1, 1000, 2, 3, 1, 50);
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
        let bestTour: LKNode[] = [];
        let bestCost: number = Number.MAX_SAFE_INTEGER;
        let meanCost: number = 0;

        let time = BigInt(Date.now());
        for (let i = 0; i < 100; i++) {
            if(tsp.shuffle) {
                tsp.tour.shuffleNodes();
            }
            tsp.tour.setCost(tsp.distanceMatrix);

            tsp.lk();
            if(tsp.tour.cost < bestCost) {
                bestTour = tsp.tour.getNodes();
                bestCost = tsp.tour.cost;
            }
            meanCost += (tsp.tour.cost - meanCost) / (i + 1);
        }

        time = BigInt(Date.now()) - BigInt(time);

        console.log(`Best cost: ${bestCost}`);
        console.log(`Mean cost: ${meanCost}`);
        console.log(`Best tour: ${bestTour.map(node => node.index)}`);

        return {
            bestPathIndexes: bestTour.map(node => node.index + 1),
            distance: bestCost,
            time: time.toString()
        }

    }
}