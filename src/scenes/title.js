import * as constants from '../constants.js';

/**
 * TitleScene is the first thing a player sees, and displays our title and lets
 * the user start the game.
 */
export class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
    }

    preload () {
        this.load.audio('soundtrack', 'assets/sounds/soundtrack.mp3');
        this.load.audio('sandstorm', 'assets/sounds/sandstorm.wav');
        this.load.audio('leavesSound', 'assets/sounds/bush-sound.mp3');
    }

    create() {
        this.cameras.main.setBackgroundColor('#D2B48C'); // Dusty yellow color

        this.tutorialTimer = 5;

        // Title
        this.add.text(constants.canvasWidth / 2, constants.canvasHeight / 2, 'Spring Summoner', {
            fontSize: '32px', fill: '#000'
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(constants.canvasWidth / 2, constants.canvasHeight / 2 + 40, 'Click anywhere to start', {
            fontSize: '16px', fill: '#000'
        }).setOrigin(0.5);

        // Tutorial subtitle
        this.tutorialText = this.add.text(constants.canvasWidth / 2, constants.canvasHeight / 2 + 80, 'Tutorial in ' + this.tutorialTimer.toString(), {
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

        // Click handler that starts the game
        this.input.on('pointerdown', () => {
            this.tweens.add({
                targets: sandstorm,
                volume: 0,
                duration: 1000,
            })
            setTimeout(() => {this.scene.start('GameScene')}, 1000);  // Time is in milliseconds
        }, this);

        this.interval = setInterval(() => {

            this.tutorialTimer -= 1;
            
            this.tutorialText.setText('Tutorial in ' + this.tutorialTimer.toString());
            if(this.tutorialTimer <= 0){
                clearInterval(this.interval);
                this.scene.stop();
                this.scene.start('TutorialScene');
            }
        }, 1000)
    
    }
}
