import {
    bugSpawnInnerRadius,
    bugSpawnOuterRadius,
    bugNumInitialSpawns,
    bugMovespeed,
    globalVolume,
} from "../constants.js";

/**
 * Bug is the simplest enemy they swarm and spawn randomly
 */
export class BugGroup {
    constructor(scene) {
        this.scene = scene
    }

    // Preload is called before scene load, with a copy of the scene
    preload() {
        this.scene.load.audio('bugSquishSound', 'assets/sounds/bug-squish.wav');
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
        const distance = (Math.random() * range) + bugSpawnInnerRadius

        const xOut = x + (distance * Math.cos(direction))
        const yOut = y + (distance * Math.sin(direction))


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
        let currentScale = bug.scaleX; // Get the current scale
        //bug.setScale(currentScale * 0.7); // Increase the scale by 50;
        bug.play('bugSpawnAnimation');
        this.scene.add.particles(x, y, 'dirtParticle', {
            speed: { min: 1, max: 20 },
            maxParticles: 20,
            anim: 'dirtTumble',
            duration: 3000,
            emitZone: { source: new Phaser.Geom.Circle(0, 0, 30) }  // Emit particles within a 4 pixel radius
        })
        this.scene.time.delayedCall(1000, (e) => { 
            e.hasSpawned = true;
            e.play('bugMoveAnimation');
        }, [bug], this);

        bug.intervalId = setInterval(() => {
            if (!bug.hasSpawned || !this.group.contains(bug)) {
                return;
            }
            bug.hasSpawned = false;
            bug?.playReverse('bugSpawnAnimation');
            bug?.setVelocity(0);
            this.scene.time.delayedCall(800, (e) => { 
                e.x = this.scene.player.gameObject.x + Math.random() * 400 - 200;
                e.y = this.scene.player.gameObject.y + Math.random() * 400 - 200;
                e.play('bugSpawnAnimation');
            }, [bug], this);
            this.scene.time.delayedCall(1600, (e) => { 
                e.hasSpawned = true;
                e.play('bugMoveAnimation');
            }, [bug], this);
        }, this.MAX_BUG_LIFESPAN_MILLIS + Math.random() * 1000);
    }


    // Create is called when the scene becomes active, once, after assets are
    // preloaded. It's expected that this scene will have aleady called preload
    create() {
        this.MAX_BUG_COUNT = 40;
        this.MAX_BUG_LIFESPAN_MILLIS = 20_000;
        this.SPAWN_INTERVAL = 3000;
        this.MAX_HEALTH = 100;
        this.bugSlowReduction = 20;
        this.bugSlowDurationMillis = 500;
        this.attackDamage = 2;
        this.attackCooldownMillis = 250;
        this.bugSquishSound = this.scene.sound.add('bugSquishSound');
        this.scene.anims.create({
            key: 'bugMoveAnimation',
            frames: this.scene.anims.generateFrameNumbers('enemy', { start: 0, end: 3}),
            frameRate: 20,
            repeat: -1,
        });
        this.scene.anims.create({
            key: 'bugSpawnAnimation',
            frames: this.scene.anims.generateFrameNumbers('bugSpawn', { start: 0, end: 5}),
            frameRate: 8,
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
                enemy.health = this.MAX_HEALTH;
                enemy.isSpawned = false;
                enemy.attacking = false;
                enemy.setCollideWorldBounds(true);
                enemy.speed = bugMovespeed;
                enemy.effects = new Phaser.Structs.Set();
            }
        });

        this.bugSpawnInterval = setInterval((() => {
            if (!this.scene.active) {
                return;
            }
            const x = this.scene.player.gameObject.x
            const y = this.scene.player.gameObject.y
            if (this.group.length >= this.MAX_BUG_COUNT) {
                return;
            };
            this.spawnBugNear({x: x, y: y})
        }).bind(this), this.SPAWN_INTERVAL);

        this.scene.postCreateHooks.push(this.postCreate.bind(this))
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
            (_player, enemy) => {this.attack(enemy)},
            null,
            this,
        );
    }

    // Update is called once per tick
    update() {
        this.group.children.iterate(this.moveBug.bind(this))
    }

    attack(bug) {
        if (bug.attacking) {
            return;
        }
        bug.attacking = true;
        bug.setVelocity(0);
        this.scene.time.delayedCall(this.attackCooldownMillis, (b) => { 
            b.attacking = false;
        }, [bug], this);
        this.scene.player.damage(this.attackDamage);
        this.scene.player.slow("bugSlow", this.bugSlowReduction, this.bugSlowDurationMillis);
    }

    damageBug(bug, damage) {
        if (!bug.hasSpawned) {
            return;
        }
        bug.health = bug.health - damage;
        if (bug.health <= 0) {
            clearInterval(bug.intervalId);
            this.bugSquishSound.play();
            this.bugSquishSound.setVolume(1 * globalVolume);
            this.group.remove(bug);
            bug.destroy();
        }
        bug.setTint(0xff0000); // Tint the sprite red
        setTimeout(() => {
            bug.clearTint(); // Clear the tint after a delay
        }, 200);
    }

    moveBug(bug) {
        if (!bug.hasSpawned || bug.attacking) {
            return;
        }
        bug.setVelocity(0, 0)
        const {x, y} = this.scene.player.gameObject;
        const vector = new Phaser.Math.Vector2(x - bug.x, y - bug.y);
        bug.rotation = vector.clone().normalizeRightHand().angle();
        vector.normalize()
        vector.scale(bug.speed)
        bug.setVelocity(vector.x, vector.y)
    }

    slowBug(bug, reason, speedReduction, durationMillis) {
        if (bug.effects.contains(reason)) {
            return;
        }
        bug.effects.set(reason);
        bug.speed = bug.speed - speedReduction;
        setTimeout(() => {
            bug.speed = bug.speed + speedReduction;
            bug.effects.delete(reason);
        }, durationMillis);
    }
    
    end() {
        this.group.children.iterate(bug => clearInterval(bug.intervalId))
        clearInterval(this.bugSpawnInterval)
    }
};
