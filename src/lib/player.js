import { HealthbarV2 } from '../lib/healthbar.js'
import { playerSpawn, playerSpeed, summonForFree, MIN_SWIPE_DISTANCE, MOUSE_SAMPLE_RATE } from '../constants.js'
import { AttackingAlly } from '../lib/attackingally.js'

/**
 *
 * Player is a the encapulated representation of our agent.
 *
 * X and Y are stored on the gameObject. HP should be stored on the healthbar
 * but is currently duplicated.
 */

let downEvent = 0;
let upEvent = 0;
let mouseCurrentlyDown = false;

let mousePositions = [];
export class Player {
    constructor(scene) {
        this.scene = scene
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
        this.scene.load.spritesheet('mouseParticle', 'assets/mouse-particle-v1.png', {
            frameWidth: 8, frameHeight: 8,
        })
        this.scene.load.audio('leavesSound', 'assets/sounds/bush-sound.mp3');
    }

    // Create is called when the scene becomes active, once, after assets are
    // preloaded. It's expected that this scene will have aleady called preload
    create() {
        this.gameObject = this.scene.physics.add.sprite(playerSpawn.x, playerSpawn.y, 'walkBack');
        let currentScale = this.gameObject.scaleX;
        this.gameObject.setScale(currentScale * 1.25);
        this.gameObject.setCollideWorldBounds(true);
        this.health = 100;
        this.healthbar = new HealthbarV2({
            scene: this.scene,
            height: 12,
            startingValue: 100,
            maxValue: 100,
            offsets: { x: 0, y: -35 },
        })
        this.MAX_MANA = 100;
        this.mana = this.MAX_MANA;
        this.manabar = new HealthbarV2({
            scene: this.scene,
            height: 6,
            startingValue: this.MAX_MANA,
            maxValue: this.MAX_MANA,
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

        this.scene.anims.create({
            key: 'mouseParticleAnimation',
            frames: this.gameObject.anims.generateFrameNumbers('mouseParticle', { start: 0, end: 1}),
            frameRate: 10,
            repeat: -1,
        });

        // Mouseclicks for summoning
        this.scene.input.mouse.disableContextMenu();
        this.scene.input.on('pointerdown', this.clickDownHandler.bind(this))  // maybe this has a context param??
        this.scene.input.on('pointerup', this.clickUpHandler.bind(this))
        setInterval(this.trackMousePositionAndSpawnParticles.bind(this), MOUSE_SAMPLE_RATE);
    }

    addMana(amount) {
        this.mana = Math.min(this.mana + amount, this.MAX_MANA)
    }

    hasMana(amount) {
        return this.mana >= amount;
    }

    detectGesture(){
        // horizontal right swipe
        if(this.rightSwipe() || this.leftSwipe()){
            let gruntManaCost = this.scene.attackingAllies.getManaCost();
            if (this.hasMana(gruntManaCost)) {
                this.mana = this.mana - gruntManaCost;
                this.scene.attackingAllies.createAttackingAlly(upEvent.worldX, upEvent.worldY);
            }
        } else if (this.upSwipe()) {
            let bushManaCost = this.scene.bushes.getManaCost();
            if (this.hasMana(bushManaCost)) {
                this.mana = this.mana - bushManaCost;
                this.scene.bushes.addBush(upEvent.worldX, upEvent.worldY);
            }
        }
        else if (this.downSwipe()) {
            let explosionManaCost = this.scene.explodingAllies.getManaCost();
            if (this.hasMana(explosionManaCost)) {
                this.mana = this.mana - explosionManaCost;
                this.scene.explodingAllies.createExplodingAlly(upEvent.worldX, upEvent.worldY);
            }
        }
    }

    upSwipe()
    {
        return downEvent.downY > upEvent.upY 
        && Math.abs(downEvent.downY - upEvent.upY) > MIN_SWIPE_DISTANCE
        && Math.abs(downEvent.downX - upEvent.upX) < MIN_SWIPE_DISTANCE
        && Math.abs(downEvent.downY - upEvent.upY) > Math.abs(downEvent.downX - upEvent.upX);
    }

    downSwipe()
    {
        return downEvent.downY < upEvent.upY 
        && Math.abs(downEvent.downY - upEvent.upY) > MIN_SWIPE_DISTANCE
        && Math.abs(downEvent.downX - upEvent.upX) < MIN_SWIPE_DISTANCE
        && Math.abs(downEvent.downY - upEvent.upY) > Math.abs(downEvent.downX - upEvent.upX);
    }

    rightSwipe()
    {
        return downEvent.downX < upEvent.upX 
        && Math.abs(downEvent.downX - upEvent.upX) > MIN_SWIPE_DISTANCE
        && Math.abs(downEvent.downY - upEvent.upY) < MIN_SWIPE_DISTANCE
        && Math.abs(downEvent.downX - upEvent.upX) > Math.abs(downEvent.downY - upEvent.upY)
    }

    leftSwipe()
    {
        return downEvent.downX > upEvent.upX 
        && Math.abs(downEvent.downX - upEvent.upX) > MIN_SWIPE_DISTANCE
        && Math.abs(downEvent.downY - upEvent.upY) < MIN_SWIPE_DISTANCE
        && Math.abs(downEvent.downX - upEvent.upX) > Math.abs(downEvent.downY - upEvent.upY)
    }

    downLeftSwipe()
    {
        return downEvent.downX > upEvent.upX 
        && downEvent.downY < upEvent.upY 
        && Math.abs(downEvent.downX - upEvent.upX) > MIN_SWIPE_DISTANCE
        && Math.abs(downEvent.downY - upEvent.upY) > MIN_SWIPE_DISTANCE
    }

    downRightSwipe()
    {
        return downEvent.downX < upEvent.upX 
        && downEvent.downY < upEvent.upY 
        && Math.abs(downEvent.downX - upEvent.upX) > MIN_SWIPE_DISTANCE
        && Math.abs(downEvent.downY - upEvent.upY) > MIN_SWIPE_DISTANCE
    }

    upLeftSwipe()
    {
        return downEvent.downX > upEvent.upX 
        && downEvent.downY > upEvent.upY 
        && Math.abs(downEvent.downX - upEvent.upX) > MIN_SWIPE_DISTANCE
        && Math.abs(downEvent.downY - upEvent.upY) > MIN_SWIPE_DISTANCE
    }

    upRightSwipe()
    {
        return downEvent.downX < upEvent.upX 
        && downEvent.downY > upEvent.upY 
        && Math.abs(downEvent.downX - upEvent.upX) > MIN_SWIPE_DISTANCE
        && Math.abs(downEvent.downY - upEvent.upY) > MIN_SWIPE_DISTANCE
    }

    trackMousePositionAndSpawnParticles()
    {
        if(mouseCurrentlyDown)
        {
            mousePositions.push([this.scene.input.mousePointer.x, this.scene.input.mousePointer.y])

            //let mPos = new Vector2(this.scene.input.mousePointer.x, this.scene.input.mousePointer.y);
            let wPos = this.scene.cameras.main.getWorldPoint(this.scene.input.mousePointer.x, this.scene.input.mousePointer.y);
        
            this.scene.add.particles(wPos.x, wPos.y, 'mouseParticle', {
                speed: { min: 1, max: 20 },
                maxParticles: 10,
                anim: 'mouseParticleAnimation',
                duration: 1000,
                // accelerationY: Math.random() * -900,
                // accelerationX: Math.random() * -50,
                // speed: Math.random() * 100,
                // lifespan: 200,
                emitZone: { source: new Phaser.Geom.Circle(0, 0, 10) }  // Emit particles within a 4 pixel radius
            });
        }
    }

   

    clickDownHandler(e) {
        mouseCurrentlyDown = true;
        downEvent = e;
        if (this.isDead()) {
            return
        }
    }

    clickUpHandler(e) {
        mousePositions = [];
        mouseCurrentlyDown = false;
        upEvent = e;

        if (this.isDead()) {
            return
        }
        this.detectGesture();
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

        // normalize the speed
        let velocity = new Phaser.Math.Vector2(this.gameObject.body.velocity.x, this.gameObject.body.velocity.y);
        velocity.normalize();
        // Scale the velocity vector to the desired speed
        velocity.scale(this.playerSpeed);

        // Apply the new velocity to the sprite
        this.gameObject.setVelocity(velocity.x, velocity.y);

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
        this.playerSpeed = this.playerSpeed + 20;
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
