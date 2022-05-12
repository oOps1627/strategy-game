import {ISpawnerConstructorParams, Spawner} from "./spawner";
import GameObjectFactory = Phaser.GameObjects.GameObjectFactory;

export class SpawnersFactory {
    constructor(private gameObjectFactory: GameObjectFactory) {
    }

    newLevel1Spawner(data: Pick<ISpawnerConstructorParams, 'x' | 'y' | 'team' | 'color'>): Spawner {
        return new Spawner({
            ...data,
            bubbleMass: 20,
            spawnInterval: 1000,
            maxHP: 500,
            gameObjectFactory: this.gameObjectFactory
        });
    }

    newLevel2Spawner(data: Pick<ISpawnerConstructorParams, 'x' | 'y' | 'team' | 'color'>): Spawner {
        return new Spawner({
            ...data,
            bubbleMass: 40,
            spawnInterval: 1000,
            maxHP: 700,
            gameObjectFactory: this.gameObjectFactory
        });
    }
}