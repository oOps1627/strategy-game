import {ISpawnerConstructorParams, Spawner} from "./spawner";

export class SpawnersFactory {
    newLevel1Spawner(data: Pick<ISpawnerConstructorParams, 'x' | 'y' | 'team' | 'color'>): Spawner {
        return new Spawner({
            ...data,
            bubbleMass: 20,
            spawnInterval: 1000,
            maxHP: 500,
        });
    }

    newLevel2Spawner(data: Pick<ISpawnerConstructorParams, 'x' | 'y' | 'team' | 'color'>): Spawner {
        return new Spawner({
            ...data,
            bubbleMass: 40,
            spawnInterval: 1000,
            maxHP: 700,
        });
    }
}