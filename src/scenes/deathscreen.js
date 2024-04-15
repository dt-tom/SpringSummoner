import * as constants from '../constants.js';


export class DeathScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DeathScene' });
    }

    preload () {
        this.load.audio('soundtrack', 'assets/sounds/soundtrack.mp3');
        this.load.audio('sandstorm', 'assets/sounds/sandstorm.wav');
        this.load.audio('leavesSound', 'assets/sounds/bush-sound.mp3');
    }

    create() {
        //this.cameras.main.setBackgroundColor('#D2B48C'); // Dusty yellow color
        this.cameras.main.setBackgroundColor('rgba(210, 180, 140, 100)');

        // Title
        this.add.text(constants.canvasWidth / 2, constants.canvasHeight / 2, 'You Died.', {
            fontSize: '32px', fill: '#000'
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(constants.canvasWidth / 2, constants.canvasHeight / 2 + 40, 'Refresh to play again', {
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

        
    }
}
