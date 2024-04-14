import {
    bugSpawnInnerRadius,
    bugSpawnOuterRadius,
    bugNumInitialSpawns,
    ENEMY_SPAWN_TIMER,
    bugMovespeed,
    bushSlow,
} from "../constants.js";

/**
 * Bug is the simplest enemy they swarm and spawn randomly
 */
export class BugGroup {
    constructor(scene) {
        this.scene = scene
        console.log('BugGroup:', 'constructed')
    }

    // Preload is called before scene load, with a copy of the scene
    preload() {
        this.scene.load.spritesheet('enemy', 'assets/bug-move.png', {
            frameWidth: 32, frameHeight: 32
        });
        this.scene.load.spritesheet('dirtParticle', 'assets/dirt-particle.png', {
            frameWidth: 6, frameHeight: 6,
        });
        this.scene.load.spritesheet('bugSpawn', 'assets/bug-spawn.png', {
            frameWidth: 32, frameHeight: 32,
        });
    }

    /*
     * Spawns a single bug between inner and outer spawn radius from the
     * provided location 
     *
     * @param loc has x and y members
     */
    spawnBugNear({x, y}) {
        const direction = Math.random() * 2 * Math.PI;
        const range = bugSpawnOuterRadius - bugSpawnInnerRadius
        const  distance = (Math.random() * range) + bugSpawnInnerRadius

        const xOut = x + (distance * Math.cos(direction))
        const yOut = y + (distance * Math.sin(direction))

        console.log('spawnBugNear', `(${x}, ${y})`, '->', `(${xOut}, ${yOut})`)

        this.spawnBugAt({
            x: xOut,
            y: yOut,
        })
    } 

    /*
     * Spawn a single bug exactly at (x, y)
     */
    spawnBugAt({x, y}) {
        // spawn animation
        let bug = this.group.create(x, y, 'bugSpawn')
        this.scene.add.particles(x, y, 'dirtParticle', {
            speed: { min: 1, max: 20 },
            maxParticles: 20,
            anim: 'dirtTumble',
            duration: 3000,
            emitZone: { source: new Phaser.Geom.Circle(0, 0, 30) }  // Emit particles within a 4 pixel radius
        })
        this.scene.time.delayedCall(1000, (e) => { 
            e.hasSpawned = true;
            this.group.playAnimation('bugMoveAnimation');
        }, [bug], this);
    }


    // Create is called when the scene becomes active, once, after assets are
    // preloaded. It's expected that this scene will have aleady called preload
    create() {
        this.scene.anims.create({
            key: 'bugMoveAnimation',
            frames: this.scene.anims.generateFrameNumbers('enemy', { start: 0, end: 3}),
            frameRate: 20,
            repeat: -1,
        });
        this.scene.anims.create({
            key: 'bugSpawnAnimation',
            frames: this.scene.anims.generateFrameNumbers('bugSpawn', { start: 0, end: 8}),
            frameRate: 10,
            repeat: -1,
        });
        this.scene.anims.create({
            key: 'dirtTumble',
            frames: this.scene.anims.generateFrameNumbers('dirtParticle', { start: 0, end: 7}),
            frameRate: 10,
            repeat: -1,
        });

        // make enemies
        this.group = this.scene.physics.add.group({
            createCallback: (enemy) => {
                enemy.isSpawned = false;
                enemy.setCollideWorldBounds(true);
            }
        });

        setInterval((() => {
            if (!this.scene.active) {
                return;
            }
            const x = this.scene.player.gameObject.x
            const y = this.scene.player.gameObject.y
            this.spawnBugNear({x: x, y: y})
        }).bind(this), ENEMY_SPAWN_TIMER);

        this.scene.postCreateHooks.push(this.postCreate.bind(this))
        console.log('BugGroup:', 'created')
    }

    postCreate() {

        for(let i = 0; i < bugNumInitialSpawns; i++) {
            this.spawnBugNear({
                x: this.scene.player.gameObject.x,
                y: this.scene.player.gameObject.y,
            });
        }
        
        // Prevent bugs from stacking
        this.scene.physics.add.collider(this.group, this.group); 

        this.scene.physics.add.collider(
            this.scene.player.gameObject,
            this.group,
            (_player, enemy) => {this.scene.player.collide(enemy)},
            null,
            this,
        );
    }

    // Update is called once per tick
    update() {
        this.group.children.iterate(this.moveBug.bind(this))
    }

    moveBug(bug) {
        if (!bug.hasSpawned) {
            return;
        }
        bug.setVelocity(0, 0)
        const {x, y} = this.scene.player.gameObject;
        const vector = new Phaser.Math.Vector2(x - bug.x, y - bug.y);
        bug.rotation = vector.clone().normalizeRightHand().angle();
        vector.normalize()
        vector.scale(bugMovespeed)
        bug.setVelocity(vector.x, vector.y)
    }
};