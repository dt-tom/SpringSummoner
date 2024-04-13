import * as constants from '../constants.js'

/**
 * GameScene is the main scene of Spring Summoner; it's where the actual game
 * lives
 */
export class GameScene extends Phaser.Scene {
    constructor () {
        super('GameScene');
        this.health = 100;
    }

    preload () {
        this.load.image('me', 'assets/druid_base.png');
        this.load.image('ally', 'assets/bush-v1.png');
        this.load.image('attackingAlly', 'assets/bomb.png');
        this.load.spritesheet('enemy', 'assets/bug-move.png', {
            frameWidth: 32, frameHeight: 32
        });
        this.load.image('sand', 'assets/desert-block.png')
        this.load.image('oasis', 'assets/oasis-inuse.png')
    }

    create () {
        // consts
        const NUMBER_OF_ENEMIES = 10;
        //  Set the camera and physics bounds to be the size of 4x4 bg images
        this.cameras.main.setBounds(0, 0, 1920 * 2, 1080 * 2);
        this.cameras.main.setZoom(2);  // 2x our assets visually
        this.physics.world.setBounds(0, 0, 1920 * 2, 1080 * 2);

        this.createWorld()

        const { wasd, arrowkeys } = this.createCursors()
        this.wasd = wasd
        this.arrowkeys = arrowkeys

        this.player = this.physics.add.image(400, 300, 'me');

        this.player.setCollideWorldBounds(true);

        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Allies are stationary helpers
        this.allies = this.physics.add.group();
        
        // Attacking allies engage with enemies
        this.attackingAllies = this.physics.add.group();

        this.input.mouse.disableContextMenu();

        this.input.on('pointerdown', e => {
            if(e.rightButtonDown()) {
                this.attackingAllies.create(e.worldX, e.worldY, 'attackingAlly')
            } else {
                this.allies.create(e.worldX, e.worldY, 'ally')
            }
            
        });

        console.log(this.health);

        // make enemies
        this.enemies = this.physics.add.group();

        for(let i = 0; i < NUMBER_OF_ENEMIES; i++) {
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
        this.physics.add.collider(this.attackingAllies, this.enemies); 
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

    /**
     * Create the tiled background and static foreground elements. Expects
     * assets named sand (tileable) and oasis (sprite) to be preloaded
     */
    createWorld() {
        //  Background/desert tiles
        this.add.tileSprite(0, 0, constants.mapWidth, constants.mapHeight, 'sand').setOrigin(0, 0);

        // Oasis
        let oasis = this.add.sprite(400, 300, 'oasis');
        oasis.setOrigin(0.5, 0.5);  // use the center of the sprite as the reference point for positioning
    }

    update () {
        // Since we have multiple inputs doing the same thing, setup (set
        // velocity to 0 must be done first)
        this.player.setVelocity(0);
        this.updateMovement(this.wasd)
        this.updateMovement(this.arrowkeys)

        for (let ally of this.attackingAllies.getChildren()) {
            let min_distance = Infinity;
            let min_enemy = null;
            for(let enemy of this.enemies.getChildren()) {
                let diff = Phaser.Math.Distance.Squared(enemy.x, enemy.y, ally.x, ally.y);
                if(diff < min_distance)
                {
                    min_distance = diff;
                    min_enemy = enemy;
                }
            }
            if(min_enemy) {
                this.physics.moveToObject(ally, min_enemy, 60);
            }
        }
    

        for(const enemy of this.enemies.getChildren()) {
            this.enemyDealDamage({
                pX: this.player.x,
                pY: this.player.y,
                eX: enemy.x,
                eY: enemy.y
            })

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

        this.updatePlayerState();
    }

    enemyDealDamage(positions, baseDamage = 1) {
        let dX = Math.sqrt((positions.pX - positions.eX) ** 2 + (positions.pY - positions.eY) ** 2);
        console.log(this.health, dX);
        if (dX < 50) this.health -= baseDamage;
    }

    updatePlayerState() {
        if (this.health <= 0) this.player.destroy();
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
