export class DeerManager {
    constructor(scene)
    {
        this.scene = scene;
    }
    preload(){
        this.scene.load.spritesheet('deerSpawn', 'assets/deer-summoning.png', {
            frameWidth: 64, frameHeight: 64,
        });
        this.scene.load.spritesheet('deerAttack', 'assets/deer-charge.png', {
            frameWidth: 64, frameHeight: 64,
        });
    }

    create() {
        this.manaCost = 25;
        this.attackDamage = 100000;
        this.attackDurationMillis = 1000;
        this.spawnAnimationDurationMillis = 1000;
        this.deers = this.scene.physics.add.group({
            createCallback: (deer) => {
                deer.spawned = false;
                deer.attacking = false;
            },
        });

        this.scene.anims.create({
            key: 'deerSpawnAnimation',
            frames: this.scene.anims.generateFrameNumbers('deerSpawn', { start: 0, end: 30}),
            frameRate: 45,
        });
        this.scene.anims.create({
            key: 'deerAttackAnimation',
            frames: this.scene.anims.generateFrameNumbers('deerAttack', { start: 0, end: 19}),
            frameRate: 15,
            repeat: -1,
        });

        this.scene.physics.add.overlap(
            this.deers,
            this.scene.bugs.group,
            (deer, bug) => {
                this.scene.bugs.damageBug(bug, this.attackDamage)},
            null,
            this,
        );
        this.scene.physics.add.overlap(
            this.deers,
            this.scene.shooters.group,
            (deer, shooter) => {
                this.scene.shooters.damageShooter(shooter, this.attackDamage)},
            null,
            this,
        );
        // this.scene.physics.add.collider(
        //     this.deers,
        //     this.scene.worm.group,
        //     (deer, worm) => {
        //         console.log("WORM COLLIDE");
        //         //this.scene.worm.damageworm(worm, this.attackDamage)},
        //     }
        // );
    }

    update() {
        // for (let deer of this.deers.getChildren()) {
        //     if (!deer.spawned) {
        //         continue;
        //     }
        //     console.log("here");
        //     let deerBounds = deer.getBounds();
        //     for (let bug of this.scene.bugs.group.getChildren()) {
        //         console.log(deerBounds);
        //         let bugBounds = bug.getBounds();
        //         console.log(bugBounds);
        //         console.log("rectange: " + Phaser.Geom.Intersects.RectangleToRectangle(deerBounds, bugBounds));
        //         if (Phaser.Geom.Intersects.RectangleToRectangle(deerBounds, bugBounds)) {
        //             console.log("here4");
        //             this.scene.bugs.damageBug(bug, this.attackDamage);
        //         }
        //     }
        //     for (let shooter of this.scene.shooters.group.getChildren()) {
        //         let shooterBounds = shooter.getBounds();
        //         if (Phaser.Geom.Intersects.RectangleToRectangle(deerBounds, shooterBounds)) {
        //             this.scene.shooters.damageShooter(shooter, this.attackDamage);
        //         }
        //     }
        //     for (let worm of this.scene.worm.group.getChildren()) {
        //         let wormBounds = worm.getBounds();
        //         if (Phaser.Geom.Intersects.RectangleToRectangle(deerBounds, wormBounds)) {
        //             this.scene.worm.damageWorm(worm, this.attackDamage);
        //         }
        //     }
        // }
    }

    moveDeer(deer, velocity, index, intervalMillis) {
        console.log("in move deer");
        index = index + 1;
       
        setTimeout(() => {
            deer.destroy();
        }, this.spawnAnimationDurationMillis);
        deer.play('deerAttackAnimation');
        deer.spawned = false;
        deer.setVelocity(velocity[0], velocity[1]);
        // this.scene.add.particles(posX, posY, 'dirtParticle', {
        //     speed: { min: 1, max: 20 },
        //     maxParticles: 20,
        //     anim: 'dirtTumble',
        //     duration: 1500,
        //     emitZone: { source: new Phaser.Geom.Circle(0, 0, 30) }  // Emit particles within a 4 pixel radius
        // });
        
    }

    createDeer(velocity, posX, posY) {
        console.log("creating deer");
        let deer = this.deers.create(posX, posY, 'deerSpawn');
        deer.spawned = true;
        deer.play('deerSpawnAnimation');
        deer.on('animationcomplete', () => {
            deer.play('deerAttackAnimation');
            this.scene.time.delayedCall(10, () => {
                let index = 0;
                let intervalMillis = this.attackDurationMillis;
                deer.spawned = true;
                this.moveDeer(deer, velocity, index, intervalMillis);
            });    
        });
       

        // this.scene.add.particles(posX, posY, 'dirtParticle', {
        //     speed: { min: 1, max: 20 },
        //     maxParticles: 20,
        //     anim: 'dirtTumble',
        //     duration: 1500,
        //     emitZone: { source: new Phaser.Geom.Circle(0, 0, 30) }  // Emit particles within a 4 pixel radius
        // });
    }

    getManaCost() {
        return this.manaCost;
    }

    end() {
    }
}
