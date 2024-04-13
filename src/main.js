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
        this.load.image('enemy', 'assets/bomb.png');
    }

  

    create ()
    {
        // consts
        const NUMBER_OF_ENEMIES = 10;
        //  Set the camera and physics bounds to be the size of 4x4 bg images
        this.cameras.main.setBounds(0, 0, 1920 * 2, 1080 * 2);
        this.physics.world.setBounds(0, 0, 1920 * 2, 1080 * 2);

        //  Mash 4 images together to create our background
        this.add.image(0, 0, 'bg').setOrigin(0);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.player = this.physics.add.image(400, 300, 'block');

        this.player.setCollideWorldBounds(true);

        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);


        // make enemies
        this.enemies = this.physics.add.group();

        for(let i = 0; i < NUMBER_OF_ENEMIES; i++) 
        {
            this.enemies.create(Math.random() * 400, Math.random() * 400, 'enemy');
        }

        this.physics.add.collider(this.player, this.enemies);
        this.physics.add.collider(this.enemies, this.enemies);  
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

    
        for(const member of this.enemies.getChildren())
        {
            //this.physics.moveTo(member, Math.random() * 10, Math.random() * 10);
            this.physics.moveTo(member, this.player.x + Math.random() * 100, this.player.y + Math.random() * 100, 150)
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
