import { HealthbarV2 } from "../lib/healthbar.js";
import { canvasHeight, canvasWidth, wormScore } from "../constants.js";
/**
 * Scoreboard displays the player's score to them. It maintains no score
 * calculation logic, and simply updates its text when instructed to.
 */
export class Scoreboard extends Phaser.Scene {
    constructor() {
        super({ key: 'Scoreboard', active: true });
    }

    create() {
        this.wormTextActive = false;
        // Add your UI elements here
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '24px', fill: '#000' }).setScrollFactor(0);
        
        this.glyphSequence = this.add.text(16, 40, 'Glyph Sequence: ', { fontSize: '16px', fill: '#000' }).setScrollFactor(0);
        this.lastSpellAccuracy = this.add.text(16, 56, 'Last Glyph Accuracy: -', { fontSize: '16px', fill: '#000' }).setScrollFactor(0);
        this.difficulty = this.add.text(16, 72, 'Difficulty: 0', { fontSize: '16px', fill: '#000' }).setScrollFactor(0);
        this.healthbar = new HealthbarV2({
            scene: this.scene.scene,
            height: 24,
            width: 400,
            startingValue: 100,
            maxValue: 100,
            offsets: { x: 0, y: 0 },
        });
        this.manabar = new HealthbarV2({
            scene: this.scene.scene,
            height: 16,
            width: 400,
            startingValue: this.MAX_MANA,
            maxValue: this.MAX_MANA,
            colorFunc: () => ({ fg: 0x0000ff, bg: 0xffffff }),
            offsets: { x: 0, y: 0 },
        });
        this.scorebar = new HealthbarV2({
            scene: this.scene.scene,
            height: 16,
            width: 100,
            startingValue: 0,
            maxValue: 60000,
            colorFunc: () => ({ fg: 0x000000, bg: 0xffffff }),
            offsets: { x: 0, y: 0 },
        })
    }

    updateLastSpellAccuracy(newSpellAccuracy) {
        this.lastSpellAccuracy.setText(`Last Glyph Accuracy: ${Math.round(newSpellAccuracy * 100, 2)}%`);
    }

    updateGlyphSequence(newGlyphSequence) {
        this.glyphSequence.setText(`Glyph Sequence: ${newGlyphSequence.map(d => d[d.length - 1])}`);
    }

    updateScore(newScore) {
        this.scoreText.setText('Score: ' + newScore);
        this.scorebar.redraw({ x: 240, y: 28, value: newScore });
        if(newScore > wormScore && !this.wormTextActive)
        {
            this.wormTextActive = true;
            this.wormText = this.add.text(canvasWidth / 2, canvasHeight / 2 - 200, 'You feel the ground rumbling...', { fontSize: '24px', fill: '#000' }).setScrollFactor(0).setOrigin(0.5);
            this.time.delayedCall(4000, (e) => { 
                this.wormText.destroy();
            });
        }
    }

    updateHP(newHP) {
        this.healthbar.redraw({ x: 802, y: 32, value: newHP });
    }

    updateMana(newMana) {
        this.manabar.redraw({ x: 802, y: 48, value: newMana });
    }

    updateDifficulty(newDifficulty) {
        this.difficulty.setText(`Difficulty: ${newDifficulty.toFixed(2)}`);
    }
}
