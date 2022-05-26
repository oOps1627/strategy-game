import {ISpawnerConstructorParams} from "../spawners/spawner";
import {IPosition} from "../models";

export interface IMapPoint {
    position: IPosition;
    possibleMoves: IPosition[];
}

export type ISpawnerInfo = Pick<ISpawnerConstructorParams, 'color' | 'team' | 'level' | 'possibleMoves' | 'position'>;

export interface IMap {
    points: IMapPoint[];
    teams: string[];
    spawnersInfo: ISpawnerInfo[];
}
