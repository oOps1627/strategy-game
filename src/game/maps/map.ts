import {ISpawnerConstructorParams} from "../spawners/spawner";
import {IPosition} from "../models";

export interface IMapPoint {
    position: IPosition;
    possibleMoves: IPosition[];
}

export interface IMap {
    points: IMapPoint[];
    teams: string[];
    spawnersInfo: Pick<ISpawnerConstructorParams, 'color' | 'team' | 'level' | 'possibleMoves' | 'position'>[];
}