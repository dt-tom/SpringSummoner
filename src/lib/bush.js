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
        this.manaCost = 15;
        this.bushTickDamage = 0.5;
        this.bushMaxLifetimeMillis = 15_000;
        this.bushSpeedReduction = 40;
        this.bushSlowDurationMillis = 2000;
        this.bushScale = 1.2;
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
            for (let bush of this.bushes.getChildren()) {
                if (!bush.isSpawned) {
                    continue;
                }
                const bushBounds = bush.getBounds();
                const bugBounds = bug.getBounds();
                if (Phaser.Geom.Intersects.RectangleToRectangle(bushBounds, bugBounds)) {
                    this.scene.bugs.slowBug(bug, "bushSlow", this.bushSpeedReduction, this.bushSlowDurationMillis);
                    this.scene.bugs.damageBug(bug, this.bushTickDamage);
                }
            }
        }
    }

    getManaCost() {
        return this.manaCost;
    }

    spiralGreen (posX, posY) {
        let radius = 1; // Initial radius
        let angle = 0; // Initial angle
        let intervalId = setInterval(() => {
            let x = posX + radius * Math.cos(angle);
            let y = posY + radius * Math.sin(angle);
            this.scene.updateTiles(x, y);
            angle += 1;
            radius += 1;
        }, 50);
        setTimeout(() => {
            clearInterval(intervalId);
        }, this.bushMaxLifetimeMillis / 4);
    }

    addBush(posX, posY) {
        let ally = this.bushes.create(posX, posY, 'bush');
        ally.setScale(ally.scaleX * this.bushScale);
        // sounds
        let bushSound = this.scene.sound.add('leavesSound');
        // Add a marker that starts at 12 second into the sound and lasts for 1 seconds
        bushSound.addMarker({name: 'bushMarker', start: 3, duration: 1});
        bushSound.play('bushMarker');
        bushSound.setVolume(0.05);

        // spiral green the terrain
        this.spiralGreen(posX, posY);
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
