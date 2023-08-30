import * as Phaser from "phaser";

class Menu extends Phaser.Scene {
    startText: Phaser.GameObjects.Text;

    constructor() {
        super({
            key: 'Menu'
        });
    }

    init(data) {
    }

    create() {
        const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
        const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;
        this.startText = this.add.text(screenCenterX, screenCenterY, 'Click anywhere to start...', {
            fontSize: '30px'
        }).setOrigin(0.5);

        this.input.once(Phaser.Input.Events.POINTER_DOWN, () => {
            this.scene.start('Play');
        });
    }
}

export default Menu;
