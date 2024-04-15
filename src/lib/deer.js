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
        this.attackDamage = 100;
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
            frameRate: 3,
        });
        this.scene.anims.create({
            key: 'deerAttackAnimation',
            frames: this.scene.anims.generateFrameNumbers('deerAttack', { start: 0, end: 19}),
            frameRate: 5,
            repeat: -1,
        });
    }

    update() {
        for (let deer of this.deers.getChildren()) {
            if (!deer.spawned) {
                continue;
            }
            let deerBounds = deer.getBounds();
            for (let bug of this.scene.bugs.group.getChildren()) {
                let bugBounds = bug.getBounds();
                if (Phaser.Geom.Intersects.RectangleToRectangle(deerBounds, bugBounds)) {
                    this.scene.bugs.damageBug(bug, this.attackDamage);
                }
            }
            for (let shooter of this.scene.shooters.group.getChildren()) {
                let shooterBounds = shooter.getBounds();
                if (Phaser.Geom.Intersects.RectangleToRectangle(deerBounds, shooterBounds)) {
                    this.scene.shooters.damageShooter(shooter, this.attackDamage);
                }
            }
            for (let worm of this.scene.worm.group.getChildren()) {
                let wormBounds = worm.getBounds();
                if (Phaser.Geom.Intersects.RectangleToRectangle(deerBounds, wormBounds)) {
                    this.scene.worm.damageworm(worm, this.attackDamage);
                }
            }
        }
    }

    moveDeer(deer, positions, index, intervalMillis) {
        console.log("in move deer");
        let posX = positions[index][0];
        let posY = positions[index][1];
        this.scene.physics.moveTo(deer, posX, posY, undefined, intervalMillis);
        index = index + 1;
        if (index < positions.length) {
            this.scene.time.delayedCall(intervalMillis, this.moveDeer, [deer, positions, index, intervalMillis], this);
        } else {
            setTimeout(() => {
                deer.destroy();
            }, this.spawnAnimationDurationMillis);
            deer.play('deerAttack');
            deer.spawned = false;
            deer.setVelocity(0);
            this.scene.add.particles(posX, posY, 'dirtParticle', {
                speed: { min: 1, max: 20 },
                maxParticles: 20,
                anim: 'dirtTumble',
                duration: 1500,
                emitZone: { source: new Phaser.Geom.Circle(0, 0, 30) }  // Emit particles within a 4 pixel radius
            });
        }
    }

    createDeer(posX, posY, positions) {
        console.log("creating deer");
        let deer = this.deers.create(posX, posY, 'deerSpawn');
        deer.play('deerAttackAnimation');
        setTimeout(() => {
            console.log("moving deer");
            let index = 0;
            let intervalMillis = this.attackDurationMillis / positions.length;
            deer.spawned = true;
            this.moveDeer(deer, positions, index, intervalMillis);
        }, this.spawnAnimationDurationMillis);
        this.scene.add.particles(posX, posY, 'dirtParticle', {
            speed: { min: 1, max: 20 },
            maxParticles: 20,
            anim: 'dirtTumble',
            duration: 1500,
            emitZone: { source: new Phaser.Geom.Circle(0, 0, 30) }  // Emit particles within a 4 pixel radius
        });
    }

    getManaCost() {
        return this.manaCost;
    }

    end() {
    }
}
