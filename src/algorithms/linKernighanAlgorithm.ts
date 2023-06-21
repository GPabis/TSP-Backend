import { shuffle } from "./utils";
import {AlgorithmResponse} from "./dto/antColonyAlgorithm.dto";

export class LKNode {
    public index: number = -1;
    public position: number = -1;
    public predecessor: LKNode = null;
    public successor: LKNode = null;
    public lat: number;
    public lng: number;

    public constructor(lat: number, lng: number) {
        this.lat = lat;
        this.lng = lng;
    }

    public equals(node: LKNode): boolean {
        return this.index === node.index;
    }

    public greaterThan(node: LKNode): boolean {
        return this.index > node.index;
    }
}

export class LKEdge {
    public node1: LKNode;
    public node2: LKNode;

    public constructor(node1: LKNode, node2: LKNode) {

        if(node1.equals(node2)) throw new Error("Cannot create edge between same nodes");

        if(node1.greaterThan(node2)) {
            this.node1 = node2;
            this.node2 = node1;
        } else {
            this.node1 = node1;
            this.node2 = node2;
        }
    }

    public equals(edge: LKEdge): boolean {
        return (this.node1.equals(edge.node1) && this.node2.equals(edge.node2)) ||
            (this.node1.equals(edge.node2) && this.node2.equals(edge.node1));
    }

    public hash(): string {
        return `(${this.node1.index}-${this.node2.index})`;
    }
}

type SwapType = 'swap_feasible' | 'swap_unfeasible' | 'swap_node_between_t2_t3' | 'swap_node_between_t2_t3_reversed' | 'swap_feasible_reversed';

export class LKTour {
    public edges: LKEdge[];
    public nodes: LKNode[];
    public cost: number;
    public size: number;
    public swapStack: Array<[LKNode, LKNode, LKNode, LKNode, SwapType] | [LKNode, LKNode, LKNode, LKNode, LKNode, LKNode, LKNode, LKNode, 'swap_double_bridge']>;

    public constructor(nodes: LKNode[]) {
        this.nodes = nodes;
        this.size = nodes.length;
        this.setNodes();

        this.edges = [];
        this.setEdges();
        this.cost = 0;

        this.swapStack = [];
    }

    public setNodes(): void {
        for (let i = 0; i < this.size; i++) {
            if(i === this.size -1) {
                this.nodes[i].successor = this.nodes[0];
            } else {
                this.nodes[i].successor = this.nodes[i + 1];
            }

            if(i === 0) {
                this.nodes[i].predecessor = this.nodes[this.size - 1];
            } else {
                this.nodes[i].predecessor = this.nodes[i - 1];
            }

            this.nodes[i].position = i;
            this.nodes[i].index = i;
        }
    }

    public setEdges(): void {
        let tourEdges = [];
        let currNode = this.nodes[0];

        while(currNode.successor.index != this.nodes[0].index) {
            tourEdges.push(new LKEdge(currNode, currNode.successor));
            currNode = currNode.successor;
        }

        tourEdges.push(new LKEdge(currNode, currNode.successor));
        this.edges = tourEdges;
    }

    public setCost(distanceMatrix: number[][]): void {
        let cost = 0;
        let currNode = this.nodes[0];

        while (currNode.successor.index != this.nodes[0].index) {
            cost += distanceMatrix[currNode.index][currNode.successor.index];
            currNode = currNode.successor;
        }

        cost += distanceMatrix[currNode.index][currNode.successor.index];
        this.cost = cost;
    }

    public setPositions(){
        let currNode = this.nodes[0];
        currNode.position = 0

        while (!currNode.successor.equals(this.nodes[0])) {
            currNode = currNode.successor;
            currNode.position = currNode.predecessor.position + 1;
        }

    }

    public getNodes(randomStart: boolean = false, startingNode: LKNode | null = null){
        let visitedNodes: LKNode[] = [...this.nodes];
        let tourNodes = [];
        let currNode = this.nodes[0];

        if(startingNode !== null) {
            currNode = startingNode;
        }

        if(randomStart) {
            currNode = this.nodes[Math.floor(Math.random() * this.nodes.length)];
        }

        visitedNodes = visitedNodes.filter(node => !node.equals(currNode));

        while (visitedNodes.length > 0) {
            while (visitedNodes.find(node => node.equals(currNode.successor))) {
                tourNodes.push(currNode);
                currNode = currNode.successor;
                visitedNodes = visitedNodes.filter(node => !node.equals(currNode));
            }
            tourNodes.push(currNode);

            if(visitedNodes.length > 0) {
                currNode = visitedNodes.values().next().value;
            }
        }

        return tourNodes;
    }

    public shuffleNodes(): void {
        let indexes = [...Array(this.size).keys()];
        indexes = shuffle(indexes);

        let currNode = this.nodes[indexes[indexes.length -1]]

        for (let i = -1; i < this.size - 1; i++) {
            currNode.successor = this.nodes[indexes[i + 1]];
            if(i === -1) {
                currNode.predecessor = this.nodes[indexes[this.size - 2]];
            } else if (i === 0) {
                currNode.predecessor = this.nodes[indexes[this.size - 1]];
            } else {
                currNode.predecessor = this.nodes[indexes[i - 1]];
            }

            currNode.position = i + 1;
            currNode = currNode.successor;
        }

        this.setEdges();
    }

    public restore(swaps: number | null = null): void {
        if(swaps === null)
            swaps = this.swapStack.length;

        for (let _ in [...Array(swaps).keys()]) {
            let currStack = this.swapStack[this.swapStack.length - 1];

            let t1 = currStack[0];
            let t2 = currStack[1];
            let t3 = currStack[2];
            let t4 = currStack[3];
            let swapType = currStack[8] ? 'swap_double_bridge' : currStack[4] as SwapType;

            if(swapType === 'swap_feasible') this.swapFeasible(t4, t1, t2, t3, false, false);
            else if (swapType === 'swap_unfeasible') this.swapUnfeasible(t4, t1, t2, t3, false, false);
            else if (swapType === 'swap_node_between_t2_t3') this.swapUnfeasible(t4, t1, t2, t3, false, false);
            else if (swapType === 'swap_node_between_t2_t3_reversed') this.swapUnfeasible(t4, t1, t2, t3, true, false);
            else if (swapType === 'swap_feasible_reversed') this.swapFeasible(t4, t1, t2, t3, true, false);
            this.swapStack.pop();
        }
        for (let swap of this.swapStack) {
            if (swap[swap.length - 1] !== 'swap_feasible') {
                this.setPositions();
                break;
            }
        }
    }

    public between(fromNode: LKNode, betweenNode: LKNode, toNode: LKNode, usePosAttr: boolean = false): boolean {
        if(usePosAttr) {
            if(fromNode.position <= toNode.position) {
                return fromNode.position < betweenNode.position && betweenNode.position < toNode.position;
            } else {
                return fromNode.position < betweenNode.position || betweenNode.position < toNode.position;
            }
        } else {
            let node = fromNode.successor;

            while (!node.equals(toNode)) {
                if(node.equals(betweenNode)) return true;
                else node = node.successor;
            }
            return false;
        }
    }

    public isSwapFeasible(t1: LKNode, t2: LKNode, t3: LKNode, t4: LKNode): boolean {
        if(t1.equals(t2) || t1.equals(t3) || t1.equals(t4) || t2.equals(t3) || t2.equals(t4) || t3.equals(t4)) {
            return false;
        }

        if(t1.successor.equals(t2)){
            if(!t4.equals(t3.predecessor))
                return false;
        } else if (t1.predecessor.equals(t2)){
            if(!t4.equals(t3.successor))
                return false;
        }

        return true;
    }

    public isSwapUnfeasible(t1: LKNode, t2: LKNode, t3: LKNode, t4: LKNode): boolean {
        if(!(!t1.equals(t2) && !t1.equals(t3) && !t1.equals(t4) && !t2.equals(t3) && !t2.equals(t4) && !t3.equals(t4))) {
            return false;
        }

        if(t1.successor.equals(t2)){
            if(t4.equals(t3.predecessor))
                return false;
        } else if (t1.predecessor.equals(t2)){
            if(t4.equals(t3.successor))
                return false;
        }

        if(t2.predecessor.equals(t3) || t2.successor.equals(t3) || t1.predecessor.equals(t4) || t1.successor.equals(t4))
            return false;

        return true;
    }

    public isSwapDoubleBridge(
        t1: LKNode, t2: LKNode, t3: LKNode, t4: LKNode,
        t5: LKNode, t6: LKNode, t7: LKNode, t8: LKNode
    ): [LKNode, LKNode, LKNode, LKNode, LKNode, LKNode, LKNode, LKNode] | null {
        if(!(!t1.equals(t2) && !t1.equals(t3) && !t1.equals(t4) && !t1.equals(t5) && !t1.equals(t6) && !t1.equals(t7) && !t1.equals(t8) &&
            !t2.equals(t3) && !t2.equals(t4) && !t2.equals(t5) && !t2.equals(t6) && !t2.equals(t7) && !t2.equals(t8) &&
            !t3.equals(t4) && !t3.equals(t5) && !t3.equals(t6) && !t3.equals(t7) && !t3.equals(t8) &&
            !t4.equals(t5) && !t4.equals(t6) && !t4.equals(t7) && !t4.equals(t8) &&
            !t5.equals(t6) && !t5.equals(t7) && !t5.equals(t8) &&
            !t6.equals(t7) && !t6.equals(t8) &&
            !t7.equals(t8)
        )) {
            return null;
        }

        if(t1.predecessor.equals(t2)){
            let temp = t2;
            t2 = t1;
            t1 = temp;
        }
        if(t3.predecessor.equals(t4)){
            let temp = t4;
            t4 = t3;
            t3 = temp;
        }
        if(t5.predecessor.equals(t6)){
            let temp = t6;
            t6 = t5;
            t5 = temp;
        }
        if(t7.predecessor.equals(t8)){
            let temp = t8;
            t8 = t7;
            t7 = temp;
        }

        let nodes = [t1, t2, t3, t4, t5, t6, t7, t8]
        nodes.sort((a, b) => a.position - b.position);
        return [nodes[0], nodes[0].successor, nodes[2], nodes[2].successor, nodes[1], nodes[1].successor, nodes[3], nodes[3].successor];
    }

    public swapFeasible(t1: LKNode, t2: LKNode, t3: LKNode, t4: LKNode, isSubtour: boolean = false, record: boolean = true) {
        if(!t1.successor.equals(t2)) {
            let temp = t1;
            t1 = t2;
            t2 = temp;
            let temp2 = t3;
            t3 = t4;
            t4 = temp2;
        }
        let segSize = t2.position - t3.position;
        if(segSize < 0) {
            segSize += this.size;
        }
        if(2*segSize > this.size) {
            let temp = t3;
            t3 = t2;
            t2 = temp;
            let temp2 = t4;
            t4 = t1;
            t1 = temp2;
        }
        let pos = t1.position;
        let node = t3;
        let endNode = t1.successor;
        while (!node.equals(endNode)) {
            let temp = node.successor;
            node.successor = node.predecessor;
            node.predecessor = temp;

            if(!isSubtour) {
                node.position = pos;
                pos -= 1;
            }
            node = temp;
        }
        t3.successor = t2;
        t2.predecessor = t3;
        t1.predecessor = t4;
        t4.successor = t1;
        if(record) {
            if(!isSubtour) {
                this.swapStack.push([t1, t2, t3, t4, 'swap_feasible']);
            } else {
                this.swapStack.push([t1, t2, t3, t4, 'swap_feasible_reversed']);
            }
        }
    }

    public swapUnfeasible(t1: LKNode, t2: LKNode, t3: LKNode, t4: LKNode, isReverseSubtour: boolean = false, record: boolean = true) {
        if(t1.successor.equals(t2)){
            let temp = t3;
            t3 = t2;
            t2 = temp;
            temp = t4;
            t4 = t1;
            t1 = temp;
        }

        t3.predecessor = t2;
        t2.successor = t3;
        t1.predecessor = t4;
        t4.successor = t1;

        if(isReverseSubtour) {
            let node = t4;

            while (!node.predecessor.equals(t4)) {
                let temp = node.predecessor;
                node.predecessor = node.successor;
                node.successor = temp;

                node = temp;
            }

            t1.predecessor = t1.successor;
            t1.successor = t4;

        }

        if(record) {
            this.swapStack.push([t1, t2, t3, t4, 'swap_unfeasible']);
        }
    }

    public swapNodeBetweenT2T3(t1: LKNode, t4: LKNode, t5: LKNode, t6: LKNode, record: boolean = true, reverse: boolean = false) {
        let t4AfterT1 = t1.successor.equals(t4);
        let t6AfterT5 = t5.successor.equals(t6);
        let reverseSubtour = t4AfterT1 !== t6AfterT5;

        if(reverseSubtour || reverse){
            let fromNode = t6;
            let toNode = t5;

            if(t6AfterT5) {
                fromNode = t5;
                toNode = t6;
            }

            while (!fromNode.equals(toNode)) {
                let temp = fromNode.predecessor;
                fromNode.predecessor = fromNode.successor;
                fromNode.successor = temp;
                fromNode = temp;
            }

            let temp2 = toNode.predecessor;
            toNode.predecessor = toNode.successor;
            toNode.successor = temp2;
        }

        if(t4AfterT1) {
            t1.successor = t6;
            t6.predecessor = t1;
            t5.successor = t4;
            t4.predecessor = t5;
        } else {
            t1.predecessor = t6;
            t6.successor = t1;
            t5.predecessor = t4;
            t4.successor = t5;
        }

        if(record) {
            if(reverseSubtour) {
                this.swapStack.push([t1, t4, t5, t6, 'swap_node_between_t2_t3_reversed']);
            } else {
                this.swapStack.push([t1, t4, t5, t6, 'swap_node_between_t2_t3']);
            }
        }
    }

    public swapDoubleBridge(
        t1: LKNode, t2: LKNode, t3: LKNode, t4: LKNode,
        t5: LKNode, t6: LKNode, t7: LKNode, t8: LKNode, record: boolean = true
    ) {
        this.swapUnfeasible(t1, t2, t3, t4, false, false);

        let fromNode = t4;
        let toNode = t1;

        if(t1.predecessor.equals(t2)) {
            fromNode = t1;
            toNode = t4;
        }

        if (!this.between(fromNode, t5, toNode)) {
            let temp = t5;
            t5 = t8;
            t8 = temp;
            temp = t6;
            t6 = t7;
            t7 = temp;
        }

        if((t1.successor.equals(t2) && t5.predecessor.equals(t6)) || (t1.predecessor.equals(t2) && t5.successor.equals(t6))) {
            let temp = t5;
            t5 = t6;
            t6 = temp;
            temp = t7;
            t7 = t8;
            t8 = temp;
        }

        this.swapUnfeasible(t5, t6, t7, t8, false, false);
        this.setPositions();
        if(record) {
            this.swapStack.push([t1, t2, t3, t4, t5, t6, t7, t8, 'swap_double_bridge']);
        }
    }

    public equals(tour: LKTour): boolean {
        if(this.edges.length !== tour.edges.length) return false;
        return this.edges.every(edge => tour.edges.some(tourEdge => edge.equals(tourEdge)));
    }

    public hash(): string {
        return this.edges.map(edge => edge.hash()).join(",");
    }
}

export class LKAlgorithm {
    public static gain_precision = 0.001;
    public nodes: LKNode[];
    public startNode: LKNode;
    public tour: LKTour;
    public distanceMatrix: number[][];
    public solutions: Set<string>;
    public closestNeighbors: Map<LKNode, LKNode[]>;
    public backtracking: number[];
    public reductionLevel: number;
    public reductionCycle: number;
    public reductionEdges: LKEdge[];
    public cycles: number;
    public closeGain: number[];
    public bestCloseGain: number;
    public doubleBridgeGain: number;
    public shuffle: boolean;
    public bestTour: LKNode[] = [];
    public bestCost: number = Number.MAX_SAFE_INTEGER;
    public time: string = '';

    public constructor(
        nodes: LKNode[],
        costFunction: (a: LKNode, b: LKNode) => number,
        shuffle: boolean = false,
        backtracking: [number, number, number] = [5, 5, 5],
        reductionLevel: number = 0,
        reductionCycle: number = 0,
        startNode?: number,
    ) {
        this.nodes = nodes;
        this.startNode = startNode ? this.nodes[startNode] : this.nodes[Math.floor(Math.random() * this.nodes.length)];
        this.tour = new LKTour(this.nodes);

        if(shuffle) {
            this.tour.shuffleNodes();
        }

        this.shuffle = true;
        this.distanceMatrix = [];
        this.setCostMatrix(costFunction);
        this.tour.setCost(this.distanceMatrix);

        this.solutions = new Set();
        this.closestNeighbors = new Map();
        this.setClosestNeighbors(Math.max(backtracking[0], backtracking[1]));

        this.backtracking = backtracking;
        this.reductionLevel = reductionLevel;
        this.reductionCycle = reductionCycle;
        this.reductionEdges = [];

        this.cycles = 0;

        this.closeGain = [];
        this.bestCloseGain = 0;
        this.doubleBridgeGain = 0;
    }

    public setCostMatrix(costFunction: (a: LKNode, b: LKNode) => number) {
        let index = 0;

        for (let i = 0; i < this.nodes.length; i++) {
            this.distanceMatrix[i] = [];
            for (let j = 0; j < this.nodes.length; j++) {
                const n1 = this.nodes[i];
                const n2 = this.nodes[j];
                let cost = costFunction(n1, n2);
                this.distanceMatrix[i][j] = cost;
            }
            index++;
        }
    }

    public setClosestNeighbors(maxNeighbors: number) {
        for (const node1 of this.tour.nodes) {
            const neighbors = this.tour.nodes
                .filter((node2) => node2.index !== node1.index);

            const neighborWithCost: Array<[LKNode, number]> = neighbors.map((node2) => [node2, this.distanceMatrix[node1.index][node2.index]]);

            const neighborsMin = neighborWithCost.sort((a, b) => a[1] - b[1]).slice(0, maxNeighbors);

            this.closestNeighbors.set(node1, neighborsMin.map((neighbor) => neighbor[0]));
        }
    }

    public getBestNeighbor(t2: LKNode, t1: LKNode | null = null) {
        const bestNeighbor: Map<[LKNode, LKNode], number> = new Map();

        for (const t3 of this.closestNeighbors.get(t2)) {
            for (const t4 of [t3.predecessor, t3.successor]) {
                if(t1 !== null) {
                    if(this.tour.isSwapFeasible(t1, t2, t3, t4)) {
                        bestNeighbor.set([t3, t4], this.distanceMatrix[t3.index][t4.index] - this.distanceMatrix[t2.index][t3.index]);
                    }
                } else {
                    bestNeighbor.set([t3, t4], this.distanceMatrix[t3.index][t4.index] - this.distanceMatrix[t2.index][t3.index]);
                }
            }
        }

        return [...bestNeighbor.entries()].sort((a, b) => b[1] - a[1]);
    }

    public lkFeasibleSearch(
        level: number,
        gain: number,
        swapFunc: SwapType,
        t1: LKNode,
        t2: LKNode,
        t3: LKNode,
        t4: LKNode,
        brokenEdges: LKEdge[],
        joinedEdges: LKEdge[]
    ){
        const brokenEdge = new LKEdge(t3, t4);
        const brokenEdgeCost = this.distanceMatrix[t3.index][t4.index];

        if(level >= this.reductionLevel && this.cycles <= this.reductionCycle && this.reductionEdges.some(edge => edge.equals(brokenEdge))) {
            return;
        }

        brokenEdges.push(new LKEdge(t1, t2));
        joinedEdges.push(new LKEdge(t2, t3));

        brokenEdges = brokenEdges.filter(edge => brokenEdges.filter(e => e.equals(edge)).length === 1);
        joinedEdges = joinedEdges.filter(edge => joinedEdges.filter(e => e.equals(edge)).length === 1);

        if(swapFunc === 'swap_feasible') {
            this.tour.swapFeasible(t1, t2, t3, t4);
        } else if(swapFunc === 'swap_node_between_t2_t3') {
            this.tour.swapNodeBetweenT2T3(t1, t2, t3, t4);
        }

        const joinedCloseEdge = new LKEdge(t4, t1);
        const joinedCloseEdgeCost = this.distanceMatrix[t4.index][t1.index];
        const joinedCloseValid = !this.tour.edges.some(edge => edge.equals(joinedCloseEdge)) && !brokenEdges.some(edge => edge.equals(joinedCloseEdge));

        let closeGain = gain + (brokenEdgeCost - joinedCloseEdgeCost);
        this.closeGain.push(closeGain);
        this.bestCloseGain = closeGain > this.bestCloseGain ? closeGain : this.bestCloseGain;

        let currBacktracking = 1;

        if(level <= this.backtracking.length -1) {
            currBacktracking = this.backtracking[level];
        }

        for (const [[next_y_head, next_x_head], _] of this.getBestNeighbor(t4, t1).slice(0, currBacktracking)) {

            const joinedEdge = new LKEdge(t4, next_y_head);
            const joinedEdgeCost = this.distanceMatrix[t4.index][next_y_head.index];

            const exploreGain = gain + (brokenEdgeCost - joinedEdgeCost);

            let disjointCriteria = false;

            if(!brokenEdges.some(edge => edge.equals(brokenEdge)) && !joinedEdges.some(edge => edge.equals(brokenEdge))) {
                if(!this.tour.edges.some(edge => edge.equals(joinedEdge)) && !brokenEdges.some(edge => edge.equals(joinedEdge))) {
                    disjointCriteria = true;
                }
            }

            let gainCriteria = false;

            if(exploreGain > LKAlgorithm.gain_precision) {
                gainCriteria = true;
            }

            let nextXICriteria = false;
            const next_broken_edge = new LKEdge(next_y_head, next_x_head);

            if(!brokenEdges.some(edge => edge.equals(next_broken_edge)) && !joinedEdges.some(edge => edge.equals(next_broken_edge))) {
                nextXICriteria = true;
            }

            if(disjointCriteria && gainCriteria && nextXICriteria) {
                if(this.solutions.has(this.tour.nodes.map(node => node.successor.index).toString())) {
                    return;
                }

                if(closeGain > exploreGain && closeGain >= this.bestCloseGain && closeGain > LKAlgorithm.gain_precision && joinedCloseValid){
                    brokenEdges.push(brokenEdge);
                    joinedEdges.push(joinedCloseEdge);
                    brokenEdges = brokenEdges.filter(edge => brokenEdges.filter(e => e.equals(edge)).length === 1);
                    joinedEdges = joinedEdges.filter(edge => joinedEdges.filter(e => e.equals(edge)).length === 1);
                    return;
                } else {
                    this.lkFeasibleSearch(level + 1, exploreGain, "swap_feasible", t1, t4, next_y_head, next_x_head, brokenEdges, joinedEdges);
                    return;
                }
            }
        }
    }

    public lkUnfeasibleSearch(gain: number, t1: LKNode, t2: LKNode, t3: LKNode, t4: LKNode, brokenEdges: LKEdge[], joinedEdges: LKEdge[]) {
        brokenEdges.push(new LKEdge(t1, t2));
        joinedEdges.push(new LKEdge(t2, t3));
        brokenEdges = brokenEdges.filter(edge => brokenEdges.filter(e => e.equals(edge)).length === 1);
        joinedEdges = joinedEdges.filter(edge => joinedEdges.filter(e => e.equals(edge)).length === 1);

        const brokenEdge1 = new LKEdge(t3, t4);
        const brokenCost1 = this.distanceMatrix[t3.index][t4.index];

        this.tour.swapUnfeasible(t1, t2, t3, t4);
        this.closeGain.push(-1);

        let currBacktracking = 1;
        if(this.backtracking.length -1 >= 1) {
            currBacktracking = this.backtracking[1];
        }

        for (const [[t5, t6], _] of this.getBestNeighbor(t4).slice(0, currBacktracking)) {
            const joinedEdge1 = new LKEdge(t4, t5);
            const joinedCost1 = this.distanceMatrix[t4.index][t5.index];

            let exploreGain = gain + (brokenCost1 - joinedCost1);

            let gainCriteria1 = false;
            if(exploreGain > LKAlgorithm.gain_precision) {
                gainCriteria1 = true;
            }

            let validNodes = false;
            if(!t5.equals(t1) && !t5.equals(t2) && !t5.equals(t3) && !t5.equals(t4)){
                if(!t6.equals(t1) && !t6.equals(t2) && !t6.equals(t3) && !t6.equals(t4)){
                    validNodes = true;
                }
            }

            if(gainCriteria1 && validNodes) {
                const brokenEdge2 = new LKEdge(t5, t6);
                const brokenCost2 = this.distanceMatrix[t5.index][t6.index];

                let t5BetweenT1T4 = false;
                let t1AfterT4 = t4.successor.equals(t1);

                if(t1AfterT4) {
                    t5BetweenT1T4 = this.tour.between(t1, t5, t4);
                } else {
                    t5BetweenT1T4 = this.tour.between(t4, t5, t1);
                }

                if(t5BetweenT1T4) {
                    if(this.tour.isSwapFeasible(t1, t4, t5, t6)) {
                        currBacktracking = 1;

                        if(this.backtracking.length -1 >= 2) {
                            currBacktracking = this.backtracking[2];
                        }

                        for (const [[t7, t8], _] of this.getBestNeighbor(t6).slice(0, currBacktracking)) {
                            const joinedEdge2 = new LKEdge(t6, t7);
                            const joinedCost2 = this.distanceMatrix[t6.index][t7.index];

                            exploreGain += (brokenCost2 - joinedCost2);

                            let gainCriteria2 = false;
                            if(exploreGain > LKAlgorithm.gain_precision) {
                                gainCriteria2 = true;
                            }

                            let t7BetweenT2T3 = false;

                            let t2AfterT3 = t3.successor.equals(t2);

                            if(t2AfterT3) {
                                t7BetweenT2T3 = this.tour.between(t2, t7, t3);
                            } else {
                                t7BetweenT2T3 = this.tour.between(t3, t7, t2);
                            }

                            let validNodes = false;

                            if(!t7.equals(t2) && !t7.equals(t3) && !t8.equals(t2) && !t8.equals(t3)){
                                validNodes = true;
                            }

                            if(gainCriteria2 && t7BetweenT2T3 && validNodes) {
                                const brokenEdge3 = new LKEdge(t7, t8);

                                this.tour.swapFeasible(t1, t4, t5, t6, true);
                                this.closeGain.push(-1);

                                brokenEdges.push(brokenEdge1);
                                brokenEdges.push(brokenEdge2);
                                brokenEdges.push(brokenEdge3);
                                joinedEdges.push(joinedEdge1);
                                joinedEdges.push(joinedEdge2);
                                brokenEdges = brokenEdges.filter(edge => brokenEdges.filter(e => e.equals(edge)).length === 1);
                                joinedEdges = joinedEdges.filter(edge => joinedEdges.filter(e => e.equals(edge)).length === 1);
                                this.lkFeasibleSearch(4, exploreGain, "swap_node_between_t2_t3", t1, t6, t7, t8, brokenEdges, joinedEdges);
                                return;
                            }
                        }
                    }
                } else {
                    brokenEdges.push(brokenEdge1);
                    joinedEdges.push(joinedEdge1);
                    brokenEdges.push(brokenEdge2);
                    brokenEdges = brokenEdges.filter(edge => brokenEdges.filter(e => e.equals(edge)).length === 1);
                    joinedEdges = joinedEdges.filter(edge => joinedEdges.filter(e => e.equals(edge)).length === 1);
                    this.lkFeasibleSearch(3, exploreGain, "swap_node_between_t2_t3", t1, t4, t5, t6, brokenEdges, joinedEdges);
                    return;
                }
            }
        }
        this.tour.restore();
    }

    public lkDoubleBridgeSearch(maxTests: number = 100) {
        let searchEngine = [...this.tour.edges].filter((edge) => !this.reductionEdges.some((reductionEdge) => reductionEdge.equals(edge)));

        if(searchEngine.length >= 4) {
            for(let i = 0; i < maxTests; i++) {
                searchEngine = shuffle(searchEngine);

                let brokenEdge1 = searchEngine[0];
                let brokenEdge2 = searchEngine[1];
                let brokenEdge3 = searchEngine[2];
                let brokenEdge4 = searchEngine[3];
                let doubleBridgeNodes = this.tour.isSwapDoubleBridge(brokenEdge1.node1, brokenEdge1.node2, brokenEdge2.node1, brokenEdge2.node2, brokenEdge3.node1, brokenEdge3.node2, brokenEdge4.node1, brokenEdge4.node2);

                if(doubleBridgeNodes) {
                    let t1 = doubleBridgeNodes[0];
                    let t2 = doubleBridgeNodes[1];
                    let t3 = doubleBridgeNodes[2];
                    let t4 = doubleBridgeNodes[3];
                    let t5 = doubleBridgeNodes[4];
                    let t6 = doubleBridgeNodes[5];
                    let t7 = doubleBridgeNodes[6];
                    let t8 = doubleBridgeNodes[7];

                    let brokenCost1 = this.distanceMatrix[t1.index][t2.index];
                    let brokenCost2 = this.distanceMatrix[t3.index][t4.index];
                    let brokenCost3 = this.distanceMatrix[t5.index][t6.index];
                    let brokenCost4 = this.distanceMatrix[t7.index][t8.index];

                    let joinedCost1 = this.distanceMatrix[t1.index][t4.index];
                    let joinedCost2 = this.distanceMatrix[t2.index][t3.index];
                    let joinedCost3 = this.distanceMatrix[t5.index][t8.index];
                    let joinedCost4 = this.distanceMatrix[t6.index][t7.index];

                    let gain = (brokenCost1 + brokenCost2 + brokenCost3 + brokenCost4) - (joinedCost1 + joinedCost2 + joinedCost3 + joinedCost4);

                    if(gain > LKAlgorithm.gain_precision) {
                        this.tour.swapDoubleBridge(t1, t2, t3, t4, t5, t6, t7, t8, false);

                        this.doubleBridgeGain = gain;
                        this.tour.edges = this.tour.edges.filter((edge) =>
                            edge.equals(new LKEdge(t1, t2)) ||
                            edge.equals(new LKEdge(t3, t4)) ||
                            edge.equals(new LKEdge(t5, t6)) ||
                            edge.equals(new LKEdge(t7, t8))
                        );

                        this.tour.edges.push(new LKEdge(t1, t4));
                        this.tour.edges.push(new LKEdge(t2, t3));
                        this.tour.edges.push(new LKEdge(t5, t8));
                        this.tour.edges.push(new LKEdge(t6, t7));
                        break;
                    }
                }
            }
        }
    };

    public lkMain(): boolean {
        for (const t1 of this.tour.getNodes(undefined, this.startNode)) {
            for (const t2 of [t1.predecessor, t1.successor]) {
                const brokenCost = this.distanceMatrix[t1.index][t2.index];

                for (const [[t3, t4], _] of this.getBestNeighbor(t2).slice(0, this.backtracking[0])) {
                    const joinedEdge = new LKEdge(t3, t2);
                    const joinedCost = this.distanceMatrix[t3.index][t2.index];

                    const gain = brokenCost - joinedCost;

                    if (gain > LKAlgorithm.gain_precision && !this.tour.edges.some(edge => edge.equals(joinedEdge))) {
                        const brokenEdges: LKEdge[] = [];
                        const joinedEdges: LKEdge[] = [];

                        if(this.tour.isSwapFeasible(t1, t2, t3, t4)) {
                            this.lkFeasibleSearch(1, gain, "swap_feasible", t1, t2, t3, t4, brokenEdges, joinedEdges);
                        } else if (this.tour.isSwapUnfeasible(t1, t2, t3, t4)) {
                            this.lkUnfeasibleSearch( gain, t1, t2, t3, t4, brokenEdges, joinedEdges);
                        }

                        if (this.closeGain.length > 0) {
                            if(Math.max(...this.closeGain) > 0) {
                                const bestIndex = this.closeGain.indexOf(Math.max(...this.closeGain));

                                for (let i = 0; i <= bestIndex; i++) {
                                    const [n1, n2, n3, n4, _] = this.tour.swapStack[i];
                                    this.tour.edges = this.tour.edges.filter((edge) => !edge.equals(new LKEdge(n1, n2)) && !edge.equals(new LKEdge(n3, n4)));
                                    this.tour.edges.push(new LKEdge(n2, n3));
                                    this.tour.edges.push(new LKEdge(n4, n1));
                                }
                                this.tour.restore((this.closeGain.length -1) - bestIndex);

                                this.startNode = this.tour.swapStack[this.tour.swapStack.length - 1][3];

                                this.tour.setCost(this.distanceMatrix);

                                this.closeGain = []

                                return true;
                            } else {
                                this.closeGain = []
                                this.tour.restore();
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    public lk () {
        let tourCount = 1;
        let improved = true;

        while (improved) {
            improved = this.lkMain();
            tourCount++;
            this.tour.swapStack.length = 0;
            this.bestCloseGain = 0;
            if(tourCount > 2000) break;
        }

        this.cycles += 1;

        this.solutions.add(this.tour.nodes.map((node) => node.successor.index).toString());
        this.solutions.add(this.tour.nodes.map((node) => node.predecessor.index).toString());

        this.reductionEdges = this.cycles === 1 ? [...this.tour.edges] : [...this.reductionEdges.filter((edge) => this.tour.edges.some((e) => e.equals(edge)))];

        if(this.cycles >= this.reductionCycle) {
            this.lkDoubleBridgeSearch();
            if(this.doubleBridgeGain > 0) {
                this.doubleBridgeGain = 0;
                this.shuffle = false
            } else {
                this.shuffle = true;
            }
        }
    }

    public runAlgorithm (numberOfRepetitions: number) {
        let time = BigInt(Date.now());
        for (let i = 0; i < numberOfRepetitions; i++) {
            if(this.shuffle) {
                this.tour.shuffleNodes();
            }
            this.tour.setCost(this.distanceMatrix);

            this.lk();

            if(this.tour.cost < this.bestCost) {
                this.bestTour = this.tour.getNodes();
                this.bestCost = this.tour.cost;
            }
        }

        this.time = (BigInt(Date.now()) - BigInt(time)).toString();
    }

    public returnResults (): AlgorithmResponse {
        return {
            distance: this.bestCost,
            bestPathIndexes: this.bestTour.map((node) => node.index + 1),
            time: this.time,
        }
    }

}