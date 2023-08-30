import * as Phaser from "phaser";

class UI extends Phaser.Scene {
    coins: number;
    coinsText: Phaser.GameObjects.Text;
    coinIcon: Phaser.GameObjects.Image;

    constructor ()
    {
        super({key: 'UI'});
    }

    preload() {
        this.load.image('coin', 'assets/coin.png');
    }

    init ()
    {
        this.scene.moveUp();
        this.coins = 0;
    }

    create ()
    {
        this._initCoin();

        // Events
        this.registry.events.on('update_coins', (coins: number) => {
            this.coins = coins;
            this.coinsText.setText(String(this.coins));
        });
    }

    private _initCoin(): void {
        this.coinIcon = this.add.image(0, 0, 'coin').setScrollFactor(0);
        this.coinsText = this.add.text(0, 0, String(this.coins)).setScrollFactor(0);
        this._setCoinBlockPosition();
    }

    private _setCoinBlockPosition(): void {
        const canvas = this.sys.game.canvas;
        this.coinIcon.setPosition(canvas.width - 60, 17);
        this.coinsText.setPosition(canvas.width - 40, 10);
    }

    destroy() {
        this.registry.events.removeAllListeners();
    }
}

export default UI;
