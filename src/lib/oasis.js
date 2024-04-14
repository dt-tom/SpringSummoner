
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

        console.log(this.gameObject.getBounds());
        
        this.gameObject.setOrigin(0.5, 0.5);  // use the center of the sprite as the reference point for positioning

        this.scene.postCreateHooks.push(this.addPlayerOverlapHandler.bind(this));

        this.auraSound = this.scene.sound.add('oasisAura');
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
                console.log("stopping");
                this.auraSound.stop();
            };
        }
    }

    overlapPlayer() {
        this.scene.player.mana += 0.5
        this.scene.player.spawnOasisParticles();
        
        this.auraSound.setVolume(0.5);
        if(!this.auraSound.isPlaying)
        {
            this.auraSound.play();
        }

    }
}
