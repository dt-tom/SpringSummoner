import * as constants from '../constants.js'
import { game } from "../main.js"

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
        this.load.spritesheet('dirtParticle', 'assets/dirt-particle.png', {
            frameWidth: 6, frameHeight: 6,
        });
        this.load.spritesheet('bugSpawn', 'assets/bug-spawn.png', {
            frameWidth: 32, frameHeight: 32,
        });
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

        // create animations
        this.anims.create({
            key: 'bugMoveAnimation',
            frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 3}),
            frameRate: 20,
            repeat: -1,
        })
        this.anims.create({
            key: 'bugSpawnAnimation',
            frames: this.anims.generateFrameNumbers('bugSpawn', { start: 0, end: 8}),
            frameRate: 10,
            repeat: -1,
        })
        this.anims.create({
            key: 'dirtTumble',
            frames: this.anims.generateFrameNumbers('dirtParticle', { start: 0, end: 7}),
            frameRate: 10,
            repeat: -1,
        })
    
        // make enemies
        this.enemies = this.physics.add.group({
            createCallback: (enemy) => {
                enemy.isSpawned = false;
            }
        });

        for(let i = 0; i < NUMBER_OF_ENEMIES; i++) {
            const spawnX = Math.random() * 400;
            const spawnY = Math.random() * 400;
            const enemy = this.enemies.create(spawnX, spawnY, 'bugSpawn');
            this.add.particles(spawnX, spawnY, 'dirtParticle', {
                speed: { min: 1, max: 20 },
                maxParticles: 20,
                anim: 'dirtTumble',
                duration: 3000,
                emitZone: { source: new Phaser.Geom.Circle(0, 0, 30) }  // Emit particles within a 4 pixel radius
            });
            this.time.delayedCall(1000, (e) => { 
                e.isSpawned = true;
                this.enemies.playAnimation('bugMoveAnimation');
             }, [enemy], this);
        }
        this.enemies.playAnimation('bugSpawnAnimation');

        this.physics.add.collider(this.enemies, this.enemies); 
        this.physics.add.collider(this.player, this.enemies);
        this.physics.add.collider(this.attackingAllies, this.enemies); 
    }

    /**f.log
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
            if (enemy.isSpawned) {
                this.physics.moveTo(enemy, this.player.x + Math.random() * 100, this.player.y + Math.random() * 100, moveSpeed)
            }
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
