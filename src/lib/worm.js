import {
    wormSpawnInnerRadius,
    wormSpawnOuterRadius,
    wormNumInitialSpawns,
    wormMovespeed,
} from "../constants.js";

/**
 * Bug is the simplest enemy they swarm and spawn randomly
 */
export class Worm {
    constructor(scene) {
        this.scene = scene
        this.tick = 0;
        this.allowSpawn = false;
    }

    // Preload is called before scene load, with a copy of the scene
    preload() {
        this.scene.load.spritesheet('wormMove', 'assets/sandworm-move.png', {
            frameWidth: 64, frameHeight: 64,
        });
        this.scene.load.spritesheet('dirtParticle', 'assets/dirt-particle.png', {
            frameWidth: 6, frameHeight: 6,
        });
        this.scene.load.spritesheet('wormSpawn', 'assets/sand-worm-burrow.png', {
            frameWidth: 64, frameHeight: 64,
        });
        this.scene.load.spritesheet('wormAttack', 'assets/sandworm-attack.png', {
            frameWidth: 64, frameHeight: 64,
        });
        this.scene.load.audio('earthquake', 'assets/sounds/earthquake.wav');
        this.scene.load.audio('roar', 'assets/sounds/roar.wav');
    }

    setAllowSpawn(){
        if (!this.allowSpawn) {
            this.allowSpawn = true;
            this.earthquakeSound.play('longEarthquake');
        }
    }

    /*
     * Spawns a single bug between inner and outer spawn radius from the
     * provided location 
     *
     * @param loc has x and y members
     */
    spawnwormNear({x, y}) {
        const direction = Math.random() * 2 * Math.PI;
        const range = wormSpawnOuterRadius - wormSpawnInnerRadius
        const distance = (Math.random() * range) + wormSpawnInnerRadius

        const xOut = x + (distance * Math.cos(direction))
        const yOut = y + (distance * Math.sin(direction))

        this.spawnwormAt({
            x: xOut,
            y: yOut,
        })
    } 

    /*
     * Spawn a single bug exactly at (x, y)
     */
    spawnwormAt({x, y}) {
        // spawn animation
        let worm = this.group.create(x, y, 'wormSpawn');
        worm.setScale(2);
        this.scene.add.particles(x, y, 'dirtParticle', {
            speed: { min: 1, max: 20 },
            maxParticles: 20,
            anim: 'dirtTumble',
            duration: 3000,
            emitZone: { source: new Phaser.Geom.Circle(0, 0, 30) }  // Emit particles within a 4 pixel radius
        })
        this.scene.time.delayedCall(1000, (e) => { 
            e.hasSpawned = true;
            e.canAttack = false;
            this.group.playAnimation('wormMoveAnimation');
        }, [worm], this);

        worm.intervalId = setInterval(() => {
            if (!worm.hasSpawned || !this.group.contains(worm)) {
                return;
            }
            worm.canAttack = false;
            worm.hasSpawned = false;
            worm?.playReverse('wormSpawnAnimation');
            this.earthquakeSound.play('shortEarthquake');
            worm?.setVelocity(0);
            this.scene.time.delayedCall(1000, (e) => { 
                e.x = this.scene.player.gameObject.x + Math.random() * 400 - 200;
                e.y = this.scene.player.gameObject.y + Math.random() * 400 - 200;
                e.play('wormSpawnAnimation');
                this.earthquakeSound.play('shortEarthquake');
            }, [worm], this);
            this.scene.time.delayedCall(2000, (e) => { 
                e.hasSpawned = true;
                worm.canAttack = true;
                e.play('wormMoveAnimation');
                this.earthquakeSound.play('shortEarthquake');
            }, [worm], this);
        }, this.MAX_worm_LIFESPAN_MILLIS + Math.random() * 1000);
    }


    // Create is called when the scene becomes active, once, after assets are
    // preloaded. It's expected that this scene will have aleady called preload
    create() {
        this.earthquakeSound = this.scene.sound.add('earthquake');
        this.earthquakeSound.setVolume(0.4);
        this.roarSound = this.scene.sound.add('roar');
        this.roarSound.setVolume(0.4);
        this.earthquakeSound.addMarker({name: 'shortEarthquake', start: 0, duration: 2});
        this.earthquakeSound.addMarker({name: 'attackEarthquake', start: 0, duration: 2.75});
        this.earthquakeSound.addMarker({name: 'longEarthquake', start: 0, duration: 4.5});
        this.wormSlow = 140;
        this.wormSlowDurationMillis = 1250;
        this.attackDamage = 8;
        this.attackCooldownMillis = 3000;
        this.projectileDamage = 1;
        this.ATTACK_SPAWN_DELAY_MILLIS = 1_700;
        //this.wormDeathSound = this.scene.sound.add('wormDeathSound');
        //this.wormShootSound = this.scene.sound.add('wormShootSound');
        this.MAX_worm_COUNT = 1;
        this.MAX_worm_LIFESPAN_MILLIS = 30_000;
        this.SPAWN_INTERVAL = 10000;
        this.MAX_HEALTH = 1000;
        this.scene.anims.create({
            key: 'wormMoveAnimation',
            frames: this.scene.anims.generateFrameNumbers('wormMove', { start: 0, end: 2}),
            frameRate: 9,
            repeat: -1,
        });
        this.scene.anims.create({
            key: 'wormSpawnAnimation',
            frames: this.scene.anims.generateFrameNumbers('wormSpawn', { start: 0, end: 9}),
            frameRate: 9,
            repeat: -1,
        });
        this.scene.anims.create({
            key: 'wormAttackAnimation',
            frames: this.scene.anims.generateFrameNumbers('wormAttack', { start: 0, end: 35}),
            frameRate: 9,
            repeat: 0,
        });
        // Don't recreate dirtTumble (it's in bug.js)

        // make enemies
        this.group = this.scene.physics.add.group({
            createCallback: (enemy) => {
                enemy.health = this.MAX_HEALTH;
                enemy.isSpawned = false;
                enemy.canAttack = false;
                enemy.attacking = false;
                enemy.attackcount = 0;
                enemy.setCollideWorldBounds(true);
                enemy.speed = wormMovespeed;
                enemy.effects = new Phaser.Structs.Set();
            }
        });

        this.wormSpawnInterval = setInterval((() => {
            if(!this.allowSpawn)
            {
                return;
            }
            if (!this.scene.active) {
                return;
            }
            if (this.group.getLength() >= this.MAX_worm_COUNT) {
                return;
            };
            const x = this.scene.player.gameObject.x
            const y = this.scene.player.gameObject.y
            this.spawnwormNear({x: x, y: y})
        }).bind(this), this.SPAWN_INTERVAL);

        this.scene.postCreateHooks.push(this.postCreate.bind(this))
    }

    postCreate() {
        for(let i = 0; i < wormNumInitialSpawns; i++) {
            this.spawnwormNear({
                x: this.scene.player.gameObject.x,
                y: this.scene.player.gameObject.y,
            });
        } 
        // Prevent bugs from stacking
        this.scene.physics.add.collider(this.group, this.group); 

        this.scene.physics.add.collider(
            this.scene.player.gameObject,
            this.group, (_player, worm) => {
                this.scene.player.slow('worm', this.wormSlow, this.wormSlowDurationMillis);
                if (worm.canAttack) {
                    this.scene.player.damage(this.attackDamage);
                }
            });

    }

    // Update is called once per tick
    update() {
        this.tick += 1;
        if(this.tick % 10 != 0){
            return;
        }
        this.group.children.iterate(this.moveworm.bind(this));
        let worm_DISTANCE = 170*170;
        for(const worm of this.group.getChildren())
        {
            if(Phaser.Math.Distance.Squared(worm.x, worm.y, this.scene.player.gameObject.x, this.scene.player.gameObject.y) < worm_DISTANCE){
                this.attack(worm);
            }
        };
    }

    attack(worm) {     
        if (worm.attacking || worm.health <= 0) {
            return;
        }
        worm.attackcount += 1;

        worm.attacking = true;
        worm.setVelocity(0);
        worm.setImmovable();
        worm.play('wormSpawnAnimation');
        this.earthquakeSound.play('shortEarthquake');
        this.scene.add.particles(worm.x, worm.y, 'dirtParticle', {
            speed: { min: 1, max: 20 },
            maxParticles: 50,
            anim: 'dirtTumble',
            duration: 3000,
            emitZone: { source: new Phaser.Geom.Circle(0, 0, 60) }  // Emit particles within a 4 pixel radius
        })
        this.scene.time.delayedCall(1000, (b) => { 
            // worm could be dead
            if(!worm)
            {
                return;
            }
            
            let vVector = Math.sqrt(this.scene.player.gameObject.body.velocity.x ** 2, this.scene.player.gameObject.body.velocity.y ** 2);
            if(vVector <= 100)
            {
                worm.x = this.scene.player.gameObject.x;
                worm.y = this.scene.player.gameObject.y;
            } else {
                worm.x = this.scene.player.gameObject.x + this.scene.player.gameObject.body.velocity.x;
                worm.y = this.scene.player.gameObject.y + this.scene.player.gameObject.body.velocity.y;
            }
            if(worm !== undefined && !worm.health <= 0)
            {
                worm.canAttack = false;
                worm.play('wormAttackAnimation');
                this.earthquakeSound.play('attackEarthquake');
                setTimeout(() => {
                    this.roarSound.play();
                    worm.canAttack = true;
                }, this.ATTACK_SPAWN_DELAY_MILLIS);
            }
            worm.on('animationcomplete', () => {
                worm.destroy();
            });
        }, [worm], this);
    }

    damageworm(worm, damage) {
        console.log("DAMAGING WORM WITH: " + damage);
        if (!worm.hasSpawned) {
            return;
        }
        worm.health = worm.health - damage;
        if (worm.health <= 0) {
            // this.wormDeathSound.play();
            // this.wormDeathSound.setVolume(0.5);
            this.group.remove(worm);
            clearInterval(worm.intervalId)
            worm.destroy();
        }
        worm.setTint(0xff0000); // Tint the sprite red
        setTimeout(() => {
            worm.clearTint(); // Clear the tint after a delay
        }, 200);
    }

    moveworm(worm) {
        if (!worm.hasSpawned || worm.attacking) {
            return;
        }
        worm.setVelocity(0, 0)
        const {x, y} = this.scene.player.gameObject;
        const vector = new Phaser.Math.Vector2(x - worm.x, y - worm.y);
        vector.normalize()
        vector.scale(worm.speed)
        worm.setVelocity(vector.x, vector.y)
    }

    slowworm(worm, reason, speedReduction, durationMillis) {
        if (worm.effects.contains(reason)) {
            return;
        }
        worm.effects.set(reason);
        worm.speed = worm.speed - speedReduction;
        setTimeout(() => {
            worm.speed = worm.speed + speedReduction;
            worm.effects.delete(reason);
        }, durationMillis);
    }

    end() {
        clearInterval(this.wormSpawnInterval)
        this.group.children.iterate(w => clearInterval(w.intervalId))
    }
};
