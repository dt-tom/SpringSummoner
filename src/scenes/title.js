import * as constants from '../constants.js';
import { globalVolume } from '../constants.js';


let startingGame = false;

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

        this.soundtrack = this.sound.add('soundtrack');
        this.soundtrack.play();
        this.soundtrack.setLoop(true);
        this.soundtrack.setVolume(0.2 * globalVolume);
        this.sandstorm = this.sound.add('sandstorm', { loop:true });
        this.sandstorm.addMarker({name: 'sandstormWhoosh'});
        this.sandstorm.play('sandstormWhoosh');
        this.sandstorm.setVolume(0.04 * globalVolume);
        this.tweens.add({
            targets: this.sandstorm,
            volume: 0,
            duration: 4500,
        })

        // Click handler that starts the game
        this.input.on('pointerdown', () => {
            this.tweens.add({
                targets: this.sandstorm,
                volume: 0,
                duration: 1000,
            })
            setTimeout(() => {
                if (startingGame) {
                    return;
                }
                startingGame = true;
                this.scene.start('GameScene')
            }, 1000);  // Time is in milliseconds
            clearInterval(this.interval);
        }, this);

        this.interval = setInterval(() => {

            this.tutorialTimer -= 1;
            
            this.tutorialText.setText('Tutorial in ' + this.tutorialTimer.toString());
            if(this.tutorialTimer <= 0){
                this.scene.stop();
                this.scene.start('TutorialScene');
                clearInterval(this.interval);
            }
        }, 1000)
    
    }
}
