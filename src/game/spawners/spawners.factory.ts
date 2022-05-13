import {ISpawnerConstructorParams, Spawner} from "./spawner";
import GameObjectFactory = Phaser.GameObjects.GameObjectFactory;

export class SpawnersFactory {
    private _levelCharactersMap = {
        [1]: {
            bubbleMass: 10,
            spawnInterval: 600,
            maxHP: 200,
        },
        [2]: {
            bubbleMass: 15,
            spawnInterval: 600,
            maxHP: 300,
        }
    }

    constructor(private gameObjectFactory: GameObjectFactory) {
    }

    newSpawner(data: Pick<ISpawnerConstructorParams, 'position' | 'team' | 'color' | 'possibleMoves' | 'level'>): Spawner {
        return new Spawner({
            ...data,
            ...this._levelCharactersMap[data.level],
            gameObjectFactory: this.gameObjectFactory
        });
    }
}