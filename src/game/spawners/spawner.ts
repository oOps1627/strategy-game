import Rectangle = Phaser.GameObjects.Rectangle;
import GameObjectFactory = Phaser.GameObjects.GameObjectFactory;
import {IPosition} from "../models";

export const NO_TEAM = '__NO_TEAM';
export const NO_TEAM_COLOR = 0x666666;

export interface ISpawnerConstructorParams {
    position: IPosition;
    team: string;
    bubbleMass: number;
    color: number;
    spawnInterval: number;
    maxHP: number;
    possibleMoves: IPosition[];
    level: number;
    gameObjectFactory: GameObjectFactory;
}

export class Spawner {
    private _onWithoutTeam: ((spawner: Spawner) => void) | null;
    private _onSpawn: ((spawner: Spawner) => void) | null;
    private _currentHP: number;
    private _spawnIntervalToClear;
    private _gameObjectFactory: GameObjectFactory;

    readonly id = String(Date.now()) + String(Math.random());
    x: number;
    y: number;
    team: string;
    bubbleMass: number;
    color: number;
    spawnInterval: number;
    maxHP: number;
    graphic: Rectangle;
    textGraphic: Phaser.GameObjects.Text;
    possibleMoves: IPosition[];
    size: number;
    level: number;

    get currentHP(): number {
        return this._currentHP;
    };

    constructor(params: ISpawnerConstructorParams) {
        this.x = params.position.x;
        this.y = params.position.y;
        this.team = params.team;
        this.bubbleMass = params.bubbleMass;
        this.color = params.color;
        this.spawnInterval = params.spawnInterval;
        this.maxHP = params.maxHP;
        this._currentHP = params.maxHP;
        this.possibleMoves = params.possibleMoves;
        this.level = params.level;
        this._gameObjectFactory = params.gameObjectFactory;

        this._setSize();
        this.createSpawnInterval();
        this._createGraphic();
    }

    private _createGraphic(): void {
        this.graphic = this._gameObjectFactory.rectangle(this.x, this.y, this.size, this.size);
        this.textGraphic = this._gameObjectFactory.text(this.x + this.size / 2, this.y - this.size / 2, '', {
            fontSize: '9px',
        });
        this.graphic.setData('id', this.id);
        this.updateGraphic();
    }

    private _setSize(): void {
        this.size = this.maxHP / 14;
    }

    createSpawnInterval(): void {
        clearInterval(this._spawnIntervalToClear);
        this._spawnIntervalToClear = setInterval(() => {
            this._onSpawn && this._onSpawn(this);
        }, this.spawnInterval);
    }

    subscribeWhenWillWithoutTeam(cb: (spawner: Spawner) => void): void {
        this._onWithoutTeam = cb;
    }

    subscribeOnSpawn(cb: (spawner: Spawner) => void): void {
        this._onSpawn = cb;
    }

    makeDamage(mass: number): void {
        this._currentHP -= mass;
        if (this._currentHP <= 0 && this._onWithoutTeam) {
            this._onWithoutTeam(this);
        }
    }

    restoreHP(mass: number): void {
        this._currentHP += mass;
        if (this._currentHP > this.maxHP) {
            this._currentHP = this.maxHP;
        }
    }

    makeWithoutTeam(): void {
        this.team = NO_TEAM;
        this.color = NO_TEAM_COLOR;
        this.restoreHP(this.maxHP);
        this._onSpawn = null;
        clearInterval(this._spawnIntervalToClear);
        this.updateGraphic();
    }

    capture(data: { team: string, color: number, mass: number }): void {
        this.team = data.team;
        this.color = data.color;
        this.updateGraphic();
    }

    updateGraphic(): void {
        const alpha = (this.currentHP / this.maxHP) > 1 ? 1 : this.currentHP / this.maxHP;
        this.graphic.setFillStyle(this.color, alpha);
        this.textGraphic.setText(` ${this.team}\n${this._currentHP} / ${this.maxHP}`);
    }

    destroy(): void {
        this._onSpawn = null;
        this._onWithoutTeam = null;
        this._spawnIntervalToClear = null;
        this.graphic.destroy();
        this.textGraphic.destroy();
    }
}

