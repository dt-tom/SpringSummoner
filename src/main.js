import * as constants from './constants.js';

class HealthBar {

    constructor (scene, startingHealth, x, y)
    {
        this.bar = new Phaser.GameObjects.Graphics(scene);

        this.x = x;
        this.y = y;
        this.value = startingHealth;
        this.p = 38 / 100;

        this.draw();

        scene.add.existing(this.bar);
    }

    decrease (amount)
    {
        this.value -= amount;

        if (this.value < 0)
        {
            this.value = 0;
        }

        this.draw();

        return (this.value === 0);
    }

    draw ()
    {
        this.bar.clear();

        //  BG
        this.bar.fillStyle(0x000000);
        this.bar.fillRect(this.x, this.y, 42, 10);

        //  Health

        this.bar.fillStyle(0xffffff);
        this.bar.fillRect(this.x + 2, this.y + 2, 38, 6);

        if (this.value < 30)
        {
            this.bar.fillStyle(0xff0000);
        }
        else
        {
            this.bar.fillStyle(0x00ff00);
        }

        var d = Math.floor(this.p * this.value);

        this.bar.fillRect(this.x + 2, this.y + 2, d, 6);
    }

    reposition(x, y)
    {
        this.x = x;
        this.y = y;
        this.draw();
    }

}

class Example extends Phaser.Scene
{
    constructor ()
    {
        super();
        this.health = 100;
    }

    preload ()
    {
        this.load.image('me', 'assets/druid_base.png');
        this.load.image('ally', 'assets/bush-v1.png');
        this.load.spritesheet('attackingAlly', 'assets/scorpion-thing-v1.png', { frameWidth: 32, frameHeight: 32});
        this.load.spritesheet('enemy', 'assets/bug-move.png', { frameWidth: 32, frameHeight: 32});
        this.load.image('ground', 'assets/desert-block.png')
    }

    create ()
    {
        // consts
        const NUMBER_OF_ENEMIES = 10;
        //  Set the camera and physics bounds to be the size of 4x4 bg images
        this.cameras.main.setBounds(0, 0, 1920 * 2, 1080 * 2);
        this.cameras.main.setZoom(2);  // 2x our assets visually
        this.physics.world.setBounds(0, 0, 1920 * 2, 1080 * 2);

        //  Background/desert tiles
        this.add.tileSprite(0, 0, constants.mapWidth, constants.mapHeight, 'ground').setOrigin(0, 0);

        const { wasd, arrowkeys } = this.createCursors()
        this.wasd = wasd
        this.arrowkeys = arrowkeys

        this.player = this.physics.add.image(400, 300, 'me');

        let playerRef = this.player;

        this.hp = new HealthBar(this, this.health, this.player.x - 300, this.player.y - 300);

        this.player.setCollideWorldBounds(true);

        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Allies are stationary helpers
        this.allies = this.physics.add.group();
        
        // Attacking allies engage with enemies
        this.attackingAllies = this.physics.add.group();

        this.input.mouse.disableContextMenu();

        this.input.on('pointerdown', e => {
            if(e.rightButtonDown()) {
                this.attackingAllies.create(e.worldX, e.worldY, 'attackingAlly');
                this.attackingAllies.playAnimation('scorpion-move');
            } else {
                this.allies.create(e.worldX, e.worldY, 'ally');
            }
            
        });

        // make enemies
        this.enemies = this.physics.add.group();

        // need to use this sometimes since this is finicky in js
        let enemiesList = this.enemies;

        for(let i = 0; i < NUMBER_OF_ENEMIES; i++) 
        {
            this.enemies.create(Math.random() * 400, Math.random() * 400, 'enemy');
        }


        // add colliders
        this.physics.add.collider(this.enemies, this.enemies);  
        this.physics.add.collider(this.attackingAllies, this.enemies); 

        this.physics.add.collider(this.player, this.enemies, (player, enemy) => {
            this.health -= 1;
            this.hp.decrease(1);
            if(this.health <= 0)
            {
                this.player.destroy();
            }
        }, null, this);

        // spawn new enemy near the player every ENEMY_SPAWN_TIMER milliseconds
        // make sure they always spawn off screen
        function spawnEnemy()
        {
            console.log("spawning enemy");
            let direction = Math.random < 0.5 ? 1 : -1
            enemiesList.create(
                playerRef.x + (constants.canvasWidth * direction) + Math.random() * 400, 
                playerRef.y + (constants.canvasHeight * direction) + Math.random() * 400, 
                'enemy');
        }
        setInterval(spawnEnemy, constants.ENEMY_SPAWN_TIMER);

        // enemy animations
        // TODO: different animations for moving, attacking, dying, etc
        this.anims.create({
            key: 'bug-move',
            frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 4}),
            frameRate: 20,
            repeat: -1,
        });

        // ally animations
        this.anims.create({
            key: 'scorpion-move',
            frames: this.anims.generateFrameNumbers('attackingAlly', { start: 0, end: 5}),
            frameRate: 20,
            repeat: -1,
        });

        this.enemies.playAnimation('bug-move');
       
    }

    /**
     * @return an object containing two cursor objects, arrowkeys and wasd which
     * each have up down left and right key inputs.
     */
    createCursors() {  // TODO: could make this (game object) a parameter and move this elsewhere
        return {
            wasd: {
                up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
                left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
                right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            },
            arrowkeys: this.input.keyboard.createCursorKeys(),
        }
    }

    getClosestObject(object, group) {
        let min_distance = Infinity;
        let min_item = null;
        for(let item of group.getChildren())
        {
            let diff = Phaser.Math.Distance.Squared(item.x, item.y, object.x, object.y);
            if(diff < min_distance)
            {
                min_distance = diff;
                min_item = item;
            }
        }
        return min_item;
    }

    update () {
        // Since we have multiple inputs doing the same thing, setup (set
        // velocity to 0 must be done first)
        this.player.setVelocity(0);
        this.updateMovement(this.wasd)
        this.updateMovement(this.arrowkeys)

        // Right click allies move towards closest enemy
        for (let ally of this.attackingAllies.getChildren()) {
            let closestEnemy = this.getClosestObject(ally, this.enemies);
            if (closestEnemy){
                this.physics.moveToObject(ally, closestEnemy, 60);
            }
            
        }
    

        for(const enemy of this.enemies.getChildren()) {
            // this.enemyDealDamage({
            //     pX: this.player.x,
            //     pY: this.player.y,
            //     eX: enemy.x,
            //     eY: enemy.y
            // })

            const vector = new Phaser.Math.Vector2(
                this.player.x - enemy.x,
                this.player.y - enemy.y
            );
            vector.normalizeRightHand();
            enemy.rotation = vector.angle();
            var moveSpeed = constants.bugMovespeed;
            for (let ally of this.allies.getChildren()) {
                const allyBounds = ally.getBounds();
                const enemyBounds = enemy.getBounds();
                if (Phaser.Geom.Intersects.RectangleToRectangle(allyBounds, enemyBounds)) {
                    moveSpeed = constants.bugMovespeed * constants.bushSlow;
                }
            }
            this.physics.moveTo(enemy, this.player.x + Math.random() * 100, this.player.y + Math.random() * 100, moveSpeed)
        }

        this.updatePlayerState();
    }

    // enemyDealDamage(positions, baseDamage = 1) {
    //     let dX = Math.sqrt((positions.pX - positions.eX) ** 2 + (positions.pY - positions.eY) ** 2);
    //     console.log(this.health, dX);
    //     if (dX < 50){
    //         this.health -= baseDamage;
    //         this.hp.decrease(baseDamage);
    //     } 
    // }

    updatePlayerState() {
        this.hp.reposition(this.player.x - 25, this.player.y - 30);
    }

    /**
     * @param cursors is an object with up down left and right as properties where the
     * value of each is an input key
     */
    updateMovement(cursor) {
        if (cursor.left.isDown) {
            this.player.setVelocityX(-500);
        }

        if (cursor.right.isDown) {
            this.player.setVelocityX(500);
        }

        if (cursor.up.isDown) {
            this.player.setVelocityY(-500);
        }

        if (cursor.down.isDown) {
            this.player.setVelocityY(500);
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: constants.canvasWidth,
    height: constants.canvasHeight,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
    },
    scene: Example
};

const game = new Phaser.Game(config);
