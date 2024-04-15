import {
    shooterSpawnInnerRadius,
    shooterSpawnOuterRadius,
    shooterNumInitialSpawns,
    ENEMY_SPAWN_TIMER,
    ENEMY_START_HEALTH,
    shooterMovespeed,
} from "../constants.js";

/**
 * Bug is the simplest enemy they swarm and spawn randomly
 */
export class ShooterGroup {
    constructor(scene) {
        this.scene = scene
    }

    // Preload is called before scene load, with a copy of the scene
    preload() {
       // this.scene.load.audio('bugSquishSound', 'assets/sounds/bug-squish.wav');
        this.scene.load.spritesheet('shooterMove', 'assets/viperess_move.png', {
            frameWidth: 32, frameHeight: 32
        });
        // this.scene.load.spritesheet('dirtParticle', 'assets/dirt-particle.png', {
        //     frameWidth: 6, frameHeight: 6,
        // });
        this.scene.load.spritesheet('shooterSpawn', 'assets/viperess_spawn.png', {
            frameWidth: 32, frameHeight: 32,
        });
    }

    /*
     * Spawns a single bug between inner and outer spawn radius from the
     * provided location 
     *
     * @param loc has x and y members
     */
    spawnShooterNear({x, y}) {
        console.log("SPAWNING");
        const direction = Math.random() * 2 * Math.PI;
        const range = shooterSpawnOuterRadius - shooterSpawnInnerRadius
        const  distance = (Math.random() * range) + shooterSpawnInnerRadius

        const xOut = x + (distance * Math.cos(direction))
        const yOut = y + (distance * Math.sin(direction))


        this.spawnShooterAt({
            x: xOut,
            y: yOut,
        })
    } 

    /*
     * Spawn a single bug exactly at (x, y)
     */
    spawnShooterAt({x, y}) {
        // spawn animation
        console.log("SPAWNING SHOOTER");
        let shooter = this.group.create(x, y, 'shooterSpawn')
        let currentScale = shooter.scaleX; // Get the current scale
        shooter.setScale(currentScale * 0.7); // Increase the scale by 50;
        this.scene.add.particles(x, y, 'dirtParticle', {
            speed: { min: 1, max: 20 },
            maxParticles: 20,
            anim: 'dirtTumble',
            duration: 3000,
            emitZone: { source: new Phaser.Geom.Circle(0, 0, 30) }  // Emit particles within a 4 pixel radius
        })
        this.scene.time.delayedCall(1000, (e) => { 
            e.hasSpawned = true;
            this.group.playAnimation('shooterMoveAnimation');
        }, [shooter], this);
    }


    // Create is called when the scene becomes active, once, after assets are
    // preloaded. It's expected that this scene will have aleady called preload
    create() {
        this.shooterSlowReduction = 20;
        this.shooterSlowDurationMillis = 500;
        this.attackDamage = 2;
        this.attackCooldownMillis = 250;
        //this.shooterSquishSound = this.scene.sound.add('shooterSquishSound');
        this.scene.anims.create({
            key: 'shooterMoveAnimation',
            frames: this.scene.anims.generateFrameNumbers('shooterMove', { start: 0, end: 3}),
            frameRate: 20,
            repeat: -1,
        });
        this.scene.anims.create({
            key: 'shooterSpawnAnimation',
            frames: this.scene.anims.generateFrameNumbers('shooterSpawn', { start: 0, end: 8}),
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
                enemy.health = ENEMY_START_HEALTH;
                enemy.isSpawned = false;
                enemy.attacking = false;
                enemy.setCollideWorldBounds(true);
                enemy.speed = shooterMovespeed;
                enemy.effects = new Phaser.Structs.Set();
            }
        });

        setInterval((() => {
            if (!this.scene.active) {
                return;
            }
            const x = this.scene.player.gameObject.x
            const y = this.scene.player.gameObject.y
            this.spawnShooterNear({x: x, y: y})
        }).bind(this), ENEMY_SPAWN_TIMER);

        this.scene.postCreateHooks.push(this.postCreate.bind(this))
    }

    postCreate() {

        for(let i = 0; i < shooterNumInitialSpawns; i++) {
            this.spawnShooterNear({
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
        this.group.children.iterate(this.moveShooter.bind(this))
    }

    attack(shooter) {
        if (shooter.attacking) {
            return;
        }
        shooter.attacking = true;
        shooter.setVelocity(0);
        this.scene.time.delayedCall(this.attackCooldownMillis, (b) => { 
            b.attacking = false;
        }, [shooter], this);
        // this.scene.player.damage(this.attackDamage);
        // this.scene.player.slow("shooterSlow", this.shooterSlowReduction, this.shooterSlowDurationMillis);
    }

    damageShooter(shooter, damage) {
        if (!shooter.hasSpawned) {
            return;
        }
        shooter.health = shooter.health - damage;
        if (shooter.health <= 0) {
            this.shooterSquishSound.play();
            this.group.remove(bug);
            shooter.destroy();
        }
        shooter.setTint(0xff0000); // Tint the sprite red
        setTimeout(() => {
            shooter.clearTint(); // Clear the tint after a delay
        }, 200);
    }

    moveShooter(shooter) {
        if (!shooter.hasSpawned || shooter.attacking) {
            return;
        }
        shooter.setVelocity(0, 0)
        const {x, y} = this.scene.player.gameObject;
        const vector = new Phaser.Math.Vector2(x - shooter.x, y - shooter.y);
        vector.normalize()
        vector.scale(shooter.speed)
        shooter.setVelocity(vector.x, vector.y)
    }

    slowshooter(shooter, reason, speedReduction, durationMillis) {
        if (shooter.effects.contains(reason)) {
            return;
        }
        shooter.effects.set(reason);
        shooter.speed = shooter.speed - speedReduction;
        setTimeout(() => {
            shooter.speed = shooter.speed + speedReduction;
            shooter.effects.delete(reason);
        }, durationMillis);
    }
};
