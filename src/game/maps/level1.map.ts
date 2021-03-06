import {IPosition} from "../models";
import {IMap, IMapPoint} from "./map";
import {NO_TEAM} from "../spawners/spawner";
import {COLOR_PALETTE} from "../color-palette";

const POSITION_A: IPosition = {x: 40, y:40};
const POSITION_B: IPosition = {x: 400, y: 200};
const POSITION_C: IPosition = {x: 40, y: 400};
const POSITION_D: IPosition = {x: 500, y: 500};

const POINT_A: IMapPoint = {
    position: POSITION_A,
    possibleMoves: [
        POSITION_B,
        POSITION_C,
    ],
}

const POINT_B: IMapPoint = {
    position: POSITION_B,
    possibleMoves: [
        POSITION_A,
        POSITION_C,
        POSITION_D
    ],
}

const POINT_C: IMapPoint = {
    position: POSITION_C,
    possibleMoves: [
        POSITION_A,
        POSITION_B,
        POSITION_D
    ],
}

const POINT_D: IMapPoint = {
    position: POSITION_D,
    possibleMoves: [
        POSITION_B,
        POSITION_C
    ],
}

export const LEVEL_1_MAP: IMap = {
    width: 750,
    height: 600,
    points: [
        POINT_A,
        POINT_B,
        POINT_C,
        POINT_D
    ],
    spawnersInfo: [
        {
            team: 'TEAM_A',
            color: COLOR_PALETTE.RED,
            level: 1,
            ...POINT_A,
        },
        {
            team: 'TEAM_B',
            color: COLOR_PALETTE.GREEN,
            level: 2,
            ...POINT_B,
        },
        {
            team: 'TEAM_C',
            color: COLOR_PALETTE.BLUE,
            level: 1,
            ...POINT_C,
        },
        {
            team: NO_TEAM,
            color: COLOR_PALETTE.NEUTRAL,
            level: 1,
            position: {x: 450, y: 350},
            possibleMoves: [
                POSITION_B,
                POSITION_D,
            ]
        },
    ],
    teams: ['TEAM_A', 'TEAM_B', 'TEAM_C']
}
