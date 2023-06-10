import {Node} from "./dto/antColonyAlgorithm.dto";

export class LKNode {
    public constructor(public readonly node: Node, public  readonly  index: number) {}

    public distanceToNode = (targetNode: LKNode): number => {
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

export class Tour {
    public tour: number[];
    public sizeOfTour: number;
    public edges: Array<[number, number]>
    public constOfTour: number;

    public constructor(tour: number[], public readonly distanceMatrix: number[][]) {
        this.tour = tour;
        this.sizeOfTour = this.tour.length;
        this.makeEdges();
        this.constOfTour = this.calculateCost();
    }

    private makePair = (i: number, j: number): [number, number] => {
        if (i < j)
            return [i, j];
        return [j, i];
    }

    public makeEdges = () => {
        this.edges = [];
        for (let i = 0; i < this.sizeOfTour; i++) {
            if(i === this.sizeOfTour - 1) {
                this.edges.push(this.makePair(this.tour[i], this.tour[0]));
            } else {
                this.edges.push(this.makePair(this.tour[i], this.tour[i + 1]));
            }
        }
    };

    public temporaryTest = (): void => {
        this.makeEdges();
        console.log(this.edges)
        const broken = [this.makePair(1, 2), this.makePair(5, 6), this.makePair(8, 9)];
        const joined = [this.makePair(1, 8), this.makePair(2, 6), this.makePair(5, 9)];
        this.generateNewTour(broken, joined);
        console.log(this.tour);
    }

    public contains = (edge: [number, number]): boolean => {
        return this.edges.includes(edge);
    }

    public at = (index: number): number => {
        return this.tour[index];
    }

    public index = (node: number): number => {
        return this.tour.indexOf(node);
    }

    public getPredecessorAndSuccessor = (node: number): [number, number] => {
        const index = this.index(node);
        if(index === 0) {
            return [this.tour[this.sizeOfTour - 1], this.tour[index + 1]];
        } else if(index === this.sizeOfTour - 1) {
            return [this.tour[index - 1], this.tour[0]];
        } else {
            return [this.tour[index - 1], this.tour[index + 1]];
        }
    }

    public generateNewTour = (brokenEdges: Array<[number, number]>, joinedEdges: Array<[number, number]>) => {
        let edges = [...this.edges.filter((edge) =>
            !brokenEdges.some((brokenEdge) =>
                brokenEdge[0] === edge[0] && brokenEdge[1] === edge[1])),
            ...joinedEdges.map((joinedEdge) => this.makePair(joinedEdge[0], joinedEdge[1]))
        ];
        let tour = [];
        tour.push(0);
        while (tour.length !== this.sizeOfTour) {
            const nextEdge = edges.find(edge => {
                if(edge[0] === tour[tour.length - 1] && !tour.includes(edge[1])) {
                    return true;
                } else if (edge[1] === tour[tour.length - 1] && !tour.includes(edge[0])) {
                    return true;
                } else {
                    return false;
                }
            });
            const nextNode = nextEdge.find(edgeNode => edgeNode !== tour[tour.length - 1]);
            tour.push(nextNode);
        }

        if(tour.length !== this.sizeOfTour) {
            console.log("Something went wrong in generateNewTour");
        }
        this.constOfTour = this.calculateCost();
        this.tour = tour;
    }

    public calculateCost = (): number => {
        let cost = 0;
        for (let i = 0; i < this.sizeOfTour; i++) {
            if(i === this.sizeOfTour - 1) {
                cost += this.distanceMatrix[this.tour[i]][this.tour[0]];
            } else {
                cost += this.distanceMatrix[this.tour[i]][this.tour[i + 1]];
            }
        }
        return cost;
    }
}

export class LinKernighanAlgorithm {
    public distanceMatrix: number[][];
    public alreadyFoundedSolutions: Set<string>;
    public LKNodes: LKNode[];
    public currentTour: Tour;

    public constructor(public readonly initNodes: Node[]) {
        this.LKNodes = initNodes.map((node, index) => new LKNode(node, index));
        this.distanceMatrix = this.LKNodes.map((node) => this.LKNodes.map((targetNode) => node.distanceToNode(targetNode)));
        this.currentTour = new Tour(this.LKNodes.map((node) => node.index), this.distanceMatrix);
    }

    public runLKAlgorithm = (): void => {

    }

    public getNthNearestNeighbour = (node: LKNode, nth: number): LKNode => {
        const sortedDistance = this.distanceMatrix[node.index].sort((a, b) => a - b);
        return this.LKNodes[this.distanceMatrix[node.index].indexOf(sortedDistance[nth])];
    }

    public getDistanceBetweenNodes = (node1: LKNode, node2: LKNode): number => {
        return this.distanceMatrix[node1.index][node2.index];
    }

    public isTour = (tour: number[]): boolean => {
        if(tour.length !== this.LKNodes.length) {
            return false;
        }

        for (let i = 0; i < tour.length; i++) {
            for (let j = i + 1; j < tour.length; j++) {
                if(tour[i] === tour[j]) {
                    return false;
                }
            }
        }

        return true;
    }

    public startLKAlgorithm = (): void => {

    }

    public selectNewT(tIndex: number[]) {
        const option1 = this.getPreviousIndex(tIndex[tIndex.length-1]);
        const option2 = this.getNextIndex(tIndex[tIndex.length-1]);
    }

    public getPreviousIndex = (index: number): number => {
        return index === 0 ? this.LKNodes.length - 1 : index - 1;
    }

    public getNextIndex = (index: number): number => {
        return (index + 1) % this.LKNodes.length;
    }

    public constructNewTour = (tIndex: number[], tour: number[], newNode: number): number[] => {

}