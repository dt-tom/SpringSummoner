/**
 * TitleScene is the first thing a player sees, and displays our title and lets
 * the user start the game.
 */
export class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#D2B48C'); // Dusty yellow color

        // Title
        this.add.text(400, 200, 'Spring Summoner', {
            fontSize: '32px', fill: '#000'
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(400, 240, 'Click anywhere to start', {
            fontSize: '16px', fill: '#000'
        }).setOrigin(0.5);

        // Click handler that starts the game
        this.input.on('pointerdown', () => {
            this.scene.start('GameScene');
        }, this);
    }
}
