import * as constants from '../constants.js';


export class DeathScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DeathScene' });
    }

    preload () {
    }

    create() {
        //this.cameras.main.setBackgroundColor('#D2B48C'); // Dusty yellow color
        this.cameras.main.setBackgroundColor('rgba(210, 180, 140, 100)');

        // Title
        this.add.text(constants.canvasWidth / 2, constants.canvasHeight / 2, 'You Died.', {
            fontSize: '32px', fill: '#000'
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(constants.canvasWidth / 2, constants.canvasHeight / 2 + 40, 'Click to play again', {
            fontSize: '16px', fill: '#000'
        }).setOrigin(0.5);

        this.input.on('pointerup', this.clickUpHandler.bind(this))
    }

    clickUpHandler() {
        this.restartGame()
    }

    restartGame() {
        this.scene.get('GameScene').scene.stop()
        this.scene.get('Scoreboard').scene.stop()
        this.scene.start('GameScene', { reset: true })
        this.scene.stop()
    }
}
