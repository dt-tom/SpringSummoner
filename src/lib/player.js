import { HealthBar, HealthbarV2 } from '../lib/healthbar.js'
import { playerSpawn, playerSpeed } from '../constants.js'

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
    }

    // Preload is called before scene load, with a copy of the scene
    preload() {
        this.scene.load.image('me', 'assets/main-character-inuse.png');
        console.log('Player:', 'preloaded')
    }

    // Create is called when the scene becomes active, once, after assets are
    // preloaded. It's expected that this scene will have aleady called preload
    create() {
        this.gameObject = this.scene.physics.add.image(playerSpawn.x, playerSpawn.y, 'me');
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

        console.log('Player:', 'created', this.gameObject)
        return this
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
        if (cursor.left.isDown) {
            this.gameObject.setVelocityX(-playerSpeed);
        }

        if (cursor.right.isDown) {
            this.gameObject.setVelocityX(playerSpeed);
        }

        if (cursor.up.isDown) {
            this.gameObject.setVelocityY(-playerSpeed);
        }

        if (cursor.down.isDown) {
            this.gameObject.setVelocityY(playerSpeed);
        }
    }

    // Called by scene when player collides with an enemy
    collide(_enemy) {
        this.health -= 1;
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

