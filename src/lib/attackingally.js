export class AttackingAlly {
    constructor(scene)
    {
        this.scene = scene;
    }
    preload(){
        this.scene.load.spritesheet('attackingAlly', 'assets/stick_grunt_idle_v1.png', {
            frameWidth: 32, frameHeight: 32,
        });
        this.scene.load.spritesheet('gruntSpawn', 'assets/stick_grunt_summoning_v1.png', {
            frameWidth: 32, frameHeight: 32,
        });
    }
    create(){
        // Attacking allies engage with enemies
        this.attackingAllies = this.scene.physics.add.group();

        this.scene.anims.create({
            key: 'gruntIdleAnimation',
            frames: this.scene.anims.generateFrameNumbers('attackingAlly', { start: 0, end: 2}),
            frameRate: 20,
            repeat: -1,
        });
        this.scene.anims.create({
            key: 'gruntSpawnAnimation',
            frames: this.scene.anims.generateFrameNumbers('gruntSpawn', { start: 0, end: 6}),
            frameRate: 10,
            repeat: -1,
        });

        this.scene.physics.add.collider(this.attackingAllies, this.attackingAllies);
    }
    update()
    {
        //console.log(this.attackingAllies);
        for (let ally of this.attackingAllies.getChildren()) {
            let closestEnemy = this.scene.getClosestObject(ally, this.scene.enemies);
            if (closestEnemy){
                this.scene.physics.moveToObject(ally, closestEnemy, 60);
            }
            
        }
    }
    createAttackingAlly(posX, posY)
    {
        let ally = this.attackingAllies.create(posX, posY, 'attackingAlly');
        ally.play('gruntSpawnAnimation');
        ally.on('animationcomplete', () => { 
            console.log("here3");
        });
        this.scene.add.particles(posX, posY, 'dirtParticle', {
            speed: { min: 1, max: 20 },
            maxParticles: 20,
            anim: 'dirtTumble',
            duration: 3000,
            emitZone: { source: new Phaser.Geom.Circle(0, 0, 30) }  // Emit particles within a 4 pixel radius
        });
        this.scene.time.delayedCall(500, (e) => { 
            console.log("lol");
            e.isSpawned = true;
            this.attackingAllies.playAnimation('gruntIdleAnimation');
            }, [ally], this);
    }
}
