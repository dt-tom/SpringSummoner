import * as constants from '../constants.js';

/**
 * TitleScene is the first thing a player sees, and displays our title and lets
 * the user start the game.
 */
export class TutorialScene extends Phaser.Scene {
    constructor() {
        super('TutorialScene');
    }

    preload () {
        this.load.audio('soundtrack', 'assets/sounds/soundtrack.mp3');
        this.load.audio('sandstorm', 'assets/sounds/sandstorm.wav');
        this.load.audio('leavesSound', 'assets/sounds/bush-sound.mp3');
        this.load.spritesheet('swipeleft', 'assets/Swipeleft-sheet.png', {
            frameWidth: 128, frameHeight: 128,
        });
        this.load.spritesheet('swiperight', 'assets/Swiperight-sheet.png', {
            frameWidth: 128, frameHeight: 128,
        });
        this.load.spritesheet('swipeup', 'assets/Swipeup-sheet.png', {
            frameWidth: 128, frameHeight: 128,
        });
        this.load.spritesheet('swipedown', 'assets/Swipedown-sheet.png', {
            frameWidth: 128, frameHeight: 128,
        });
        this.load.spritesheet('ultrune', 'assets/ultrune.png', {
            frameWidth: 128, frameHeight: 128,
        });
        this.load.image('oasis', 'assets/oasis-v2.png');
        this.load.image('fruit1', 'assets/special_fruit.png');
        this.load.image('fruit2', 'assets/pink_fruit.png');
        this.load.image('fruit3', 'assets/blue_fruit.png');
    }

    create() {
        this.cameras.main.setBackgroundColor('#D2B48C'); // Dusty yellow color

        this.gameObject = this.physics.add.sprite(constants.canvasWidth / 2, constants.canvasHeight / 2 - 140, 'swipeleft');
        this.gameObject.setScale(3);

        this.page = 0;

        this.swipeAnimation = this.anims.create({
            key: 'swipeLeftAnimation',
            frames: this.anims.generateFrameNumbers('swipeleft', { start: 0, end: 6}),
            frameRate: 10,
            repeat: -1,
        });
        this.swipeAnimation = this.anims.create({
            key: 'swipeRightAnimation',
            frames: this.anims.generateFrameNumbers('swiperight', { start: 0, end: 6}),
            frameRate: 10,
            repeat: -1,
        });
        this.swipeAnimation = this.anims.create({
            key: 'swipeUpAnimation',
            frames: this.anims.generateFrameNumbers('swipeup', { start: 0, end: 6}),
            frameRate: 10,
            repeat: -1,
        });
        this.swipeAnimation = this.anims.create({
            key: 'swipeDownAnimation',
            frames: this.anims.generateFrameNumbers('swipedown', { start: 0, end: 6}),
            frameRate: 10,
            repeat: -1,
        });
        this.swipeAnimation = this.anims.create({
            key: 'ultRuneAnimation',
            frames: this.anims.generateFrameNumbers('ultrune', { start: 0, end: 15}),
            frameRate: 10,
            repeat: -1,
        });

        //this.gameObject.play('swipeLeftAnimation');


        // Subtitle
        this.text1 = this.add.text(constants.canvasWidth / 2, constants.canvasHeight / 2 + 40, 'Swipe up or down to summon a tree', {
            fontSize: '16px', fill: '#000'
        }).setOrigin(0.5);

        this.text2 = this.add.text(constants.canvasWidth / 2, constants.canvasHeight / 2 + 80, 'It slows and damages enemies that run through it', {
            fontSize: '16px', fill: '#000'
        }).setOrigin(0.5);

        this.text3 = this.add.text(constants.canvasWidth / 2, constants.canvasHeight / 2 + 120, 'Click to continue', {
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

        this.swipeDirection = 0;
        setInterval(() => {
            if(this.swipeDirection == -1){
                return;
            }
            this.swipeDirection == 0 ? this.swipeDirection = 1 : this.swipeDirection = 0;
            this.swipeDirection == 0 ? this.gameObject.play('swipeUpAnimation') : this.gameObject.play('swipeDownAnimation');
        }, 600);

        
        // Click handler that starts the game
        this.input.on('pointerdown', () => {
            console.log(this.page);
            this.page += 1;
            switch (this.page){
                case 1:
                    this.swipeDirection = -1;
                    this.gameObject.play('swipeLeftAnimation');
                    this.text1.setText("Swipe left to summon a grunt ally. It costs mana.");
                    this.text2.setText("It will fight on your behalf");
                    break;
                case 2:
                    this.gameObject.play('swipeRightAnimation')
                    this.text1.setText("Swipe right to summon a bomb ally. It also cost mana.");
                    this.text2.setText("It will fight on your behalf");
                    break;
                case 3:
                    this.gameObject.destroy();
                    this.gameObject = this.physics.add.sprite(constants.canvasWidth / 2, constants.canvasHeight / 2 - 140, 'oasis');
                    this.gameObject.setOrigin(0.5);
                    this.text1.setText("You spawn on the oasis. It will regenerate your mana.");
                    this.text2.setText("You also regenerate mana passively.");
                    break;
                case 4:
                    this.gameObject.destroy();
                    this.gameObject = this.physics.add.sprite(constants.canvasWidth / 2 - 60, constants.canvasHeight / 2 - 140, 'fruit1');
                    this.gameObject2 = this.physics.add.sprite(constants.canvasWidth / 2, constants.canvasHeight / 2 - 140, 'fruit2');
                    this.gameObject3 = this.physics.add.sprite(constants.canvasWidth / 2 + 60, constants.canvasHeight / 2 - 140, 'fruit3');
                    this.gameObject.setOrigin(0.5);
                    this.gameObject2.setOrigin(0.5);
                    this.gameObject3.setOrigin(0.5);
                    this.gameObject.setScale(2);
                    this.gameObject2.setScale(2);
                    this.gameObject3.setScale(2);
                    this.text1.setText("You can pick up fruits from around the map.");
                    this.text2.setText("They provide speed, health, and mana, respectively.");
                    break;
                case 5:
                    this.gameObject.destroy();
                    this.gameObject2.destroy();
                    this.gameObject3.destroy();
                    this.gameObject = this.physics.add.sprite(constants.canvasWidth / 2, constants.canvasHeight / 2 - 160, 'ultrune');
                    this.gameObject.setScale(3);
                    this.text1.setText("With full mana, draw the runes above to summon your greatest ally.");
                    this.text2.setText("It will charge in the direction of your final swipe.");
                    this.gameObject.play('ultRuneAnimation');
                    break;
                case 6:
                    this.gameObject.destroy();
                    this.text1.setText("Cover the ground in greenery to increase your score.");
                    this.text2.setText("Victory awaits.");
                    this.text3.setText("Click to begin game.");
                    break;
                case 7:
                    this.tweens.add({
                        targets: sandstorm,
                        volume: 0,
                        duration: 1000,
                    })
                    setTimeout(() => {this.scene.start('GameScene')}, 1000);  // Time is in milliseconds
            }
        }, this);

    }
}
