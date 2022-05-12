import Ellipse = Phaser.GameObjects.Ellipse;
import {Spawner} from "../spawners/spawner";

export interface IBubbleConstructorParams {
    spawner: Spawner;
}

export class Bubble {
    private _mass: number;

    team: string;
    size: number;

    get mass(): number {
        return this._mass;
    }

    constructor(params: IBubbleConstructorParams) {
        this.team = params.spawner.team;
        this._mass = params.spawner.bubbleMass;

        this._setSize();
    }

    setMass(mass: number): void {
        this._mass = mass;
    }

    private _setSize(): void {
        const radius = Math.sqrt(this.mass * 3.14);

        this.size = radius * 2;
    }
}