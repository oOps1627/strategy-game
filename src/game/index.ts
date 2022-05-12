import * as Phaser from "phaser";
import Graphics = Phaser.GameObjects.Graphics;
import GameObjectWithBody = Phaser.Types.Physics.Arcade.GameObjectWithBody;
import Ellipse = Phaser.GameObjects.Ellipse;
import Group = Phaser.Physics.Arcade.Group;
import {NO_TEAM, Spawner} from "./spawners/spawner";
import {IMapPoint, IPosition} from "./models";
import {LEVEL1_MAP} from "./maps/level1.map";
import Rectangle = Phaser.GameObjects.Rectangle;
import {Bubble} from "./bubbles/bubble";

export class Level1 extends Phaser.Scene {
    map: IMapPoint[];
    graphics: Graphics;
    bubbleGroups = new Map<string, Group>();
    spawnerGroups = new Map<string, Group>();
    bubblesMap: { [bubbleId: string]: Bubble } = {};

    constructor() {
        super('level-1');
    }

    preload() {
        this.graphics = this.add.graphics({
            lineStyle: {width: 10, color: 0xfff888},
        });
    }

    create() {
        this.map = LEVEL1_MAP;

        this._setGroups();
        this._drawPaths();
        this._createSpawners();
        this._createBubblesCollides();
        this._createSpawnersCollides();

        this.map.filter(i => !!i.spawner).forEach(point => {
            const spawner = <Spawner>point.spawner;
            spawner.subscribeOnSpawn(() => {
                const bubble = this._createBubble(spawner);
                this._moveBubble(bubble, point.possibleMoves);
            })
        })
    }

    private _createBubble(spawner: Spawner): Bubble {
        const bubble = new Bubble({spawner, gameObjectFactory: this.add});
        this.bubbleGroups.get(spawner.team)?.add(bubble.graphic);
        this.bubblesMap[bubble.id] = bubble;

        return bubble;
    }

    private _moveBubble(bubble: Bubble, possibleMoves: IPosition[]): void {
        const direction = this._getMoveDirection(possibleMoves);

        bubble.moveTo(direction, (bubbleToMove) => {
            let point = <IMapPoint>this._findPointByPosition(bubbleToMove.graphic);
            return this._getMoveDirection(point.possibleMoves, bubbleToMove.movedFrom);
        });
    }

    private _getMoveDirection(possibleMoves: IPosition[], movedFrom?: IPosition): IPosition {
        let moves = possibleMoves.filter(p => !movedFrom || (p.x !== movedFrom.x || p.y !== movedFrom.y));

        return moves[getRandomInteger(0, moves.length - 1)];
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
            const spawner = point.spawner;

            if (spawner) {
                let rect = this.add.rectangle(point.position.x, point.position.y, spawner.maxHP / 14, spawner.maxHP / 14);
                rect.setFillStyle(spawner.color);
                rect.setData('spawner', point.spawner);
                spawner.subscribeOnDestroy(() => this._onSpawnerDestroy(rect));
                this.spawnerGroups.get(spawner.team)?.add(rect);
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

        this.spawnerGroups.set(NO_TEAM, this.physics.add.group().setName(NO_TEAM));
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
                const collider = this.physics.add.collider(spawnerGroup, bubbleGroup, <any>this._onBubbleCollidesWithSpawner.bind(this));
                collider.overlapOnly = true;
            });
        });
    }

    private _onBubbleCollidesWithSpawner(spawnerGraphic: Ellipse, bubbleGraphic: Ellipse): void {
        const spawner: Spawner = spawnerGraphic.getData('spawner');
        const bubble: Bubble = this._getBubbleByGraphic(bubbleGraphic);

        const isSameTeam = spawner.team === bubble.team;

        if (isSameTeam) {
            this._onBubbleCollidesWithAllySpawner(spawnerGraphic, bubbleGraphic);
        } else {
            if (spawner.team === NO_TEAM) {
                this._onBubbleCollidesWithNeutralSpawner(spawnerGraphic, bubbleGraphic);
            } else {
                this._onBubbleCollidesWithEnemySpawner(spawnerGraphic, bubbleGraphic);
            }
        }

        spawner.updateSpawnerGraphic(spawnerGraphic);
    }

    private _onBubbleCollidesWithAllySpawner(spawnerGraphic: Ellipse, bubbleGraphic: Ellipse): void {
        const spawner: Spawner = spawnerGraphic.getData('spawner');
        if (spawner.maxHP === spawner.currentHP)
            return;

        const bubble: Bubble = this._getBubbleByGraphic(bubbleGraphic);

        if (bubble.mass + spawner.currentHP > spawner.maxHP) {
            const neededMass = spawner.maxHP - spawner.currentHP;
            spawner.restoreHP(neededMass);
            bubble.setMass(bubble.mass - neededMass);
        } else {
            spawner.restoreHP(bubble.mass);
            bubbleGraphic.destroy(true);
        }
    }

    private _onBubbleCollidesWithNeutralSpawner(spawnerGraphic: Ellipse, bubbleGraphic: Ellipse): void {
        const spawner: Spawner = spawnerGraphic.getData('spawner');
        const bubble: Bubble = this._getBubbleByGraphic(bubbleGraphic);

        spawner.capture({mass: bubble.mass, team: bubble.team, color: bubbleGraphic.fillColor});
        spawner.subscribeOnSpawn(() => {
            const point = <IMapPoint>this._findPointByPosition(spawner);
            const bubble = this._createBubble(spawner);
            this._moveBubble(bubble, point.possibleMoves);
        })
        this._destroyBubble(bubble);
        spawnerGraphic.setData('spawner', spawner);
        spawner.createSpawnInterval();
        spawner.subscribeOnDestroy(() => this._onSpawnerDestroy(<any>spawnerGraphic));
        this.spawnerGroups.get(NO_TEAM)?.remove(spawnerGraphic);
        this.spawnerGroups.get(bubble.team)?.add(spawnerGraphic);
    }

    private _onBubbleCollidesWithEnemySpawner(spawnerGraphic: Ellipse, bubbleGraphic: Ellipse): void {
        const spawner: Spawner = spawnerGraphic.getData('spawner');
        const bubble = this._getBubbleByGraphic(bubbleGraphic);

        spawner.makeDamage(bubble.mass);
        this._destroyBubble(bubble);
    }

    private _getBubbleByGraphic(graphic: Ellipse | GameObjectWithBody): Bubble {
        return this.bubblesMap[graphic.getData('id')];
    }

    private _findPointByPosition(position: IPosition): IMapPoint | undefined {
        return this.map.find(point => point.position.x === position.x && point.position.y === position.y);
    }

    private _onSpawnerDestroy(spawnerGraphics: Rectangle): void {
        const spawner: Spawner = spawnerGraphics.getData('spawner');
        this.spawnerGroups.get(spawner.team)?.remove(spawnerGraphics);
        spawner.destroy();
        spawnerGraphics.setData('spawner', spawner);
        this.spawnerGroups.get(NO_TEAM)?.add(spawnerGraphics);
        spawner.updateSpawnerGraphic(spawnerGraphics);
    }

    private _onBubblesCollide(bubble1Graphic: GameObjectWithBody, bubble2Graphic: GameObjectWithBody): void {
        const bubble1: Bubble = this._getBubbleByGraphic(bubble1Graphic);
        const bubble2: Bubble = this._getBubbleByGraphic(bubble2Graphic);
        bubble1.setMass(bubble1.mass - bubble2.mass);
        bubble2.setMass(bubble2.mass - bubble1.mass);

        if (bubble1.mass <= 0) {
            this._destroyBubble(bubble1);
        }
        if (bubble2.mass <= 0) {
            this._destroyBubble(bubble2);
        }
    }

    private _destroyBubble(bubble: Bubble): void {
        delete this.bubblesMap[bubble.id];
        bubble.destroy();
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
