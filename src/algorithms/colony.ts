import type {AlgorithmResponse, Node} from "./dto/antColonyAlgorithm.dto";

export class AntNode {
    public readonly node: Node;
    public index: number;
    public constructor(node: Node, index: number) {
        this.node = node;
        this.index = index;
    }

    public distanceToNode = (targetNode: AntNode): number => {
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

class AntNodeGraph {
    public pheromoneMatrix: number[][] = [];
    public distanceMatrix: number[][] = [];
    public nodes: AntNode[] = [];
    public evaporatePheromoneValue: number;

    public constructor(nodes: Node[], pheromone: number, evaporatePheromoneValue: number){
        this.evaporatePheromoneValue = evaporatePheromoneValue;
        nodes.forEach((node, index) => {
            this.nodes.push(new AntNode(node, index));
            this.pheromoneMatrix[index] = [];
            this.distanceMatrix[index] = [];
        });

        this.nodes.forEach((node1, index1) => {
            this.nodes.forEach((node2, index2) => {
                this.pheromoneMatrix[index1][index2] = pheromone;
                this.distanceMatrix[index1][index2] = this.nodes[index1].distanceToNode(this.nodes[index2]);
            });
        });

    }

    public getDistance = (node1: AntNode, node2: AntNode): number => {
        return this.distanceMatrix[node1.index][node2.index];
    }

    public getPheromone = (node1: AntNode, node2: AntNode): number => {
        return this.pheromoneMatrix[node1.index][node2.index];
    }

    public getEta = (node1: AntNode, node2: AntNode): number => {
        return 1 / this.getDistance(node1, node2);
    }

    public getDesirability = (node1: AntNode, node2: AntNode, alpha: number, bata: number): number => {
        return Math.pow(this.getPheromone(node1, node2), alpha) * Math.pow(this.getEta(node1, node2), bata);
    }

    public updatePheromone = (node1: AntNode, node2: AntNode, pheromoneDelta: number): void => {
        this.pheromoneMatrix[node1.index][node2.index] += pheromoneDelta;
        this.pheromoneMatrix[node2.index][node1.index] += pheromoneDelta;
    }

    public evaporatePheromone = (): void => {
        this.pheromoneMatrix.forEach((row, index) => {
            row.forEach((col, index2) => {
                this.pheromoneMatrix[index][index2] = this.pheromoneMatrix[index][index2] * (1 - this.evaporatePheromoneValue);
            });
        });
    }
}

export class Ant {
    private readonly initialNode: AntNode;
    private currentNode: AntNode;
    private toVisit: AntNode[] = [];
    public path: AntNode[] = [];
    public distance: number = 0;


    public constructor(
        private readonly colony: Colony,
        private readonly nodes: AntNode[],
        private readonly alpha: number,
        private readonly beta: number,
        // private readonly Q: number,
        firstNodeIndex: number
    ) {
        this.initialNode = this.nodes.find(node => node.node.nodeIndex === firstNodeIndex);
        this.currentNode = this.nodes.find(node => node.node.nodeIndex === firstNodeIndex);
        this.toVisit = this.nodes.filter(node => node.node.nodeIndex !== firstNodeIndex);
    }

    public move = (): void => {
        while (this.toVisit.length != 0) {
            const nextNode = this.pickNode();
            this.path.push(nextNode);
            this.distance += this.colony.graph.getDistance(this.currentNode, nextNode);

            this.currentNode = nextNode;
            this.toVisit = this.toVisit.filter(node => node.node.nodeIndex !== nextNode.node.nodeIndex);
        }
        if(this.path.length === this.nodes.length - 1) {
            this.path.push(this.initialNode);
            this.path.reverse();
            this.distance += this.colony.graph.getDistance(this.currentNode, this.initialNode);
        }
    }

    private pickNode = (): AntNode => {
        const desirabilitySum = this.toVisit.reduce((acc, node) => {
            return acc + this.colony.graph.getDesirability(this.currentNode, node, this.alpha, this.beta);
        }, 0);

        const probabilities = this.toVisit.map(node => {
            if(node.node.nodeIndex === this.currentNode.node.nodeIndex) return 0;
            return  this.colony.graph.getDesirability(this.currentNode, node, this.alpha, this.beta) / desirabilitySum;
        });

        const random = Math.random();

        let sum = 0;
        let index = 0;
        while (sum < random) {
            sum += probabilities[index];
            index++;
        }


        return this.toVisit[index - 1];
    }

    public updatePheromones = (): void => {
        const pheromoneDelta = (1 / this.distance) * 1;
        for (let i = 0; i < this.path.length - 1; i++) {
            const node1 = this.path[i];
            const node2 = this.path[i + 1];
            this.colony.graph.updatePheromone(node1, node2, pheromoneDelta);
        }
    }

    public reset = (): void => {
        this.currentNode = this.initialNode;
        this.toVisit = this.nodes.filter(node => node.node.nodeIndex !== this.initialNode.node.nodeIndex);
        this.path = [];
        this.distance = 0;
    }

}

export class Colony {
    public ants: Ant[] = [];
    public graph: AntNodeGraph;
    public iterationsDone: number = 0;
    public totalIterations: number = 0;
    public bestDistance: number = 0;
    public optimalPath: AntNode[] = [];
    public timeStart: number = 0;
    public timeEnd: number = 0;


    constructor(public readonly nodes: Node[], pher: number, pho: number, iterations: number, alpha: number, beta: number, antsCount: number) {
        this.graph = new AntNodeGraph(nodes, pher, pho);
        this.totalIterations = iterations;

        for (let i = 0; i < antsCount; i++) {
            const random = Math.floor(Math.random() * nodes.length) + 1;
            this.ants.push(new Ant(this, this.graph.nodes, alpha, beta,  random));
        }
    }

    public callIteration = (): void => {
        this.ants.forEach(ant => {
            ant.move();
            ant.updatePheromones();
            if (ant.distance < this.bestDistance || this.bestDistance === 0) {
                this.bestDistance = ant.distance;
                this.optimalPath = ant.path;
            }
            this.graph.evaporatePheromone()
            ant.reset();
        });
    }

    public callIterations = (): void => {
        this.timeStart = Date.now();
        while (this.iterationsDone < this.totalIterations) {
            this.callIteration();
            this.iterationsDone++;
        }
        this.timeEnd = Date.now();
    }

    public returnResults = (): AlgorithmResponse => {
        const indexOfFirst = this.optimalPath.findIndex(node => node.node.nodeIndex === 1);
        const bestPathIndexes = [...this.optimalPath.map(node => node.node.nodeIndex).slice(indexOfFirst), ...this.optimalPath.map(node => node.node.nodeIndex).slice(0, indexOfFirst)];

        return {
            bestPathIndexes,
            distance: this.bestDistance,
            time: String(BigInt(this.timeEnd) - BigInt(this.timeStart)),
        }
    }
}

