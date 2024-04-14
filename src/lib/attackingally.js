export class AttackingAlly {
    constructor()
    {

    }
    preload()
    {
        this.load.spritesheet('attackingAlly', 'assets/stick_grunt_idle_v1.png', {
            frameWidth: 32, frameHeight: 32
        });
        this.load.spritesheet('gruntSpawn', 'assets/stick_grunt_summoning_v1.png', {
            frameWidth: 32, frameHeight: 32,
        });
    }
    create()
    {
        // Attacking allies engage with enemies
        this.attackingAllies = this.physics.add.group();
        this.anims.create({
            key: 'gruntIdleAnimation',
            frames: this.anims.generateFrameNumbers('attackingAlly', { start: 0, end: 2}),
            frameRate: 20,
            repeat: -1,
        });
        this.anims.create({
            key: 'gruntSpawnAnimation',
            frames: this.anims.generateFrameNumbers('gruntSpawn', { start: 0, end: 6}),
            frameRate: 20,
            repeat: -1,
        });
    }
    update()
    {
        
    }
    createAttackingAlly()
    {
        console.log("here");
        // const ally = this.attackingAllies.create(posX, posY, 'gruntSpawn');
        // //ally.play('gruntSpawnAnimation');
        // this.add.particles(posX, posY, 'dirtParticle', {
        //     speed: { min: 1, max: 20 },
        //     maxParticles: 20,
        //     anim: 'dirtTumble',
        //     duration: 3000,
        //     emitZone: { source: new Phaser.Geom.Circle(0, 0, 30) }  // Emit particles within a 4 pixel radius
        // });
        // this.time.delayedCall(1000, (e) => { 
        //     e.isSpawned = true;
        //     this.attackingAllies.playAnimation('gruntIdleAnimation');
        //     }, [ally], this);
        // return ally;
    }
}
