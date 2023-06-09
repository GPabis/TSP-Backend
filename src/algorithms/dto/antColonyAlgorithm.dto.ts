export interface Node {
    nodeIndex: number;
    lat: number;
    lng: number;
}

export interface AlgorithmResponse {
    bestPathIndexes: number[];
    distance: number;
    time: string;
}

export class AlgorithmRequest {
    nodes: Node[];
}