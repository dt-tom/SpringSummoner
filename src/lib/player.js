import { HealthbarV2 } from '../lib/healthbar.js'
import { playerSpawn, playerSpeed, summonForFree } from '../constants.js'
import { AttackingAlly } from '../lib/attackingally.js'

/**
 *
 * Player is a the encapulated representation of our agent.
 *
 * X and Y are stored on the gameObject. HP should be stored on the healthbar
 * but is currently duplicated.
 */

let downPos = 0;
let upPos = 0;
export class Player {
    constructor(scene) {
        this.scene = scene
        console.log('Player:', 'constructed')
        this.firstUpdate = true
        this.playerSpeed = playerSpeed;
    }

    // Preload is called before scene load, with a copy of the scene
    preload() {
        this.scene.load.image('me', 'assets/main-character-inuse.png');
        this.scene.load.spritesheet('death', 'assets/main-character-death-animation-inuse.png', {
            frameWidth: 32, frameHeight: 32,
        })
        this.scene.load.spritesheet('walkFront', 'assets/main-character_walking_front_v1.png', {
            frameWidth: 32, frameHeight: 32,
        })
        this.scene.load.spritesheet('walkBack', 'assets/main_character_walking_back_v1.png', {
            frameWidth: 32, frameHeight: 32,
        })
        this.scene.load.spritesheet('oasisHeal', 'assets/oasis-heal-particle-v3.png', {
            frameWidth: 8, frameHeight: 8,
        })
        this.scene.load.audio('leavesSound', 'assets/sounds/bush-sound.mp3');
        console.log('Player:', 'preloaded')
    }

    // Create is called when the scene becomes active, once, after assets are
    // preloaded. It's expected that this scene will have aleady called preload
    create() {
        this.gameObject = this.scene.physics.add.sprite(playerSpawn.x, playerSpawn.y, 'walkBack');
        this.gameObject.setCollideWorldBounds(true);

        this.health = 100;
        this.healthbar = new HealthbarV2({
            scene: this.scene,
            height: 12,
            startingValue: 100,
            maxValue: 100,
            offsets: { x: 0, y: -35 },
        })
        this.mana = 200;
        this.manabar = new HealthbarV2({
            scene: this.scene,
            height: 6,
            startingValue: 200,
            maxValue: 500,
            colorFunc: () => ({ fg: 0x0000ff, bg: 0xffffff }),
            offsets: { x: 0, y: -28 },
        })

        let { wasd, arrowkeys } = createCursors(this.scene)
        this.wasd = wasd
        this.arrowkeys = arrowkeys

        this.gameObject.anims.create({
            key: 'deathAnimation',
            frames: this.gameObject.anims.generateFrameNumbers('death', { start: 0, end: 26}),
            frameRate: 12,
        });
        this.gameObject.anims.create({
            key: 'walkFrontAnimation',
            frames: this.gameObject.anims.generateFrameNumbers('walkFront', { start: 0, end: 3}),
            frameRate: 8,
        });
        this.gameObject.anims.create({
            key: 'walkBackAnimation',
            frames: this.gameObject.anims.generateFrameNumbers('walkBack', { start: 0, end: 3}),
            frameRate: 8,
        });

        // this one goes in scene since it's a particle
        this.scene.anims.create({
            key: 'oasisHealAnimation',
            frames: this.gameObject.anims.generateFrameNumbers('oasisHeal', { start: 0, end: 1}),
            frameRate: 10,
            repeat: -1,
        });

        // Mouseclicks for summoning
        this.scene.input.mouse.disableContextMenu();
        this.scene.input.on('pointerdown', this.clickHandler.bind(this))  // maybe this has a context param??
        this.scene.input.on('pointerup', this.clickHandler2.bind(this))
        console.log('Player:', 'created')
    }

    

    clickHandler(e) {
        console.log(e.downX);
        downPos = e.downX;
        if (this.isDead()) {
            return
        }
        if (this.mana >= 50) {
          if (!summonForFree)  {
            this.mana -= 50; // TODO: configurable summon costs
          }
        } else {
          return;  // TODO: signal this to the player
        }
        // if(e.rightButtonDown()) {
        //     //AttackingAlly.createAttackingAlly();
        //     this.scene.attackingAllies.createAttackingAlly(e.worldX, e.worldY);
        // } else {
        //     this.scene.bushes.addBush(e.worldX, e.worldY);
        // }
    }

    clickHandler2(e) {
        console.log(e.upX);
        upPos = e.upX;

        if(downPos < upPos)
        {
            console.log("SWIPE");
            this.scene.attackingAllies.createAttackingAlly(e.worldX, e.worldY);
        } else {
            this.scene.bushes.addBush(e.worldX, e.worldY);
        }
        if (this.isDead()) {
            return
        }
        if (this.mana >= 50) {
          if (!summonForFree)  {
            this.mana -= 50; // TODO: configurable summon costs
          }
        } else {
          return;  // TODO: signal this to the player
        }
        if(e.rightButtonDown()) {
            //AttackingAlly.createAttackingAlly();
            //this.scene.attackingAllies.createAttackingAlly(e.worldX, e.worldY);
        } else {
            //his.scene.bushes.addBush(e.worldX, e.worldY);
        }
    }

    // Update is called once per tick
    update() {
        // Since we have multiple inputs doing the same thing, setup (set
        // velocity to 0 must be done first)
        this.gameObject.setVelocity(0);
        this.updateMovement(this.wasd)
        this.updateMovement(this.arrowkeys)

        this.healthbar.redraw({ x: this.gameObject.x, y: this.gameObject.y, value: this.health })
        this.manabar.redraw({ x: this.gameObject.x, y: this.gameObject.y, value: this.mana })
    }
    /**
     * @param cursors is an object with up down left and right as properties where the
     * value of each is an input key
     */
    updateMovement(cursor) {
        if (!this.gameObject.body.enable) {
            return;
        }

        if (cursor.left.isDown) {
            this.gameObject.setFlipX(true);
            this.gameObject.setVelocityX(-this.playerSpeed);
            this.gameObject.anims.play('walkFrontAnimation', true)
        }

        if (cursor.right.isDown) {
            this.gameObject.setFlipX(false);
            this.gameObject.setVelocityX(this.playerSpeed);
            this.gameObject.anims.play('walkFrontAnimation', true)
        }

        if (cursor.up.isDown) {
            this.gameObject.anims.play('walkBackAnimation', true)
            this.gameObject.setVelocityY(-this.playerSpeed);
        }

        if (cursor.down.isDown) {
            this.gameObject.setVelocityY(this.playerSpeed);
            this.gameObject.anims.play('walkFrontAnimation', true)
        }

        if (!cursor.left.isDown && !cursor.right.isDown && !cursor.up.isDown && !cursor.down.isDown) {
            this.gameObject.setTexture('me')
        }
    }

    // Called by scene when player collides with an enemy
    collide(_enemy) {
        this.health -= 1;
        if(this.health <= 0) {
            this.healthbar.gfx.destroy();
            this.manabar.gfx.destroy();
            this.gameObject.body.enable = false;
            this.gameObject.setTexture('death');
            this.gameObject.anims.play('deathAnimation', true);
            this.scene.end();
        }
    }

    pickUp(drop) {
        this.playerSpeed *= 1.1;
        drop.destroy();
    }

    isDead () {
        return this.health <= 0 || !this.gameObject.body.enable;
    }

    spawnOasisParticles () {
        this.scene.add.particles(this.gameObject.x + Math.random() * 10, this.gameObject.y + Math.random() * 10, 'oasisHeal', {
            speed: { min: 1, max: 2 },
            maxParticles: 2,
            anim: 'oasisHealAnimation',
            duration: 100,
            accelerationY: Math.random() * -900,
            accelerationX: Math.random() * -50,
            speed: Math.random() * 100,
            lifespan: 200,
            //emitZone: { source: new Phaser.Geom.Rectangle(0, 0, 30, 30) }  // Emit particles within a 4 pixel radius
        });
    }
};

/**
 * @return an object containing two cursor objects, arrowkeys and wasd which
 * each have up down left and right key inputs.
 */
function createCursors(scene) {
    return {
        wasd: {
            up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        },
        arrowkeys: scene.input.keyboard.createCursorKeys(),
    }
}
