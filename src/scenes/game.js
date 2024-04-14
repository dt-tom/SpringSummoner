import * as constants from '../constants.js'
import { Player } from '../lib/player.js'
import { Oasis } from '../lib/oasis.js'
import { HealthBar } from '../lib/healthbar.js'
import { AttackingAlly } from '../lib/attackingally.js';

let allowSpawnEnemy = false;


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
        this.tick = 0;
        this.active = true;
    }

    preload () {
        this.load.scenePlugin('AnimatedTiles', 'https://raw.githubusercontent.com/nkholski/phaser-animated-tiles/master/dist/AnimatedTiles.js', 'animatedTiles', 'animatedTiles'); 
        this.load.image('me', 'assets/main-character-inuse.png');
        this.load.image('drop', 'assets/star.png');
        this.load.image('bush', 'assets/bush-v1.png');
        
        this.load.image('bush', 'assets/bush-v1.png');
        this.load.spritesheet('enemy', 'assets/bug-move.png', {
            frameWidth: 32, frameHeight: 32
        });
        this.load.image('sand', 'assets/desert-block.png');
        this.load.image('oasis', 'assets/oasis-inuse.png');
        this.load.image('tiles', 'assets/grass-block.png');
        this.load.image('grassTiles', 'assets/grass-block-sheet-v2.png');
        this.load.image('desertTile', 'assets/desert-block.png');
        this.load.spritesheet('dirtParticle', 'assets/dirt-particle.png', {
            frameWidth: 6, frameHeight: 6,
        });
        this.load.spritesheet('bugSpawn', 'assets/bug-spawn.png', {
            frameWidth: 32, frameHeight: 32,
        });
        this.load.spritesheet('bushSpawn', 'assets/bush-spawn.png', {
            frameWidth: 64, frameHeight: 64,
        });
        this.player.preload();
        this.oasis.preload();
        this.attackingAllies.preload();
    }

    createEnemy(posX, posY)
    {
        const enemy = this.enemies.create(posX, posY, 'bugSpawn');
        this.add.particles(posX, posY, 'dirtParticle', {
            speed: { min: 1, max: 20 },
            maxParticles: 20,
            anim: 'dirtTumble',
            duration: 3000,
            emitZone: { source: new Phaser.Geom.Circle(0, 0, 30) }  // Emit particles within a 4 pixel radius
        });
        this.time.delayedCall(1000, (e) => { 
            e.isSpawned = true;
            this.enemies.playAnimation('bugMoveAnimation');
            }, [enemy], this);
    }

    createDrop(posX, posY) {
        const drop = this.drops.create(posX, posY, 'drop');
    }

    create () {
        this.createWorld();
        // Will call each of these after everything is initialized
        // Useful for adding collision handlers when everything is ready to go
        // (make sure to bind them if they're instance methods)
        this.postCreateHooks = []
          this.levelArray = [];
          // construct level array
          for(let i = 0; i < constants.mapHeight; i++)
          {
            let thisRow = [];
            for(let j = 0; j < constants.mapWidth; j++)
            {
                thisRow.push([0]);
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
                thisRow.push([0]);
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
         
        // consts
        const NUMBER_OF_ENEMIES = 10;
        //  Set the camera and physics bounds to be the size of 4x4 bg images
        this.cameras.main.setBounds(0, 0, 1920 * 2, 1080 * 2);
        this.cameras.main.setZoom(2);  // 2x our assets visually
        this.physics.world.setBounds(0, 0, 1920 * 2, 1080 * 2);

        //  Background/desert tiles
        this.add.tileSprite(0, 0, constants.mapWidth, constants.mapHeight, 'sand').setOrigin(0, 0);

        this.oasis.create();
        this.player.create();
        this.attackingAllies.create();
        

        this.cameras.main.startFollow(this.player.gameObject, true, 0.1, 0.1);  // Should this be in player.js?

        // Allies are stationary helpers
        this.allies = this.physics.add.group({
            createCallback: (ally) => {
                ally.isSpawned = false;
            },
        });

        this.drops = this.physics.add.group({
            createCallback: (drop) => {
                drop.isSpawned = false;
            },
        });

        // Attacking allies engage with enemies
        this.attackingAllies = this.physics.add.group();

        // make enemies
        this.enemies = this.physics.add.group();

        

        this.anims.create({
            key: 'bugMoveAnimation',
            frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 3}),
            frameRate: 20,
            repeat: -1,
        });
        this.anims.create({
            key: 'bugSpawnAnimation',
            frames: this.anims.generateFrameNumbers('bugSpawn', { start: 0, end: 8}),
            frameRate: 10,
            repeat: -1,
        });
        this.anims.create({
            key: 'dirtTumble',
            frames: this.anims.generateFrameNumbers('dirtParticle', { start: 0, end: 7}),
            frameRate: 10,
            repeat: -1,
        });
        this.anims.create({
            key: 'bushSpawnAnimation',
            frames: this.anims.generateFrameNumbers('bushSpawn', { start: 0, end: 10}),
            frameRate: 15,
        });
        // this.anims.create({
        //     key: 'scorpion-move',
        //     frames: this.anims.generateFrameNumbers('attackingAlly', { start: 0, end: 5}),
        //     frameRate: 20,
        //     repeat: -1,
        // });
        
    
        // make enemies
        this.enemies = this.physics.add.group({
            createCallback: (enemy) => {
                enemy.isSpawned = false;
            }
        });

        

        for(let i = 0; i < constants.NUMBER_OF_ENEMIES; i++) {
            const spawnX = Math.random() * 400;
            const spawnY = Math.random() * 400;
            this.createEnemy(spawnX, spawnY);
        }
        this.enemies.playAnimation('bugSpawnAnimation');

        this.physics.add.collider(this.player.gameObject, this.drops, (_player, drop) => {
            this.player.pickUp(drop)
        }, null, this);
        this.physics.add.collider(this.enemies, this.enemies); 
        this.physics.add.collider(this.attackingAllies.attackingAllies, this.enemies);
        //this.physics.add.collider(this.attackingAllies, this.enemies); 
        this.physics.add.collider(this.player.gameObject, this.enemies, (_player, enemy) => {
            this.player.collide(enemy)
        }, null, this);

        // spawn new enemy near the player every ENEMY_SPAWN_TIMER milliseconds
        // make sure they always spawn off screen
        const playerObjRef = this.player.gameObject
        function spawnEnemy()
        {
            allowSpawnEnemy = true;
        }
        setInterval(
            spawnEnemy,
            constants.ENEMY_SPAWN_TIMER
        );

        if (constants.devMode) {
            this.physics.world.createDebugGraphic()
            this.physics.world.drawDebug = true
        }

        for (let callable of this.postCreateHooks) {
            callable()
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
              thisRow.push([0]);
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
              thisRow.push([0]);
          }
          levelArray2.push(thisRow);
        }
      
        // When loading from an array, make sure to specify the tileWidth and tileHeight
        this.grassMap = this.make.tilemap({ data: this.levelArray, tileWidth: 32, tileHeight: 32 });
        var tiles = this.grassMap.addTilesetImage("grassTiles");
        //const grassTiles = map.addTilesetImage("grassTile");
        this.grassLayer = this.grassMap.createLayer(0, tiles, 0, 0);
        this.grassLayer.setDepth(-1);
        
        var desertMap = this.make.tilemap({ data: levelArray2, tileWidth: 32, tileHeight: 32 });
        var desertTiles = desertMap.addTilesetImage("desertTile");
        //const grassTiles = map.addTilesetImage("grassTile");
        var desertLayer = desertMap.createLayer(0, desertTiles, 0, 0);
        desertLayer.setDepth(-2);


        // Oasis
       let oasis = this.add.sprite(400, 300, 'oasis');
       oasis.setOrigin(0.5, 0.5);  // use the center of the sprite as the reference point for positioning
    }

    updateTiles()
    {
        let currentTile = this.grassMap.getTileAtWorldXY(this.player.gameObject.x, this.player.gameObject.y);

        if(currentTile && this.tick % constants.GRASS_GROW_SPEED == 0)
        {
            this.grassMap
                .getTilesWithin(currentTile.x-1, currentTile.y-1, 3, 3) // find all tiles around the player
                .filter(t => t.index < 5) // filter out grass then increment tile stage
                .map(tile => this.grassMap.replaceByIndex(tile.index, tile.index + 1, tile.x, tile.y, 1, 1));
        }
    }

    update () {
        this.tick += 1;
        if (!this.active) {
            return;
        }

        if(allowSpawnEnemy == true)
        {
            let direction = Math.random < 0.5 ? 1 : -1;
            this.createEnemy(
                this.player.gameObject.x + (constants.canvasWidth * direction) + Math.random() * 400, 
                this.player.gameObject.y + (constants.canvasHeight * direction) + Math.random() * 400);
            allowSpawnEnemy = false;
        }
        this.createDrop(
            constants.canvasWidth * Math.random() * 32,
            constants.canvasHeight * Math.random() * 32);

        this.updateTiles();

        this.player.update();
        this.oasis.update();
        this.attackingAllies.update();
    
        for(const enemy of this.enemies.getChildren()) {
            const vector = new Phaser.Math.Vector2(
                this.player.gameObject.x - enemy.x,
                this.player.gameObject.y - enemy.y
            );
            vector.normalizeRightHand();
            enemy.rotation = vector.angle();
            var moveSpeed = constants.bugMovespeed;
            for (let ally of this.allies.getChildren()) {
                if (!ally.isSpawned) {
                    continue;
                }
                const allyBounds = ally.getBounds();
                const enemyBounds = enemy.getBounds();
                if (Phaser.Geom.Intersects.RectangleToRectangle(allyBounds, enemyBounds)) {
                    moveSpeed = constants.bugMovespeed * constants.bushSlow;
                }
            }
            if (enemy.isSpawned) {
                this.physics.moveTo(enemy, this.player.gameObject.x + Math.random() * 100, this.player.gameObject.y + Math.random() * 100, moveSpeed)
            }
        }
    }

    // called when player health is zero
    end () {
        this.active = false;
        for (let enemy of this.enemies.getChildren()) {
            enemy.body.setVelocity(0, 0);
        }
        // wait one second so death animation can finish
        this.time.delayedCall(1000, (enemies) => { 
            for (let enemy of enemies.getChildren()) {
                enemy.playReverse('bugSpawnAnimation');
            }
        }, [this.enemies], this);
        // wait 1.8 seconds before removing enemies (not 2s to avoid overlapping frames)
        this.time.delayedCall(1800, (enemies) => { 
            for (let enemy of enemies.getChildren()) {
                enemy.setVisible(false);
                enemy.body.enable = false;
            }
        }, [this.enemies], this);
    }
}
