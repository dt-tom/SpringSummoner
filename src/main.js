import * as constants from './constants.js';
import { TitleScene } from './scenes/title.js'
import { GameScene } from './scenes/game.js'
import { Scoreboard } from './scenes/scoreboard.js'

const config = {
    type: Phaser.AUTO,
    width: constants.canvasWidth,
    height: constants.canvasHeight,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
    },
    scene: [TitleScene, GameScene, Scoreboard],
};

const CLASSES = ['Glyph: ¬', 'Glyph: -', 'Glyph: ƨ'];
let model;

// 100% safe code :)))))
async function loadMyModel() {
    let res = await fetch('./src/model/model.json').then(d => d.blob())
    let res2 = await fetch('./src/model/model.weights.bin').then(d => d.blob())
      model = await tf.loadLayersModel(tf.io.browserFiles([new File([res], "myDoodleNet.json", {
        type: "application/json",
      }), new File([res2], "myDoodleNet.weights.bin", {
        type: "application/macbinary",
      })]));
      model.summary();
    }

loadMyModel();

export function guess(x) {
    // Get input image from the canvas

    let inputs = []
    x = x.map(d => [d])
    while(x.length) inputs.push(x.splice(0,28));

    // Predict
    let guess = model.predict(tf.tensor([inputs]));

    // Format res to an array
    const rawProb = Array.from(guess.dataSync());
    // Get top 5 res with index and probability
    const rawProbWIndex = rawProb.map((probability, index) => {
        return {
            index,
            probability
        }
    });

    const sortProb = rawProbWIndex.sort((a, b) => b.probability - a.probability);
    const res = CLASSES[sortProb[0].index];
    // console.log(`${res}\n,${rawProbWIndex.map(x => `${CLASSES[x.index]} (${x.probability}) \n`)}`)
    return { glyph: res, spellAccuracy: sortProb[0].probability }
}

export const game = new Phaser.Game(config);
