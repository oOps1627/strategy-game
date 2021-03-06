import {ISpawnerConstructorParams, Spawner} from "./spawner";
import GameObjectFactory = Phaser.GameObjects.GameObjectFactory;

interface ILevelCharacter {
    bubbleMass: number;
    spawnInterval:  number;
    maxHP: number;
    canUpgrade: boolean;
    costForUpgrade?: number;
}

const LevelCharactersMap: {[level: number]: ILevelCharacter} = {
    [1]: {
        bubbleMass: 10,
        spawnInterval: 600,
        maxHP: 250,
        canUpgrade: true,
        costForUpgrade: 50,
    },
    [2]: {
        bubbleMass: 15,
        spawnInterval: 600,
        maxHP: 300,
        canUpgrade: true,
        costForUpgrade: 100,
    },
    [3]: {
        bubbleMass: 20,
        spawnInterval: 500,
        maxHP: 350,
        canUpgrade: true,
        costForUpgrade: 500
    },
    [4]: {
        bubbleMass: 50,
        spawnInterval: 500,
        maxHP: 400,
        canUpgrade: true,
    },
    [5]: {
        bubbleMass: 150,
        spawnInterval: 1000,
        maxHP: 450,
        canUpgrade: false,
    }
}

export class SpawnersFactory {
    constructor(private gameObjectFactory: GameObjectFactory) {
    }

    static getLevelCharacters(level: number): ILevelCharacter {
        return LevelCharactersMap[level];
    }

    newSpawner(data: Pick<ISpawnerConstructorParams, 'position' | 'showArrows' | 'team' | 'color' | 'possibleMoves' | 'level'>): Spawner {
        return new Spawner({
            ...data,
            ...SpawnersFactory.getLevelCharacters(data.level),
            gameObjectFactory: this.gameObjectFactory
        });
    }
}
