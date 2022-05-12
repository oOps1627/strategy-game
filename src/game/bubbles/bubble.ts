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

    readonly id = String(Date.now() + Math.random());
    movedFrom: IPosition;
    team: string;
    size: number;
    graphic: Ellipse;

    get mass(): number {
        return this._mass;
    }

    constructor(params: IBubbleConstructorParams) {
        this.team = params.spawner.team;
        this._mass = params.spawner.bubbleMass;
        this.movedFrom = {x: params.spawner.x, y: params.spawner.y};
        this._setSize();
        this._createGraphic(params.gameObjectFactory, params.spawner);
        this._moveTo = new MoveTo(this.graphic, {speed: 80});
    }

    setMass(mass: number): void {
        this._mass = mass;
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

    private _createGraphic(gameObjectFactory: GameObjectFactory, spawner: Spawner): void {
        this.graphic = gameObjectFactory.ellipse(spawner.x, spawner.y, this.size, this.size);
        this.graphic.setFillStyle(spawner.color);
        this.graphic.setData('id', this.id);
    }

    private _setSize(): void {
        const radius = Math.sqrt(this.mass * 3.14);

        this.size = radius * 2;
    }

    destroy(): void {
        this._moveTo.destroy();
        this.graphic.destroy(true);
    }
}