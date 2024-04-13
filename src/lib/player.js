import { HealthBar } from '../lib/healthbar.js'

/**
 *
 * Player is a the encapulated representation of our agent.
 *
 * X and Y are stored on the gameObject. HP should be stored on the healthbar
 * but is currently duplicated.
 */
export class Player {
    constructor(scene) {
        this.scene = scene
        console.log('Player:', 'constructed')
        this.firstUpdate = true
    }

    // Preload is called before scene load, with a copy of the scene
    preload() {
        this.scene.load.image('me', 'assets/main-character-inuse.png');
        this.health = 100;
        console.log('Player:', 'preloaded')
    }

    // Create is called when the scene becomes active, once, after assets are
    // preloaded. It's expected that this scene will have aleady called preload
    create() {
        const startingX = 400
        const startingY = 300
        this.gameObject = this.scene.physics.add.image(startingX, startingY, 'me');
        this.gameObject.setCollideWorldBounds(true);

        this.hp = new HealthBar(this.scene, this.health, startingX - 300, startingY - 300);

        let { wasd, arrowkeys } = createCursors(this.scene)
        this.wasd = wasd
        this.arrowkeys = arrowkeys

        console.log('Player:', 'created', this.gameObject)
        return this
    }

    // Update is called once per tick
    update() {
        if (this.firstUpdate) {
            console.log("Player:", "first update", this.gameObject)
            this.firstUpdate = false
        }
        // Since we have multiple inputs doing the same thing, setup (set
        // velocity to 0 must be done first)
        this.gameObject.setVelocity(0);
        this.updateMovement(this.wasd)
        this.updateMovement(this.arrowkeys)

        this.hp.reposition(this.gameObject.x - 25, this.gameObject.y - 30);
    }
    /**
     * @param cursors is an object with up down left and right as properties where the
     * value of each is an input key
     */
    updateMovement(cursor) {
        if (cursor.left.isDown) {
            this.gameObject.setVelocityX(-500);
        }

        if (cursor.right.isDown) {
            this.gameObject.setVelocityX(500);
        }

        if (cursor.up.isDown) {
            this.gameObject.setVelocityY(-500);
        }

        if (cursor.down.isDown) {
            this.gameObject.setVelocityY(500);
        }
    }

    // Called by scene when player collides with an enemy
    collide(_enemy) {
        this.health -= 1;
        this.hp.decrease(1);
        if(this.health <= 0) {
            this.gameObject.destroy();
            console.log('Player:', "we're dead")
        }
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

