import {AlgorithmResponse, Node} from "./dto/antColonyAlgorithm.dto";

function shuffle(array) {
    let currentIndex = array.length,  randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

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
    public costOfTour: number;

    public constructor(tour: number[], public readonly distanceMatrix: number[][]) {
        this.tour = shuffle(tour);
        this.sizeOfTour = this.tour.length;
        this.makeEdges();
        this.costOfTour = this.calculateCost();
    }

    public makePair = (i: number, j: number): [number, number] => {
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

    public makeShortestEdges = () => {
        const edges = [];
        let tour: number[] = [];
        tour.push(0);
        for (let i = 0; i < this.sizeOfTour; i++){
            const sortedDistanceMatrix = [...this.distanceMatrix[tour[tour.length -1]]]
            sortedDistanceMatrix.sort((distA, distB) => distA - distB);
            for(let j = 1; j < sortedDistanceMatrix.length; j++) {
                const index = this.distanceMatrix[tour[tour.length -1]].indexOf(sortedDistanceMatrix[j]);
                if(tour.some(node => node === index)) {
                    continue;
                }

                edges.push(this.makePair(tour[tour.length-1], index));
                tour.push(index);
                break;
            }
        }

        this.tour = tour;
        this.edges = edges;
        this.costOfTour = this.calculateCost();
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
                (brokenEdge[0] === edge[0] && brokenEdge[1] === edge[1]) || (brokenEdge[0] === edge[1] && brokenEdge[1] === edge[0]))),
            ...joinedEdges.map((joinedEdge) => this.makePair(joinedEdge[0], joinedEdge[1]))
        ];

        console.log(edges)
        console.log(edges.length)
        console.log(this.sizeOfTour)

        if(edges.length !== this.sizeOfTour) {
            console.log("Not enough edges to generate new tour")
            return {
                isTour: false,
                tour: []
            }
        }


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

            if(!nextEdge) {
                break;
            }

            const nextNode = nextEdge.find(edgeNode => edgeNode !== tour[tour.length - 1]);
            tour.push(nextNode);
        }

        return {
            // edges: edges,
            isTour: tour.length === this.sizeOfTour,
            tour: tour
        }
    }

    public saveTour = (tour: number[]): void => {
        // this.edges = edges;
        this.tour = tour;
        this.costOfTour = this.calculateCost();

        this.makeEdges();
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
    public neighbors: Array<Array<[number, number]>> = [];
    public time: bigint = BigInt(0);

    public constructor(public readonly initNodes: Node[]) {
        this.LKNodes = initNodes.map((node, index) => new LKNode(node, index));
        this.distanceMatrix = this.LKNodes.map((node) => this.LKNodes.map((targetNode) => node.distanceToNode(targetNode)));
        this.currentTour = new Tour(this.LKNodes.map((node) => node.index), this.distanceMatrix);
    }

    public optimize = (): void => {
        this.time = BigInt(Date.now());
        let better = true;
        this.alreadyFoundedSolutions = new Set<string>();

        this.LKNodes.forEach((node) => {
            this.neighbors[node.index] = []

            this.distanceMatrix[node.index].forEach((distance, index) => {
                if(distance > 0 && this.currentTour.tour.includes(index)) {
                    this.neighbors[node.index].push([index, this.distanceMatrix[node.index][index]]);
                    this.neighbors[node.index].sort((a, b) => a[1] - b[1]);
                }
            })
        });

        while(better) {
            better = this.improve();
            this.alreadyFoundedSolutions.add(this.currentTour.tour.toString());
        }
        this.time = BigInt(Date.now()) - BigInt(this.time);
    }
    //
    // public closest = (t2i: number, gain: number, brokenEdges: Array<[number, number]>, joinedEdges: Array<[number, number]>): Array<[number, number]> => {
    //     const neighbors: Array<[number, number]> = [];
    //
    //     for (const node of this.neighbors[t2i]){
    //         const yi = this.currentTour.makePair(t2i, node[0]);
    //         const Gi = gain - node[1];
    //
    //         const isInBrokenEdges = brokenEdges.some((brokenEdge) =>
    //             (brokenEdge[0] === yi[0] && brokenEdge[1] === yi[1]) ||
    //             (brokenEdge[0] === yi[1] && brokenEdge[1] === yi[0]));
    //
    //         const isInTour = this.currentTour.edges.some((edge) => (edge[0] === yi[0] && edge[1] === yi[1]) || (edge[0] === yi[1] && edge[1] === yi[0]));
    //
    //         if(Gi <= 0 || !isInBrokenEdges || !isInTour) {
    //             continue;
    //         }
    //
    //         for (const succ of this.currentTour.getPredecessorAndSuccessor(node[0])) {
    //             const xi = this.currentTour.makePair(node[0], succ);;
    //
    //             if(xi[0] === t2i || xi[1] === t2i) {
    //                 continue;
    //             }
    //         }
    //     }
    // }

    public improve = (): boolean => {
        for (const t1 of this.currentTour.tour) {
            const neighbors = this.currentTour.getPredecessorAndSuccessor(t1);

            for(const t2 of neighbors) {
                const brokenEdges = [this.currentTour.makePair(t1, t2)];
                const gain = this.distanceMatrix[t1][t2];

                const closestArr = this.neighbors[t2].filter((neighbor) => {
                    const inBrokenEdges = brokenEdges.some((brokenEdge) => brokenEdge[0] === neighbor[0] || brokenEdge[1] === neighbor[0]);
                    const around = this.currentTour.getPredecessorAndSuccessor(neighbor[0]);
                    const isGainNegative = this.distanceMatrix[neighbor[0]][around[1]] - neighbor[1] < 0;
                    const isSecoundGainNegative = gain - neighbor[1] < 0;
                    const tourContains = this.currentTour.edges.some((edge) => (edge[0] === neighbor[0]  && edge[1] === t2) || (edge[0] === t2 && edge[1] === neighbor[0]));
                    return !inBrokenEdges && !tourContains && !isSecoundGainNegative && !isGainNegative;
                });

                closestArr.sort((a, b) => {
                    const aroundA = this.currentTour.getPredecessorAndSuccessor(a[0]);
                    const aroundB = this.currentTour.getPredecessorAndSuccessor(b[0]);
                    const gainA = this.distanceMatrix[a[0]][aroundA[1]] - a[1];
                    const gainB = this.distanceMatrix[b[0]][aroundB[1]] - b[1];
                    return gainA - gainB;
                });

                let tries = 50;

                for(const closest of closestArr) {
                    const [t3, distance] = closest;

                    if(neighbors.includes(t3)) {
                        continue;
                    }

                    const joined = [this.currentTour.makePair(t2, t3)];

                    if(this.chooseX(t1, t3, distance, brokenEdges, joined)) {
                        return true;
                    }

                    tries--;
                    if(tries === 0) {
                        break;
                    }
                }
            }
        }

        return false;
    }

    public chooseX = (t1: number, last: number, gain: number, brokenEdges: Array<[number, number]>, joinedEdges: Array<[number, number]>): boolean => {
        let around: number[];

        if(brokenEdges.length === 4) {
            const [pred, succ] = this.currentTour.getPredecessorAndSuccessor(last);
            if(this.distanceMatrix[pred][last] > this.distanceMatrix[succ][last]) {
                around = [pred];
            } else {
                around = [succ];
            }
        } else {
            around = this.currentTour.getPredecessorAndSuccessor(last);
        }

        for (const t2i of around) {
            const xi = this.currentTour.makePair(last, t2i);

            const Gi = gain + this.distanceMatrix[last][t2i];

            const notInBrokenEdges = !brokenEdges.find((edge) => (edge[0] === xi[0] && edge[1] === xi[1]) || (edge[0] === xi[1] && edge[1] === xi[0]));
            const notInJoinedEdges = !joinedEdges.find((edge) => (edge[0] === xi[0] && edge[1] === xi[1]) || (edge[0] === xi[1] && edge[1] === xi[0]));

            if(notInBrokenEdges && notInJoinedEdges) {
                const newBrokenEdges = [...brokenEdges, xi];
                const newJoinedEdges = [...joinedEdges, this.currentTour.makePair(t1, t2i)];

                const relink = Gi - this.distanceMatrix[t1][t2i];

                const {isTour, tour} = this.currentTour.generateNewTour(newBrokenEdges, newJoinedEdges);


                if(!isTour && newJoinedEdges.length > 2) {
                    console.log('not tour');
                    continue;
                }

                if(this.alreadyFoundedSolutions.has(tour.toString())) {
                    console.log('already founded');
                    return false;
                }

                if(isTour && relink > 0) {
                    console.log('better');
                    console.log('better tour', tour);

                    this.currentTour.saveTour(tour);
                    this.alreadyFoundedSolutions.add(tour.toString());
                    return true;
                } else {
                    const choice = this.chooseY(t1, t2i, Gi, newBrokenEdges, joinedEdges);

                    if(choice && brokenEdges.length == 2) {
                        return true;
                    } else {
                        return choice;
                    }
                }
            }
        }
        return false;
    }

    public chooseY = (t1: number, t2i: number, gain: number, brokenEdges: Array<[number, number]>, joinedEdges: Array<[number, number]>): boolean => {
        const closestArr = this.neighbors[t2i].filter((neighbor) => {
            const inBrokenEdges = brokenEdges.some((brokenEdge) => brokenEdge[0] === neighbor[0] || brokenEdge[1] === neighbor[0]);
            const inJoinedEdges = joinedEdges.some((joinedEdge) => joinedEdge[0] === neighbor[0] || joinedEdge[1] === neighbor[0]);
            const around = this.currentTour.getPredecessorAndSuccessor(neighbor[0]);
            const isGainNegative = this.distanceMatrix[neighbor[0]][around[1]] - neighbor[1] < 0;
            const isSecoundGainNegative = gain - neighbor[1] < 0;
            const tourContains = this.currentTour.edges.some((edge) => (edge[0] === neighbor[0]  && edge[1] === t2i) || (edge[0] === t2i && edge[1] === neighbor[0]));
            return !inBrokenEdges && !isGainNegative && !tourContains && !inJoinedEdges && !isSecoundGainNegative;
        });

        closestArr.sort((a, b) => {
            const aroundA = this.currentTour.getPredecessorAndSuccessor(a[0]);
            const aroundB = this.currentTour.getPredecessorAndSuccessor(b[0]);
            const gainA = this.distanceMatrix[a[0]][aroundA[1]] - a[1];
            const gainB = this.distanceMatrix[b[0]][aroundB[1]] - b[1];
            return gainA - gainB;
        });

        let top: number;

        if(brokenEdges.length == 2)  top = 10;
        else top = 3;

        for(const closest of closestArr) {
            const yi = this.currentTour.makePair(t2i, closest[0]);
            const newJoinedEdges = [...joinedEdges, yi];

            if (this.chooseX(t1, closest[0], closest[1], brokenEdges, newJoinedEdges)) {
                return true;
            }

            top--;

            if(top === 0) {
                break;
            }
        }
        return false;
    }

    public returnResult = (): AlgorithmResponse => {
        return {
            bestPathIndexes: this.currentTour.tour.map((node) => node + 1),
            time: String(this.time),
            distance: this.currentTour.costOfTour
        }
    }
}