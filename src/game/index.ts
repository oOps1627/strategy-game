import * as Phaser from "phaser";
import Graphics = Phaser.GameObjects.Graphics;
import GameObjectWithBody = Phaser.Types.Physics.Arcade.GameObjectWithBody;
import Ellipse = Phaser.GameObjects.Ellipse;
import Group = Phaser.Physics.Arcade.Group;
import MoveTo from 'phaser3-rex-plugins/plugins/moveto.js';
import { ISpawnerConstructorParams, SpawnerFactory } from "./spawner-factory";

interface IPosition {
    x: number;
    y: number;
}

interface IPoint {
    position: IPosition;
    possibleMoves: IPosition[];
    spawner?: ISpawnerConstructorParams;
}

const spawnerFactory = new SpawnerFactory();

const map: IPoint[] = [
    {
        position: {x: 20, y: 400},
        possibleMoves: [
            {x: 20, y: 20},
            {x: 400, y: 200}
        ],
        spawner: spawnerFactory.newLevel1Spawner({
            team: 'A',
            color: 0x871734,
            x: 20,
            y: 400,
        })
    },
    {
        position: {x: 400, y: 200},
        possibleMoves: [
            {x: 20, y: 20},
            {x: 20, y: 400}
        ],
        spawner:  spawnerFactory.newLevel1Spawner({
            team: 'B',
            color: 0x341690,
            x: 400,
            y: 200,
        })
    },
    {
        position: {x: 20, y: 20},
        possibleMoves: [
            {x: 20, y: 400},
            {x: 400, y: 200}
        ],
        spawner:  spawnerFactory.newLevel1Spawner({
            team: 'C',
            color: 0x618234,
            x: 20,
            y: 20,
        })
    }
]

export class Level1 extends Phaser.Scene {
    map: IPoint[] = map;
    graphics: Graphics;
    bubbleGroups = new Map<string, Group>();
    spawnerGroups = new Map<string, Group>();

    constructor() {
        super('level-1');
    }

    preload() {
        this.graphics = this.add.graphics({
            lineStyle: {width: 10, color: 0xfff888},
        });
    }

    create() {
        this._setGroups();
        this._drawPaths();
        this._createSpawners();
        this._createBubblesCollides();
        this._createSpawnersCollides();
        this.map.forEach(point => {
            const spawner = point.spawner;
            if (spawner) {
                setInterval(() => {
                    const bubble = this._createBubble(spawner, point.position);
                    this._moveBubble(bubble, point.possibleMoves);
                }, spawner.spawnInterval);
            }
        })
    }

    private _moveBubble(bubble: Ellipse, possibleMoves: IPosition[], moveTo: MoveTo = new MoveTo(bubble, {speed: 100})): void {
        const direction = possibleMoves[getRandomInteger(0, possibleMoves.length - 1)];
        if (!direction)
            return;

        bubble.setData('movedFrom', {x: bubble.x, y: bubble.y});
        moveTo.moveTo(direction.x, direction.y);

        moveTo.on('complete', (bubble, moveTo) => {
            let point = this.map.find(point => point.position.x === bubble.x && point.position.y === bubble.y);
            const movedFrom = bubble.getData('movedFrom');
            let moves = point?.possibleMoves.filter(p => (p.x !== movedFrom.x || p.y !== movedFrom.y));
            if (moves?.length) {
                this._moveBubble(bubble, [...moves], moveTo);
            }
        });
    }

    update(time: number, delta: number) {
        super.update(time, delta);
    }

    private _drawPaths(): void {
        this.map.forEach(point => {
            point.possibleMoves.forEach(possibleMove => {
                const line = new Phaser.Geom.Line(point.position.x, point.position.y, possibleMove.x, possibleMove.y);
                this.graphics.strokeLineShape(line);
            });
        });
    }

    private _createSpawners(): void {
        this.map.forEach(point => {
            if (point.spawner) {
                this.graphics.fillStyle(point.spawner.color);
                let rect = this.add.rectangle(point.position.x, point.position.y, 30, 30);
                rect.setData('team', point.spawner.team);
                rect.setData('HP', point.spawner.currentHP);
                rect.setData('maxHP', point.spawner.maxHP);
                rect.setFillStyle(point.spawner.color);
                this.spawnerGroups.get(point.spawner.team)?.add(rect);
            }
        });
    }

    private _setGroups(): void {
        this.map.forEach(point => {
            if (point?.spawner) {
                this.bubbleGroups.set(point.spawner.team, this.physics.add.group().setName(point.spawner.team));
                this.spawnerGroups.set(point.spawner.team, this.physics.add.group().setName(point.spawner.team));
            }
        });
    }

    private _createBubble(spawner: ISpawnerConstructorParams, position: IPosition): Ellipse {
        let size = this._getBubbleSizeByMass(spawner.bubbleMass);
        let item = this.add.ellipse(position.x, position.y, size, size);
        item.setFillStyle(spawner.color);
        item.setData('team', spawner.team);
        this._setBubbleMass(item, spawner.bubbleMass);
        this.bubbleGroups.get(spawner.team)?.add(item);

        return item;
    }

    private _createBubblesCollides(): void {
        const groups = [...this.bubbleGroups.values()];

        for (let i = 0; i < groups.length - 1; i++) {
            for (let j = i + 1; j < groups.length; j++) {
                const collider = this.physics.add.collider(groups[i], groups[j], this._onBubblesCollide.bind(this));
                collider.overlapOnly = true;
            }
        }
    }

    private _createSpawnersCollides(): void {
        this.spawnerGroups.forEach(spawnerGroup => {
            this.bubbleGroups.forEach(bubbleGroup => {
                const collider = this.physics.add.collider(spawnerGroup, bubbleGroup, <any>this._onSpawnersCollide.bind(this));
                collider.overlapOnly = true;
            });
        });
    }

    private _onSpawnersCollide(spawner: Graphics, bubble: Ellipse): void {
        const isSameTeam = spawner.getData('team') === bubble.getData('team');
        const maxHP = spawner.getData('maxHP');
        const HP = spawner.getData('HP');
        const bubbleMass = this._getBubbleMass(bubble);

        if (isSameTeam) {
            const isSpawnerFullHP = maxHP === HP;

            if (!isSpawnerFullHP) {
                if (bubbleMass + HP > maxHP) {
                    const neededMass = maxHP - HP;
                    spawner.setData('HP', HP + neededMass);
                    this._setBubbleMass(bubble, bubbleMass - neededMass);
                } else {
                    spawner.setData('HP', HP + bubbleMass);
                    bubble.destroy(true);
                }

                this._updateSpawner(spawner);

            }
        } else {
            spawner.setData('HP', HP - bubbleMass);
            bubble.destroy(true);
            this._updateSpawner(spawner);

            if (spawner.getData('HP') <= 0) {
                const team = spawner.getData('team');
                spawner.destroy(true);

                if (!this.spawnerGroups.get(team)?.children?.size) {
                    this.spawnerGroups.get(team)?.destroy();
                }


            }
        }
    }

    private _updateSpawner(spawner: Graphics): void {
        const hp = spawner.getData('HP');
        const maxHP = spawner.getData('maxHP');
        const alpha = (hp / maxHP) > 1 ? 1 : hp / maxHP;

        spawner.setAlpha(alpha);
    }

    private _onBubblesCollide(bubble1: GameObjectWithBody, bubble2: GameObjectWithBody): void {
        const newBubble1Mass = this._getBubbleMass(bubble1) - this._getBubbleMass(bubble2);
        const newBubble2Mass = this._getBubbleMass(bubble2) - this._getBubbleMass(bubble1);
        if (newBubble1Mass <= 0) {
            bubble1.destroy(true);
        } else {
            this._setBubbleMass(<any>bubble1, newBubble1Mass);
        }

        if (newBubble2Mass <= 0) {
            bubble2.destroy(true);
        } else {
            this._setBubbleMass(<any>bubble2, newBubble2Mass);
        }
    }

    private _setBubbleMass(bubble: Ellipse, mass: number): void {
        bubble.setData('mass', mass);
        this._updateBubbleSize(bubble);
    }

    private _getBubbleMass(bubble: Ellipse | GameObjectWithBody): number {
        return bubble.getData('mass');
    }

    private _getBubbleSizeByMass(mass: number): number {
        const radius = Math.sqrt(mass * 3.14);

        return radius * 2;
    }

    private _updateBubbleSize(bubble: Ellipse): void {
        const mass = this._getBubbleMass(bubble);
        const radius = Math.sqrt(mass * 3.14);
        const currentRadius = bubble.width / 2;
        bubble.setScale(radius / currentRadius);
    }
}

export function loadGame(): void {
    const game = new Phaser.Game({
        type: Phaser.AUTO,
        backgroundColor: '#125555',
        width: 800,
        height: 600,
        parent: 'content',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: {y: 0, x: 0}
            }
        },
        scene: Level1
    });
}

function getRandomInteger(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
