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
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' }).setScrollFactor(0);
    }

    updateScore(newScore) {
        this.scoreText.setText('Score: ' + newScore);
    }
}
