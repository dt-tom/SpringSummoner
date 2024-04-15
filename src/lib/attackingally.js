export class AttackingAlly {
    constructor(scene)
    {
        this.scene = scene;
    }
    preload(){
        this.scene.load.audio('slash', 'assets/sounds/slash.wav');
        this.scene.load.spritesheet('gruntWalking', 'assets/stick_grunt_walking_front.png', {
            frameWidth: 32, frameHeight: 32,
        });
        this.scene.load.spritesheet('gruntSpawn', 'assets/stick_grunt_summoning_v1.png', {
            frameWidth: 32, frameHeight: 32,
        });
        this.scene.load.spritesheet('gruntAttack', 'assets/stick_grunt_attack.png', {
            frameWidth: 32, frameHeight: 32,
        });
    }
    create() {
        this.manaCost = 20;
        this.gruntMaxLifetimeMillis = 14_000
        this.slashSound = this.scene.sound.add('slash');
        this.slashSound.setVolume(0.05);
        this.attackDamage = 40;
        this.attackCooldownMillis = 500;
        this.attackSlow = 50;
        this.attackSlowDurationMillis = 250;

        // Attacking allies engage with enemies
        this.attackingAllies = this.scene.physics.add.group({
            createCallback: (grunt) => {
                grunt.spawned = false;
                grunt.attacking = false;
            },
        });

        this.scene.anims.create({
            key: 'gruntWalkAnimation',
            frames: this.scene.anims.generateFrameNumbers('gruntWalking', { start: 0, end: 3}),
            frameRate: 20,
            repeat: -1,
        });
        this.scene.anims.create({
            key: 'gruntSpawnAnimation',
            frames: this.scene.anims.generateFrameNumbers('gruntSpawn', { start: 0, end: 6}),
            frameRate: 7,
        });
        this.scene.anims.create({
            key: 'gruntAttackAnimation',
            frames: this.scene.anims.generateFrameNumbers('gruntAttack', { start: 0, end: 4}),
            frameRate: 10,
            repeat: -1,
        });

        this.scene.physics.add.collider(this.attackingAllies, this.attackingAllies);
    }
    update()
    {
        for (let grunt of this.attackingAllies.getChildren()) {
            if (!grunt.spawned || grunt.attacking) {
                continue;
            }
            const gruntBounds = grunt.getBounds();
            // Get closest enemy

            let bugClosest = this.scene.getClosestObject(grunt, this.scene.bugs.group);
            let shooterClosest = this.scene.getClosestObject(grunt, this.scene.shooters.group);
            let bug = bugClosest[1] < shooterClosest[1] ? bugClosest[0] : shooterClosest[0];
            if (bug) {
                const bugBounds = bug.getBounds();
                if (Phaser.Geom.Intersects.RectangleToRectangle(gruntBounds, bugBounds)) {
                    grunt.attacking = true;
                    this.slashSound.play();
                    this.scene.bugs.damageBug(bug, this.attackDamage);
                    this.scene.bugs.slowBug(bug, "gruntAttack", this.attackSlow, this.attackSlowDurationMillis);
                    grunt.play('gruntAttackAnimation');
                    grunt.setVelocity(0);
                    this.scene.time.delayedCall(this.attackCooldownMillis, (g) => { 
                        g.attacking = false;
                        // grunt may be dead by the time this is called
                        if (g.spawned) {
                            this.attackingAllies.playAnimation('gruntWalkAnimation');
                        }
                    }, [grunt], this);
                } else {
                    this.scene.physics.moveToObject(grunt, bug, 60);
                }
            }
        }
    }
    createAttackingAlly(posX, posY)
    {
        let grunt = this.attackingAllies.create(posX, posY, 'gruntWalking');
        grunt.play('gruntSpawnAnimation');
        this.scene.add.particles(posX, posY, 'dirtParticle', {
            speed: { min: 1, max: 20 },
            maxParticles: 20,
            anim: 'dirtTumble',
            duration: 3000,
            emitZone: { source: new Phaser.Geom.Circle(0, 0, 30) }  // Emit particles within a 4 pixel radius
        });
        this.scene.time.delayedCall(1000, (e) => { 
            e.spawned = true;
            this.attackingAllies.playAnimation('gruntWalkAnimation');
        }, [grunt], this);

        this.scene.time.delayedCall(this.gruntMaxLifetimeMillis, (g) => { 
            g.spawned = false;
            g.attacking = true;
            g.setVelocity(0);
            g.anims.stop();
            g.setTexture('gruntSpawnAnimation');
            g.playReverse('gruntSpawnAnimation');
            setTimeout(() => {
                if (g == undefined || g == null) {
                    return;
                }
                this.attackingAllies.remove(g);
                g.setVisible(false);
                g.body.enable = false;
                g.destroy();
            }, 1000);
        }, [grunt], this);
    }

    getManaCost() {
        return this.manaCost;
    }

    end() {
        // clearing the enemeis here causes exception
    }
}
