import {Spawner} from "./spawner";
import Menu from "phaser3-rex-plugins/templates/ui/menu/Menu";
import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import {Scene} from "phaser";

export interface ISpawnerMenuItem {
    name: string;
    handler: (spawner: Spawner, menu: Menu) => void;
    hidden?: boolean;
}

export class SpawnerMenu {
    static createSpawnerMenu(spawner: Spawner, scene: Scene, menuItems: ISpawnerMenuItem[]): Menu {
        const rexUI: UIPlugin = scene['rexUI'];

        const menu = rexUI.add.menu({
            x: spawner.x + spawner.size,
            y: spawner.y + spawner.size,
            items: menuItems.filter(i => !i.hidden),
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
            menuItems[i].handler(spawner, menu);
        })

        return menu;
    }
}