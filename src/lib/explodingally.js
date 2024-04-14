export class ExplodingAlly {
    constructor(scene)
    {
        this.scene = scene;
    }
    preload(){
        this.scene.load.audio('explosion', 'assets/sounds/explosion.mp3');
        this.scene.load.spritesheet('gemWalking', 'assets/gem_bearer_walk.png', {
            frameWidth: 32, frameHeight: 32,
        });
        this.scene.load.spritesheet('gemSpawn', 'assets/gem_bearer_summoning.png', {
            frameWidth: 32, frameHeight: 32,
        });
        this.scene.load.spritesheet('gemExplode', 'assets/gem_bearer_death_v2.png', {
            frameWidth: 64, frameHeight: 64,
        });
    }
    create(){

        this.manaCost = 50;
        // exploding allies engage with enemies
        this.explodingAllies = this.scene.physics.add.group({
            createCallback: (ally) => {
                ally.exploding = false;
            }
        });

        this.explodingSound = this.scene.sound.add('explosion');
        this.explodingSound.setVolume(0.5);

        this.scene.anims.create({
            key: 'gemWalkAnimation',
            frames: this.scene.anims.generateFrameNumbers('gemWalking', { start: 0, end: 1}),
            frameRate: 10,
            repeat: -1,
        });
        this.scene.anims.create({
            key: 'gemSpawnAnimation',
            frames: this.scene.anims.generateFrameNumbers('gemSpawn', { start: 0, end: 4}),
            frameRate: 15,
            repeat: 0,
        });
        this.scene.anims.create({
            key: 'gemExplodeAnimation',
            frames: this.scene.anims.generateFrameNumbers('gemExplode', { start: 0, end: 6}),
            frameRate: 20,
            repeat: 0,
        });

        this.scene.physics.add.collider(this.explodingAllies, this.explodingAllies);
    }
    update()
    {
        //console.log(this.explodingAllies);
        for (let ally of this.explodingAllies.getChildren()) {
            if(!ally.exploding){
                let closestEnemy = this.scene.getClosestObject(ally, this.scene.bugs.group);
                if (closestEnemy) {
                    this.scene.physics.moveToObject(ally, closestEnemy, 120);
                }
            }
            
        }
    }
    createExplodingAlly(posX, posY)
    {
        let ally = this.explodingAllies.create(posX, posY, 'gemWalking');
        ally.play('gemSpawnAnimation');
        this.scene.add.particles(posX, posY, 'dirtParticle', {
            speed: { min: 1, max: 20 },
            maxParticles: 20,
            anim: 'dirtTumble',
            duration: 3000,
            emitZone: { source: new Phaser.Geom.Circle(0, 0, 30) }  // Emit particles within a 4 pixel radius
        });
        ally.on('animationcomplete', () => {
            ally.play('gemWalkAnimation');
        });
       
    }

    explode(ally, enemy)
    {
        console.log(ally);
        if(!ally.exploding)
        {
            ally.exploding = true;
            ally.play('gemExplodeAnimation');
            this.explodingSound.play();
            
        }
        ally.on('animationcomplete', () => {
            ally.destroy();
            this.scene.bugs.damageBug(enemy, 100);
        });
        this.scene.time.delayedCall(800, (e) => { 
            ally.destroy();
        });
    }

    getManaCost() {
        return this.manaCost;
    }

    end() {
      this.explodingAllies.clear(true, true)
    }
}
