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

// {
//     "nodes": [
//     {
//         "nodeIndex": 1,
//         "lat": 52.231163984032676,
//         "lng": 21.004829406738285
//     },
//     {
//         "nodeIndex": 2,
//         "lat": 50.08738205168907,
//         "lng": 14.420757293701174
//     },
//     {
//         "nodeIndex": 3,
//         "lat": 48.140432438188135,
//         "lng": 17.112665176391605
//     },
//     {
//         "nodeIndex": 4,
//         "lat": 48.20831616149326,
//         "lng": 16.372375488281254
//     },
//     {
//         "nodeIndex": 5,
//         "lat": 47.49424059692759,
//         "lng": 19.052696228027347
//     },
//     {
//         "nodeIndex": 6,
//         "lat": 52.51684763305083,
//         "lng": 13.388557434082033
//     },
//     {
//         "nodeIndex": 7,
//         "lat": 55.6866817192071,
//         "lng": 12.569303512573244
//     },
//     {
//         "nodeIndex": 8,
//         "lat": 52.370568669179654,
//         "lng": 4.897842407226563
//     },
//     {
//         "nodeIndex": 9,
//         "lat": 48.852969123136674,
//         "lng": 2.347469329833985
//     },
//     {
//         "nodeIndex": 10,
//         "lat": 50.8438877341113,
//         "lng": 4.350585937500001
//     },
//     {
//         "nodeIndex": 11,
//         "lat": 51.50660558430045,
//         "lng": -0.12565612792968753
//     },
//     {
//         "nodeIndex": 12,
//         "lat": 53.34768212671975,
//         "lng": -6.261863708496095
//     },
//     {
//         "nodeIndex": 13,
//         "lat": 40.41558722527384,
//         "lng": -3.703079223632813
//     },
//     {
//         "nodeIndex": 14,
//         "lat": 38.70761583218457,
//         "lng": -9.13667678833008
//     },
//     {
//         "nodeIndex": 15,
//         "lat": 47.3734771527976,
//         "lng": 8.541870117187502
//     },
//     {
//         "nodeIndex": 16,
//         "lat": 41.89342870250225,
//         "lng": 12.48295783996582
//     },
//     {
//         "nodeIndex": 17,
//         "lat": 46.0498844238435,
//         "lng": 14.507017135620119
//     },
//     {
//         "nodeIndex": 18,
//         "lat": 45.81300790534134,
//         "lng": 15.977039337158205
//     },
//     {
//         "nodeIndex": 19,
//         "lat": 44.435495892324575,
//         "lng": 26.10282897949219
//     },
//     {
//         "nodeIndex": 20,
//         "lat": 44.8171590576615,
//         "lng": 20.45740127563477
//     },
//     {
//         "nodeIndex": 21,
//         "lat": 43.851736216053666,
//         "lng": 18.3867359161377
//     },
//     {
//         "nodeIndex": 22,
//         "lat": 50.44963461000952,
//         "lng": 30.523452758789062
//     },
//     {
//         "nodeIndex": 23,
//         "lat": 53.90049497277677,
//         "lng": 27.559032440185547
//     },
//     {
//         "nodeIndex": 24,
//         "lat": 54.687377670218865,
//         "lng": 25.283231735229496
//     },
//     {
//         "nodeIndex": 25,
//         "lat": 56.949000126893836,
//         "lng": 24.105205535888675
//     },
//     {
//         "nodeIndex": 26,
//         "lat": 59.43722020374139,
//         "lng": 24.745845794677738
//     },
//     {
//         "nodeIndex": 27,
//         "lat": 59.91329955192041,
//         "lng": 10.738964080810549
//     },
//     {
//         "nodeIndex": 28,
//         "lat": 59.32478310834112,
//         "lng": 18.070793151855472
//     },
//     {
//         "nodeIndex": 29,
//         "lat": 60.16756070532547,
//         "lng": 24.94308471679688
//     },
//     {
//         "nodeIndex": 30,
//         "lat": 37.97532689557135,
//         "lng": 23.730812072753906
//     }
// ]
// }