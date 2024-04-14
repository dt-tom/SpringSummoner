import * as constants from '../constants.js'

export class Bush {
    constructor(scene)
    {
        this.scene = scene;
    }
    preload() {
        this.scene.load.image('bush', 'assets/bush-v1.png');
        this.scene.load.audio('leavesSound', 'assets/sounds/bush-sound.mp3');
        this.scene.load.audio('bugSquishSound', 'assets/sounds/bug-squish.wav');
        this.scene.load.spritesheet('bushSpawn', 'assets/bush-spawn.png', {
            frameWidth: 64, frameHeight: 64,
        });
    }

    create (){
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
        // slow enemies
        for(const enemy of this.scene.bugs.group.getChildren()) {
            const vector = new Phaser.Math.Vector2(
                this.scene.player.gameObject.x - enemy.x,
                this.scene.player.gameObject.y - enemy.y
            );
            vector.normalizeRightHand();
            enemy.rotation = vector.angle();
            var moveSpeed = constants.bugMovespeed;
            for (let ally of this.bushes.getChildren()) {
                if (!ally.isSpawned) {
                    continue;
                }
                const allyBounds = ally.getBounds();
                const enemyBounds = enemy.getBounds();
                if (Phaser.Geom.Intersects.RectangleToRectangle(allyBounds, enemyBounds)) {
                    moveSpeed = constants.bugMovespeed * constants.bushSlow;
                }
            }
            if (enemy.isSpawned) {
                this.scene.physics.moveTo(enemy, this.scene.player.gameObject.x + Math.random() * 100, this.scene.player.gameObject.y + Math.random() * 100, moveSpeed)
            }
        }
    }

    addBush(posX, posY) {
        let ally = this.bushes.create(posX, posY, 'bush');

        // sounds
        let bushSound = this.scene.sound.add('leavesSound');
        // Add a marker that starts at 12 second into the sound and lasts for 1 seconds
        bushSound.addMarker({name: 'bushMarker', start: 3, duration: 1});
        bushSound.play('bushMarker');
        bushSound.setVolume(0.05);
        let bugSquishSound = this.scene.sound.add('bugSquishSound');

        // after 8 seconds trees disappear
        this.scene.time.delayedCall(8000, (ally) => { 
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
            for (let enemy of this.scene.bugs.group.getChildren()) {
                const allyBounds = ally.getBounds();
                const enemyBounds = enemy.getBounds();
                if (Phaser.Geom.Intersects.RectangleToRectangle(allyBounds, enemyBounds)) {
                    bugSquishSound.play();
                    this.scene.bugs.group.remove(enemy);
                    enemy.setVisible(false);
                    enemy.body.enable = false;
                    enemy.destroy();
                }
            }
            ally.isSpawned = true;
        }, this.scene);
        ally.setDepth(0);
    }
}
