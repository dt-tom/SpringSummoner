/**
 * Scoreboard displays the player's score to them. It maintains no score
 * calculation logic, and simply updates its text when instructed to.
 */
export class Scoreboard extends Phaser.Scene {
    constructor() {
        super({ key: 'Scoreboard', active: true });
    }

    create() {
        // Add your UI elements here
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '24px', fill: '#000' }).setScrollFactor(0);
        this.glyphSequence = this.add.text(16, 40, 'Glyph Sequence: -', { fontSize: '16px', fill: '#000' }).setScrollFactor(0);
        this.lastSpellAccuracy = this.add.text(16, 56, 'Last Glyph Accuracy: -', { fontSize: '16px', fill: '#000' }).setScrollFactor(0);
    }

    updateLastSpellAccuracy(newSpellAccuracy) {
        this.lastSpellAccuracy.setText(`Last Glyph Accuracy: ${Math.round(newSpellAccuracy * 100, 2)}%`);
    }

    updateGlyphSequence(newGlyphSequence) {
        this.glyphSequence.setText(`Glyph Sequence: ${newGlyphSequence.map(d => d[d.length - 1])}`);
    }

    updateScore(newScore) {
        this.scoreText.setText('Score: ' + newScore);
    }
}
