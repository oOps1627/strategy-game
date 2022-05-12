import {SpawnersFactory} from "../spawners/spawners.factory";
import {IMapPoint, IPosition} from "../models";



const POINT_A: IPosition = {x: 20, y: 400};
const POINT_B: IPosition = {x: 400, y: 200};
const POINT_C: IPosition = {x: 20, y: 20};

export function LEVEL1_MAP(spawnerFactory: SpawnersFactory): IMapPoint[] {
    return [
        {
            position: POINT_A,
            possibleMoves: [
                {x: 20, y: 20},
                POINT_B
            ],
            spawner: spawnerFactory.newLevel1Spawner({
                team: 'A',
                color: 0x871734,
                ...POINT_A
            })
        },
        {
            position: POINT_B,
            possibleMoves: [
                {x: 20, y: 20},
                POINT_A,
            ],
            spawner: spawnerFactory.newLevel2Spawner({
                team: 'B',
                color: 0x341690,
                ...POINT_B
            })
        },
        {
            position: POINT_C,
            possibleMoves: [
                POINT_A,
                POINT_B
            ],
            spawner: spawnerFactory.newLevel1Spawner({
                team: 'C',
                color: 0x618234,
                ...POINT_C
            })
        }
    ]
}