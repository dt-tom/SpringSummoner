import * as constants from '../constants.js'
import { Player } from '../lib/player.js'
<<<<<<< HEAD
import { Oasis } from '../lib/oasis.js'
=======
import { HealthBar } from '../lib/healthbar.js'
//import AnimatedTiles from '../../node_modules/phaser-animated-tiles-phaser3.5/dist/AnimatedTiles.min.js'
>>>>>>> 0389944 (tiles)

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
    }

    preload () {
        this.load.scenePlugin('AnimatedTiles', 'https://raw.githubusercontent.com/nkholski/phaser-animated-tiles/master/dist/AnimatedTiles.js', 'animatedTiles', 'animatedTiles'); 
        this.load.image('me', 'assets/main-character-inuse.png');
        this.load.image('bush', 'assets/bush-v1.png');
        this.load.image('attackingAlly', 'assets/bomb.png');
        this.load.image('bush', 'assets/bush-v1.png');
        this.load.spritesheet('enemy', 'assets/bug-move.png', {
            frameWidth: 32, frameHeight: 32
        });
<<<<<<< HEAD
        this.load.image('sand', 'assets/desert-block.png')
=======
        this.load.image('sand', 'assets/desert-block.png');
        this.load.image('oasis', 'assets/oasis-inuse.png');
        this.load.image('tiles', 'assets/grass-block.png');
>>>>>>> 0389944 (tiles)
        this.load.spritesheet('dirtParticle', 'assets/dirt-particle.png', {
            frameWidth: 6, frameHeight: 6,
        });
        this.load.spritesheet('bugSpawn', 'assets/bug-spawn.png', {
            frameWidth: 32, frameHeight: 32,
        });
        this.load.spritesheet('bushSpawn', 'assets/bush-spawn.png', {
            frameWidth: 64, frameHeight: 64,
        });
        this.load.audio('leavesSound', 'assets/sounds/bush-sound.mp3');

        this.player.preload();
        this.oasis.preload();
    }

    createEnemy(posX, posY)
    {
        // console.log("creating enemy");
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

    create () {
<<<<<<< HEAD
        // Will call each of these after everything is initialized
        // Useful for adding collision handlers when everything is ready to go
        // (make sure to bind them if they're instance methods)
        this.postCreateHooks = []

=======

        const level = [
            [  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0 ],
            [  0,   1,   2,   3,   0,   0,   0,   1,   2,   3,   0 ],
            [  0,   5,   6,   7,   0,   0,   0,   5,   6,   7,   0 ],
            [  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0 ],
            [  0,   0,   0,  14,  13,  14,   0,   0,   0,   0,   0 ],
            [  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0 ],
            [  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0 ],
            [  0,   0,  14,  14,  14,  14,  14,   0,   0,   0,  15 ],
            [  0,   0,   0,   0,   0,   0,   0,   0,   0,  15,  15 ],
            [ 35,  36,  37,   0,   0,   0,   0,   0,  15,  15,  15 ],
            [ 39,  39,  39,  39,  39,  39,  39,  39,  39,  39,  39 ]
          ];

          var levelArray = [[]];
          // construct level array
          for(let i = 0; i < constants.mapWidth; i++)
          {
            levelArray += [  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0 ];
          }
        
          // When loading from an array, make sure to specify the tileWidth and tileHeight
          const map = this.make.tilemap({ data: level, tileWidth: 32, tileHeight: 32 });
          const tiles = map.addTilesetImage("tiles");
          const layer = map.createLayer(0, tiles, 0, 0);
>>>>>>> 0389944 (tiles)
        // consts
        const NUMBER_OF_ENEMIES = 10;
        //  Set the camera and physics bounds to be the size of 4x4 bg images
        this.cameras.main.setBounds(0, 0, 1920 * 2, 1080 * 2);
        this.cameras.main.setZoom(2);  // 2x our assets visually
        this.physics.world.setBounds(0, 0, 1920 * 2, 1080 * 2);

        //  Background/desert tiles
        this.add.tileSprite(0, 0, constants.mapWidth, constants.mapHeight, 'sand').setOrigin(0, 0);

        this.oasis.create()
        this.player.create()

        this.cameras.main.startFollow(this.player.gameObject, true, 0.1, 0.1);  // Should this be in player.js?

        // Allies are stationary helpers
        this.allies = this.physics.add.group({
            createCallback: (ally) => {
                ally.isSpawned = false;
            },
        });
        
        // Attacking allies engage with enemies
        this.attackingAllies = this.physics.add.group();

        // make enemies
        this.enemies = this.physics.add.group();

        let bushSound = this.sound.add('leavesSound');
        // Add a marker that starts at 12 second into the sound and lasts for 1 seconds
        bushSound.addMarker({name: 'bushMarker', start: 3, duration: 1});

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
        this.anims.create({
            key: 'scorpion-move',
            frames: this.anims.generateFrameNumbers('attackingAlly', { start: 0, end: 5}),
            frameRate: 20,
            repeat: -1,
        });
    
        // make enemies
        this.enemies = this.physics.add.group({
            createCallback: (enemy) => {
                enemy.isSpawned = false;
            }
        });

        for(let i = 0; i < NUMBER_OF_ENEMIES; i++) {
            const spawnX = Math.random() * 400;
            const spawnY = Math.random() * 400;
            this.createEnemy(spawnX, spawnY);
        }
        this.enemies.playAnimation('bugSpawnAnimation');

        this.physics.add.collider(this.enemies, this.enemies); 
        this.physics.add.collider(this.attackingAllies, this.enemies); 
        this.physics.add.collider(this.player.gameObject, this.enemies, (_player, enemy) => {
            this.player.collide(enemy)
        }, null, this);

        console.log(allowSpawnEnemy);

        // spawn new enemy near the player every ENEMY_SPAWN_TIMER milliseconds
        // make sure they always spawn off screen
        function spawnEnemy() {
            // console.log("spawning enemy");
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

<<<<<<< HEAD
=======
    /**
     * Create the tiled background and static foreground elements. Expects
     * assets named sand (tileable) and oasis (sprite) to be preloaded
     */
    createWorld() {
        //  Background/desert tiles
        // this.add.tileSprite(0, 0, constants.mapWidth, constants.mapHeight, 'sand').setOrigin(0, 0);

        // const array=[[0,1,2,22],
        //             [17,18,19],
        //             [34,35,36]];

        // this.map = this.make.tilemap({ key: 'map' });
        // const tiles = this.map.addTilesetImage('Desert', 'tiles');
        // const layer = this.map.createLayer('Ground', tiles, 0, 0);

        //this.sys.animatedTiles.init(map);


        // Oasis
       // let oasis = this.add.sprite(400, 300, 'oasis');
       // oasis.setOrigin(0.5, 0.5);  // use the center of the sprite as the reference point for positioning
    }

>>>>>>> 0389944 (tiles)
    update () {
        if(allowSpawnEnemy == true)
        {
            let direction = Math.random < 0.5 ? 1 : -1;
            this.createEnemy(
                this.player.gameObject.x + (constants.canvasWidth * direction) + Math.random() * 400, 
                this.player.gameObject.y + (constants.canvasHeight * direction) + Math.random() * 400);
            allowSpawnEnemy = false;
        }
        this.player.update()
        this.oasis.update()

        for (let ally of this.attackingAllies.getChildren()) {
            let closestEnemy = this.getClosestObject(ally, this.enemies);
            if (closestEnemy){
                this.physics.moveToObject(ally, closestEnemy, 60);
            }
            
        }
    

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
}
