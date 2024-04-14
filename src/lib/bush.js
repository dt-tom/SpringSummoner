import * as constants from '../constants.js'

export class Bush {
    constructor(scene)
    {
        this.scene = scene;
    }
    preload() {
        this.scene.load.image('bush', 'assets/bush-v1.png');
        this.scene.load.audio('leavesSound', 'assets/sounds/bush-sound.mp3');
        this.scene.load.spritesheet('bushSpawn', 'assets/bush-spawn.png', {
            frameWidth: 64, frameHeight: 64,
        });
    }

    create (){
        this.manaCost = 20;
        this.bushMaxLifetimeMillis = 10_000;
        this.bushSpeedReduction = 50;
        this.bushSlowDurationMillis = 200;
        this.scene.anims.create({
            key: 'bushSpawnAnimation',
            frames: this.scene.anims.generateFrameNumbers('bushSpawn', { start: 0, end: 10}),
            frameRate: 15,
        });

        this.bushes = this.scene.physics.add.group({
            createCallback: (ally) => {
                ally.isSpawned = false;
            },
        });
    }

    update() {
        // slow bugs
        for(const bug of this.scene.bugs.group.getChildren()) {
            const vector = new Phaser.Math.Vector2(
                this.scene.player.gameObject.x - bug.x,
                this.scene.player.gameObject.y - bug.y
            );
            vector.normalizeRightHand();
            bug.rotation = vector.angle();
            // var moveSpeed = constants.bugMovespeed;
            for (let bush of this.bushes.getChildren()) {
                if (!bush.isSpawned) {
                    continue;
                }
                const bushBounds = bush.getBounds();
                const bugBounds = bug.getBounds();
                if (Phaser.Geom.Intersects.RectangleToRectangle(bushBounds, bugBounds)) {
                    this.scene.bugs.slowBug(bug, "bushSlow", this.bushSpeedReduction, this.bushSlowDurationMillis);
                    // moveSpeed = constants.bugMovespeed * constants.bushSlow;
                }
            }

            // if (enemy.isSpawned) {
            //     this.scene.physics.moveTo(enemy, this.scene.player.gameObject.x + Math.random() * 100, this.scene.player.gameObject.y + Math.random() * 100, moveSpeed)
            // }
        }
    }

    getManaCost() {
        return this.manaCost;
    }

    addBush(posX, posY) {
        let ally = this.bushes.create(posX, posY, 'bush');
        // sounds
        let bushSound = this.scene.sound.add('leavesSound');
        // Add a marker that starts at 12 second into the sound and lasts for 1 seconds
        bushSound.addMarker({name: 'bushMarker', start: 3, duration: 1});
        bushSound.play('bushMarker');
        bushSound.setVolume(0.05);

        // after 8 seconds trees disappear
        this.scene.time.delayedCall(this.bushMaxLifetimeMillis, (ally) => { 
            ally.on('animationcomplete', () => { 
                this.bushes.remove(ally);
                ally.setVisible(false);
                ally.body.enable = false;
                ally.destroy();
            }, this.scene);
            ally.playReverse('bushSpawnAnimation');
        }, [ally], this);

        // spawn animation
        ally.play('bushSpawnAnimation');
        ally.on('animationcomplete', () => { 
            ally.setTexture('bush');
            if (ally.isSpawned) {
                return;
            }
            // bad code xd xd 
            for (let bug of this.scene.bugs.group.getChildren()) {
                const bushBounds = ally.getBounds();
                const bugBounds = bug.getBounds();
                if (Phaser.Geom.Intersects.RectangleToRectangle(bushBounds, bugBounds)) {
                    this.scene.bugs.damageBug(bug, 1000);
                }
            }
            ally.isSpawned = true;
        }, this.scene);
        ally.setDepth(0);
    }
}
