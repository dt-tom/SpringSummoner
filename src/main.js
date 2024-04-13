import * as constants from './constants.js';

class Example extends Phaser.Scene
{
    constructor ()
    {
        super();
    }

    preload ()
    {
        this.load.image('me', 'assets/druid_base.png');
        this.load.image('ally', 'assets/bomb.png');
        this.load.spritesheet('enemy', 'assets/bug-move.png', { frameWidth: 32, frameHeight: 32});
        this.load.image('ground', 'assets/desert-block.png')
    }

  

    create ()
    {
        // consts
        const NUMBER_OF_ENEMIES = 10;
        //  Set the camera and physics bounds to be the size of 4x4 bg images
        this.cameras.main.setBounds(0, 0, 1920 * 2, 1080 * 2);
        this.cameras.main.setZoom(2);  // 2x our assets visually
        this.physics.world.setBounds(0, 0, 1920 * 2, 1080 * 2);

        //  Background/desert tiles
        this.add.tileSprite(0, 0, constants.mapWidth, constants.mapHeight, 'ground').setOrigin(0, 0);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.player = this.physics.add.image(400, 300, 'me');

        this.player.setCollideWorldBounds(true);

        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);

        // allies
        this.allies = this.physics.add.group();

        this.input.on('pointerdown', e => {
            console.log(e.worldX, e.worldY);

            this.allies.create(e.worldX, e.worldY, 'ally')
        })

        // make enemies
        this.enemies = this.physics.add.group();

        for(let i = 0; i < NUMBER_OF_ENEMIES; i++) 
        {
            this.enemies.create(Math.random() * 400, Math.random() * 400, 'enemy');
        }

        this.anims.create({
            key: 'bug-move',
            frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 4}),
            frameRate: 20,
            repeat: -1,
        })
        this.enemies.playAnimation('bug-move');

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
    
        for(const member of this.enemies.getChildren())
        {
            const vector = new Phaser.Math.Vector2(
                this.player.x - member.x,
                this.player.y - member.y
            );
            vector.normalizeRightHand();
            member.rotation = vector.angle();
            this.physics.moveTo(member, this.player.x + Math.random() * 100, this.player.y + Math.random() * 100, 150)
        }

        for(const ally of this.allies.getChildren())
        {
            // find nearest enemy and move towards her
            closest_enemy = this.enemies.getClosestTo(ally)
            this.physics.moveTo(ally, closest_enemy, 150)
        }


    }
}

const config = {
    type: Phaser.AUTO,
    width: constants.canvasWidth,
    height: constants.canvasHeight,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
    },
    scene: Example
};

const game = new Phaser.Game(config);
