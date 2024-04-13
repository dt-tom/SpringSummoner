import * as constants from '../constants.js'
import { Player } from '../lib/player.js'

let allowSpawnEnemy = false;


/**
 * GameScene is the main scene of Spring Summoner; it's where the actual game
 * lives
 */
export class GameScene extends Phaser.Scene {
    constructor () {
        super('GameScene');
        this.player = new Player(this)
    }

    preload () {
        this.load.image('ally', 'assets/bush-v1.png');
        this.load.image('attackingAlly', 'assets/bomb.png');
        this.load.spritesheet('enemy', 'assets/bug-move.png', {
            frameWidth: 32, frameHeight: 32
        });
        this.load.image('sand', 'assets/desert-block.png')
        this.load.image('oasis', 'assets/oasis-inuse.png')
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
        this.load.audio('soundtrack', 'assets/sounds/soundtrack.mp3');

        this.player.preload(this)
    }

    createEnemy(posX, posY)
    {
        console.log("creating enemy");
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
        // consts
        const NUMBER_OF_ENEMIES = 10;
        //  Set the camera and physics bounds to be the size of 4x4 bg images
        this.cameras.main.setBounds(0, 0, 1920 * 2, 1080 * 2);
        this.cameras.main.setZoom(2);  // 2x our assets visually
        this.physics.world.setBounds(0, 0, 1920 * 2, 1080 * 2);

        this.createWorld()


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

        this.input.mouse.disableContextMenu();

        // make enemies
        this.enemies = this.physics.add.group();

        let bushSound = this.sound.add('leavesSound');
        // Add a marker that starts at 12 second into the sound and lasts for 1 seconds
        bushSound.addMarker({name: 'bushMarker', start: 3, duration: 1});
        bushSound.setVolume(0.0);

        this.load.audio('soundtrack', 'assets/sounds/soundtrack.mp3');
        let soundtrack = this.sound.add('soundtrack');
        soundtrack.setLoop(true);
        soundtrack.play();
        soundtrack.setVolume(0.3);
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

        this.input.on('pointerdown', e => {
            if(e.rightButtonDown()) {
                this.attackingAllies.create(e.worldX, e.worldY, 'attackingAlly');
                this.attackingAllies.playAnimation('scorpion-move');
            } else {
                let ally = this.allies.create(e.worldX, e.worldY, 'bush');
                ally.play('bushSpawnAnimation');
                ally.on('animationcomplete', () => { 
                    ally.isSpawned = true;
                    ally.setTexture('bush');
                }, this);
                ally.setDepth(0);
                bushSound.play('bushMarker');
            }
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
        const playerObjRef = this.player.gameObject
        function spawnEnemy()
        {
            console.log("spawning enemy");
            allowSpawnEnemy = true;
        }
        setInterval(
            spawnEnemy,
            constants.ENEMY_SPAWN_TIMER
        );
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
        //  Background/desert tiles
        this.add.tileSprite(0, 0, constants.mapWidth, constants.mapHeight, 'sand').setOrigin(0, 0);

        // Oasis
        let oasis = this.add.sprite(400, 300, 'oasis');
        oasis.setOrigin(0.5, 0.5);  // use the center of the sprite as the reference point for positioning
    }

    update () {
        if(allowSpawnEnemy == true)
        {
            let direction = Math.random < 0.5 ? 1 : -1;
            this.createEnemy(
                this.player.x + (constants.canvasWidth * direction) + Math.random() * 400, 
                this.player.y + (constants.canvasHeight * direction) + Math.random() * 400);
            allowSpawnEnemy = false;
        }
        this.player.update()

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
