import { playerSpawn, playerSpeed, MOUSE_SAMPLE_RATE } from '../constants.js'
import { guess } from '../main.js';

/**
 *
 * Player is a the encapulated representation of our agent.
 *
 * X and Y are stored on the gameObject. HP should be stored on the healthbar
 * but is currently duplicated.
 */

let downEvent = 0;
let upEvent = 0;
let mouseCurrentlyDown = false;
const MIN_SWIPE_DISTANCE = 50;

let mousePositions = [];
export class Player {
    constructor(scene) {
        this.scene = scene
        this.firstUpdate = true
        this.playerSpeed = playerSpeed;
        this.glyphSequence = [];
        this.glyphLevel = 1;
        this.prevGlyphLevel = 1;
        this.wPosPath = [];
    }

    // Preload is called before scene load, with a copy of the scene
    preload() {
        this.scene.load.image('me', 'assets/main-character-inuse.png');
        this.scene.load.spritesheet('death', 'assets/main-character-death-animation-inuse.png', {
            frameWidth: 32, frameHeight: 32,
        })
        this.scene.load.spritesheet('walkFront', 'assets/main-character_walking_front_v1.png', {
            frameWidth: 32, frameHeight: 32,
        })
        this.scene.load.spritesheet('walkBack', 'assets/main_character_walking_back_v1.png', {
            frameWidth: 32, frameHeight: 32,
        });
        this.scene.load.spritesheet('summon', 'assets/main-character-summoning-inuse.png', {
            frameWidth: 32, frameHeight: 32,
        });
        this.scene.load.spritesheet('oasisHeal', 'assets/oasis-heal-particle-v3.png', {
            frameWidth: 8, frameHeight: 8,
        })
        this.scene.load.spritesheet('mouseParticle', 'assets/mouse-particle-v1.png', {
            frameWidth: 8, frameHeight: 8,
        })
    }

    // Create is called when the scene becomes active, once, after assets are
    // preloaded. It's expected that this scene will have aleady called preload
    create() {
        this.effects = new Phaser.Structs.Set();
        this.particles = [];
        this.gameObject = this.scene.physics.add.sprite(playerSpawn.x, playerSpawn.y, 'walkBack');
        let currentScale = this.gameObject.scaleX;
        this.gameObject.setScale(currentScale * 1.25);
        this.gameObject.setCollideWorldBounds(true);
        this.MAX_HEALTH = 100;
        this.health = this.MAX_HEALTH;
        this.MAX_MANA = 100;
        this.mana = this.MAX_MANA;
        this.MANA_REGEN_INTERVAL = 200;
        let { wasd, arrowkeys } = createCursors(this.scene)
        this.wasd = wasd
        this.arrowkeys = arrowkeys

        this.gameObject.anims.create({
            key: 'deathAnimation',
            frames: this.gameObject.anims.generateFrameNumbers('death', { start: 0, end: 26}),
            frameRate: 12,
        });
        this.gameObject.anims.create({
            key: 'walkFrontAnimation',
            frames: this.gameObject.anims.generateFrameNumbers('walkFront', { start: 0, end: 3}),
            frameRate: 8,
        });
        this.gameObject.anims.create({
            key: 'walkBackAnimation',
            frames: this.gameObject.anims.generateFrameNumbers('walkBack', { start: 0, end: 3}),
            frameRate: 8,
        });
        this.gameObject.anims.create({
            key: 'summonAnimation',
            frames: this.gameObject.anims.generateFrameNumbers('summon', { start: 0, end: 6}),
            frameRate: 14,
        });

        // this one goes in scene since it's a particle
        this.scene.anims.create({
            key: 'oasisHealAnimation',
            frames: this.gameObject.anims.generateFrameNumbers('oasisHeal', { start: 0, end: 1}),
            frameRate: 10,
            repeat: -1,
        });

        this.scene.anims.create({
            key: 'mouseParticleAnimation',
            frames: this.gameObject.anims.generateFrameNumbers('mouseParticle', { start: 0, end: 1}),
            frameRate: 10,
            repeat: -1,
        });

        // Mouseclicks for summoning
        this.scene.input.mouse.disableContextMenu();
        this.scene.input.on('pointerdown', this.clickDownHandler.bind(this))  // maybe this has a context param??
        this.scene.input.on('pointerup', this.clickUpHandler.bind(this))
        this.scene.input.on('mouseout', this.mouseOutFunction.bind(this))
        document.querySelectorAll('canvas')[0].addEventListener('mouseout', this.mouseOutFunction.bind(this))
        setInterval(this.trackMousePositionAndSpawnParticles.bind(this), MOUSE_SAMPLE_RATE);
        
        // passively game mana over time
        setInterval(() => {
            this.updateMana(0.2);
        }, this.MANA_REGEN_INTERVAL);
    }

   
    hasMana(amount) {
        return this.mana >= amount;
    }

    detectGesture(glyphData){
        if (!glyphData) return;
        const { glyph, spellAccuracy } = glyphData;
        this.scene.scene.get('Scoreboard').updateLastSpellAccuracy(spellAccuracy);
        let result = [false, 0xff0000];
        if (!this.hasMana(10)) return result;
        // keep track of combos
        if (spellAccuracy >= 0.75) {
            this.glyphSequence.push(glyph);
            this.glyphLevel += 1;
            if (this.glyphLevel % 10 == 0) {
                this.prevGlyphLevel = this.glyphLevel;
                this.scalePlayer();
                this.scaleSummons();
            }
            this.scene.scene.get('Scoreboard').updateGlyphLevel(this.glyphLevel);
        } else if (spellAccuracy >= 0.5) {
            this.glyphSequence = [];
            this.glyphLevel = this.prevGlyphLevel;
            this.scene.scene.get('Scoreboard').updateGlyphLevel(this.glyphLevel);
        } else {
            // bad confidence score, missed spell
            this.glyphSequence = [];
            this.glyphLevel = this.prevGlyphLevel;
            this.scene.scene.get('Scoreboard').updateGlyphLevel(this.glyphLevel);
            return result;
        }
        this.scene.scene.get('Scoreboard').updateGlyphSequence(this.glyphSequence);

        if (this.glyphSequence.length == 10) this.summonAidanS();

        if (this.deerFlag) {
            if(this.anySwipe){
                this.glyphSequence = [];
                
                result = this.summonDeer();
                this.scene.scene.get('Scoreboard').updateGlyphSequence(this.glyphSequence);
                this.deerFlag = false;

            }
        } else if (this.glyphSequence.length == 2 && this.glyphSequence[0] == 'Glyph: ƨ' && this.glyphSequence[1] == 'Glyph: ¬') {
            this.deerFlag = true;
        } else if (this.upSwipe() || this.downSwipe()) {
            result = this.summonBush();
        } else if (glyph === 'Glyph: -') {
            result = this.summonGrunt();
        } else if (glyph === 'Glyph: ¬') {
            result = this.summonExploder();
        }
        this.wPosPath = [];
        return result;
    }

    scalePlayer() {
        this.health += 200;
        this.mana += 50;
        this.speed += 5;
        this.scene.scene.get("Scoreboard").levelBreakpoint(this.health, this.mana)
    }

    scaleSummons(damageBaseMulti=1.1, manaCostBaseMulti=0.95) {
        const game = this.scene.scene.get("GameScene");
        game.attackingAllies.attackDamage *= damageBaseMulti;
        game.attackingAllies.gruntMaxLifetimeMillis *= damageBaseMulti;
        game.explodingAllies.explodeDamage *= damageBaseMulti;
        game.bushes.bushTickDamage *= damageBaseMulti;
        game.deers.attackDamage *= damageBaseMulti;

        game.deers.manaCost *= manaCostBaseMulti;
        game.attackingAllies.manaCost *= manaCostBaseMulti;
        game.explodingAllies.manaCost *= manaCostBaseMulti;
        game.bushes.manaCost *= manaCostBaseMulti;
    }

    summonAidanS() {
        let str = ['Glyph: ƨ', 'Glyph: ƨ', 'Glyph: ƨ', 'Glyph: -', 'Glyph: ¬',
                   'Glyph: ¬', 'Glyph: -', 'Glyph: ƨ', 'Glyph: ¬', 'Glyph: -']
        if (JSON.stringify(this.glyphSequence) !== JSON.stringify(str)) return;
        this.glyphSequence = [];
        this.scene.scene.get('Scoreboard').updateGlyphSequence(this.glyphSequence);
        this.velocity = [upEvent.upX - downEvent.downX , downEvent.upY - upEvent.downY];
        let v1 = [this.velocity[0], this.velocity[1]];
        let v2 = [-this.velocity[0], -this.velocity[1]];
        let v3 = [this.velocity[0], -this.velocity[1]];
        let v4 = [-this.velocity[0], this.velocity[1]];
        this.scene.deers.createDeer(v1, this.wPosPath[0][0], this.wPosPath[0][1]);
        this.scene.deers.createDeer(v2, this.wPosPath[0][0], this.wPosPath[0][1]);
        this.scene.deers.createDeer(v3, this.wPosPath[0][0], this.wPosPath[0][1]);
        this.scene.deers.createDeer(v4, this.wPosPath[0][0], this.wPosPath[0][1]);
    }

    summonDeer() {
        let manaCost = this.scene.deers.getManaCost();
        if (this.hasMana(manaCost)) {
            this.mana = this.mana - manaCost;
            this.velocity = [upEvent.upX - downEvent.downX , downEvent.upY - upEvent.downY ];
            this.scene.deers.createDeer(this.velocity, this.wPosPath[0][0], this.wPosPath[0][1]);
            
            return [true, 0x00ff00];
        }
        return [false, 0x0000ff];
    }

    summonGrunt() {
        let gruntManaCost = this.scene.attackingAllies.getManaCost();
        if (this.hasMana(gruntManaCost)) {
            this.mana = this.mana - gruntManaCost;
            this.scene.attackingAllies.createAttackingAlly(upEvent.worldX, upEvent.worldY);
            return [true, 0x00ff00];
        }
        return [false, 0x0000ff];
    }

    summonBush() {
        let bushManaCost = this.scene.bushes.getManaCost();
        if (this.hasMana(bushManaCost)) {
            this.mana = this.mana - bushManaCost;
            this.scene.bushes.addBush(upEvent.worldX, upEvent.worldY);
            return [true, 0x00ff00];
        }
        return [false, 0x0000ff];
    }

    summonExploder() {
        let explosionManaCost = this.scene.explodingAllies.getManaCost();
        if (this.hasMana(explosionManaCost)) {
            this.mana = this.mana - explosionManaCost;
            this.scene.explodingAllies.createExplodingAlly(upEvent.worldX, upEvent.worldY);
            return [true, 0x00ff00];
        }
        return [false, 0x0000ff];
    }

    upSwipe()
    {
        return downEvent.downY > upEvent.upY 
        && Math.abs(downEvent.downY - upEvent.upY) > MIN_SWIPE_DISTANCE
        && Math.abs(downEvent.downX - upEvent.upX) < MIN_SWIPE_DISTANCE
        && Math.abs(downEvent.downY - upEvent.upY) > Math.abs(downEvent.downX - upEvent.upX);
    }

    anySwipe()
    {
        return Math.abs(downEvent.downY - upEvent.upY) > MIN_SWIPE_DISTANCE
        || Math.abs(downEvent.downX - upEvent.upX) > MIN_SWIPE_DISTANCE;
    }

    downSwipe()
    {
        return downEvent.downY < upEvent.upY 
        && Math.abs(downEvent.downY - upEvent.upY) > MIN_SWIPE_DISTANCE
        && Math.abs(downEvent.downX - upEvent.upX) < MIN_SWIPE_DISTANCE
        && Math.abs(downEvent.downY - upEvent.upY) > Math.abs(downEvent.downX - upEvent.upX);
    }

    rightSwipe()
    {
        return downEvent.downX < upEvent.upX 
        && Math.abs(downEvent.downX - upEvent.upX) > MIN_SWIPE_DISTANCE
        && Math.abs(downEvent.downY - upEvent.upY) < MIN_SWIPE_DISTANCE
        && Math.abs(downEvent.downX - upEvent.upX) > Math.abs(downEvent.downY - upEvent.upY)
    }

    leftSwipe()
    {
        return downEvent.downX > upEvent.upX 
        && Math.abs(downEvent.downX - upEvent.upX) > MIN_SWIPE_DISTANCE
        && Math.abs(downEvent.downY - upEvent.upY) < MIN_SWIPE_DISTANCE
        && Math.abs(downEvent.downX - upEvent.upX) > Math.abs(downEvent.downY - upEvent.upY)
    }

    // downLeftSwipe()
    // {
    //     return downEvent.downX > upEvent.upX 
    //     && downEvent.downY < upEvent.upY 
    //     && Math.abs(downEvent.downX - upEvent.upX) > MIN_SWIPE_DISTANCE
    //     && Math.abs(downEvent.downY - upEvent.upY) > MIN_SWIPE_DISTANCE
    // }

    // downRightSwipe()
    // {
    //     return downEvent.downX < upEvent.upX 
    //     && downEvent.downY < upEvent.upY 
    //     && Math.abs(downEvent.downX - upEvent.upX) > MIN_SWIPE_DISTANCE
    //     && Math.abs(downEvent.downY - upEvent.upY) > MIN_SWIPE_DISTANCE
    // }

    // upLeftSwipe()
    // {
    //     return downEvent.downX > upEvent.upX 
    //     && downEvent.downY > upEvent.upY 
    //     && Math.abs(downEvent.downX - upEvent.upX) > MIN_SWIPE_DISTANCE
    //     && Math.abs(downEvent.downY - upEvent.upY) > MIN_SWIPE_DISTANCE
    // }

    // upRightSwipe()
    // {
    //     return downEvent.downX < upEvent.upX 
    //     && downEvent.downY > upEvent.upY 
    //     && Math.abs(downEvent.downX - upEvent.upX) > MIN_SWIPE_DISTANCE
    //     && Math.abs(downEvent.downY - upEvent.upY) > MIN_SWIPE_DISTANCE
    // }

    trackMousePositionAndSpawnParticles()
    {
        if(mouseCurrentlyDown)
        {
            mousePositions.push([this.scene.input.mousePointer.x, this.scene.input.mousePointer.y])

            //let mPos = new Vector2(this.scene.input.mousePointer.x, this.scene.input.mousePointer.y);
            let wPos = this.scene.cameras.main.getWorldPoint(this.scene.input.mousePointer.x, this.scene.input.mousePointer.y);
            if (this.wPosPath.length > 1) {
                let prevPoint = this.wPosPath[this.wPosPath?.length-1];
                if (prevPoint[0] !== wPos.x && prevPoint[1] !== wPos.y) this.wPosPath.push([wPos.x, wPos.y]);
            } else {
                this.wPosPath.push([wPos.x, wPos.y]);
            }
            let p = this.scene.add.particles(wPos.x, wPos.y, 'mouseParticle', {
                speed: { min: 1, max: 20 },
                maxParticles: 10,
                anim: 'mouseParticleAnimation',
                duration: 1000,
                // accelerationY: Math.random() * -900,
                // accelerationX: Math.random() * -50,
                // speed: Math.random() * 100,
                // lifespan: 200,
                emitZone: { source: new Phaser.Geom.Circle(0, 0, 10) }  // Emit particles within a 4 pixel radius
            });
            this.particles.push(p)
        }
    }

    classifySummmon(size=28) {
        function drawLine(ctx, x1, y1, x2, y2, stroke = 'black', width = 3) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = stroke;
            ctx.lineWidth = width;
            ctx.stroke();
        }
        const canvas = document.createElement("canvas");
        canvas.style.display = "none";
        document.body.appendChild(canvas);
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.canvas.width  = size;
        ctx.canvas.height = size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.fillStyle= "white";
        ctx.fillRect(0, 0, size, size);

        const tx = size/1024;
        const ty = size/768;
        for (let i = 0; i < mousePositions.length - 1; i++) {
            const [x1, y1, x2, y2] = [mousePositions[i][0] * tx, mousePositions[i][1] * ty,mousePositions[i+1][0] * tx,mousePositions[i + 1][1] * ty];
            drawLine(ctx, x1, y1, x2, y2);
        }
        let bright  = []
        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                bright.push(ctx.getImageData(x,y,1,1).data[0]/255)
            }
        }

        const res = bright.filter(d=>d<1).length > 10 ? guess(bright): null;

        document.body.removeChild(canvas);
        return res;
    }

    mouseOutFunction()
    {
        mouseCurrentlyDown = false;
    }


    clickDownHandler(e) {
        mouseCurrentlyDown = true;
        downEvent = e;
        if (this.isDead()) {
            return
        }
    }

    clickUpHandler(e) {
        const glyph = this.classifySummmon();
        mousePositions = [];
        mouseCurrentlyDown = false;
        upEvent = e;
        if (this.isDead()) {
            return
        }
        this.gameObject.anims.play('summonAnimation', true)
        let result = this.detectGesture(glyph) || [false, 0x0];
        // Iterate over the array
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].setParticleTint(result[1]);
        }
        this.particles = [];
    }

    // Update is called once per tick
    update() {
        // Since we have multiple inputs doing the same thing, setup (set
        // velocity to 0 must be done first)
        this.gameObject.setVelocity(0);
        this.updateMovement(this.wasd)
        this.updateMovement(this.arrowkeys)
        this.scene.scene.get('Scoreboard').updateHP(this.health);
        this.scene.scene.get('Scoreboard').updateMana(this.mana);
    }
    /**
     * @param cursors is an object with up down left and right as properties where the
     * value of each is an input key
     */
    updateMovement(cursor) {
        if (!this.gameObject.body.enable) {
            return;
        }

        if (cursor.left.isDown) {
            this.gameObject.setFlipX(true);
            this.gameObject.setVelocityX(-this.playerSpeed);
            if (mouseCurrentlyDown) {
                this.gameObject.anims.play('summonAnimation', true)
            } else {
                this.gameObject.anims.play('walkFrontAnimation', true)
            }
        }

        if (cursor.right.isDown) {
            this.gameObject.setFlipX(false);
            this.gameObject.setVelocityX(this.playerSpeed);
            if (mouseCurrentlyDown) {
                this.gameObject.anims.play('summonAnimation', true)
            } else {
                this.gameObject.anims.play('walkFrontAnimation', true)
            }        
        }

        if (cursor.down.isDown) {
            this.gameObject.setVelocityY(this.playerSpeed);
            if (mouseCurrentlyDown) {
                this.gameObject.anims.play('summonAnimation', true)
            } else {
                this.gameObject.anims.play('walkFrontAnimation', true)
            }
        }



        if (cursor.up.isDown) {
            this.gameObject.anims.play('walkBackAnimation', true)
            this.gameObject.setVelocityY(-this.playerSpeed);
        }

        // normalize the speed
        let velocity = new Phaser.Math.Vector2(this.gameObject.body.velocity.x, this.gameObject.body.velocity.y);
        velocity.normalize();
        // Scale the velocity vector to the desired speed
        velocity.scale(this.playerSpeed);

        // Apply the new velocity to the sprite
        this.gameObject.setVelocity(velocity.x, velocity.y);

        if (!cursor.left.isDown && !cursor.right.isDown && !cursor.up.isDown && !cursor.down.isDown) {
            // this.gameObject.setTexture('me')
        }
    }

    slow(reason, speedReduction, durationMillis) {
        if (this.effects.contains(reason) && reason !== 'bugSlow') {
            return;
        }
        let reduction = speedReduction;
        if (this.playerSpeed - speedReduction <= 0) {
            reduction = this.playerSpeed;
        }
        if (reduction == 0) {
            return;
        }
        this.effects.set(reason);
        this.playerSpeed -= reduction;
        setTimeout(() => {
            this.playerSpeed += reduction;
            this.effects.delete(reason);
        }, durationMillis);
    }

    damage(damage) {
        this.health -= damage;
        this.gameObject.setTint(0xFF474c); // Tint the sprite red
        setTimeout(() => {
            this.gameObject.clearTint(); // Clear the tint after a delay
        }, 100);
        if(this.health <= 0) {
            this.gameObject.body.enable = false;
            this.gameObject.setTexture('death');
            this.gameObject.anims.play('deathAnimation', true);
            this.scene.scene.get('Scoreboard').updateHP(0);
            this.scene.end();
            
        }
    }

    updateMana(amount) {
        if (this.mana < this.MAX_MANA && amount > 5) {
            this.spawnManaParticles();
        }
        this.mana = Math.min(this.mana + amount, this.MAX_MANA);
    }

    updateSpeed(reason, amount, durationMillis) {
        if (this.effects.contains(reason)) {
            return;
        }
        this.effects.set(reason);
        this.playerSpeed += amount;
        setTimeout(() => {
            this.playerSpeed -= amount;
            this.effects.delete(reason);
        }, durationMillis);
    }

    pickUp(drop) {
        if(drop.type == "speed")
        {
            this.updateSpeed('powerup', 100, 5000);
        }
        if(drop.type == "mana")
        {
            this.updateMana(50);
        }
        if(drop.type == "health")
        {
            this.health = Math.min(this.health + 20, this.MAX_HEALTH);
        }
        drop.destroy();
    }

    isDead () {
        return this.health <= 0 || !this.gameObject.body.enable;
    }

    spawnManaParticles () {
        this.scene.add.particles(this.gameObject.x + Math.random() * 10, this.gameObject.y + Math.random() * 10, 'oasisHeal', {
            speed: { min: 1, max: 2 },
            maxParticles: 20,
            anim: 'oasisHealAnimation',
            duration: 2000,
            accelerationY: Math.random() * -900,
            accelerationX: Math.random() * -50,
            speed: Math.random() * 100,
            lifespan: 500,
            //emitZone: { source: new Phaser.Geom.Rectangle(0, 0, 30, 30) }  // Emit particles within a 4 pixel radius
        });
    }
};

/**
 * @return an object containing two cursor objects, arrowkeys and wasd which
 * each have up down left and right key inputs.
 */
function createCursors(scene) {
    return {
        wasd: {
            up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        },
        arrowkeys: scene.input.keyboard.createCursorKeys(),
    }
}
