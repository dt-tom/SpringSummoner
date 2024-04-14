
/**
 * Oasis is the spawn location that causes the player to regenerate mana
 */
export class Oasis {
    constructor(scene) {
        this.scene = scene
    }

    preload() {
        this.scene.load.image('oasis', 'assets/oasis-inuse.png')
    }

    create() {
        // Oasis
        this.gameObject = this.scene.physics.add.image(400, 300, 'oasis');
        this.gameObject.setOrigin(0.5, 0.5);  // use the center of the sprite as the reference point for positioning

        this.scene.postCreateHooks.push(this.addPlayerOverlapHandler.bind(this))
    }

    addPlayerOverlapHandler() {
        if (this.scene.player !== undefined && this.scene.player.gameObject !== undefined) {
            console.log('Oasis:', 'adding player overlap handler')
            this.scene.physics.add.overlap(
                this.scene.player.gameObject, this.gameObject, this.overlapPlayer, null, this
            )
        } else {
            console.log('Oasis:', "couldn't find a player to heal")
        }
    }

    update() {}

    overlapPlayer() {
        this.scene.player.mana += 0.5
        this.scene.player.spawnOasisParticles();
    }
}
