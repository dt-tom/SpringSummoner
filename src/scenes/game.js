import * as constants from '../constants.js'
import { Player } from '../lib/player.js'
import { Oasis } from '../lib/oasis.js'
import { AttackingAlly } from '../lib/attackingally.js';
import { ExplodingAlly } from '../lib/explodingally.js';
import { Bush } from '../lib/bush.js';
import { BugGroup } from '../lib/bug.js'
import { ShooterGroup } from '../lib/shooter.js';
import { DeerManager } from '../lib/deer.js';
import { Worm } from '../lib/worm.js';

/**
 * GameScene is the main scene of Spring Summoner; it's where the actual game
 * lives
 */
export class GameScene extends Phaser.Scene {
    constructor () {
        super('GameScene');
    }

    scaleEnemies(difficulty) {
        const { spawnIntervalX, maxEnemyCountX, attackDamageX,
                projectileDamageX, lifespanMilliX, maxHealthX } = this.scalingFunction(difficulty);

        // scale the bugs
        this.bugs.attackDamage += attackDamageX;
        // this.bugs.MAX_BUG_COUNT += maxEnemyCountX;
        // this.bugs.MAX_BUG_LIFESPAN_MILLIS *= lifespanMilliX;
        // this.bugs.SPAWN_INTERVAL *= spawnIntervalX;
        this.bugs.MAX_HEALTH += maxHealthX;

        // scale the shooters
        this.shooters.attackDamage += attackDamageX;
        this.shooters.projectileDamage += projectileDamageX;
        // this.shooters.MAX_SHOOTER_COUNT += maxEnemyCountX;
        // this.shooters.MAX_SHOOTER_LIFESPAN_MILLIS *= lifespanMilliX;
        // this.shooters.SPAWN_INTERVAL *= spawnIntervalX;
        this.shooters.MAX_HEALTH += maxHealthX;

        // scale the worm
        this.worm.attackDamage += attackDamageX;
        this.worm.projectileDamage += projectileDamageX;
        // this.worm.MAX_worm_COUNT += maxEnemyCountX;
        // this.worm.MAX_worm_LIFESPAN_MILLIS *= lifespanMilliX;
        // this.worm.SPAWN_INTERVAL *= spawnIntervalX;
        this.worm.MAX_HEALTH += maxHealthX;
    }

    scalingFunction(difficulty) {
        return {
            spawnIntervalX: 1 / difficulty,
            maxEnemyCountX: difficulty,
            attackDamageX: difficulty,
            projectileDamageX: difficulty,
            lifespanMilliX: difficulty,
            maxHealthX: difficulty
        }
    }

    preload () {
        this.load.image('me', 'assets/main-character-inuse.png')
        this.load.image('speedDrop', 'assets/special_fruit.png');
        this.load.image('healthDrop', 'assets/pink_fruit.png');
        this.load.image('manaDrop', 'assets/blue_fruit.png');
        this.load.image('sand', 'assets/desert-block.png');
        this.load.image('tiles', 'assets/grass-block.png');
        this.load.image('grassTiles', 'assets/grass-block-sheet-v2.png');
        this.load.image('desertTile', 'assets/desert-block.png');
        this.player.preload();
        this.oasis.preload();
        this.bugs.preload();
        this.shooters.preload();
        this.deers.preload();
        this.bushes.preload();
        this.attackingAllies.preload();
        this.explodingAllies.preload();
        this.worm.preload();

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
    }

    // Called before create, even on stop/restart
    init() {
        this.player = new Player(this)
        this.oasis = new Oasis(this)
        this.attackingAllies = new AttackingAlly(this);
        this.explodingAllies = new ExplodingAlly(this);
        this.bushes = new Bush(this);
        this.bugs = new BugGroup(this);
        this.shooters = new ShooterGroup(this);
        this.deers = new DeerManager(this);
        this.worm = new Worm(this)
        this.tick = 0;
        this.active = true;
        this.difficulty = 1;
        this.previousDifficulty = 1;
        this.won = false;

        this.score = 0;
    }

    createDrop(posX, posY) {
        
        let random = Math.random();
        if(random < 0.33) {
            const drop = this.drops.create(posX, posY, 'speedDrop');
            drop.type = "speed";
        } else if (random < 0.66) {
            const drop = this.drops.create(posX, posY, 'manaDrop');
            drop.type = "mana";
        } else {
            const drop = this.drops.create(posX, posY, 'healthDrop');
            drop.type = "health";
        }
    }

    create () {
        // Will call each of these after everything is initialized
        // Useful for adding collision handlers when everything is ready to go
        // (make sure to bind them if they're instance methods)
        this.postCreateHooks = []
        this.createWorld();

        this.scene.launch('Scoreboard');

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
        this.shooters.create();
        this.deers.create();
        this.worm.create();

        this.cameras.main.startFollow(this.player.gameObject, false, 1, 1, 0, 0 );

        this.drops = this.physics.add.group({
            createCallback: (drop) => {
                drop.isSpawned = false;
                drop.type = '';
            },
        });

        this.physics.add.collider(this.player.gameObject, this.drops, (_player, drop) => {
            this.player.pickUp(drop)
        }, null, this);
        this.physics.add.collider(this.attackingAllies.attackingAllies, this.bugs.group);
        this.physics.add.collider(this.attackingAllies.attackingAllies, this.shooters.group);
        this.physics.add.collider(this.bugs.group, this.shooters.group);
        // this.physics.add.collider(this.bugs.group, this.worm.group);
        // this.physics.add.collider(this.shooters.group, this.worm.group);
        // this.physics.add.collider(this.bugs.group, this.worm.group);
        this.physics.add.overlap(this.deers.deers, this.worm.group, (ally, enemy) => {
            this.worm.damageworm(enemy, this.deers.attackDamage);
        });
        this.physics.add.collider(this.explodingAllies.explodingAllies, this.worm.group, (ally, enemy) => {
            this.explodingAllies.explode(ally, enemy);
        });
        this.physics.add.collider(this.explodingAllies.explodingAllies, this.bugs.group, (ally, enemy) => {
            this.explodingAllies.explode(ally, enemy);
        });
        this.physics.add.collider(this.explodingAllies.explodingAllies, this.shooters.group, (ally, enemy) => {
            this.explodingAllies.explode(ally, enemy);
        });


        if (constants.devMode) {
            this.physics.world.createDebugGraphic()
            this.physics.world.drawDebug = true
        }

        for (let callable of this.postCreateHooks) {
            callable()
        }
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
        return [min_item, min_distance];
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
    }

    replaceTileIndex(tile){
        this.grassMap.replaceByIndex(tile.index, tile.index + 1, tile.x, tile.y, 1, 1);
        this.score += tile.index + 1;
        if(this.score > constants.wormScore)
        {
            this.worm.setAllowSpawn()
        }
        this.scene.get('Scoreboard').updateScore(this.score);
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
        // slow down difficulty by obtaining score, 600 tick grace period
        if (this.tick > 600) {
            this.difficulty += (this.tick - 600)/(this.score + 1)/100;
        }
        this.scene.get("Scoreboard").updateDifficulty(this.difficulty);
        // check next integer difficulty
        if (this.difficulty > this.previousDifficulty + 1) {
            this.previousDifficulty = Math.floor(this.difficulty);
            this.scaleEnemies(this.previousDifficulty);
        }

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
        this.shooters.update();
        this.deers.update();
        this.worm.update();
    }

    // called when player health is zero
    end () {
        this.active = false;
        for (let enemy of this.bugs.group.getChildren()) {
            enemy.body.setVelocity(0, 0);
        }
        for (let enemy of this.shooters.group.getChildren()) {
            enemy.body.setVelocity(0, 0);
        }
        this.bugs.end();
        this.deers.end();
        this.shooters.end();
        this.worm.end();
        // wait one second so death animation can finish
        this.time.delayedCall(1000, (enemies) => { 
            for (let enemy of enemies.getChildren()) {
                enemy.playReverse('bugSpawnAnimation');
            }
        }, [this.bugs.group], this);
        this.time.delayedCall(1000, (enemies) => { 
            for (let enemy of enemies.getChildren()) {
                enemy.playReverse('shooterSpawnAnimation');
            }
        }, [this.shooters.group], this);
        // wait 1.8 seconds before removing enemies (not 2s to avoid overlapping frames)
        this.time.delayedCall(1800, (enemies) => { 
            for (let enemy of enemies.getChildren()) {
                enemy.setVisible(false);
                enemy.body.enable = false;
            }
        }, [this.bugs.group], this);
        this.time.delayedCall(1800, (enemies) => { 
            for (let enemy of enemies.getChildren()) {
                enemy.setVisible(false);
                enemy.body.enable = false;
            }
        }, [this.shooters.group], this);
        this.attackingAllies.end();
        if(this.won) {
            this.time.delayedCall(3000, () => {
                this.scene.launch('WinScene');
            });
        } else {
            this.time.delayedCall(3000, () => {
                this.scene.launch('DeathScene');
            });
        }
        
    }
}
