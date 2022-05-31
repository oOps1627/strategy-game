import * as Phaser from "phaser";
import { IPossibleMove, NO_TEAM, Spawner } from "./spawners/spawner";
import { IPosition } from "./models";
import { Bubble } from "./bubbles/bubble";
import { getPositionAfterMoving, getRandomInteger, onlyUnique } from "./helpers";
import { IMap, IMapPoint, ISpawnerInfo } from "./maps/map";
import { SpawnersFactory } from "./spawners/spawners.factory";
import { Player } from "./player/player";
import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import Menu from "phaser3-rex-plugins/templates/ui/menu/Menu";
import { ISpawnerMenuItem, SpawnerMenu } from "./spawners/spawner-menu";
import { GAME_STATE } from "./game-state";
import GameObjectWithBody = Phaser.Types.Physics.Arcade.GameObjectWithBody;
import Ellipse = Phaser.GameObjects.Ellipse;
import Group = Phaser.Physics.Arcade.Group;
import Rectangle = Phaser.GameObjects.Rectangle;
import Pointer = Phaser.Input.Pointer;
import GesturesPlugin from "phaser3-rex-plugins/plugins/gestures-plugin";
import Pinch from "phaser3-rex-plugins/plugins/input/gestures/pinch/Pinch";
import {COLOR_PALETTE} from "./color-palette";

export class Level1 extends Phaser.Scene {
    player = new Player({
        startCoins: 80,
        team: 'TEAM_A'
    });
    points: IMapPoint[];
    bubbleGroups = new Map<string, Group>();
    spawnerGroups = new Map<string, Group>();
    bubblesMap: { [bubbleId: string]: Bubble } = {};
    spawnersMap: { [spawnerId: string]: Spawner } = {};
    coinsText: Phaser.GameObjects.Text;
    coinIcon: Phaser.GameObjects.Image;
    spawnerMenu: Menu | undefined;
    map: IMap;

    constructor() {
        super('level-1');
    }

    preload() {
        this.load.image('coin', 'assets/coin.png');
    }

    create() {
        this._initMap();
        this._subscribeOnBubblesCollides();
        this._subscribeOnSpawnersCollides();

        this._getSpawners().forEach(spawner => {
            if (spawner.team !== NO_TEAM) {
                spawner.subscribeOnSpawn((s) => this._onSpawnerSpawnBubble(s));
            }
        })

        setInterval(() => {
            this.player.addCoins(5);
            this._redrawCoins();
        }, 1000);

        window.addEventListener('resize', () => {
            this._setCameraBounds();
            this._setCoinBlockPosition();
        });
    }

    private _initMap(): void {
        this.map = <IMap>GAME_STATE.currentMap;
        this.points = this.map.points;
        this._drawPaths();

        this.map.teams.forEach(team => {
            this.spawnerGroups.set(team, this.physics.add.group());
            this.bubbleGroups.set(team, this.physics.add.group());
        });

        this.spawnerGroups.set(NO_TEAM, this.physics.add.group().setName(NO_TEAM));

        this._initSpawners(this.map.spawnersInfo);
        this._setCamera();
        this._initCoin();
    }

    private _setCamera(): void {
        const cam = this.cameras.main;
        this._setCameraBounds();
        let zooming = false;

        this.input.on('wheel', (e) => {
            if (zooming)
                return;

            const newZoom = this.cameras.main.zoomX - e.deltaY / 200;
            if (newZoom > 0.8 && newZoom < 2) {
                zooming = true;
                this.cameras.main.zoomTo(newZoom, 50);
                setTimeout(() => zooming = false, 50);
            }
        })

        const pinch = new Pinch(this);
        pinch.on('pinch', function (dragScale) {
            if (zooming)
                return;

            const newZoom = cam.zoom * dragScale.scaleFactor;
            if (newZoom > 0.8 && newZoom < 2) {
                zooming = true;
                cam.zoomTo(newZoom, 50);
                setTimeout(() => zooming = false, 50);
            }
        }, this);

        this.input.on('pointermove', function (p) {
            if (!p.isDown) return;
            cam.scrollX -= (p.x - p.prevPosition.x) / cam.zoom;
            cam.scrollY -= (p.y - p.prevPosition.y) / cam.zoom;
        });
    }

    private _setCameraBounds(): void {
        const documentEl = document.documentElement;
        const xBound = documentEl.scrollWidth - documentEl.clientWidth + this.map.width;
        const yBound = documentEl.scrollHeight - documentEl.clientHeight + this.map.height;
        this.cameras.main.setBounds(0, 0, xBound, yBound);
    }

    private _initSpawners(spawnersInfo: ISpawnerInfo[]): void {
        const spawnerFactory = new SpawnersFactory(this.add);

        spawnersInfo.forEach(params => {
            const spawner = spawnerFactory.newSpawner({...params, showArrows: params.team === this.player.team});
            this.spawnersMap[spawner.id] = spawner;
            this.spawnerGroups.get(spawner.team)?.add(spawner.graphic);
            spawner.subscribeWhenWillWithoutTeam(() => this._destroySpawner(spawner));
            spawner.subscribeOnClick((spawner, pointer) => this._onSpawnerClick(spawner, pointer));
        });
    }

    private _initCoin(): void {
        this.coinIcon = this.add.image(0, 0, 'coin').setScrollFactor(0);
        this.coinsText = this.add.text(0, 0, String(this.player.coins)).setScrollFactor(0);
        this._setCoinBlockPosition();
    }

    private _setCoinBlockPosition(): void {
        this.coinIcon.setPosition(document.documentElement.clientWidth - 60, 17);
        this.coinsText.setPosition(document.documentElement.clientWidth - 40, 10);
    }

    private _redrawCoins(): void {
        this.coinsText.setText(String(this.player.coins));
    }

    private _onSpawnerClick(spawner: Spawner, pointer: Pointer): void {
        if (!this.player.isSameTeam(spawner.team)) {
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
        const menuItems: ISpawnerMenuItem[] = [
            {
                name: `Вдосконалити (${spawner.costForUpgrade})`,
                hidden: !spawner.canUpgrade,
                handler: (spawner, menu) => {
                    if (spawner.canUpgrade && this.player.coins >= <number>spawner.costForUpgrade) {
                        this.player.removeCoins(<number>spawner.costForUpgrade);
                        spawner.upgrade();
                        this._redrawCoins();
                        menu.collapse();
                        this.spawnerMenu = undefined;
                    }
                }
            }
        ];

        return SpawnerMenu.createSpawnerMenu(spawner, this, menuItems);
    }

    private _createBubble(spawner: Spawner, position: IPosition): Bubble {
        const bubble = new Bubble({spawner, gameObjectFactory: this.add, startPosition: position});
        this.bubbleGroups.get(spawner.team)?.add(bubble.graphic);
        this.bubblesMap[bubble.id] = bubble;

        return bubble;
    }

    private _moveBubble(bubble: Bubble, moveDirection: IPosition): void {
        bubble.moveTo(moveDirection, (bubbleToMove) => {
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
            lineStyle: {width: 6, color: COLOR_PALETTE.ROAD},
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

        spawner.capture({
            mass: bubble.mass,
            team: bubble.team,
            color: bubbleGraphic.fillColor,
            drawArrows: bubble.team === this.player.team
        });

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
        const moveDirection = this._getMoveDirection([...spawner.possibleMoves]);
        const bubble = this._createBubble(spawner, getPositionAfterMoving(spawner, moveDirection, spawner.size));
        this._moveBubble(bubble, moveDirection);
    }

    private _checkGameOver(): void {
        const teams = this._getSpawners().map(i => i.team).filter(onlyUnique).filter(team => team !== NO_TEAM);
        if (teams.length === 1) {
            let winner = teams[0];
            alert(winner === this.player.team ? 'Ви виграли' : 'Ви програли');
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

export function loadGame(map: IMap): void {
    GAME_STATE.currentMap = map;

    new Phaser.Game({
        type: Phaser.AUTO,
        backgroundColor: COLOR_PALETTE.BACKGROUND,
        width: map.width,
        height: map.height,
        parent: 'content',
        plugins: {
            scene: [
                {
                    key: 'rexUI',
                    plugin: UIPlugin,
                    mapping: 'rexUI'
                },
                {
                    key: 'rexGestures',
                    plugin: GesturesPlugin,
                    mapping: 'rexGestures'
                }
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

