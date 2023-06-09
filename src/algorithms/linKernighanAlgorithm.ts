class TupleSet extends Set {
    public add(elem: [number, number]){
        if(elem[0] !== undefined && elem[1] !== undefined)
            return super.add(`${elem[0]},${elem[1]}`);
        throw new Error(`TupleSet.add: ${elem[0]} or ${elem[1]} is wrong`);
    }
    public has(elem: [number, number]){
        if(elem[0] !== undefined && elem[1] !== undefined)
            return super.has(`${elem[0]},${elem[1]}`);
        throw new Error(`TupleSet.add: ${elem[0]} or ${elem[1]} is wrong`);
    }

    public delete(elem: [number, number]){
        if(elem[0] !== undefined && elem[1] !== undefined)
            return super.delete(`${elem[0]},${elem[1]}`);
        throw new Error(`TupleSet.add: ${elem[0]} or ${elem[1]} is wrong`);
    }

    public forEach(callBack: (value: [number, number], value2: [number, number], set: Set<[number, number]>) => void, thisArg?: any): void {
        super.forEach((value, value2, set) => {
            callBack(value.split(',').map((elem) => parseInt(elem)) as [number, number], value2.split(',').map((elem) => parseInt(elem)) as [number, number], set);
        }, thisArg);
    }
}

export class LinKernighanAlgorithm {
    public tour: number[];
    public sizeOfTour: number;
    public edges: TupleSet;

    public constructor() {
        this.tour = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        this.sizeOfTour = this.tour.length;
        this.edges = new TupleSet();
    }

    private makePair = (i: number, j: number): [number, number] => {
        if (i < j)
            return [i, j];
        return [j, i];
    }

    public makeEdges = () => {
        this.edges = new TupleSet();
        for (let i = 0; i < this.sizeOfTour; i++) {
            if(i === this.sizeOfTour - 1) {
                this.edges.add(this.makePair(this.tour[i], this.tour[0]));
            } else {
                this.edges.add(this.makePair(this.tour[i], this.tour[i + 1]));
            }
        }
    };

    public temporaryTest = (): void => {
        this.makeEdges();
        console.log(this.tour);
        this.generateNewTour(new TupleSet([this.makePair(0, 1), this.makePair(2,3)]), new TupleSet([this.makePair(3, 1), this.makePair(2, 0)]));
        console.log(this.tour);
    }

    public contains = (edge: [number, number]): boolean => {
        return this.edges.has(edge);
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

    public generateNewTour = (brokenEdges: TupleSet, joinedEdges: TupleSet) => {
        let edges = new TupleSet(this.edges);
        brokenEdges.forEach((edge) => edges.delete(edge));
        joinedEdges.forEach((edge) => edges.add(edge));
        const successors: number[] = [];
        let node = 0;

        while (edges.size > 0) {
            for(const tuple of edges) {
                const [i, j] = tuple.split(',').map((elem) => parseInt(elem)) as [number, number];
                if(i === node) {
                    successors[node] = j;
                    node = j;
                    break;
                } else if(j === node) {
                    successors[node] = i;
                    node = i;
                    break;
                }
                console.log([i, j]);
                console.log(this.edges);
                edges.delete(this.makePair(i, j));
            }
        }

        if(successors.length < this.sizeOfTour) {
            throw new Error("Successors array is too short");
        }

        let succ = successors[0];
        const newTour = [0];
        const visited = new Set<number>(newTour);
        while (!visited.has(succ)) {
            newTour.push(succ);
            visited.add(succ);
            succ = successors[succ];

        }

        if(newTour.length !== this.sizeOfTour) {
            throw new Error("New tour is too short");
        }

        this.tour = newTour;
    }
}