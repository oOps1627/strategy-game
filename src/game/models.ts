import {Spawner} from "./spawners/spawner";

export interface IPosition {
    x: number;
    y: number;
}

export interface IMapPoint {
    position: IPosition;
    possibleMoves: IPosition[];
    spawner?: Spawner;
}