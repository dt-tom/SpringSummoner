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

        const { wasd, arrowkeys } = this.createCursors()
        this.wasd = wasd
        this.arrowkeys = arrowkeys
        console.log(wasd, arrowkeys)

        this.player = this.physics.add.image(400, 300, 'me');

        this.player.setCollideWorldBounds(true);

        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);

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

    /**
     * @return an object containing two cursor objects, arrowkeys and wasd which
     * each have up down left and right key inputs.
     */
    createCursors() {  // TODO: could make this (game object) a parameter and move this elsewhere
        return {
            wasd: {
                up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
                left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
                right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            },
            arrowkeys: this.input.keyboard.createCursorKeys(),
        }
    }

    update () {
        // Since we have multiple inputs doing the same thing, setup (set
        // velocity to 0 must be done first)
        this.player.setVelocity(0);
        this.updateMovement(this.wasd)
        this.updateMovement(this.arrowkeys)

        for (let ally of this.allies.getChildren()) {
            // this.physics.moveToObject(entity, this.player, 150);
        }

        //             for (const enemy of this.enemies.getChildren()) {

            //     if (Phaser.Geom.Intersects.RectangleToRectangle(allyBounds, enemyBounds)) {
            //         this.physics.moveTo(enemy, this.player.x + Math.random() * 100, this.player.y + Math.random() * 100, 10)
            //     } else {
            //         this.physics.moveTo(enemy, this.player.x + Math.random() * 100, this.player.y + Math.random() * 100, 150)
            //     }
            // }
    
        for(const enemy of this.enemies.getChildren()) {
            const vector = new Phaser.Math.Vector2(
                this.player.x - enemy.x,
                this.player.y - enemy.y
            );
            vector.normalizeRightHand();
            enemy.rotation = vector.angle();
            var moveSpeed = constants.bugMovespeed;
            for (let ally of this.allies.getChildren()) {
                const allyBounds = ally.getBounds();
                const enemyBounds = enemy.getBounds();
                if (Phaser.Geom.Intersects.RectangleToRectangle(allyBounds, enemyBounds)) {
                    moveSpeed = constants.bugMovespeed * constants.bushSlow;
                }
            }
            this.physics.moveTo(enemy, this.player.x + Math.random() * 100, this.player.y + Math.random() * 100, moveSpeed)
        }
    }

    /**
     * @param cursors is an object with up down left and right as properties where the
     * value of each is an input key
     */
    updateMovement(cursor) {
        if (cursor.left.isDown) {
            this.player.setVelocityX(-500);
        }

        if (cursor.right.isDown) {
            this.player.setVelocityX(500);
        }

        if (cursor.up.isDown) {
            this.player.setVelocityY(-500);
        }

        if (cursor.down.isDown) {
            this.player.setVelocityY(500);
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
