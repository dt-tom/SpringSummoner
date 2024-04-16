import * as constants from '../constants.js';


export class WinScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WinScene' });
    }

    preload () {
        this.load.audio('soundtrack', 'assets/sounds/soundtrack.mp3');
        this.load.audio('sandstorm', 'assets/sounds/sandstorm.wav');
    }

    create() {
        //this.cameras.main.setBackgroundColor('#D2B48C'); // Dusty yellow color
        this.cameras.main.setBackgroundColor('rgba(210, 180, 140, 100)');

        // Title
        this.add.text(constants.canvasWidth / 2, constants.canvasHeight / 2, 'You Win!', {
            fontSize: '32px', fill: '#000'
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(constants.canvasWidth / 2, constants.canvasHeight / 2 + 40, 'Click to play again', {
            fontSize: '16px', fill: '#000'
        }).setOrigin(0.5);

        let soundtrack = this.sound.add('soundtrack');
        soundtrack.play();
        soundtrack.setLoop(true);
        soundtrack.setVolume(0.2);
        let sandstorm = this.sound.add('sandstorm', { loop:true });
        sandstorm.addMarker({name: 'sandstormWhoosh'});
        sandstorm.play('sandstormWhoosh');
        sandstorm.setVolume(0.03);

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
