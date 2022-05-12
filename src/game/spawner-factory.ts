export const NO_TEAM = '__NO_TEAM';

export interface ISpawnerConstructorParams {
    x: number;
    y: number;
    team: string;
    bubbleMass: number;
    color: number;
    spawnInterval: number;
    maxHP: number;
    currentHP: number;
}

class Spawner {
    private _onDestroy: (spawner: Spawner) => void;
    private _currentHP: number;
    private _spawnInterval;

    x: number;
    y: number;
    team: string;
    bubbleMass: number;
    color: number;
    spawnInterval: number;
    maxHP: number;

    get currentHP(): number {
        return this._currentHP;
    };

    constructor(params: ISpawnerConstructorParams) {
        this.x = params.x;
        this.y = params.y;
        this.team = params.team;
        this.bubbleMass = params.bubbleMass;
        this.color = params.color;
        this.spawnInterval = params.spawnInterval;
        this.maxHP = params.maxHP;
        this._currentHP = params.currentHP;
    }

    subscribeOnDestroy(cb: (spawner: Spawner) => void): void {
        this._onDestroy = cb;
    }

    makeDamage(mass: number): void {
        this._currentHP -= mass;
        if (this._currentHP <= 0 && this._onDestroy) {
            this._onDestroy(this);
            this.destroy();
        }
    }

    restoreHP(mass: number): void {
        this._currentHP += mass;
        if (this._currentHP > this.maxHP) {
            this._currentHP = this.maxHP;
        }
    }

    destroy(): void {
        this.team = NO_TEAM;
        this._currentHP = 0;
    }
}

export class SpawnerFactory {
    newLevel1Spawner(data: Pick<ISpawnerConstructorParams, 'x' | 'y' | 'team' | 'color'>): Spawner {
        return {
            ...data,
            bubbleMass: 20,
            spawnInterval: 1000,
            maxHP: 500,
            currentHP: 500
        }
    }
}
