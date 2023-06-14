import {LKNode} from "./linKernighanAlgorithm";

export const shuffle = (array) => {
    let currentIndex = array.length,  randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

export const distanceToNode = (node1: LKNode, node2: LKNode): number => {
    if(node1.index === node2.index) return 0;
    const radLat1 = (node1.lat * Math.PI )/ 180;
    const radLat2 = (node2.lat * Math.PI )/ 180;

    const theta = node1.lng - node2.lng;
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