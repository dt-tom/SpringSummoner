import { Globals } from "../constants.js";

/**
 * Oasis is the spawn location that causes the player to regenerate mana
 */
export class Oasis {
    constructor(scene) {
        this.scene = scene
    }

    preload() {
        this.scene.load.image('oasis', 'assets/oasis-v2.png')
        this.scene.load.audio('oasisAura', 'assets/sounds/oasisAura3.mp3');
    }

    create() {
        this.manaHealed = false;
        this.manaHealAmount = 10;
        this.manaHealCooldownMillis = 1000;

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

        if(!this.auraSound.isPlaying) {
            this.auraSound.play();
            this.auraSound.setVolume(0.1 * Globals.globalVolume);
        }
        if (this.manaHealed) {
            return;
        }
        this.manaHealed = true;
        this.scene.player.updateMana(this.manaHealAmount);
        setTimeout(() => {
            this.manaHealed = false;
        }, this.manaHealCooldownMillis);
        this.scene.player.spawnManaParticles();
    }
}
