import Rectangle = Phaser.GameObjects.Rectangle;

export const NO_TEAM = '__NO_TEAM';
export const NO_TEAM_COLOR = 0x666666;

export interface ISpawnerConstructorParams {
    x: number;
    y: number;
    team: string;
    bubbleMass: number;
    color: number;
    spawnInterval: number;
    maxHP: number;
}

export class Spawner {
    private _onDestroy: (spawner: Spawner) => void;
    private _onSpawn: (spawner: Spawner) => void;
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
        this._currentHP = params.maxHP;

        this.createSpawnInterval();
    }

    createSpawnInterval(): void {
        if (this._spawnInterval) {
            clearInterval(this._spawnInterval);
        }

        this._spawnInterval = setInterval(() => this._onSpawn && this._onSpawn(this), this.spawnInterval);
    }

    subscribeOnDestroy(cb: (spawner: Spawner) => void): void {
        this._onDestroy = cb;
    }

    subscribeOnSpawn(cb: (spawner: Spawner) => void): void {
        this._onSpawn = cb;
    }

    makeDamage(mass: number): void {
        this._currentHP -= mass;
        if (this._currentHP <= 0 && this._onDestroy) {
            this._onDestroy(this);
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
        this.color = NO_TEAM_COLOR;
        this.restoreHP(this.maxHP);
        this._onSpawn = () => null;
        if (this._spawnInterval) {
            clearInterval(this._spawnInterval);
        }
    }

    capture(data: {team: string, color: number, mass: number}): void {
        this.team = data.team;
        this.color = data.color;
    }

    updateSpawnerGraphic(spawnerGraphic: Rectangle): void {
        const spawner: Spawner = spawnerGraphic.getData('spawner');
        const hp = spawner.currentHP;
        const maxHP = spawner.maxHP;
        const alpha = (hp / maxHP) > 1 ? 1 : hp / maxHP;
        spawnerGraphic.setFillStyle(spawner.color, alpha);
    }
}

