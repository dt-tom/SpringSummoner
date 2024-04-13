class Example extends Phaser.Scene
{
    constructor ()
    {
        super();
    }

    preload ()
    {
        this.load.image('bg', 'assets/sky.png');
        this.load.image('block', 'assets/star.png');
        this.load.image('ally', 'assets/bomb.png');
    }

    create ()
    {
        //  Set the camera and physics bounds to be the size of 4x4 bg images
        this.cameras.main.setBounds(0, 0, 1920 * 2, 1080 * 2);
        this.physics.world.setBounds(0, 0, 1920 * 2, 1080 * 2);

        //  Mash 4 images together to create our background
        this.add.image(0, 0, 'bg').setOrigin(0);
        this.add.image(1920, 0, 'bg').setOrigin(0).setFlipX(true);
        this.add.image(0, 1080, 'bg').setOrigin(0).setFlipY(true);
        this.add.image(1920, 1080, 'bg').setOrigin(0).setFlipX(true).setFlipY(true);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.player = this.physics.add.image(400, 300, 'block');

        this.player.setCollideWorldBounds(true);

        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);

        this.allies = this.physics.add.group();

        this.input.on('pointerdown', e => {
            console.log(e.downX, e.downY);

            this.allies.create(e.downX, e.downY, 'ally')
        })
    }

    update ()
    {
        this.player.setVelocity(0);

        if (this.cursors.left.isDown)
        {
            this.player.setVelocityX(-500);
        }
        else if (this.cursors.right.isDown)
        {
            this.player.setVelocityX(500);
        }

        if (this.cursors.up.isDown)
        {
            this.player.setVelocityY(-500);
        }
        else if (this.cursors.down.isDown)
        {
            this.player.setVelocityY(500);
        }

        for (let entity of this.allies.getChildren()) {
            this.physics.moveToObject(entity, this.player, 150);
        }
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
    },
    scene: Example
};

const game = new Phaser.Game(config);