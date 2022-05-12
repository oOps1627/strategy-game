import {Spawner} from "../spawners/spawner";
import Ellipse = Phaser.GameObjects.Ellipse;
import GameObjectFactory = Phaser.GameObjects.GameObjectFactory;
import {IPosition} from "../models";
import MoveTo from 'phaser3-rex-plugins/plugins/moveto.js';

export interface IBubbleConstructorParams {
    spawner: Spawner;
    gameObjectFactory: GameObjectFactory;
}

export class Bubble {
    private _mass: number;
    private _moveTo: MoveTo;
    private _gameObjectFactory: GameObjectFactory;

    readonly id = String(Date.now()) + String(Math.random());
    movedFrom: IPosition;
    team: string;
    color: number;
    size: number;
    graphic: Ellipse;

    get mass(): number {
        return this._mass;
    }

    constructor(params: IBubbleConstructorParams) {
        this.team = params.spawner.team;
        this.color = params.spawner.color;
        this._mass = params.spawner.bubbleMass;
        this.movedFrom = {x: params.spawner.x, y: params.spawner.y};
        this._gameObjectFactory = params.gameObjectFactory;
        this._setSize();
        this._createGraphic(params.spawner);
        this._moveTo = new MoveTo(this.graphic, {speed: 80});
    }

    setMass(mass: number): void {
        this._mass = mass;

        if (mass < 0) {
            this._mass = 0;
        }
        const prevSize = this.size;
        this._setSize();
        this.updateGraphic(prevSize);
    }

    moveTo(position: IPosition, getNextDirection: (bubble: Bubble) => IPosition): void {
        if (!this.graphic || !position)
            return;

        this.movedFrom = {x: this.graphic.x, y: this.graphic.y};
        this._moveTo.moveTo(position.x, position.y);
        this._moveTo.on('complete', () => {
            this.moveTo(getNextDirection(this), getNextDirection);
        });
    }

    private _createGraphic(spawner: Spawner): void {
        this.graphic = this._gameObjectFactory.ellipse(spawner.x, spawner.y, this.size, this.size);
        this.graphic.setData('id', this.id);
        this.updateGraphic(this.size);
    }

    private _setSize(): void {
        const radius = Math.sqrt(this.mass * 3.14);
        this.size = radius * 2;
    }

    updateGraphic(prevSize: number): void {
        this.graphic.setFillStyle(this.color);
        this.graphic.setScale(this.size / prevSize);
    }

    destroy(): void {
        this._moveTo.destroy();
        this.graphic.destroy(true);
    }
}