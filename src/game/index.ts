import * as Phaser from "phaser";
import { IPossibleMove, NO_TEAM, Spawner } from "./spawners/spawner";
import { IPosition } from "./models";
import { Bubble } from "./bubbles/bubble";
import GameObjectWithBody = Phaser.Types.Physics.Arcade.GameObjectWithBody;
import Ellipse = Phaser.GameObjects.Ellipse;
import Group = Phaser.Physics.Arcade.Group;
import Rectangle = Phaser.GameObjects.Rectangle;
import { getRandomInteger, onlyUnique } from "./helpers";
import { IMap, IMapPoint } from "./maps/map";
import { LEVEL_1_MAP } from "./maps/level1.map";
import { SpawnersFactory } from "./spawners/spawners.factory";
import { IPlayerInfo } from "./player/player";
import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import Menu from "phaser3-rex-plugins/templates/ui/menu/Menu";
import Pointer = Phaser.Input.Pointer;

export class Level1 extends Phaser.Scene {
    player: IPlayerInfo = {
        coins: 80,
        team: "TEAM_A"
    }
    points: IMapPoint[];
    bubbleGroups = new Map<string, Group>();
    spawnerGroups = new Map<string, Group>();
    bubblesMap: { [bubbleId: string]: Bubble } = {};
    spawnersMap: { [spawnerId: string]: Spawner } = {};
    coinsText: Phaser.GameObjects.Text;
    spawnerMenu: Menu | undefined;

    constructor() {
        super('level-1');
    }

    preload() {
        this.load.image('coin', 'assets/coin.png');
    }

    create() {
        this._initMap(LEVEL_1_MAP);
        this._subscribeOnBubblesCollides();
        this._subscribeOnSpawnersCollides();

        this._getSpawners().forEach(spawner => {
            if (spawner.team !== NO_TEAM) {
                spawner.subscribeOnSpawn((s) => this._onSpawnerSpawnBubble(s));
            }
        })

        setInterval(() => {
            this.player.coins += 5;
            this._redrawCoins();
        }, 1000);
    }

    private _initMap(map: IMap): void {
        this.points = map.points;
        this._drawPaths();

        const spawnerFactory = new SpawnersFactory(this.add);

        map.teams.forEach(team => {
            this.spawnerGroups.set(team, this.physics.add.group());
            this.bubbleGroups.set(team, this.physics.add.group());
        });

        this.spawnerGroups.set(NO_TEAM, this.physics.add.group().setName(NO_TEAM));

        map.spawnersInfo.forEach(params => {
            const spawner = spawnerFactory.newSpawner({...params, showArrows: params.team === this.player.team});
            this.spawnersMap[spawner.id] = spawner;
            this.spawnerGroups.get(spawner.team)?.add(spawner.graphic);
            spawner.subscribeWhenWillWithoutTeam(() => this._destroySpawner(spawner));
            spawner.subscribeOnClick((spawner, pointer) => this._onSpawnerClick(spawner, pointer));
        });

        this._initCoin();
    }

    private _initCoin(): void {
        const coin = this.add.image(730, 17, 'coin');
        coin.setDisplaySize(20, 20)
        this.coinsText = this.add.text(750, 10, String(this.player.coins));
    }

    private _redrawCoins(): void {
        this.coinsText.setText(String(this.player.coins));
    }

    private _onSpawnerClick(spawner: Spawner, pointer: Pointer): void {
        if (spawner.team !== this.player.team) {
            return;
        }

        if (!this.spawnerMenu) {
            this.spawnerMenu = this._createSpawnerMenu(spawner);
        } else if (!this.spawnerMenu.isInTouching()) {
            this.spawnerMenu.collapse();
            this.spawnerMenu = undefined;
        }
    }

    private _createSpawnerMenu(spawner: Spawner): Menu {
        const rexUI: UIPlugin = this['rexUI'];
        const scene = this;
        const items: {name: string, type: string}[] = [];

        if (spawner.canUpgrade) {
            items.push({
                name: `Upgrade (${spawner.costForUpgrade})`,
                type: 'Upgrade'
            });
        }

        const menu = rexUI.add.menu({
            x: spawner.x + spawner.size,
            y: spawner.y + spawner.size,
            items: items,
            createButtonCallback: function (item, i, options) {
                return rexUI.add.label({
                    background: rexUI.add.roundRectangle(0, 0, 2, 2, 0, 0x717337),
                    text: scene.add.text(0, 0, item.name, {fontSize: '11px'}),
                    space: {
                        left: 5,
                        right: 5,
                        top: 5,
                        bottom: 5,
                    }
                })
            },
        });

        menu.on('button.click', (e, i) => {
            if (items[i].type === 'Upgrade') {
                if (spawner.canUpgrade && this.player.coins >= <number>spawner.costForUpgrade) {
                    this.player.coins -= <number>spawner.costForUpgrade;
                    spawner.upgrade();
                    this._redrawCoins();
                    menu.collapse();
                    this.spawnerMenu = undefined;
                }
            }
        })

        return menu;
    }

    private _createBubble(spawner: Spawner): Bubble {
        const bubble = new Bubble({spawner, gameObjectFactory: this.add});
        this.bubbleGroups.get(spawner.team)?.add(bubble.graphic);
        this.bubblesMap[bubble.id] = bubble;

        return bubble;
    }

    private _moveBubble(bubble: Bubble, possibleMoves: IPossibleMove[]): void {
        const direction = this._getMoveDirection(possibleMoves);

        bubble.moveTo(direction, (bubbleToMove) => {
            let spawner = this._findSpawnerByPosition(bubbleToMove.graphic);
            let point = <IMapPoint>this._findPointByPosition(bubbleToMove.graphic);

            return this._getMoveDirection(spawner ? spawner.possibleMoves : point.possibleMoves, bubbleToMove.movedFrom);
        });
    }

    private _getMoveDirection(possibleMoves: IPossibleMove[], movedFrom?: IPossibleMove): IPosition {
        let moves = possibleMoves.filter(p => !p.disabled && (!movedFrom || (p.x !== movedFrom.x || p.y !== movedFrom.y)));

        return {...moves[getRandomInteger(0, moves.length - 1)]};
    }

    private _drawPaths(): void {
        const graphics = this.add.graphics({
            lineStyle: {width: 6, color: 0xfff888},
        });

        graphics.setAlpha(0.1);
        this.points.forEach(point => {
            point.possibleMoves.forEach(possibleMove => {
                const line = new Phaser.Geom.Line(point.position.x, point.position.y, possibleMove.x, possibleMove.y);
                graphics.strokeLineShape(line);
            });
        });
    }

    private _subscribeOnBubblesCollides(): void {
        const groups = [...this.bubbleGroups.values()];

        for (let i = 0; i < groups.length - 1; i++) {
            for (let j = i + 1; j < groups.length; j++) {
                const collider = this.physics.add.collider(groups[i], groups[j], this._onBubblesCollide.bind(this));
                collider.overlapOnly = true;
            }
        }
    }

    private _subscribeOnSpawnersCollides(): void {
        this.spawnerGroups.forEach(spawnerGroup => {
            this.bubbleGroups.forEach(bubbleGroup => {
                const collider = this.physics.add.collider(spawnerGroup, bubbleGroup, <any>this._onBubbleCollidesWithSpawner.bind(this));
                collider.overlapOnly = true;
            });
        });
    }

    private _onBubbleCollidesWithSpawner(spawnerGraphic: Ellipse, bubbleGraphic: Ellipse): void {
        const spawner: Spawner = this._getSpawnerByGraphic(spawnerGraphic);
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

        spawner.updateGraphic();
    }

    private _onBubbleCollidesWithAllySpawner(spawnerGraphic: Ellipse, bubbleGraphic: Ellipse): void {
        const spawner: Spawner = this._getSpawnerByGraphic(spawnerGraphic);
        if (spawner.maxHP === spawner.currentHP)
            return;

        const bubble: Bubble = this._getBubbleByGraphic(bubbleGraphic);

        if (bubble.mass + spawner.currentHP > spawner.maxHP) {
            const neededMass = spawner.maxHP - spawner.currentHP;
            spawner.restoreHP(neededMass);
            bubble.setMass(bubble.mass - neededMass);
        } else {
            spawner.restoreHP(bubble.mass);
            this._destroyBubble(bubble);
        }
    }

    private _onBubbleCollidesWithNeutralSpawner(spawnerGraphic: Ellipse, bubbleGraphic: Ellipse): void {
        const spawner: Spawner = this._getSpawnerByGraphic(spawnerGraphic);
        const bubble: Bubble = this._getBubbleByGraphic(bubbleGraphic);

        spawner.capture({mass: bubble.mass, team: bubble.team, color: bubbleGraphic.fillColor});
        this._checkGameOver();
        spawner.subscribeOnSpawn((s) => this._onSpawnerSpawnBubble(s));
        this._destroyBubble(bubble);
        spawner.createSpawnInterval();
        spawner.subscribeWhenWillWithoutTeam(() => this._destroySpawner(spawner));
        this.spawnerGroups.get(NO_TEAM)?.remove(spawnerGraphic);
        this.spawnerGroups.get(bubble.team)?.add(spawnerGraphic);
    }

    private _onBubbleCollidesWithEnemySpawner(spawnerGraphic: Ellipse, bubbleGraphic: Ellipse): void {
        const spawner = this._getSpawnerByGraphic(spawnerGraphic);
        const bubble = this._getBubbleByGraphic(bubbleGraphic);

        spawner.makeDamage(bubble.mass);
        this._destroyBubble(bubble);
    }

    private _getBubbleByGraphic(graphic: Ellipse | GameObjectWithBody): Bubble {
        return this.bubblesMap[graphic.getData('id')];
    }

    private _getSpawnerByGraphic(graphic: Rectangle | GameObjectWithBody): Spawner {
        return this.spawnersMap[graphic.getData('id')];
    }

    private _findPointByPosition(position: IPosition): IMapPoint | undefined {
        return this.points.find(point => point.position.x === position.x && point.position.y === position.y);
    }

    private _findSpawnerByPosition(position: IPosition): Spawner | undefined {
        return this._getSpawners().find(s => s.x === position.x && s.y === position.y);
    }

    private _getSpawners(): Spawner[] {
        return Object.values(this.spawnersMap);
    }

    private _getBubbles(): Bubble[] {
        return Object.values(this.bubblesMap);
    }

    private _onBubblesCollide(bubble1Graphic: GameObjectWithBody, bubble2Graphic: GameObjectWithBody): void {
        const bubble1: Bubble = this._getBubbleByGraphic(bubble1Graphic);
        const bubble2: Bubble = this._getBubbleByGraphic(bubble2Graphic);

        if (!bubble1 || !bubble2) {
            console.warn('No bubble', bubble1, bubble2);
            return;
        }

        const bubble1Mass = bubble1.mass;
        const bubble2Mass = bubble2.mass;

        bubble1.setMass(bubble1Mass - bubble2Mass);
        bubble2.setMass(bubble2Mass - bubble1Mass);

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

    private _destroySpawner(spawner: Spawner): void {
        this.spawnerGroups.get(spawner.team)?.remove(spawner.graphic);
        this.spawnerGroups.get(NO_TEAM)?.add(spawner.graphic);
        spawner.makeWithoutTeam();
    }

    private _onSpawnerSpawnBubble(spawner: Spawner): void {
        const bubble = this._createBubble(spawner);
        this._moveBubble(bubble, [...spawner.possibleMoves]);
    }

    private _checkGameOver(): void {
        const teams = this._getSpawners().map(i => i.team).filter(onlyUnique).filter(team => team !== NO_TEAM);
        if (teams.length === 1) {
            alert(`${teams[0]} Win`);

            setTimeout(() => this.destroy())
        }
    }

    destroy(): void {
        this.bubbleGroups.forEach(group => group.destroy(true));
        this.spawnerGroups.forEach(group => group.destroy(true));
        this._getBubbles().forEach(i => i.destroy());
        this._getSpawners().forEach(i => i.destroy());
        this.game.destroy(false);
    }
}

export function loadGame(): void {
    new Phaser.Game({
        type: Phaser.AUTO,
        backgroundColor: '#125555',
        width: 800,
        height: 600,
        parent: 'content',
        plugins: {
            scene: [{
                key: 'rexUI',
                plugin: UIPlugin,
                mapping: 'rexUI'
            },
            ]
        },
        physics: {
            default: 'arcade',
            arcade: {
                gravity: {y: 0, x: 0}
            }
        },
        scene: Level1
    });
}

