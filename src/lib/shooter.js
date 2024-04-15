import {
    shooterSpawnInnerRadius,
    shooterSpawnOuterRadius,
    shooterNumInitialSpawns,
    shooterMovespeed,
} from "../constants.js";

/**
 * Bug is the simplest enemy they swarm and spawn randomly
 */
export class ShooterGroup {
    constructor(scene) {
        this.scene = scene
        this.tick = 0;
    }

    // Preload is called before scene load, with a copy of the scene
    preload() {
        this.scene.load.spritesheet('shooterMove', 'assets/viperess_move.png', {
            frameWidth: 32, frameHeight: 32
        });
        // this.scene.load.spritesheet('dirtParticle', 'assets/dirt-particle.png', {
        //     frameWidth: 6, frameHeight: 6,
        // });
        this.scene.load.spritesheet('shooterSpawn', 'assets/viperess_spawn.png', {
            frameWidth: 32, frameHeight: 32,
        });
        this.scene.load.spritesheet('shooterAttack', 'assets/viperess_attack.png', {
            frameWidth: 32, frameHeight: 32,
        });
        this.scene.load.image('shooterProjectile', 'assets/viperess_projectile.png');
        this.scene.load.audio('shooterShootSound', 'assets/sounds/viper-spit.wav');
        this.scene.load.audio('shooterDeathSound', 'assets/sounds/viper-death.wav');
    }

    /*
     * Spawns a single bug between inner and outer spawn radius from the
     * provided location 
     *
     * @param loc has x and y members
     */
    spawnShooterNear({x, y}) {
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
        let shooter = this.group.create(x, y, 'shooterSpawn')
        let currentScale = shooter.scaleX; // Get the current scale
        //shooter.setScale(currentScale * 0.7); // Increase the scale by 50;
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

        shooter.intervalId = setInterval(() => {
            if (!shooter.hasSpawned || !this.group.contains(shooter)) {
                return;
            }
            shooter.hasSpawned = false;
            shooter?.playReverse('shooterSpawnAnimation');
            shooter?.setVelocity(0);
            this.scene.time.delayedCall(1000, (e) => { 
                e.x = this.scene.player.gameObject.x + Math.random() * 400 - 200;
                e.y = this.scene.player.gameObject.y + Math.random() * 400 - 200;
                e.play('shooterSpawnAnimation');
            }, [shooter], this);
            this.scene.time.delayedCall(2000, (e) => { 
                e.hasSpawned = true;
                e.play('shooterMoveAnimation');
            }, [shooter], this);
        }, this.MAX_SHOOTER_LIFESPAN_MILLIS + Math.random() * 1000);
    }


    // Create is called when the scene becomes active, once, after assets are
    // preloaded. It's expected that this scene will have aleady called preload
    create() {
        this.shooterSlowReduction = 20;
        this.shooterSlowDurationMillis = 500;
        this.attackDamage = 8;
        this.attackCooldownMillis = 3000;
        this.projectileDamage = 1;
        this.shooterDeathSound = this.scene.sound.add('shooterDeathSound');
        this.shooterShootSound = this.scene.sound.add('shooterShootSound');
        this.projectileSlow = 170;
        this.projectileSlowDurationMillis = 350;
        this.MAX_SHOOTER_COUNT = 10;
        this.MAX_SHOOTER_LIFESPAN_MILLIS = 30_000;
        this.SPAWN_INTERVAL = 8_000;
        this.MAX_HEALTH = 50;
        this.scene.anims.create({
            key: 'shooterMoveAnimation',
            frames: this.scene.anims.generateFrameNumbers('shooterMove', { start: 0, end: 3}),
            frameRate: 20,
            repeat: -1,
        });
        this.scene.anims.create({
            key: 'shooterSpawnAnimation',
            frames: this.scene.anims.generateFrameNumbers('shooterSpawn', { start: 0, end: 8}),
            frameRate: 9,
            repeat: -1,
        });
        this.scene.anims.create({
            key: 'shooterAttackAnimation',
            frames: this.scene.anims.generateFrameNumbers('shooterAttack', { start: 0, end: 5}),
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
                enemy.health = this.MAX_HEALTH;
                enemy.isSpawned = false;
                enemy.attacking = false;
                enemy.attackcount = 0;
                enemy.setCollideWorldBounds(true);
                enemy.speed = shooterMovespeed;
                enemy.effects = new Phaser.Structs.Set();
            }
        });

        setInterval((() => {
            if (!this.scene.active) {
                return;
            }
            if (this.group.length >= this.MAX_SHOOTER_COUNT) {
                return;
            };
            const x = this.scene.player.gameObject.x
            const y = this.scene.player.gameObject.y
            this.spawnShooterNear({x: x, y: y})
        }).bind(this), this.SPAWN_INTERVAL);

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

    }

    // Update is called once per tick
    update() {
        this.tick += 1;
        if(this.tick % 10 != 0){
            return;
        }
        this.group.children.iterate(this.moveShooter.bind(this));
        let SHOOTER_DISTANCE = 170*170;
        for(const shooter of this.group.getChildren())
        {
            if(Phaser.Math.Distance.Squared(shooter.x, shooter.y, this.scene.player.gameObject.x, this.scene.player.gameObject.y) < SHOOTER_DISTANCE){
                this.attack(shooter);
            }
        };
    }

    attack(shooter) {
        if (shooter.attacking) {
            return;
        }
        shooter.attackcount += 1;

        shooter.attacking = true;
        shooter.setVelocity(0);
        shooter.play('shooterAttackAnimation');
        this.shooterShootSound.play();
        this.shooterShootSound.setVolume(0.2);
        this.projectile = this.scene.physics.add.image(shooter.x, shooter.y, 'shooterProjectile');
        const {x, y} = this.scene.player.gameObject;
        this.scene.physics.add.collider(
            this.scene.player.gameObject,
            this.projectile,
            (_player, projectile) => {
                this.scene.player.damage(this.projectileDamage);
                this.scene.player.slow('shooter', this.projectileSlow, this.projectileSlowDurationMillis);
                projectile.destroy();
            },
            null,
            this,
        );
        this.scene.physics.moveTo(this.projectile, x, y, 100);
        this.scene.time.delayedCall(this.attackCooldownMillis, (b) => { 
            b.attacking = false;
        }, [shooter], this);
    }

    damageShooter(shooter, damage) {
        if (!shooter.hasSpawned) {
            return;
        }
        shooter.health = shooter.health - damage;
        if (shooter.health <= 0) {
            this.shooterDeathSound.play();
            this.shooterDeathSound.setVolume(0.5);
            this.group.remove(shooter);
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

    slowShooter(shooter, reason, speedReduction, durationMillis) {
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
