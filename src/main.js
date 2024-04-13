import { mapWidth, mapHeight } from './constants.js';

class Example extends Phaser.Scene
{
    constructor ()
    {
        super();
    }

    preload ()
    {
        this.load.image('block', 'assets/star.png');
        this.load.image('ally', 'assets/bomb.png');
        this.load.image('enemy', 'assets/bomb.png');
        this.load.image('ground', 'assets/desert-block.png')
    }

  

    create ()
    {
        // consts
        const NUMBER_OF_ENEMIES = 10;
        //  Set the camera and physics bounds to be the size of 4x4 bg images
        this.cameras.main.setBounds(0, 0, 1920 * 2, 1080 * 2);
        this.physics.world.setBounds(0, 0, 1920 * 2, 1080 * 2);

        //  Background/desert tiles
        this.add.tileSprite(0, 0, mapWidth, mapHeight, 'ground').setOrigin(0, 0);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.player = this.physics.add.image(400, 300, 'block');

        this.player.setCollideWorldBounds(true);

        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);

        this.allies = this.physics.add.group();

        this.input.on('pointerdown', e => {
            console.log(e.downX, e.downY);

            this.allies.create(e.downX, e.downY, 'ally')
        })

        // make enemies
        this.enemies = this.physics.add.group();

        for(let i = 0; i < NUMBER_OF_ENEMIES; i++) 
        {
            this.enemies.create(Math.random() * 400, Math.random() * 400, 'enemy');
        }

        this.physics.add.collider(this.player, this.enemies);
        this.physics.add.collider(this.enemies, this.enemies);  
    }

    update ()
    {
        this.player.setVelocity(0);

        if (this.cursors.left.isDown)
        {
            this.player.setVelocityX(-500);
        }
        else if (this.cursors.right.isDown)
        {
            this.player.setVelocityX(500);
        }

        if (this.cursors.up.isDown)
        {
            this.player.setVelocityY(-500);
        }
        else if (this.cursors.down.isDown)
        {
            this.player.setVelocityY(500);
        }

        for (let entity of this.allies.getChildren()) {
            this.physics.moveToObject(entity, this.player, 150);
        }
    
        for(const member of this.enemies.getChildren())
        {
            //this.physics.moveTo(member, Math.random() * 10, Math.random() * 10);
            this.physics.moveTo(member, this.player.x + Math.random() * 100, this.player.y + Math.random() * 100, 150)
        }


    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
    },
    scene: Example
};

const game = new Phaser.Game(config);
