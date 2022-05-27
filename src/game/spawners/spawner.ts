import Rectangle = Phaser.GameObjects.Rectangle;
import GameObjectFactory = Phaser.GameObjects.GameObjectFactory;
import {IPosition} from "../models";
import {SpawnersFactory} from "./spawners.factory";
import Pointer = Phaser.Input.Pointer;
import Triangle = Phaser.GameObjects.Triangle;
import {getAngleForRotation, getPositionAfterMoving, isSamePosition} from "../helpers";

export const NO_TEAM = '__NO_TEAM';
export const NO_TEAM_COLOR = 0x666666;

export interface IPossibleMove extends IPosition {
    disabled?: boolean;
}

export interface ISpawnerConstructorParams {
    position: IPosition;
    team: string;
    bubbleMass: number;
    color: number;
    spawnInterval: number;
    maxHP: number;
    possibleMoves: IPossibleMove[];
    level: number;
    gameObjectFactory: GameObjectFactory;
    canUpgrade: boolean;
    showArrows: boolean;
    costForUpgrade?: number;
}

export class Spawner {
    private _onWithoutTeam: ((spawner: Spawner) => void) | null;
    private _onSpawn: ((spawner: Spawner) => void) | null;
    private _onClick: ((spawner: Spawner, pointer: Pointer) => void) | null;
    private _currentHP: number;
    private _spawnIntervalToClear;
    private _gameObjectFactory: GameObjectFactory;
    private _originSize: number;
    private _capturingTeam: string;

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
    possibleMoves: IPossibleMove[];
    size: number;
    level: number;
    canUpgrade: boolean;
    costForUpgrade: number | undefined;
    arrowsGraphic: Triangle[] = [];
    showArrows: boolean;

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
        this.possibleMoves = [...params.possibleMoves];
        this.level = params.level;
        this.canUpgrade = params.canUpgrade;
        this.costForUpgrade = params.costForUpgrade;
        this.showArrows = params.showArrows;
        this._gameObjectFactory = params.gameObjectFactory;

        this._setSize();
        this.createSpawnInterval();
        this._createGraphic();
    }

    private _createGraphic(): void {
        this._originSize = this.size;
        this.graphic = this._gameObjectFactory.rectangle(this.x, this.y, this.size, this.size);
        this.textGraphic = this._gameObjectFactory.text(this.x + this.size / 2, this.y - this.size / 2, '', {
            fontSize: '9px',
        });
        this.graphic.setData('id', this.id);
        this.graphic.setInteractive();
        this.graphic.on('pointerdown', (pointer) => this._onClick && this._onClick(this, pointer));
        if (this.showArrows) {
            this._createArrows();
        }

        this.updateGraphic();
    }

    private _setSize(): void {
        this.size = this.maxHP / 10;
    }

    private _createArrows(): void {
        this.possibleMoves.forEach(move => {
            const arrowCenter = getPositionAfterMoving(this, move, this.size / 1.5);
            const arrow = this._gameObjectFactory.triangle(arrowCenter.x, arrowCenter.y, 0, 12, 6, 0, 12, 12);
            const angleDeg = getAngleForRotation(this, move);
            arrow.setAngle(angleDeg - 90);
            arrow.setFillStyle(move.disabled ? 0x000000 : 0xffffff);
            arrow.setInteractive();
            arrow.setData('toPosition', move);
            arrow.setDepth(1);
            this.arrowsGraphic.push(arrow);
            arrow.on('pointerdown', () => this._onArrowToggle(move));
        })
    }

    private _onArrowToggle(direction: IPosition): void {
        const isActionForDisable = !this.possibleMoves.find(i => isSamePosition(i, direction))?.disabled;
        const isOnlyOneEnabledArrow = this.possibleMoves.filter(i => !i.disabled).length === 1;

        if (isActionForDisable && isOnlyOneEnabledArrow)
            return;

        this.possibleMoves = this.possibleMoves.map(possibleMove => ({
                ...possibleMove,
                disabled: isSamePosition(direction, possibleMove) ? !possibleMove.disabled : possibleMove.disabled
            }
        ));
        this._updateArrowColorAndPosition();
    }

    private _removeArrows(): void {
        this.arrowsGraphic.forEach(i => i.destroy(true));
        this.arrowsGraphic = [];
    }

    private _updateArrowColorAndPosition(): void {
        this.arrowsGraphic.forEach(arrowGraphic => {
            const toPosition = arrowGraphic.getData('toPosition');
            const arrowCenter = getPositionAfterMoving(this, toPosition, this.size / 1.5);
            arrowGraphic.setPosition(arrowCenter.x, arrowCenter.y)
            const isDisabled = this.possibleMoves.find(p => p.x === toPosition.x && p.y === toPosition.y)?.disabled;
            arrowGraphic.setFillStyle(isDisabled ? 0x000000 : 0xffffff);
        })
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

    subscribeOnClick(onClick: (spawner: Spawner, pointer: Pointer) => void): void {
        this._onClick = onClick;
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
        this._currentHP = this.maxHP;
        this._onSpawn = null;
        clearInterval(this._spawnIntervalToClear);
        this.updateGraphic();
    }

    capture(data: { team: string, color: number, mass: number, drawArrows: boolean }): void {
        this.team = data.team;
        this.color = data.color;
        this._currentHP = this.maxHP;
        this.possibleMoves = this.possibleMoves.map(i => ({...i, disabled: false}));

        if (this.showArrows != data.drawArrows) {
            this.showArrows = data.drawArrows;
            this.showArrows ? this._createArrows() : this._removeArrows();
        }

        this.updateGraphic();
    }

    updateGraphic(): void {
        const alpha = (this.currentHP / this.maxHP) > 1 ? 1 : this.currentHP / this.maxHP;
        this.graphic.setFillStyle(this.color, alpha);
        this.graphic.setScale(this.size / this._originSize);
        this.textGraphic.setText(` ${this.team}\n${this._currentHP} / ${this.maxHP}`);
        this.textGraphic.setPosition(this.x + this.size / 2, this.y - this.size / 2);
        this._updateArrowColorAndPosition();
    }

    upgrade(): void {
        const characters = SpawnersFactory.getLevelCharacters(++this.level);
        if (characters) {
            this.maxHP = characters.maxHP;
            this.restoreHP(this.maxHP);
            this.spawnInterval = characters.spawnInterval;
            this.bubbleMass = characters.bubbleMass;
            this.canUpgrade = characters.canUpgrade;
            this.costForUpgrade = characters.costForUpgrade;
            this._setSize();
            this.updateGraphic();
        }
    }

    destroy(): void {
        this._onSpawn = null;
        this._onWithoutTeam = null;
        this._spawnIntervalToClear = null;
        this.graphic.destroy();
        this.textGraphic.destroy();
    }
}

