export default class HexTile extends Phaser.GameObjects.Container {
    constructor(scene, q, r, x, y, size, index) {
        super(scene, x, y);
        scene.add.existing(this);

        this.q = q;
        this.r = r;
        this.size = size;
        this.index = index;



        // Game Data
        this.ownerID = 0; // 0: Neutral, 1:Orange, 2:Yellow, 3:Green, 4:Blue, 5:Purple, 6:Pink, 9:PONIX
        this.power = 0;
        this.isShielded = false;
        this.isPermanentShield = false; // "Kingdom" status
        this.isSelected = false;
        this.isSpecial = false;
        this.specialName = '';
        this.isStartCandidate = false; // New: For Setup Phase highlighting

        // 1. Base Sprite (The Tile)
        this.baseSprite = scene.add.sprite(0, 0, 'field_brown');
        // Scale adjustment if needed. 
        // Request: "Hexagon size: 68x78 px". The images are likely already this size or close.
        // Let's assume 1:1 for now, or check scale.
        // If grid spacing is different, we might need to scale. 
        // Previous code used `size` (radius) for drawing.
        // If size=42, width ~ 72, height ~ 84.
        // User said images are 68x78.
        // For now, let's just use the image size.
        this.add(this.baseSprite);

        // 2. Overlay Objects
        // Crown (Special / Landmark) using 'crown_gold'
        this.crownSprite = scene.add.sprite(0, 0, 'crown_gold').setVisible(false);
        this.add(this.crownSprite);

        // Dice (Power) using 'dice_1' to 'dice_5'
        this.diceSprite = scene.add.sprite(0, 0, 'dice_1').setVisible(false);
        this.add(this.diceSprite);



        // Index Label (Visible tile number)
        this.indexText = scene.add.text(0, 28, `${index}`, {
            fontFamily: 'Pretendard', fontSize: '21px', color: '#ffffff',
            stroke: '#201006', strokeThickness: 3, fontStyle: '600'
        }).setOrigin(0.5);
        this.add(this.indexText);

        this.updateVisuals();

        // Interaction
        // Polygon for hit area (Images are hexagonalish)
        // 68x78.
        // Let's define a rough hexagon based on 68x78.
        const points = [
            { x: 0, y: -39 },
            { x: 34, y: -20 },
            { x: 34, y: 20 },
            { x: 0, y: 39 },
            { x: -34, y: 20 },
            { x: -34, y: -20 }
        ];
        this.setInteractive(new Phaser.Geom.Polygon(points), Phaser.Geom.Polygon.Contains);
    }

    updateVisuals() {
        let textureKey = '';

        // Determine Base Texture
        if (this.ownerID === 0) {
            // Neutrals
            if (this.isSpecial) {
                if (this.specialName === '창의학습관') {
                    textureKey = this.isSelected ? 'field_gold_selected' : 'field_gold';
                } else {
                    textureKey = this.isSelected ? 'field_silver_selected' : 'field_silver';
                }
            } else {
                textureKey = this.isSelected ? 'field_brown_selected' : 'field_brown';
            }
        } else {
            // Teams
            const color = HexTile.COLOR_MAP[this.ownerID] || 'brown';

            // Suffix construction
            let suffix = '';

            // Priority: Kingdom (Perm Shield) > Shield > Normal
            if (this.isPermanentShield && color !== 'ponix') {
                suffix = '_kingdom';
            } else if (this.isShielded) {
                suffix = '_shield';
            }

            if (this.isSelected) {
                suffix += '_selected';
            }

            textureKey = `land_${color}${suffix}`;
        }

        // All textures are pre-loaded in BootScene, so set directly
        this.baseSprite.setTexture(textureKey);

        // Setup Phase: Highlight Start Candidates (if Neutral)
        if (this.ownerID === 0 && this.isStartCandidate) {
            this.baseSprite.setTint(0x00FF00); // Green Tint
        } else {
            this.baseSprite.clearTint();
        }

        // Crown
        // Show if Special Land (Landmark)
        // User said: "특수 칸은 칸 위에 왕관 모양을 얹고"
        if (this.isSpecial) {
            this.crownSprite.setVisible(true);
            // Gold crown for Creative Learning Center, Silver for others
            if (this.specialName === '창의학습관') {
                this.crownSprite.setTexture('crown_gold');
            } else {
                this.crownSprite.setTexture('crown_silver');
            }
            this.crownSprite.setDepth(1); // Above base
        } else {
            this.crownSprite.setVisible(false);
        }

        // Dice (Power)
        if (this.ownerID !== 0 && this.power > 0) {
            this.diceSprite.setVisible(true);
            const p = Math.min(5, Math.max(1, this.power));
            this.diceSprite.setTexture(`dice_${p}`);
            this.diceSprite.setDepth(2); // Above crown?
        } else {
            this.diceSprite.setVisible(false);
        }


    }

    // Proxy methods to trigger update
    draw() {
        this.updateVisuals();
    }

    setSpecial(name) {
        this.isSpecial = true;
        this.specialName = name;
    }

    setOwner(id) {
        if (this.ownerID !== id) {
            this.ownerID = id;
            // Invalidate cached tile stats
            if (this.scene?.gameManager) {
                this.scene.gameManager._statsDirty = true;
            }
        }
    }

    setPower(val) {
        this.power = val;
    }

    select() {
        this.isSelected = true;
        this.updateVisuals();
    }

    deselect() {
        this.isSelected = false;
        this.updateVisuals();
    }
}

// Static constant — created once, shared by all instances
HexTile.COLOR_MAP = {
    1: 'orange', 2: 'yellow', 3: 'green', 4: 'blue', 5: 'purple', 6: 'pink', 9: 'ponix'
};
