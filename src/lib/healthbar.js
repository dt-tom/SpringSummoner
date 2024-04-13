export class HealthBar {
    constructor (scene, startingHealth, x, y) {
        this.bar = new Phaser.GameObjects.Graphics(scene);

        this.x = x;
        this.y = y;
        this.value = startingHealth;
        this.p = 38 / 100;

        this.draw();

        scene.add.existing(this.bar);
    }

    decrease (amount) {
        this.value -= amount;

        if (this.value < 0)
        {
            this.value = 0;
        }

        this.draw();

        return (this.value === 0);
    }

    draw () {
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

    reposition(x, y) {
        this.x = x;
        this.y = y;
        this.draw();
    }
}

/**
 * HealthbarV2 is like healthbar but it's configured to work for any object
 * (player, ally or enemy) and be configurable in size, color and location
 * relative to the object.
 *
 * HealthbarV2s are configured for a particular type of entity, but are not
 * attached to any instance of that entity. In the entity's update method,
 * their healthbar should be redrawn by passing their health and location.
 */
export class HealthbarV2 {
    /*
     * @param colorFunc: a function that determines the color of the filled and
     * unfilled parts of the healthbar from the current and max HP values
     *
     * @param offsets: object containing x and y values that specify where to
     * position the center of the healthbar relative to the center of the
     * entity whose health is being represented
     */
    constructor ({
        scene,
        startingValue = 100,
        maxValue = 100,
        width = 40,
        height = 15,
        borderRadius = 1,  // black outline thickness
        colorFunc = function(currentValue, maxValue) {
            bg = 0xffffff
            fg = ((currentValue / maxValue) < 30) ? 0xff0000 : 0x00ff00;
            return { bg: bg, fg: fg }
        },
        offsets ={ x: 0, y: 0, },
    }) {
        this.gfx = new Phaser.GameObjects.Graphics(scene);
        this.value = startingValue;
        this.maxValue = maxValue;
        this.width = width;
        this.height = height
        this.colorFunc = colorFunc;
        this.offsets = offsets;
        this.borderRadius = borderRadius;
    }

    // Call this when health changes or the entity moves
    redraw({ x, y, value }) {
        this.gfx.clear();
        const { fg, bg } = this.colorFunc(value, this.maxValue);
        const black = 0x000000;

        const centerX = x + this.offsets.x
        const centerY = y + this.offsets.y

        this.bar.clear();

        //  Outline
        this.bar.fillStyle(black);
        this.bar.fillRect(
            centerX - width - this.borderRadius,
            centerY - height - this.borderRadius,
            this.width + this.borderRadius,
            this.height + this.borderRadius,
        );

        // Background
        this.bar.fillStyle(bg);
        this.bar.fillRect(
            centerX - width,
            centerY - height,
            this.width,
            this.height,
        );

        //  Health
        this.bar.fillStyle(fg);
        this.bar.fillRect(
            centerX - width,
            centerY - height,
            this.width * (value / this.maxValue),
            this.height,
        );
    }

}
