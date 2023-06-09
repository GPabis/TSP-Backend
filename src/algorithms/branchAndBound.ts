import {AlgorithmResponse, Node} from "./dto/antColonyAlgorithm.dto";

export class BranchAndBoundNode {
    public constructor(public readonly node: Node, public  readonly  index: number) {}

    public distanceToNode = (targetNode: BranchAndBoundNode): number => {
        if(this.node.nodeIndex === targetNode.node.nodeIndex) return 0;
        const radLat1 = (this.node.lat * Math.PI )/ 180;
        const radLat2 = (targetNode.node.lat * Math.PI )/ 180;

        const theta = this.node.lng - targetNode.node.lng;
        const radTheta = (theta * Math.PI )/ 180;

        let dist = Math.sin(radLat1) * Math.sin(radLat2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.cos(radTheta);

        if (dist > 1) {
            dist = 1;
        }

        dist = Math.acos(dist);
        dist = (dist * 180) / Math.PI;
        dist = dist * 60 * 1.1515;
        dist = dist * 1.609344;

        return dist;
    }
}

export class BranchAndBoundAlgorithm {
    public bestPath: number[] = [];
    public finalResult: number = Number.MAX_VALUE;
    public breaks: number = 0;
    public finishedIterations: number = 0;
    public runs: number = 0;
    public time: bigint | undefined;
    public distanceMatrix: number[][] = [];
    public nodes: BranchAndBoundNode[] = [];
    public firstIteration: boolean = true;
    public numberOfNodes;
    public visitedNodes: boolean[];

    public constructor(public readonly initNodes: Node[], public indexOfStartNode: number){
        this.nodes = initNodes.map((node, index) => new BranchAndBoundNode(node, index));
        this.distanceMatrix = this.nodes.map(node1 => this.nodes.map(node2 => node1.distanceToNode(node2)));
        this.numberOfNodes = this.nodes.length;
        this.visitedNodes = Array(this.numberOfNodes).fill(false);
        this.bestPath = Array(this.numberOfNodes).fill(-1);
    }

    public runAlgorithm = (): void => {
        this.time = BigInt(Date.now());
        let currBound = 0;
        let currPath = Array (this.numberOfNodes).fill (-1);

        for (let i = 0; i < this.numberOfNodes; i++){
            const sortedDistanceMatrix = [...this.distanceMatrix[i]]
            sortedDistanceMatrix.sort((distA, distB) => distA - distB);
            currBound += this.firstMin(sortedDistanceMatrix) + this.secondMin(sortedDistanceMatrix);
        }

        currBound = currBound / 2
        this.visitedNodes[0] = true;
        currPath[0] = 0;

        this.branchAndBound(currBound, 0, 1, currPath);
        this.time = BigInt(Date.now()) - BigInt(this.time);
    }

    public branchAndBound = (currBound: number, currWeight: number, level: number, currPatch: number[]): void => {
        this.runs++;
        if(this.runs % 100000 === 0) console.log(this.runs);

        if(level === this.numberOfNodes){
            const best = currWeight + this.distanceMatrix[currPatch[level - 1]][currPatch[0]];
            this.finishedIterations++;
            if(best < this.finalResult){
                this.finalResult = best;
                this.bestPath = currPatch.map(node => node + 1);
            }
        } else {
            const sortedDistanceMatrix = [...this.distanceMatrix[currPatch[level-1]]];
            sortedDistanceMatrix.sort((distA, distB) => distA - distB);
            for(let i = 0; i < this.numberOfNodes; i++){
                const {indexOfNthSmallest, distance} = this.getNthSmallestDistance(sortedDistanceMatrix,currPatch[level - 1],i);
                if (distance !== 0 && !this.visitedNodes[indexOfNthSmallest]){
                    let temp = currBound;
                    currWeight += distance;
                    const sortedDistanceMatrixOfNextNode = [...this.distanceMatrix[indexOfNthSmallest]]
                    sortedDistanceMatrixOfNextNode.sort((distA, distB) => distA - distB);

                    if (level ==  1){
                        currBound -= (this.firstMin(sortedDistanceMatrix) + this.firstMin(sortedDistanceMatrixOfNextNode)) / 2;
                    } else {
                        currBound -= (this.secondMin(sortedDistanceMatrix) + this.firstMin(sortedDistanceMatrixOfNextNode)) / 2;
                    }

                    if (currBound + currWeight < this.finalResult){
                        currPatch[level] = indexOfNthSmallest;
                        this.visitedNodes[indexOfNthSmallest] = true;
                        this.branchAndBound(currBound, currWeight, level + 1, currPatch);
                    }

                    currWeight -= distance;
                    currBound = temp;
                    this.breaks++;

                    this.visitedNodes.fill (false)
                    for (let j = 0; j <= level - 1; j++)
                        this.visitedNodes[currPatch[j]] = true;
                }
            }
        }
    }

    private getNthSmallestDistance = (sortedArray: number[],index: number, nth: number): {indexOfNthSmallest: number, distance: number} => {
        const indexOfNthSmallest = this.distanceMatrix[index].indexOf(sortedArray[nth]);
        return {distance: sortedArray[nth], indexOfNthSmallest};
    }

    private firstMin = (sortedArray: number[]): number => {
        return sortedArray[1]
    }

    private secondMin = (sortedArray: number[]) => {
        return sortedArray[2]
    }

    public returnResults = (): AlgorithmResponse => {
        console.log('breaks', this.breaks);
        console.log('runs', this.runs);
        console.log('finishedIterations', this.finishedIterations);
        return {
            bestPathIndexes: this.bestPath,
            distance: this.finalResult,
            time: String(this.time)
        }
    }
};

