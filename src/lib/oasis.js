
/**
 * Oasis is the spawn location that causes the player to regenerate mana
 */
export class Oasis {
    constructor(scene) {
        this.scene = scene
    }

    preload() {
        this.scene.load.image('oasis', 'assets/oasis-inuse.png')
        this.scene.load.audio('oasisAura', 'assets/sounds/oasisAura3.mp3');
    }

    create() {
        // Oasis
        this.gameObject = this.scene.physics.add.image(400, 300, 'oasis');
        
        this.gameObject.setOrigin(0.5, 0.5);  // use the center of the sprite as the reference point for positioning

        this.scene.postCreateHooks.push(this.addPlayerOverlapHandler.bind(this));

        this.auraSound = this.scene.sound.add('oasisAura');
    }

    addPlayerOverlapHandler() {
        if (this.scene.player !== undefined && this.scene.player.gameObject !== undefined) {
            this.scene.physics.add.overlap(
                this.scene.player.gameObject, this.gameObject, this.overlapPlayer, null, this
            )
        }
    }

    checkOverlap(spriteA, spriteB) {
        let boundsA = spriteA.getBounds();
        let boundsB = spriteB.getBounds();
        return Phaser.Geom.Intersects.RectangleToRectangle(boundsA, boundsB);
    }

    update() {
        if(this.gameObject.getBounds())
        {
            if(!this.checkOverlap(this.scene.player.gameObject, this.gameObject))
            {
                this.auraSound.stop();
            };
        }
    }

    overlapPlayer() {
        this.scene.player.mana += 0.5
        this.scene.player.spawnOasisParticles();
        
        this.auraSound.setVolume(0.25);
        if(!this.auraSound.isPlaying)
        {
            this.auraSound.play();
        }
    }
}
