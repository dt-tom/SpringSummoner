import * as constants from './constants.js';
import { TitleScene } from './scenes/title.js'
import { GameScene } from './scenes/game.js'

const config = {
    type: Phaser.AUTO,
    width: constants.canvasWidth,
    height: constants.canvasHeight,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
    },
    scene: [TitleScene, GameScene],
};

const game = new Phaser.Game(config);
