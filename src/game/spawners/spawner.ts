import Rectangle = Phaser.GameObjects.Rectangle;
import GameObjectFactory = Phaser.GameObjects.GameObjectFactory;
import {IPosition} from "../models";
import {SpawnersFactory} from "./spawners.factory";
import Pointer = Phaser.Input.Pointer;
import Triangle = Phaser.GameObjects.Triangle;
import {getAngleForRotation, getPositionAfterMoving, isSamePosition} from "../helpers";
import {COLOR_PALETTE} from "../color-palette";
import { Subject } from "rxjs";

export const NO_TEAM = '__NO_TEAM';

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
    private _onSpawn: ((spawner: Spawner) => void) | null;
    private _currentHP: number;
    private _spawnIntervalToClear;
    private _gameObjectFactory: GameObjectFactory;
    private _originSize: number;
    private _click$ = new Subject<Pointer>();
    private _noHP$ = new Subject<void>();
    public click$ = this._click$.asObservable();
    public noHP$ = this._noHP$.asObservable();

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
        this.textGraphic = this._gameObjectFactory.text(0, 0, '', {
            fontSize: '9px',
        });
        this.graphic.setData('id', this.id);
        this.graphic.setDepth(0);
        this.graphic.setInteractive();
        this.graphic.on('pointerdown', (pointer) => this._click$.next(pointer));
        if (this.showArrows) {
            this._createArrows();
        }

        this.updateGraphic();
    }

    private _setSize(): void {
        this.size = 40;
    }

    private _createArrows(): void {
        this.possibleMoves.forEach(move => {
            const arrowCenter = getPositionAfterMoving(this, move, this.size / 1.5);
            const arrow = this._gameObjectFactory.triangle(arrowCenter.x, arrowCenter.y, 0, 12, 6, 0, 12, 12);
            const angleDeg = getAngleForRotation(this, move);
            arrow.setAngle(angleDeg - 90);
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
        this._updateArrowsGraphic();
    }

    private _removeArrows(): void {
        this.arrowsGraphic.forEach(i => i.destroy(true));
        this.arrowsGraphic = [];
    }

    private _updateArrowsGraphic(): void {
        this.arrowsGraphic.forEach(arrowGraphic => {
            const toPosition = arrowGraphic.getData('toPosition');
            const isDisabled = this.possibleMoves.find(p => p.x === toPosition.x && p.y === toPosition.y)?.disabled;
            const arrowCenter = getPositionAfterMoving(this, toPosition, this.size / 1.5);
            arrowGraphic.setPosition(arrowCenter.x, arrowCenter.y)
            arrowGraphic.setFillStyle(isDisabled ? COLOR_PALETTE.ROAD :  this.color);
            arrowGraphic.setStrokeStyle(1, 0x000000);
        })
    }

    createSpawnInterval(): void {
        clearInterval(this._spawnIntervalToClear);
        this._spawnIntervalToClear = setInterval(() => {
            this._onSpawn && this._onSpawn(this);
        }, this.spawnInterval);
    }

    subscribeOnSpawn(cb: (spawner: Spawner) => void): void {
        this._onSpawn = cb;
    }

    makeDamage(mass: number): void {
        this._currentHP -= mass;
        if (this._currentHP <= 0) {
            this._noHP$.next();
        }
    }

    restoreHP(mass: number): void {
        this._currentHP += mass;
        if (this._currentHP > this.maxHP) {
            this._currentHP = this.maxHP;
        }
    }

    makeNeutral(): void {
        this.team = NO_TEAM;
        this.color = COLOR_PALETTE.NEUTRAL;
        this._currentHP = this.maxHP;
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
        this.graphic.setStrokeStyle(1,0x131313);
        this.graphic.setScale(this.size / this._originSize);
        this.textGraphic.setText(`${Math.round(this._currentHP / this.maxHP * 100)}%\nlvl ${this.level}`);
        this.textGraphic.setPosition(this.x - 12, this.y - 10);
        this._updateArrowsGraphic();
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
        this._noHP$.complete();
        this._click$.complete();
        this._onSpawn = null;
        this.graphic.destroy();
        this.textGraphic.destroy();
    }
}

