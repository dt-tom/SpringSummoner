import * as constants from '../constants.js'
import { Player } from '../lib/player.js'
import { Oasis } from '../lib/oasis.js'
import { AttackingAlly } from '../lib/attackingally.js';
import { ExplodingAlly } from '../lib/explodingally.js';
import { Bush } from '../lib/bush.js';
import { BugGroup } from '../lib/bug.js'

/**
 * GameScene is the main scene of Spring Summoner; it's where the actual game
 * lives
 */
export class GameScene extends Phaser.Scene {
    constructor () {
        super('GameScene');
        this.player = new Player(this)
        this.oasis = new Oasis(this)
        this.attackingAllies = new AttackingAlly(this);
        this.explodingAllies = new ExplodingAlly(this);
        this.bushes = new Bush(this);
        this.bugs = new BugGroup(this)

        this.tick = 0;
        this.active = true;

        this.score = 0;
    }

    preload () {
        this.load.scenePlugin('AnimatedTiles', 'https://raw.githubusercontent.com/nkholski/phaser-animated-tiles/master/dist/AnimatedTiles.js', 'animatedTiles', 'animatedTiles'); 
        this.load.image('me', 'assets/main-character-inuse.png')
        this.load.image('drop', 'assets/star.png');
        this.load.image('sand', 'assets/desert-block.png');
        this.load.image('tiles', 'assets/grass-block.png');
        this.load.image('grassTiles', 'assets/grass-block-sheet-v2.png');
        this.load.image('desertTile', 'assets/desert-block.png');
        this.player.preload();
        this.oasis.preload();
        this.bugs.preload();
        this.bushes.preload();
        this.attackingAllies.preload();
        this.explodingAllies.preload();

        // var progressBar = this.add.graphics();
        // var progressBox = this.add.graphics();
        // progressBox.fillStyle(0x222222, 1);
        // progressBox.fillRect(0, 0, 1000, 1000);
        // progressBox.setDepth(100);
        // progressBar.setDepth(100);

        // this.load.on('progress', function (value) {
        //     console.log(value);
        //     progressBar.clear();
        //     progressBar.fillStyle(0xffffff, 1);
        //     progressBar.fillRect(0, 0, 300 * value, 30);
        // });
                    
        // // this.load.on('fileprogress', function (file) {
        // //     console.log(file.src);
        // // });
        // this.load.on('complete', function () {
        //     console.log("LOAD COMPLETE");
        //     // progressBox.destroy();
        //     // progressBar.destroy();
        // });

        this.time.delayedCall(1000, () => {
            console.log("second after load");
        })


    }

    createDrop(posX, posY) {
        const drop = this.drops.create(posX, posY, 'drop');
    }

    create () {
        // Will call each of these after everything is initialized
        // Useful for adding collision handlers when everything is ready to go
        // (make sure to bind them if they're instance methods)
        this.postCreateHooks = []
        this.createWorld();

        //  Set the camera and physics bounds to be the size of 4x4 bg images
        this.cameras.main.setBounds(0, 0, 1920 * 2, 1080 * 2);
        this.cameras.main.setZoom(2);  // 2x our assets visually
        this.physics.world.setBounds(0, 0, 1920 * 2, 1080 * 2);

        this.oasis.create();
        this.player.create();
        this.attackingAllies.create();
        this.explodingAllies.create();
        this.bushes.create();
        this.bugs.create();

        this.cameras.main.startFollow(this.player.gameObject, true, 0.1, 0.1);  // Should this be in player.js?

        this.drops = this.physics.add.group({
            createCallback: (drop) => {
                drop.isSpawned = false;
            },
        });

        this.physics.add.collider(this.player.gameObject, this.drops, (_player, drop) => {
            this.player.pickUp(drop)
        }, null, this);
        this.physics.add.collider(this.attackingAllies.attackingAllies, this.bugs.group);
        this.physics.add.collider(this.explodingAllies.explodingAllies, this.bugs.group, (ally, enemy) => {
            this.explodingAllies.explode(ally, enemy);
        });

        this.anims.create({
            key: 'bushSpawnAnimation',
            frames: this.anims.generateFrameNumbers('bushSpawn', { start: 0, end: 10}),
            frameRate: 15,
        });
        this.anims.create({
            key: 'scorpion-move',
            frames: this.anims.generateFrameNumbers('attackingAlly', { start: 0, end: 4}),
            frameRate: 20,
            repeat: -1,
        });

        if (constants.devMode) {
            this.physics.world.createDebugGraphic()
            this.physics.world.drawDebug = true
        }

        for (let callable of this.postCreateHooks) {
            callable()
        }

        this.scoreText = this.add.text(400, 400, 'Score: ' + this.score.toString(), {
            fontSize: '32px', fill: '#000'
        }).setOrigin(0.5);

       
    // t.cameraOffset.setTo(200, 500);

        // // Adjust its position using cameraOffset
        // this.scoreText.cameraOffset.x = 100; // Set your desired x-coordinate
        // this.scoreText.cameraOffset.y = 50;  // Set your desired y-coordinate
    }

    getAllObjectsWithinRange(object, group, minimumDistance) {
        let items = [];
        for(let item of group.getChildren())
        {
            let diff = Phaser.Math.Distance.Squared(item.x, item.y, object.x, object.y);
            if(diff < minimumDistance)
            {
                items.push(item);
                item.destroy();
            }
        }
    }

    getClosestObject(object, group) {
        let min_distance = Infinity;
        let min_item = null;
        for(let item of group.getChildren())
        {
            let diff = Phaser.Math.Distance.Squared(item.x, item.y, object.x, object.y);
            if(diff < min_distance)
            {
                min_distance = diff;
                min_item = item;
            }
        }
        return min_item;
    }
    /**
     * Create the tiled background and static foreground elements. Expects
     * assets named sand (tileable) and oasis (sprite) to be preloaded
     */
    createWorld() {
        this.levelArray = [];
        // construct level array
        for(let i = 0; i < constants.mapHeight; i++)
        {
          let thisRow = [];
          for(let j = 0; j < constants.mapWidth; j++)
          {
              thisRow.push(0);
          }
          this.levelArray.push(thisRow);
        }

        var levelArray2 = [];
        // construct level array
        for(let i = 0; i < constants.mapHeight; i++)
        {
          let thisRow = [];
          for(let j = 0; j < constants.mapWidth; j++)
          {
              thisRow.push(0);
          }
          levelArray2.push(thisRow);
        }

        // When loading from an array, make sure to specify the tileWidth and tileHeight
        this.grassMap = this.make.tilemap({ data: this.levelArray, tileWidth: 32, tileHeight: 32 });
        var tiles = this.grassMap.addTilesetImage("grassTiles");
        this.grassLayer = this.grassMap.createLayer(0, tiles, 0, 0);
        this.grassLayer.setDepth(-1);

        var desertMap = this.make.tilemap({ data: levelArray2, tileWidth: 32, tileHeight: 32 });
        var desertTiles = desertMap.addTilesetImage("desertTile");
        var desertLayer = desertMap.createLayer(0, desertTiles, 0, 0);
        desertLayer.setDepth(-2);

        // Oasis
       let oasis = this.add.sprite(400, 300, 'oasis');
       oasis.setOrigin(0.5, 0.5);  // use the center of the sprite as the reference point for positioning
    }

    replaceTileIndex(tile){
        this.grassMap.replaceByIndex(tile.index, tile.index + 1, tile.x, tile.y, 1, 1);
        this.score += tile.index + 1;
        this.scoreText.setText('Score: ' + this.score.toString());
        
    }

    updateTiles(posX, posY)
    {      
        let currentTile = this.grassMap.getTileAtWorldXY(posX, posY);

        if(currentTile && this.tick % constants.GRASS_GROW_SPEED == 0)
        {
            this.grassMap
                .getTilesWithin(currentTile.x-1, currentTile.y-1, 3, 3) // find all tiles around the player
                .filter(t => t.index < 5) // filter out grass then increment tile stage
                .map(tile => (tile != currentTile) ? 
                (Math.random() > 0.2) ? this.replaceTileIndex(tile) : null
                : this.replaceTileIndex(tile));
        }

    }

    update () {
        this.tick += 1;
        if (!this.active) {
            return;
        }

        this.createDrop(
            constants.canvasWidth * Math.random() * 32,
            constants.canvasHeight * Math.random() * 32);

        this.updateTiles(this.player.gameObject.x, this.player.gameObject.y);

        this.player.update();
        this.oasis.update();
        this.attackingAllies.update();
        this.explodingAllies.update();
        this.bushes.update();
        this.bugs.update();
    }

    // called when player health is zero
    end () {
        this.active = false;
        for (let enemy of this.bugs.group.getChildren()) {
            enemy.body.setVelocity(0, 0);
        }
        // wait one second so death animation can finish
        this.time.delayedCall(1000, (enemies) => { 
            for (let enemy of enemies.getChildren()) {
                enemy.playReverse('bugSpawnAnimation');
            }
        }, [this.bugs.group], this);
        // wait 1.8 seconds before removing enemies (not 2s to avoid overlapping frames)
        this.time.delayedCall(1800, (enemies) => { 
            for (let enemy of enemies.getChildren()) {
                enemy.setVisible(false);
                enemy.body.enable = false;
            }
        }, [this.bugs.group], this);
        this.attackingAllies.end()
    }
}
