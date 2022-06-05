import { IMap } from "./maps/map";
import { GAME_STATE } from "./game-state";
import Phaser from "phaser";
import { COLOR_PALETTE } from "./color-palette";
import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin";
import GesturesPlugin from "phaser3-rex-plugins/plugins/gestures-plugin";
import { MainScene } from "./main-scene";

export function loadGame(map: IMap): void {
    GAME_STATE.currentMap = map;

    new Phaser.Game({
        type: Phaser.AUTO,
        backgroundColor: COLOR_PALETTE.BACKGROUND,
        width: map.width,
        height: map.height,
        parent: 'content',
        scene: MainScene,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: {y: 0, x: 0}
            }
        },
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
    });
}
